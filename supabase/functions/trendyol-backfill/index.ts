import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const CHUNK_DAYS = 7;
const TOTAL_BACKFILL_DAYS = 30;

const STATUS_MAP: Record<string, string> = {
  Created: "aktif",
  Picking: "aktif",
  Invoiced: "aktif",
  Shipped: "aktif",
  Delivered: "aktif",
  UnDelivered: "aktif",
  Returned: "iade_edildi",
  Cancelled: "iptal",
};

function sanitizeError(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 300);
  if (typeof err === "string") return err.slice(0, 300);
  return "Bilinmeyen hata";
}

// Türkiye UTC+3 sabit (2016'dan beri DST yok)
function toTRDate(msTimestamp: number): string {
  if (!msTimestamp || msTimestamp <= 0) return new Date().toISOString().slice(0, 10);
  return new Date(msTimestamp + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const auth = req.headers.get("Authorization") ?? "";
  if (auth.replace("Bearer ", "") !== SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  let body: { connection_id: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Geçersiz istek" }), { status: 400 });
  }

  const { connection_id } = body;
  if (!connection_id) {
    return new Response(JSON.stringify({ error: "connection_id zorunlu" }), { status: 400 });
  }

  const { data: conn, error: connErr } = await adminClient
    .from("marketplace_connections")
    .select("id, user_id, trendyol_supplier_id, initial_backfill_done, backfill_last_fetched_date")
    .eq("id", connection_id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (connErr || !conn) {
    return new Response(JSON.stringify({ error: "Bağlantı bulunamadı" }), { status: 404 });
  }

  if (conn.initial_backfill_done) {
    return new Response(JSON.stringify({ skipped: true, reason: "Backfill zaten tamamlanmış" }), { status: 200 });
  }

  const [{ data: apiKey }, { data: apiSecret }] = await Promise.all([
    adminClient.rpc("get_decrypted_secret", { secret_name: `trendyol_apikey_${connection_id}` }),
    adminClient.rpc("get_decrypted_secret", { secret_name: `trendyol_apisecret_${connection_id}` }),
  ]);

  if (!apiKey || !apiSecret) {
    return new Response(JSON.stringify({ error: "API credentials bulunamadı" }), { status: 500 });
  }

  // Chunk penceresi hesapla
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  const backfillStart = new Date(now.getTime() - TOTAL_BACKFILL_DAYS * 24 * 60 * 60 * 1000);

  let chunkStartDate: Date;
  if (conn.backfill_last_fetched_date) {
    // Kaldığı günün ertesinden devam et
    chunkStartDate = new Date(conn.backfill_last_fetched_date);
    chunkStartDate.setUTCDate(chunkStartDate.getUTCDate() + 1);
    chunkStartDate.setUTCHours(0, 0, 0, 0);
  } else {
    chunkStartDate = new Date(backfillStart);
  }

  // Başlangıç bugünü geçtiyse tamamlanmış demektir
  if (chunkStartDate.getTime() > now.getTime()) {
    await adminClient.from("marketplace_connections").update({
      sync_status: "idle",
      initial_backfill_done: true,
      backfill_completed_at: new Date().toISOString(),
      last_order_sync_at: new Date().toISOString(),
      sync_error_count: 0,
      sync_error_message: null,
    }).eq("id", connection_id);
    return new Response(
      JSON.stringify({ success: true, completed: true }),
      { headers: { "Content-Type": "application/json" } },
    );
  }

  // Bu chunk'ın bitiş zamanı (7 gün veya bugün dahil, hangisi önce)
  const chunkEndDate = new Date(Math.min(
    chunkStartDate.getTime() + CHUNK_DAYS * 24 * 60 * 60 * 1000,
    now.getTime() + 24 * 60 * 60 * 1000,
  ));
  const isLastChunk = chunkEndDate.getTime() >= now.getTime() + 24 * 60 * 60 * 1000;

  // İlk chunk ise sync_status güncelle
  const isFirstChunk = !conn.backfill_last_fetched_date;
  if (isFirstChunk) {
    await adminClient.from("marketplace_connections").update({
      sync_status: "backfilling",
      backfill_started_at: new Date().toISOString(),
    }).eq("id", connection_id);
  }

  const { data: syncLog } = await adminClient
    .from("marketplace_sync_logs")
    .insert({
      connection_id,
      user_id: conn.user_id,
      sync_type: "backfill",
      status: "running",
      sync_from: chunkStartDate.toISOString(),
      sync_to: chunkEndDate.toISOString(),
    })
    .select("id")
    .single();

  const credentials = btoa(`${apiKey}:${apiSecret}`);
  const startTime = Date.now();
  let totalFetched = 0;
  let totalProcessed = 0;

  try {
    const daysInChunk = Math.floor((chunkEndDate.getTime() - chunkStartDate.getTime()) / (24 * 60 * 60 * 1000));

    for (let d = 0; d < daysInChunk; d++) {
      // Bağlantı hâlâ aktif mi?
      const { data: checkConn } = await adminClient
        .from("marketplace_connections")
        .select("is_active, deleted_at")
        .eq("id", connection_id)
        .single();

      if (!checkConn?.is_active || checkConn.deleted_at) break;

      const dayStart = new Date(chunkStartDate.getTime() + d * 24 * 60 * 60 * 1000);
      dayStart.setUTCHours(0, 0, 0, 0);
      const dayEndMs = dayStart.getTime() + 24 * 60 * 60 * 1000;

      // İlerleme takibi
      await adminClient.from("marketplace_connections")
        .update({ backfill_last_fetched_date: dayStart.toISOString().slice(0, 10) })
        .eq("id", connection_id);

      let page = 0;
      let hasMore = true;
      let retryCount = 0;

      while (hasMore) {
        const url =
          `https://apigw.trendyol.com/integration/order/sellers/${conn.trendyol_supplier_id}/orders` +
          `?startDate=${dayStart.getTime()}&endDate=${dayEndMs}&size=200&page=${page}` +
          `&orderByField=PackageLastModifiedDate&orderByDirection=DESC`;

        let resp: Response;
        try {
          resp = await fetch(url, {
            headers: {
              Authorization: `Basic ${credentials}`,
              "User-Agent": `${conn.trendyol_supplier_id} - HisuPusla`,
              "Content-Type": "application/json",
            },
          });
        } catch (fetchErr) {
          if (retryCount < 3) {
            retryCount++;
            await new Promise((r) => setTimeout(r, 2000 * retryCount));
            continue;
          }
          throw new Error(`Trendyol'a ulaşılamadı: ${sanitizeError(fetchErr)}`);
        }

        if (resp.status === 429) {
          if (retryCount >= 5) throw new Error("Trendyol rate limit: 5 deneme aşıldı, backfill durduruldu");
          await new Promise((r) => setTimeout(r, Math.min(2000 * (2 ** retryCount), 30000)));
          retryCount++;
          continue;
        }

        retryCount = 0;

        if (!resp.ok) {
          hasMore = false;
          break;
        }

        const data = await resp.json();
        const orders: any[] = data.content ?? [];
        totalFetched += orders.length;
        if (orders.length < 200) hasMore = false;
        else page++;

        for (const order of orders) {
          // null/zero orderDate guard — 1970 tarihi DB'ye yazılmasın
          if (!order.orderDate || order.orderDate <= 0) continue;

          const productName =
            (order.lines ?? []).map((l: any) => l.productName).filter(Boolean).join(", ") ||
            "Trendyol Ürünü";
          const quantity =
            (order.lines ?? []).reduce((s: number, l: any) => s + (l.quantity || 1), 0) || 1;
          const status = STATUS_MAP[order.shipmentPackageStatus] ?? "aktif";

          const { error: upsertErr } = await adminClient.rpc("upsert_marketplace_sale", {
            p_user_id: conn.user_id,
            p_external_id: String(order.id),
            p_external_order_no: order.orderNumber ?? String(order.id),
            p_platform: "trendyol",
            p_product_name: productName,
            p_quantity: quantity,
            p_total_amount: order.totalPrice ?? 0,
            p_unit_price: order.lines?.[0]?.price ?? (order.totalPrice ?? 0),
            p_sale_date: toTRDate(order.orderDate),
            p_status: status,
            p_note: `Trendyol #${order.orderNumber ?? order.id} — maliyet girilmedi`,
          });

          if (!upsertErr) totalProcessed++;
        }
      }
    }

    // Chunk log
    const finishedAt = new Date().toISOString();
    if (syncLog?.id) {
      await adminClient.from("marketplace_sync_logs").update({
        status: "success",
        records_fetched: totalFetched,
        records_inserted: totalProcessed,
        finished_at: finishedAt,
        duration_ms: Date.now() - startTime,
      }).eq("id", syncLog.id);
    }

    if (isLastChunk) {
      await adminClient.from("marketplace_connections").update({
        sync_status: "idle",
        initial_backfill_done: true,
        backfill_completed_at: finishedAt,
        last_order_sync_at: finishedAt,
        sync_error_count: 0,
        sync_error_message: null,
      }).eq("id", connection_id);

      return new Response(
        JSON.stringify({ success: true, completed: true, records_fetched: totalFetched, records_processed: totalProcessed }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Sonraki chunk'ı ateşle (fire-and-forget)
    const nextFetch = fetch(`${SUPABASE_URL}/functions/v1/trendyol-backfill`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ connection_id }),
    }).catch((e) => { console.error("Backfill chunk re-trigger hatası:", e); });

    if (typeof (globalThis as any).EdgeRuntime !== "undefined") {
      (globalThis as any).EdgeRuntime.waitUntil(nextFetch);
    }

    return new Response(
      JSON.stringify({ success: true, chunk_done: true, more_chunks: true, records_fetched: totalFetched }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const errMsg = sanitizeError(err);

    await adminClient.from("marketplace_connections").update({
      sync_status: "error",
      sync_error_message: `Geçmiş aktarımı başarısız: ${errMsg}`,
    }).eq("id", connection_id);

    if (syncLog?.id) {
      await adminClient.from("marketplace_sync_logs").update({
        status: "error",
        error_message: errMsg,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      }).eq("id", syncLog.id);
    }

    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
