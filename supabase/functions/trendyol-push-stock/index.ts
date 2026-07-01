import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function sanitizeError(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 300);
  if (typeof err === "string") return err.slice(0, 300);
  return "Bilinmeyen hata";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // User JWT doğrulama
  const authHeader = req.headers.get("Authorization") ?? "";
  const { data: { user }, error: userErr } = await adminClient.auth.getUser(
    authHeader.replace("Bearer ", ""),
  );
  if (userErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  let body: { connection_id: string; product_id: string; quantity: number };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Geçersiz istek" }), { status: 400 });
  }

  const { connection_id, product_id, quantity } = body;
  if (!connection_id || !product_id || quantity === undefined || quantity < 0) {
    return new Response(
      JSON.stringify({ error: "connection_id, product_id ve quantity zorunlu" }),
      { status: 400 },
    );
  }

  // Bağlantı sahiplik doğrulama
  const { data: conn, error: connErr } = await adminClient
    .from("marketplace_connections")
    .select("id, user_id, trendyol_supplier_id")
    .eq("id", connection_id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (connErr || !conn) {
    return new Response(JSON.stringify({ error: "Bağlantı bulunamadı" }), { status: 404 });
  }

  // Ürün sahiplik + Trendyol doğrulama
  const { data: product, error: productErr } = await adminClient
    .from("products")
    .select("id, user_id, name, marketplace_product_id, platform, unit_price, quantity")
    .eq("id", product_id)
    .eq("user_id", user.id)
    .is("deleted_at", null)
    .single();

  if (productErr || !product) {
    return new Response(JSON.stringify({ error: "Ürün bulunamadı" }), { status: 404 });
  }

  if (product.platform !== "trendyol" || !product.marketplace_product_id) {
    return new Response(
      JSON.stringify({ error: "Bu ürün Trendyol ürünü değil" }),
      { status: 422 },
    );
  }

  const salePrice = Number(product.unit_price ?? 0);
  if (salePrice <= 0) {
    return new Response(
      JSON.stringify({
        error: "Ürün fiyatı bulunamadı. Lütfen ürünü düzenleyerek satış fiyatı ekleyin.",
      }),
      { status: 422 },
    );
  }

  // API credentials
  const [{ data: apiKey }, { data: apiSecret }] = await Promise.all([
    adminClient.rpc("get_decrypted_secret", { secret_name: `trendyol_apikey_${connection_id}` }),
    adminClient.rpc("get_decrypted_secret", { secret_name: `trendyol_apisecret_${connection_id}` }),
  ]);

  if (!apiKey || !apiSecret) {
    return new Response(JSON.stringify({ error: "API credentials bulunamadı" }), { status: 500 });
  }

  // Sync log oluştur
  const { data: syncLog } = await adminClient
    .from("marketplace_sync_logs")
    .insert({
      connection_id,
      user_id: user.id,
      product_id,
      sync_type: "stock_push",
      status: "running",
      quantity_sent: quantity,
      sync_from: new Date().toISOString(),
      sync_to: new Date().toISOString(),
    })
    .select("id")
    .single();

  const startTime = Date.now();
  const credentials = btoa(`${apiKey}:${apiSecret}`);

  try {
    const url =
      `https://apigw.trendyol.com/sapigw/suppliers/${conn.trendyol_supplier_id}/products/price-and-inventory`;

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: "PUT",
        headers: {
          Authorization: `Basic ${credentials}`,
          "User-Agent": `${conn.trendyol_supplier_id} - HisuPusla`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: [{
            barcode: product.marketplace_product_id,
            quantity,
            salePrice,
            listPrice: salePrice,
          }],
        }),
      });
    } catch (fetchErr) {
      throw new Error(`Trendyol API'ye ulaşılamadı: ${sanitizeError(fetchErr)}`);
    }

    if (!resp.ok) {
      const errBody = await resp.text().catch(() => "");
      throw new Error(`Trendyol API hatası (HTTP ${resp.status}): ${errBody.slice(0, 200)}`);
    }

    const result = await resp.json();
    const batchRequestId: string | null = result.batchRequestId ?? null;
    const pushedAt = new Date().toISOString();

    // Başarı: lokal stok + last_pushed_at güncelle
    await adminClient.from("products").update({
      quantity,
      last_pushed_at: pushedAt,
    }).eq("id", product_id).eq("user_id", user.id);

    // Stok hareketi kaydet
    if (quantity !== Number(product.quantity)) {
      const diff = quantity - Number(product.quantity);
      await adminClient.from("stock_lots").insert({
        product_id,
        user_id: user.id,
        quantity: diff,
        unit_cost: salePrice,
        note: `Trendyol push (batchId: ${batchRequestId ?? "—"})`,
      }).then(() => {});
    }

    // Sync log güncelle
    if (syncLog?.id) {
      await adminClient.from("marketplace_sync_logs").update({
        status: "success",
        batch_request_id: batchRequestId,
        records_inserted: 1,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      }).eq("id", syncLog.id);
    }

    return new Response(
      JSON.stringify({ success: true, batch_request_id: batchRequestId }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const errMsg = sanitizeError(err);

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
