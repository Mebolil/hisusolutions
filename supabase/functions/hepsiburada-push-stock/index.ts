import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function sanitizeError(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 300);
  if (typeof err === "string") return err.slice(0, 300);
  return "Bilinmeyen hata";
}

function isUUID(s: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);
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

  // Kullanıcı JWT doğrulama
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

  const { connection_id, product_id, quantity: rawQuantity } = body;

  if (!connection_id || !product_id || !isUUID(connection_id) || !isUUID(product_id)) {
    return new Response(
      JSON.stringify({ error: "Geçersiz connection_id veya product_id" }),
      { status: 400 },
    );
  }

  const qty = Math.round(Number(rawQuantity));
  if (!Number.isFinite(qty) || qty < 0 || qty > 100_000) {
    return new Response(
      JSON.stringify({ error: "Stok miktarı 0 ile 100.000 arasında olmalıdır" }),
      { status: 400 },
    );
  }

  // Bağlantı sahiplik + HB doğrulama
  const { data: conn, error: connErr } = await adminClient
    .from("marketplace_connections")
    .select("id, user_id, hb_merchant_id, hb_username")
    .eq("id", connection_id)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (connErr || !conn || !conn.hb_merchant_id) {
    return new Response(JSON.stringify({ error: "Bağlantı bulunamadı" }), { status: 404 });
  }

  // Ürün sahiplik + HB doğrulama
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

  if (product.platform !== "hepsiburada" || !product.marketplace_product_id) {
    return new Response(
      JSON.stringify({ error: "Bu ürün Hepsiburada ürünü değil" }),
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

  const { data: hbPassword } = await adminClient.rpc("get_decrypted_secret", {
    secret_name: `hb_password_${connection_id}`,
  });

  if (!hbPassword || !conn.hb_username) {
    return new Response(JSON.stringify({ error: "HB credentials bulunamadı" }), { status: 500 });
  }

  const credentials = btoa(`${conn.hb_username}:${hbPassword}`);

  // Sync log
  const { data: syncLog } = await adminClient
    .from("marketplace_sync_logs")
    .insert({
      connection_id,
      user_id: user.id,
      product_id,
      sync_type: "stock_push",
      status: "running",
      quantity_sent: qty,
      sync_from: new Date().toISOString(),
      sync_to: new Date().toISOString(),
    })
    .select("id")
    .single();

  const startTime = Date.now();

  try {
    const url =
      `https://listing-external.hepsiburada.com/listings/merchantid/${conn.hb_merchant_id}`;

    let resp: Response;
    try {
      resp = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify([{
          merchantSku: product.marketplace_product_id,
          availableStock: qty,
          price: salePrice,
          listingPrice: salePrice,
        }]),
      });
    } catch (fetchErr) {
      throw new Error(`HB API'ye ulaşılamadı: ${sanitizeError(fetchErr)}`);
    }

    if (resp.status === 429) {
      throw new Error("Hepsiburada rate limit aşıldı. 60 saniye sonra tekrar deneyin.");
    }

    if (!resp.ok) {
      const errBody = await resp.text().catch(() => "");
      throw new Error(`HB API hatası (HTTP ${resp.status}): ${errBody.slice(0, 200)}`);
    }

    // HB push yanıtını kontrol et
    const result = await resp.json().catch(() => ({}));
    // HB bazı durumlarda errors array döndürür
    const errors = result?.errors ?? result?.error ?? null;
    if (errors) {
      const msg = Array.isArray(errors)
        ? errors[0]?.message ?? JSON.stringify(errors[0])
        : String(errors);
      throw new Error(`HB hatası: ${msg.slice(0, 200)}`);
    }

    const pushedAt = new Date().toISOString();

    await adminClient.from("products").update({
      quantity: qty,
      last_pushed_at: pushedAt,
    }).eq("id", product_id).eq("user_id", user.id);

    if (syncLog?.id) {
      await adminClient.from("marketplace_sync_logs").update({
        status: "success",
        records_inserted: 1,
        finished_at: new Date().toISOString(),
        duration_ms: Date.now() - startTime,
      }).eq("id", syncLog.id);
    }

    return new Response(
      JSON.stringify({ success: true }),
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
