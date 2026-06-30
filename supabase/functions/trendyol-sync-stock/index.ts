import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAGE_SIZE = 200;

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

  let body: { connection_id: string; page?: number; sync_log_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Geçersiz istek" }), { status: 400 });
  }

  const { connection_id, page: startPage = 0, sync_log_id } = body;
  if (!connection_id) {
    return new Response(JSON.stringify({ error: "connection_id zorunlu" }), { status: 400 });
  }

  const { data: conn, error: connErr } = await adminClient
    .from("marketplace_connections")
    .select("id, user_id, trendyol_supplier_id, is_active, deleted_at")
    .eq("id", connection_id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (connErr || !conn) {
    return new Response(JSON.stringify({ error: "Bağlantı bulunamadı" }), { status: 404 });
  }

  const [{ data: apiKey }, { data: apiSecret }] = await Promise.all([
    adminClient.rpc("get_decrypted_secret", { secret_name: `trendyol_apikey_${connection_id}` }),
    adminClient.rpc("get_decrypted_secret", { secret_name: `trendyol_apisecret_${connection_id}` }),
  ]);

  if (!apiKey || !apiSecret) {
    return new Response(JSON.stringify({ error: "API credentials bulunamadı" }), { status: 500 });
  }

  // İlk sayfa ise sync log oluştur
  let logId = sync_log_id;
  const startTime = Date.now();

  if (!logId) {
    const { data: syncLog } = await adminClient
      .from("marketplace_sync_logs")
      .insert({
        connection_id,
        user_id: conn.user_id,
        sync_type: "stock",
        status: "running",
        sync_from: new Date().toISOString(),
        sync_to: new Date().toISOString(),
      })
      .select("id")
      .single();
    logId = syncLog?.id;
  }

  const credentials = btoa(`${apiKey}:${apiSecret}`);
  let totalFetched = 0;
  let totalUpserted = 0;

  try {
    const url =
      `https://apigw.trendyol.com/sapigw/suppliers/${conn.trendyol_supplier_id}/products` +
      `?approved=true&size=${PAGE_SIZE}&page=${startPage}`;

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
      throw new Error(`Trendyol ürün API'sine ulaşılamadı: ${sanitizeError(fetchErr)}`);
    }

    if (resp.status === 429) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Rate limit, bir sonraki sync'te devam edilecek" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    if (!resp.ok) {
      throw new Error(`Trendyol ürün API hatası (HTTP ${resp.status})`);
    }

    const data = await resp.json();
    const products: any[] = data.content ?? [];
    const totalPages: number = data.totalPages ?? data.page?.totalPages ?? 1;
    totalFetched = products.length;

    for (const product of products) {
      if (!product.barcode) continue; // marketplace_product_id için zorunlu

      const { error: upsertErr } = await adminClient.from("products").upsert({
        user_id: conn.user_id,
        name: (product.title ?? "Trendyol Ürünü").slice(0, 255),
        category: (product.categoryName ?? "Trendyol Ürünü").slice(0, 100),
        quantity: product.quantity ?? 0,
        low_stock_threshold: 5,
        unit_price: product.salePrice ?? product.listPrice ?? 0,
        sku: product.stockCode ?? null,
        marketplace_product_id: String(product.barcode),
        platform: "trendyol",
        urun_kodu: product.stockCode ?? null,
        note: `Trendyol Ürün ID: ${product.barcode}`,
      }, {
        onConflict: "user_id,marketplace_product_id",
        ignoreDuplicates: false, // stok/fiyat güncellensin
      });

      if (!upsertErr) totalUpserted++;
      else console.error("products upsert hatası:", upsertErr.message);
    }

    const isLastPage = startPage + 1 >= totalPages;

    if (!isLastPage) {
      // Sonraki sayfayı self-trigger et (chunk-based — timeout önlemi)
      const nextFetch = fetch(`${SUPABASE_URL}/functions/v1/trendyol-sync-stock`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ connection_id, page: startPage + 1, sync_log_id: logId }),
      }).catch((e) => { console.error("Stock sync next-page trigger hatası:", e); });

      if (typeof (globalThis as any).EdgeRuntime !== "undefined") {
        (globalThis as any).EdgeRuntime.waitUntil(nextFetch);
      }

      return new Response(
        JSON.stringify({ success: true, page: startPage, more_pages: true, records_upserted: totalUpserted }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    // Son sayfa: log + last_stock_sync_at güncelle
    const finishedAt = new Date().toISOString();
    if (logId) {
      await adminClient.from("marketplace_sync_logs").update({
        status: "success",
        records_fetched: totalFetched,
        records_inserted: totalUpserted,
        finished_at: finishedAt,
        duration_ms: Date.now() - startTime,
      }).eq("id", logId);
    }

    await adminClient.from("marketplace_connections").update({
      last_stock_sync_at: finishedAt,
    }).eq("id", connection_id);

    return new Response(
      JSON.stringify({ success: true, page: startPage, completed: true, records_upserted: totalUpserted }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const errMsg = sanitizeError(err);

    if (logId) {
      await adminClient.from("marketplace_sync_logs").update({
        status: "error",
        error_message: errMsg,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      }).eq("id", logId);
    }

    return new Response(
      JSON.stringify({ error: errMsg }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
});
