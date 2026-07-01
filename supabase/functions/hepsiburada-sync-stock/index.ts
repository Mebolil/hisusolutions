import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAGE_LIMIT = 1000;

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

  let body: { connection_id: string; offset?: number; sync_log_id?: string };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Geçersiz istek" }), { status: 400 });
  }

  const { connection_id, offset: startOffset = 0, sync_log_id } = body;
  if (!connection_id) {
    return new Response(JSON.stringify({ error: "connection_id zorunlu" }), { status: 400 });
  }

  const { data: conn, error: connErr } = await adminClient
    .from("marketplace_connections")
    .select("id, user_id, hb_merchant_id, is_active, deleted_at")
    .eq("id", connection_id)
    .eq("is_active", true)
    .is("deleted_at", null)
    .single();

  if (connErr || !conn || !conn.hb_merchant_id) {
    return new Response(JSON.stringify({ error: "Bağlantı bulunamadı" }), { status: 404 });
  }

  const { data: hbPassword } = await adminClient.rpc("get_decrypted_secret", {
    secret_name: `hb_password_${connection_id}`,
  });
  const { data: hbUsername } = await adminClient
    .from("marketplace_connections")
    .select("hb_username")
    .eq("id", connection_id)
    .single();

  if (!hbPassword || !hbUsername?.hb_username) {
    return new Response(JSON.stringify({ error: "HB credentials bulunamadı" }), { status: 500 });
  }

  const credentials = btoa(`${hbUsername.hb_username}:${hbPassword}`);

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

  let totalUpserted = 0;

  try {
    const url =
      `https://listing-external.hepsiburada.com/listings/merchantid/${conn.hb_merchant_id}` +
      `?offset=${startOffset}&limit=${PAGE_LIMIT}`;

    let resp: Response;
    try {
      resp = await fetch(url, {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
      });
    } catch (fetchErr) {
      throw new Error(`HB Listings API'ye ulaşılamadı: ${sanitizeError(fetchErr)}`);
    }

    if (resp.status === 429) {
      if (logId) {
        await adminClient.from("marketplace_sync_logs").update({
          status: "skipped",
          error_message: "HB API rate limit — tekrar denenecek",
          finished_at: new Date().toISOString(),
          duration_ms: Date.now() - startTime,
        }).eq("id", logId);
      }
      return new Response(
        JSON.stringify({ skipped: true, reason: "Rate limit, bir sonraki sync'te devam edilecek" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    if (!resp.ok) {
      throw new Error(`HB Listings API hatası (HTTP ${resp.status})`);
    }

    const data = await resp.json();
    // HB listings response: { data: { listings: [...] } } veya { listings: [...] }
    const listings: any[] = data?.data?.listings ?? data?.listings ?? [];
    const totalCount: number = data?.data?.totalCount ?? data?.totalCount ?? listings.length;
    const hasMore = startOffset + PAGE_LIMIT < totalCount;

    for (const listing of listings) {
      const merchantSku = listing.merchantSku ?? listing.sku;
      if (!merchantSku) continue;

      const { error: upsertErr } = await adminClient.from("products").upsert({
        user_id: conn.user_id,
        name: (listing.name ?? listing.productName ?? merchantSku).slice(0, 255),
        category: (listing.categoryName ?? "Hepsiburada Ürünü").slice(0, 100),
        quantity: Number(listing.availableStock ?? listing.stock ?? 0),
        low_stock_threshold: 5,
        unit_price: Number(listing.price ?? 0),
        sku: merchantSku,
        marketplace_product_id: String(merchantSku),
        platform: "hepsiburada",
        urun_kodu: merchantSku,
        note: `HB SKU: ${merchantSku}`,
      }, {
        onConflict: "user_id,marketplace_product_id,platform",
        ignoreDuplicates: false,
      });

      if (!upsertErr) totalUpserted++;
      else console.error("products upsert hatası:", upsertErr.message);
    }

    if (hasMore) {
      const nextFetch = fetch(`${SUPABASE_URL}/functions/v1/hepsiburada-sync-stock`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          connection_id,
          offset: startOffset + PAGE_LIMIT,
          sync_log_id: logId,
        }),
      }).catch((e) => { console.error("HB stock sync next-page hatası:", e); });

      if (typeof (globalThis as any).EdgeRuntime !== "undefined") {
        (globalThis as any).EdgeRuntime.waitUntil(nextFetch);
      }

      return new Response(
        JSON.stringify({ success: true, offset: startOffset, more_pages: true, records_upserted: totalUpserted }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const finishedAt = new Date().toISOString();
    if (logId) {
      await adminClient.from("marketplace_sync_logs").update({
        status: "success",
        records_fetched: totalUpserted,
        records_inserted: totalUpserted,
        finished_at: finishedAt,
        duration_ms: Date.now() - startTime,
      }).eq("id", logId);
    }

    await adminClient.from("marketplace_connections").update({
      last_stock_sync_at: finishedAt,
      initial_backfill_done: true,
    }).eq("id", connection_id);

    return new Response(
      JSON.stringify({ success: true, completed: true, records_upserted: totalUpserted }),
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
    return new Response(JSON.stringify({ error: errMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
