import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYNC_ORDERS_URL = `${SUPABASE_URL}/functions/v1/trendyol-sync-orders`;
const SYNC_CALL_TIMEOUT_MS = 30_000; // 30s per sync call max

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  // Service role auth — sadece pg_cron tetikleyebilir
  const auth = req.headers.get("Authorization") ?? "";
  if (auth.replace("Bearer ", "") !== SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Aktif bağlantıları çek — zaten çalışan, backfill yapan ve devre dışı olanları atla
  const { data: connections, error } = await adminClient
    .from("marketplace_connections")
    .select("id, platform, last_order_sync_at, sync_status, sync_error_count")
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("sync_status", "in", '("disabled","running","backfilling")');

  if (error) {
    return new Response(JSON.stringify({ error: "Bağlantılar alınamadı" }), { status: 500 });
  }

  const nowMs = Date.now();
  const ORDER_SYNC_INTERVAL_MS = 25 * 60 * 1000; // 25 dk (30 dk'lık cron'da güvenlik marjı)
  const triggered: string[] = [];
  const skipped: string[] = [];

  for (const conn of connections ?? []) {
    // Faz 2: sadece Trendyol
    if (conn.platform !== "trendyol") {
      skipped.push(conn.id);
      continue;
    }

    // Circuit breaker: art arda 3+ hata → sync_status='error' oldu, filtreden geçmedi
    // ama sync_error_count >= 5 olan 'idle' bağlantıları da koru
    if ((conn.sync_error_count ?? 0) >= 5) {
      skipped.push(conn.id);
      continue;
    }

    // Zaman kontrolü: son sync'ten 25 dk geçmemiş → atla
    const lastSyncMs = conn.last_order_sync_at
      ? new Date(conn.last_order_sync_at).getTime()
      : 0;

    if (nowMs - lastSyncMs < ORDER_SYNC_INTERVAL_MS) {
      skipped.push(conn.id);
      continue;
    }

    // Sync'i tetikle (timeout ile)
    try {
      await fetch(SYNC_ORDERS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ connection_id: conn.id }),
        signal: AbortSignal.timeout(SYNC_CALL_TIMEOUT_MS),
      });
      triggered.push(conn.id);
    } catch {
      // Timeout veya hata — bir sonraki bağlantıya geç
      skipped.push(conn.id);
    }

    // Bağlantılar arası kısa bekleme (rate limit)
    await new Promise((r) => setTimeout(r, 500));
  }

  return new Response(
    JSON.stringify({ success: true, triggered: triggered.length, skipped: skipped.length }),
    { headers: { "Content-Type": "application/json" } },
  );
});
