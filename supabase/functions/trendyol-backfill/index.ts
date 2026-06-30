import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

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
    .select("id, user_id, trendyol_supplier_id, initial_backfill_done")
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

  // Backfill başladı
  await adminClient.from("marketplace_connections").update({
    sync_status: "backfilling",
    backfill_started_at: new Date().toISOString(),
  }).eq("id", connection_id);

  const { data: syncLog } = await adminClient
    .from("marketplace_sync_logs")
    .insert({
      connection_id,
      user_id: conn.user_id,
      sync_type: "backfill",
      status: "running",
      sync_from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      sync_to: new Date().toISOString(),
    })
    .select("id")
    .single();

  const credentials = btoa(`${apiKey}:${apiSecret}`);
  const startTime = Date.now();
  let totalFetched = 0;
  let totalProcessed = 0;

  try {
    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      // Bağlantı hala aktif mi kontrol et (kullanıcı silmiş olabilir)
      const { data: checkConn } = await adminClient
        .from("marketplace_connections")
        .select("is_active, deleted_at")
        .eq("id", connection_id)
        .single();

      if (!checkConn?.is_active || checkConn.deleted_at) break;

      // Günlük pencere: [T 00:00 UTC, T+1 00:00 UTC) — kapalı-açık aralık
      const dayStart = new Date();
      dayStart.setUTCHours(0, 0, 0, 0);
      dayStart.setUTCDate(dayStart.getUTCDate() - dayOffset);
      const dayEndMs = dayStart.getTime() + 24 * 60 * 60 * 1000;

      // İlerleme takibi
      await adminClient.from("marketplace_connections")
        .update({ backfill_last_fetched_date: dayStart.toISOString().slice(0, 10) })
        .eq("id", connection_id);

      // Günlük siparişleri çek (sayfalı)
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
            p_platform: "Trendyol",
            p_product_name: productName,
            p_quantity: quantity,
            p_total_amount: order.totalPrice ?? 0,
            p_unit_price: order.lines?.[0]?.price ?? (order.totalPrice ?? 0),
            p_sale_date: new Date(order.orderDate).toISOString().slice(0, 10),
            p_status: status,
            p_note: `Trendyol #${order.orderNumber ?? order.id} — maliyet girilmedi`,
          });

          if (!upsertErr) totalProcessed++;
        }
      }
    }

    // Backfill tamamlandı
    const finishedAt = new Date().toISOString();
    await adminClient.from("marketplace_connections").update({
      sync_status: "idle",
      initial_backfill_done: true,
      backfill_completed_at: finishedAt,
      last_order_sync_at: finishedAt,
      sync_error_count: 0,
      sync_error_message: null,
    }).eq("id", connection_id);

    if (syncLog?.id) {
      await adminClient.from("marketplace_sync_logs").update({
        status: "success",
        records_fetched: totalFetched,
        records_inserted: totalProcessed,
        finished_at: finishedAt,
        duration_ms: Date.now() - startTime,
      }).eq("id", syncLog.id);
    }

    return new Response(
      JSON.stringify({ success: true, records_fetched: totalFetched, records_processed: totalProcessed }),
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
