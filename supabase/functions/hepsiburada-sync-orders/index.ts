import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const PAGE_LIMIT = 50;
const MAX_WINDOW_DAYS = 30;

function sanitizeError(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 300);
  if (typeof err === "string") return err.slice(0, 300);
  return "Bilinmeyen hata";
}

// HB status → uygulama status mapping
function mapHbStatus(hbStatus: string): string {
  const s = (hbStatus ?? "").toLowerCase();
  if (s.includes("cancel") || s === "cancelled") return "iptal";
  if (s.includes("return") || s === "returned") return "iade_edildi";
  return "aktif";
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
    .select("id, user_id, hb_merchant_id, last_order_sync_at, is_active, deleted_at")
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
  const { data: connMeta } = await adminClient
    .from("marketplace_connections")
    .select("hb_username")
    .eq("id", connection_id)
    .single();

  if (!hbPassword || !connMeta?.hb_username) {
    return new Response(JSON.stringify({ error: "HB credentials bulunamadı" }), { status: 500 });
  }

  const credentials = btoa(`${connMeta.hb_username}:${hbPassword}`);

  let logId = sync_log_id;
  const startTime = Date.now();

  if (!logId) {
    const { data: syncLog } = await adminClient
      .from("marketplace_sync_logs")
      .insert({
        connection_id,
        user_id: conn.user_id,
        sync_type: "orders",
        status: "running",
        sync_from: new Date().toISOString(),
        sync_to: new Date().toISOString(),
      })
      .select("id")
      .single();
    logId = syncLog?.id;
  }

  let totalInserted = 0;

  try {
    // Son sync'ten 1 gün öncesinden başla, max 30 gün
    const nowMs = Date.now();
    const syncFromMs = conn.last_order_sync_at
      ? Math.max(
          new Date(conn.last_order_sync_at).getTime() - 24 * 60 * 60 * 1000,
          nowMs - MAX_WINDOW_DAYS * 24 * 60 * 60 * 1000,
        )
      : nowMs - MAX_WINDOW_DAYS * 24 * 60 * 60 * 1000;

    const beginDate = new Date(syncFromMs).toISOString().slice(0, 19) + "Z";
    const endDate = new Date(nowMs).toISOString().slice(0, 19) + "Z";

    const url =
      `https://oms-external.hepsiburada.com/packages/${conn.hb_merchant_id}` +
      `?beginDate=${beginDate}&endDate=${endDate}&offset=${startOffset}&limit=${PAGE_LIMIT}`;

    let resp: Response;
    try {
      resp = await fetch(url, {
        headers: {
          Authorization: `Basic ${credentials}`,
          "Content-Type": "application/json",
        },
      });
    } catch (fetchErr) {
      throw new Error(`HB Orders API'ye ulaşılamadı: ${sanitizeError(fetchErr)}`);
    }

    if (resp.status === 429) {
      return new Response(
        JSON.stringify({ skipped: true, reason: "Rate limit" }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    if (!resp.ok) {
      throw new Error(`HB Orders API hatası (HTTP ${resp.status})`);
    }

    const data = await resp.json();
    const packages: any[] = data?.data ?? data?.packages ?? data ?? [];
    const totalCount: number = data?.totalCount ?? data?.total ?? packages.length;
    const hasMore = startOffset + PAGE_LIMIT < totalCount;

    for (const pkg of packages) {
      const packageNumber = pkg.packageNumber ?? pkg.id;
      if (!packageNumber) continue;

      const lines: any[] = pkg.lines ?? pkg.lineItems ?? [];
      const customerName = `${pkg.customer?.firstName ?? ""} ${pkg.customer?.lastName ?? ""}`.trim() || null;
      const totalAmount = Number(pkg.totalPrice ?? pkg.amount ?? 0);
      const saleDate = pkg.createdDate
        ? new Date(pkg.createdDate).toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 10);
      const status = mapHbStatus(pkg.status ?? "");

      // Sipariş başına bir satış kaydı — çoklu ürün varsa birinci satır ürün adı
      const productName = lines.length > 0
        ? lines.map((l: any) => `${l.productName ?? l.name ?? "Ürün"} x${l.quantity ?? 1}`).join(", ").slice(0, 255)
        : "Hepsiburada Siparişi";
      const quantity = lines.reduce((sum: number, l: any) => sum + Number(l.quantity ?? 1), 0);
      const unitPrice = lines.length > 0 ? Number(lines[0].price ?? 0) : totalAmount;

      // Müşteri kaydı — varsa bul, yoksa oluştur
      let customerId: string | null = null;
      if (customerName) {
        const { data: existingCustomer } = await adminClient
          .from("customers")
          .select("id")
          .eq("user_id", conn.user_id)
          .eq("name", customerName)
          .maybeSingle();

        if (existingCustomer?.id) {
          customerId = existingCustomer.id;
        } else {
          const { data: newCustomer } = await adminClient
            .from("customers")
            .insert({ user_id: conn.user_id, name: customerName })
            .select("id")
            .single();
          customerId = newCustomer?.id ?? null;
        }
      }

      const { error: upsertErr } = await adminClient.from("sales").upsert({
        user_id: conn.user_id,
        customer_id: customerId,
        external_id: String(packageNumber),
        external_order_no: String(packageNumber),
        platform: "hepsiburada",
        product_name: productName,
        quantity,
        unit_price: unitPrice,
        total_amount: totalAmount,
        total_cost: null,
        sale_date: saleDate,
        status,
        note: `HB Paket: ${packageNumber}`,
      }, {
        onConflict: "user_id,external_id,platform",
        ignoreDuplicates: false,
      });

      if (!upsertErr) totalInserted++;
      else console.error("sales upsert hatası:", upsertErr.message);
    }

    if (hasMore) {
      const nextFetch = fetch(`${SUPABASE_URL}/functions/v1/hepsiburada-sync-orders`, {
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
      }).catch((e) => { console.error("HB orders next-page hatası:", e); });

      if (typeof (globalThis as any).EdgeRuntime !== "undefined") {
        (globalThis as any).EdgeRuntime.waitUntil(nextFetch);
      }

      return new Response(
        JSON.stringify({ success: true, offset: startOffset, more_pages: true, records_inserted: totalInserted }),
        { headers: { "Content-Type": "application/json" } },
      );
    }

    const finishedAt = new Date().toISOString();
    if (logId) {
      await adminClient.from("marketplace_sync_logs").update({
        status: "success",
        records_fetched: totalInserted,
        records_inserted: totalInserted,
        finished_at: finishedAt,
        duration_ms: Date.now() - startTime,
      }).eq("id", logId);
    }

    await adminClient.from("marketplace_connections").update({
      last_order_sync_at: finishedAt,
    }).eq("id", connection_id);

    return new Response(
      JSON.stringify({ success: true, completed: true, records_inserted: totalInserted }),
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
