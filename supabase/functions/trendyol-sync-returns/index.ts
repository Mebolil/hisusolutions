import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAGE_SIZE = 50;
const MAX_WINDOW_DAYS = 14;

function sanitizeError(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 300);
  if (typeof err === "string") return err.slice(0, 300);
  return "Bilinmeyen hata";
}

// Türkiye UTC+3 sabit
function toTRDate(msTimestamp: number | string | null | undefined): string {
  if (!msTimestamp) return new Date().toISOString().slice(0, 10);
  const ts = typeof msTimestamp === "string" ? Number(msTimestamp) : msTimestamp;
  if (!ts || ts <= 0 || isNaN(ts)) return new Date().toISOString().slice(0, 10);
  return new Date(ts + 3 * 60 * 60 * 1000).toISOString().slice(0, 10);
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
    .select("id, user_id, trendyol_supplier_id, last_returns_sync_at")
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

  // Sync penceresi — son sync'ten 1 gün öncesinden başla, max 14 gün
  const nowMs = Date.now();
  const syncFromMs = conn.last_returns_sync_at
    ? Math.max(
        new Date(conn.last_returns_sync_at).getTime() - 24 * 60 * 60 * 1000,
        nowMs - MAX_WINDOW_DAYS * 24 * 60 * 60 * 1000,
      )
    : nowMs - MAX_WINDOW_DAYS * 24 * 60 * 60 * 1000;

  const credentials = btoa(`${apiKey}:${apiSecret}`);
  const startTime = Date.now();
  let totalFetched = 0;
  let totalInserted = 0;
  let totalDuplicate = 0;

  const { data: syncLog } = await adminClient
    .from("marketplace_sync_logs")
    .insert({
      connection_id,
      user_id: conn.user_id,
      sync_type: "returns",
      status: "running",
      sync_from: new Date(syncFromMs).toISOString(),
      sync_to: new Date(nowMs).toISOString(),
    })
    .select("id")
    .single();

  try {
    let page = 0;
    let hasMore = true;

    while (hasMore) {
      const url =
        `https://apigw.trendyol.com/integration/order/sellers/${conn.trendyol_supplier_id}/claims` +
        `?startDate=${syncFromMs}&endDate=${nowMs}&page=${page}&size=${PAGE_SIZE}`;

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
        throw new Error(`Trendyol iade API'ye ulaşılamadı: ${sanitizeError(fetchErr)}`);
      }

      if (resp.status === 429) {
        await new Promise((r) => setTimeout(r, 10000));
        continue;
      }

      if (!resp.ok) {
        throw new Error(`Trendyol iade API hatası (HTTP ${resp.status})`);
      }

      const data = await resp.json();
      const claims: any[] = data.content ?? [];
      totalFetched += claims.length;

      const totalPages = data.totalPages ?? data.page?.totalPages ?? 1;
      if (page + 1 >= totalPages || claims.length === 0) hasMore = false;
      else page++;

      for (const claim of claims) {
        const claimId = String(claim.id ?? claim.claimId ?? "");
        if (!claimId) continue;

        const { error: upsertErr } = await adminClient
          .from("marketplace_returns")
          .upsert({
            user_id: conn.user_id,
            marketplace_connection_id: connection_id,
            claim_id: claimId,
            order_id: claim.orderId ? String(claim.orderId) : null,
            claim_type: claim.claimType ?? null,
            return_date: toTRDate(claim.returnDate ?? claim.createdDate ?? null),
            total_price: claim.totalPrice ?? claim.claimItemTotalPrice ?? null,
            items: claim.claimItems ?? claim.items ?? null,
            synced_at: new Date().toISOString(),
          }, {
            onConflict: "user_id,claim_id",
            ignoreDuplicates: false,
          });

        if (!upsertErr) {
          totalInserted++;
        } else {
          console.error("İade upsert hatası:", upsertErr.message);
        }
      }
    }

    const finishedAt = new Date().toISOString();
    if (syncLog?.id) {
      await adminClient.from("marketplace_sync_logs").update({
        status: "success",
        records_fetched: totalFetched,
        records_inserted: totalInserted,
        finished_at: finishedAt,
        duration_ms: Date.now() - startTime,
      }).eq("id", syncLog.id);
    }

    await adminClient.from("marketplace_connections").update({
      last_returns_sync_at: new Date(nowMs).toISOString(),
    }).eq("id", connection_id);

    return new Response(
      JSON.stringify({
        success: true,
        records_fetched: totalFetched,
        records_upserted: totalInserted,
        records_duplicate: totalDuplicate,
      }),
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
