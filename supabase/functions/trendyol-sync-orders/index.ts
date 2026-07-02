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

// Türkiye UTC+3 sabit (2016'dan beri DST yok)
// String timestamp da normalize edilir (Trendyol bazen string ms döndürür)
function toTRDate(msTimestamp: number | string): string {
  const ts = typeof msTimestamp === "string" ? Number(msTimestamp) : msTimestamp;
  if (!ts || ts <= 0 || isNaN(ts)) return new Date().toISOString().slice(0, 10);
  return new Date(ts + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  // Sadece service role erişimi — orchestrator'dan tetiklenir
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

  // Bağlantıyı çek
  const { data: conn, error: connErr } = await adminClient
    .from("marketplace_connections")
    .select("id, user_id, trendyol_supplier_id, last_order_sync_at, sync_status, sync_error_count")
    .eq("id", connection_id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (connErr || !conn) {
    return new Response(JSON.stringify({ error: "Bağlantı bulunamadı" }), { status: 404 });
  }

  // Zaten çalışıyorsa atla — çakışan sync önlemi
  if (conn.sync_status === "running" || conn.sync_status === "backfilling") {
    return new Response(JSON.stringify({ skipped: true, reason: "Sync zaten çalışıyor" }), { status: 200 });
  }

  // Vault'tan credentials çek
  const [{ data: apiKey }, { data: apiSecret }] = await Promise.all([
    adminClient.rpc("get_decrypted_secret", { secret_name: `trendyol_apikey_${connection_id}` }),
    adminClient.rpc("get_decrypted_secret", { secret_name: `trendyol_apisecret_${connection_id}` }),
  ]);

  if (!apiKey || !apiSecret) {
    return new Response(JSON.stringify({ error: "API credentials bulunamadı" }), { status: 500 });
  }

  // Sync penceresi: son sync'ten 10 dk önce veya son 2 saat (ilk sync)
  const nowMs = Date.now();
  const syncFromMs = conn.last_order_sync_at
    ? new Date(conn.last_order_sync_at).getTime() - 10 * 60 * 1000
    : nowMs - 2 * 60 * 60 * 1000;

  // Sync log başlat
  const { data: syncLog } = await adminClient
    .from("marketplace_sync_logs")
    .insert({
      connection_id,
      user_id: conn.user_id,
      sync_type: "orders",
      status: "running",
      sync_from: new Date(syncFromMs).toISOString(),
      sync_to: new Date(nowMs).toISOString(),
    })
    .select("id")
    .single();

  // Bağlantı durumunu güncelle
  await adminClient
    .from("marketplace_connections")
    .update({ sync_status: "running" })
    .eq("id", connection_id);

  const credentials = btoa(`${apiKey}:${apiSecret}`);
  const startTime = Date.now();
  let totalFetched = 0;
  let totalProcessed = 0;

  try {
    let page = 0;
    let hasMore = true;
    let retryCount = 0;

    while (hasMore) {
      const url =
        `https://apigw.trendyol.com/integration/order/sellers/${conn.trendyol_supplier_id}/orders` +
        `?startDate=${syncFromMs}&endDate=${nowMs}&size=200&page=${page}` +
        `&orderByField=PackageLastModifiedDate&orderByDirection=DESC`;

      let resp: Response;
      try {
        resp = await fetch(url, {
          headers: {
            Authorization: `Basic ${credentials}`,
            "User-Agent": `${conn.trendyol_supplier_id} - PUSLA`,
            "Content-Type": "application/json",
          },
        });
      } catch (fetchErr) {
        throw new Error(`Trendyol'a ulaşılamadı: ${sanitizeError(fetchErr)}`);
      }

      if (resp.status === 429) {
        if (retryCount >= 5) throw new Error("Trendyol rate limit: 5 deneme aşıldı");
        await new Promise((r) => setTimeout(r, Math.min(2000 * (2 ** retryCount), 30000)));
        retryCount++;
        continue;
      }
      retryCount = 0;

      if (!resp.ok) {
        throw new Error(`Trendyol API hatası (HTTP ${resp.status})`);
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

    // Başarı
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

    await adminClient.from("marketplace_connections").update({
      sync_status: "idle",
      last_order_sync_at: new Date(nowMs).toISOString(),
      sync_error_count: 0,
      sync_error_message: null,
    }).eq("id", connection_id);

    return new Response(
      JSON.stringify({ success: true, records_fetched: totalFetched, records_processed: totalProcessed }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const errMsg = sanitizeError(err);
    const newErrCount = (conn.sync_error_count ?? 0) + 1;

    if (syncLog?.id) {
      await adminClient.from("marketplace_sync_logs").update({
        status: "error",
        error_message: errMsg,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      }).eq("id", syncLog.id);
    }

    await adminClient.from("marketplace_connections").update({
      sync_status: newErrCount >= 3 ? "error" : "idle",
      sync_error_message: newErrCount >= 3
        ? `Trendyol'a ${newErrCount} kez arka arkaya ulaşılamadı. Bağlantı bilgilerini kontrol edin.`
        : errMsg,
      sync_error_count: newErrCount,
    }).eq("id", connection_id);

    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
