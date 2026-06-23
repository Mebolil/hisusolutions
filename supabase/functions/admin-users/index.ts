import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const ADMIN_EMAIL = "hatamelih245@gmail.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://hisusolutions.com",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  // JWT doğrulama — sadece admin email erişebilir
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return new Response("unauthorized", { status: 401, headers: corsHeaders });

  const token = authHeader.replace("Bearer ", "");
  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(token);
  if (authErr || !user || user.email !== ADMIN_EMAIL) {
    return new Response("forbidden", { status: 403, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const action = url.searchParams.get("action") ?? "list";

  if (req.method === "GET" && action === "list") {
    // Tüm profilleri auth.users emailiyle birlikte getir
    const { data: profiles, error } = await supabaseAdmin
      .from("profiles")
      .select("user_id, plan, trial_ends_at, created_at")
      .order("created_at", { ascending: false });

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    // Her profil için email çek
    const enriched = await Promise.all(
      (profiles ?? []).map(async (p) => {
        const { data: userData } = await supabaseAdmin.auth.admin.getUserById(p.user_id);
        return { ...p, email: userData?.user?.email ?? "—" };
      })
    );

    return new Response(JSON.stringify(enriched), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST" && action === "update-plan") {
    const { user_id, plan } = await req.json();
    if (!user_id || !plan) return new Response("missing params", { status: 400, headers: corsHeaders });

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ plan })
      .eq("user_id", user_id);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (req.method === "POST" && action === "update-trial") {
    const { user_id, trial_ends_at } = await req.json();
    if (!user_id || !trial_ends_at) return new Response("missing params", { status: 400, headers: corsHeaders });

    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ trial_ends_at })
      .eq("user_id", user_id);

    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response("not found", { status: 404, headers: corsHeaders });
});
