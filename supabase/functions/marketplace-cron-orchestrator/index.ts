import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const SYNC_ORDERS_URL = `${SUPABASE_URL}/functions/v1/trendyol-sync-orders`;
const SYNC_FINANCIAL_URL = `${SUPABASE_URL}/functions/v1/trendyol-sync-financial`;
const SYNC_STOCK_URL = `${SUPABASE_URL}/functions/v1/trendyol-sync-stock`;
const SYNC_RETURNS_URL = `${SUPABASE_URL}/functions/v1/trendyol-sync-returns`;
const SYNC_CALL_TIMEOUT_MS = 30_000;

const ORDER_SYNC_INTERVAL_MS = 25 * 60 * 1000;          // 25 dk
const FINANCIAL_SYNC_INTERVAL_MS = 23 * 60 * 60 * 1000; // 23 saat (günlük)
const STOCK_SYNC_INTERVAL_MS = 3.5 * 60 * 60 * 1000;    // 3.5 saat
const RETURNS_SYNC_INTERVAL_MS = 30 * 60 * 1000;         // 30 dk

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: { "Access-Control-Allow-Origin": "*" } });
  }

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const auth = req.headers.get("Authorization") ?? "";
  const cronSecretHeader = req.headers.get("X-Cron-Secret") ?? "";

  const isServiceRoleAuth = auth.replace("Bearer ", "") === SUPABASE_SERVICE_ROLE_KEY;

  let isCronAuth = false;
  if (!isServiceRoleAuth && cronSecretHeader) {
    const { data: storedSecret } = await adminClient
      .from("cron_secrets")
      .select("value")
      .eq("key", "orchestrator_secret")
      .single();
    isCronAuth = !!storedSecret && storedSecret.value === cronSecretHeader;
  }

  if (!isServiceRoleAuth && !isCronAuth) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const { data: connections, error } = await adminClient
    .from("marketplace_connections")
    .select(
      "id, platform, last_order_sync_at, last_financial_sync_at, last_stock_sync_at, last_returns_sync_at, sync_status, sync_error_count, initial_backfill_done",
    )
    .eq("is_active", true)
    .is("deleted_at", null)
    .not("sync_status", "in", '("disabled","running","backfilling")');

  if (error) {
    return new Response(JSON.stringify({ error: "Bağlantılar alınamadı" }), { status: 500 });
  }

  const nowMs = Date.now();
  const results = {
    orders: { triggered: 0, skipped: 0 },
    financial: { triggered: 0, skipped: 0 },
    stock: { triggered: 0, skipped: 0 },
    returns: { triggered: 0, skipped: 0 },
  };

  for (const conn of connections ?? []) {
    if (conn.platform !== "trendyol") continue;

    // Circuit breaker: art arda 5+ hata → atla
    if ((conn.sync_error_count ?? 0) >= 5) {
      results.orders.skipped++;
      continue;
    }

    // Backfill tamamlanmadan order sync çalıştırma
    if (!conn.initial_backfill_done) {
      results.orders.skipped++;
      continue;
    }

    // ── Sipariş sync (her 25 dk) ──────────────────────────────
    const lastOrderMs = conn.last_order_sync_at
      ? new Date(conn.last_order_sync_at).getTime()
      : 0;

    if (nowMs - lastOrderMs >= ORDER_SYNC_INTERVAL_MS) {
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
        results.orders.triggered++;
      } catch {
        results.orders.skipped++;
      }
      await new Promise((r) => setTimeout(r, 300));
    } else {
      results.orders.skipped++;
    }

    // ── Finansal sync (günlük) ────────────────────────────────
    const lastFinancialMs = conn.last_financial_sync_at
      ? new Date(conn.last_financial_sync_at).getTime()
      : 0;

    if (nowMs - lastFinancialMs >= FINANCIAL_SYNC_INTERVAL_MS) {
      try {
        fetch(SYNC_FINANCIAL_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ connection_id: conn.id }),
          signal: AbortSignal.timeout(SYNC_CALL_TIMEOUT_MS),
        }).catch((e) => { console.error("Finansal sync tetikleme hatası:", e); });
        results.financial.triggered++;
      } catch {
        results.financial.skipped++;
      }
      await new Promise((r) => setTimeout(r, 300));
    } else {
      results.financial.skipped++;
    }

    // ── Stok sync (4 saatte bir) ──────────────────────────────
    const lastStockMs = conn.last_stock_sync_at
      ? new Date(conn.last_stock_sync_at).getTime()
      : 0;

    if (nowMs - lastStockMs >= STOCK_SYNC_INTERVAL_MS) {
      try {
        fetch(SYNC_STOCK_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ connection_id: conn.id }),
          signal: AbortSignal.timeout(SYNC_CALL_TIMEOUT_MS),
        }).catch((e) => { console.error("Stok sync tetikleme hatası:", e); });
        results.stock.triggered++;
      } catch {
        results.stock.skipped++;
      }
      await new Promise((r) => setTimeout(r, 300));
    } else {
      results.stock.skipped++;
    }

    // ── İade/İptal sync (30 dakikada bir) ────────────────────
    const lastReturnsMs = conn.last_returns_sync_at
      ? new Date(conn.last_returns_sync_at).getTime()
      : 0;

    if (nowMs - lastReturnsMs >= RETURNS_SYNC_INTERVAL_MS) {
      try {
        fetch(SYNC_RETURNS_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ connection_id: conn.id }),
          signal: AbortSignal.timeout(SYNC_CALL_TIMEOUT_MS),
        }).catch((e) => { console.error("İade sync tetikleme hatası:", e); });
        results.returns.triggered++;
      } catch {
        results.returns.skipped++;
      }
      await new Promise((r) => setTimeout(r, 300));
    } else {
      results.returns.skipped++;
    }
  }

  return new Response(
    JSON.stringify({ success: true, results }),
    { headers: { "Content-Type": "application/json" } },
  );
});
