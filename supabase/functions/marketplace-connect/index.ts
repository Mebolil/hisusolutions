import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://hisusolutions.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function sanitizeError(err: unknown): string {
  if (err instanceof Error) return err.message.slice(0, 300);
  if (typeof err === "string") return err.slice(0, 300);
  return "Bilinmeyen hata";
}

const TY_ERROR_MESSAGES: Record<number, string> = {
  401: "API anahtarı veya şifre hatalı. Trendyol Satıcı Paneli'nden kontrol edin.",
  403: "Bu API anahtarının yeterli yetkisi yok.",
  404: "Mağaza (Supplier ID) bulunamadı. Supplier ID'nizi kontrol edin.",
  429: "Trendyol rate limit aşıldı. Lütfen 1 dakika bekleyip tekrar deneyin.",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  // Kullanıcı JWT doğrulama
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Yetkilendirme başlığı eksik" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await adminClient.auth.getUser(token);
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Geçersiz oturum" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "connect";

  // ──────────────────────────────────────────────
  // Bağlantı testi + kaydetme
  // ──────────────────────────────────────────────
  if (req.method === "POST" && action === "connect") {
    let body: {
      platform: string;
      store_name?: string;
      trendyol_supplier_id?: string;
      api_key?: string;
      api_secret?: string;
    };

    try {
      body = await req.json();
    } catch {
      return new Response(JSON.stringify({ error: "Geçersiz istek gövdesi" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { platform, store_name, trendyol_supplier_id, api_key, api_secret } = body;

    if (!platform || !["trendyol", "hepsiburada"].includes(platform)) {
      return new Response(JSON.stringify({ error: "Geçersiz platform" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Trendyol bağlantısı
    if (platform === "trendyol") {
      if (!trendyol_supplier_id || !api_key || !api_secret) {
        return new Response(
          JSON.stringify({ error: "Supplier ID, API Anahtarı ve API Şifresi zorunludur" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      // Trendyol API testi
      const testUrl =
        `https://apigw.trendyol.com/sapigw/suppliers/${trendyol_supplier_id}/products?size=1`;
      const credentials = btoa(`${api_key}:${api_secret}`);

      let testResp: Response;
      try {
        testResp = await fetch(testUrl, {
          headers: {
            "Authorization": `Basic ${credentials}`,
            "User-Agent": `${trendyol_supplier_id} - HisuPusla`,
            "Content-Type": "application/json",
          },
        });
      } catch (fetchErr) {
        return new Response(
          JSON.stringify({ error: `Trendyol'a ulaşılamadı: ${sanitizeError(fetchErr)}` }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }

      if (!testResp.ok) {
        const msg =
          TY_ERROR_MESSAGES[testResp.status] ??
          `Trendyol bağlantısı başarısız (HTTP ${testResp.status})`;
        return new Response(JSON.stringify({ error: msg }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Vault'a kaydet — atomic olmayan işlem, hata durumunda temizle
      const connId = crypto.randomUUID();
      let apiKeySecretId: string | null = null;
      let apiSecretSecretId: string | null = null;

      async function cleanupVaultSecrets() {
        for (const sid of [apiKeySecretId, apiSecretSecretId].filter(Boolean)) {
          try { await adminClient.rpc("vault_delete_secret", { p_id: sid }); } catch { /* ignore */ }
        }
      }

      try {
        const { data: keyData, error: keyErr } = await adminClient.rpc("vault_create_secret", {
          p_secret: api_key,
          p_name: `trendyol_apikey_${connId}`,
          p_description: `Trendyol API Key — connection ${connId}`,
        });
        if (keyErr || !keyData) throw new Error(`Vault key hatası: ${keyErr?.message}`);
        apiKeySecretId = keyData as string;

        const { data: secretData, error: secretErr } = await adminClient.rpc(
          "vault_create_secret",
          {
            p_secret: api_secret,
            p_name: `trendyol_apisecret_${connId}`,
            p_description: `Trendyol API Secret — connection ${connId}`,
          },
        );
        if (secretErr || !secretData) throw new Error(`Vault secret hatası: ${secretErr?.message}`);
        apiSecretSecretId = secretData as string;

        // marketplace_connections'a kaydet
        const { data: conn, error: connErr } = await adminClient
          .from("marketplace_connections")
          .insert({
            id: connId,
            user_id: user.id,
            platform: "trendyol",
            store_name: store_name ?? `Trendyol Mağazam`,
            trendyol_supplier_id,
            trendyol_api_key_secret_id: apiKeySecretId,
            trendyol_api_secret_secret_id: apiSecretSecretId,
            sync_status: "idle",
          })
          .select("id, store_name, sync_status, created_at")
          .single();

        if (connErr) {
          // DB kaydı başarısız → Vault'ta oluşturulan secret'ları temizle
          await cleanupVaultSecrets();
          if (connErr.code === "23505") {
            return new Response(
              JSON.stringify({ error: "Bu Supplier ID ile zaten bir bağlantı var" }),
              { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } },
            );
          }
          throw new Error(connErr.message);
        }

        // Sync log: bağlantı testi kaydı
        await adminClient.from("marketplace_sync_logs").insert({
          connection_id: conn!.id,
          user_id: user.id,
          sync_type: "connection_test",
          status: "success",
          records_fetched: 0,
          finished_at: new Date().toISOString(),
          duration_ms: 0,
        });

        // Backfill tetikle: bağlantı kurulunca 30 günlük geçmiş otomatik başlar
        const backfillUrl = `${SUPABASE_URL}/functions/v1/trendyol-backfill`;
        const backfillFetch = fetch(backfillUrl, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ connection_id: connId }),
        }).catch(() => {/* backfill tetikleme hatası response'u etkilemez */});

        // EdgeRuntime.waitUntil ile backfill isteğinin gönderilmesi garantilenir
        if (typeof (globalThis as any).EdgeRuntime !== "undefined") {
          (globalThis as any).EdgeRuntime.waitUntil(backfillFetch);
        }

        return new Response(
          JSON.stringify({ success: true, connection: conn }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      } catch (vaultErr) {
        await cleanupVaultSecrets();
        return new Response(
          JSON.stringify({ error: `Kayıt hatası: ${sanitizeError(vaultErr)}` }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
        );
      }
    }

    // Hepsiburada — Faz 6'da eklenecek
    return new Response(
      JSON.stringify({ error: "Hepsiburada entegrasyonu yakında gelecek" }),
      { status: 501, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  // ──────────────────────────────────────────────
  // Bağlantı listesi
  // ──────────────────────────────────────────────
  if (req.method === "GET" && action === "list") {
    const { data, error } = await adminClient
      .from("marketplace_connections")
      .select(
        "id, platform, store_name, sync_status, sync_error_message, sync_error_count, is_active, initial_backfill_done, last_order_sync_at, last_financial_sync_at, last_stock_sync_at, last_return_sync_at, created_at, extension_api_token",
      )
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (error) {
      return new Response(JSON.stringify({ error: sanitizeError(error) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ connections: data ?? [] }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ──────────────────────────────────────────────
  // Bağlantı silme (soft delete + Vault temizleme)
  // ──────────────────────────────────────────────
  if (req.method === "POST" && action === "delete") {
    const { connection_id } = await req.json();
    if (!connection_id) {
      return new Response(JSON.stringify({ error: "connection_id zorunlu" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Sadece bu kullanıcının bağlantısını silebilir
    const { data: conn, error: fetchErr } = await adminClient
      .from("marketplace_connections")
      .select("*")
      .eq("id", connection_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .single();

    if (fetchErr || !conn) {
      return new Response(JSON.stringify({ error: "Bağlantı bulunamadı" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Vault secret'larını temizle
    const secretIds = [
      conn.trendyol_api_key_secret_id,
      conn.trendyol_api_secret_secret_id,
      conn.hb_password_secret_id,
    ].filter(Boolean);

    for (const secretId of secretIds) {
      try {
        await adminClient.rpc("vault_delete_secret", { p_id: secretId });
      } catch {
        // Vault temizleme başarısız olursa yine de soft-delete yap
      }
    }

    const { error: delErr } = await adminClient
      .from("marketplace_connections")
      .update({ deleted_at: new Date().toISOString(), is_active: false })
      .eq("id", connection_id)
      .eq("user_id", user.id);

    if (delErr) {
      return new Response(JSON.stringify({ error: sanitizeError(delErr) }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // ──────────────────────────────────────────────
  // Extension token yenileme
  // ──────────────────────────────────────────────
  if (req.method === "POST" && action === "refresh-token") {
    const { connection_id } = await req.json();
    if (!connection_id) {
      return new Response(JSON.stringify({ error: "connection_id zorunlu" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data, error: updErr } = await adminClient
      .from("marketplace_connections")
      .update({ extension_api_token: crypto.randomUUID() })
      .eq("id", connection_id)
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .select("extension_api_token")
      .single();

    if (updErr || !data) {
      return new Response(JSON.stringify({ error: "Token yenilenemedi" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, token: data.extension_api_token }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Geçersiz istek" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
