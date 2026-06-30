import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "Hisu Pusla <bildirim@hisusolutions.com>";
const ADMIN_EMAILS = ["hatamelih245@gmail.com", "info@hisusolutions.com"];

serve(async (req) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "https://hisusolutions.com",
    "Access-Control-Allow-Headers": "authorization, content-type",
  };

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("unauthorized", { status: 401, headers: corsHeaders });

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !user) return new Response("unauthorized", { status: 401, headers: corsHeaders });

    const { data: profile } = await supabase
      .from("profiles")
      .select("trial_notified_at")
      .eq("user_id", user.id)
      .maybeSingle();

    if (profile?.trial_notified_at) {
      return new Response("already_notified", { status: 200, headers: corsHeaders });
    }

    const userName = user.user_metadata?.full_name ?? "Değerli Kullanıcı";
    const userEmail = user.email!;

    const userHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:32px 24px">
        <h2 style="margin:0 0 8px;color:#0f172a;font-size:22px">30 günlük deneme süreniz sona erdi</h2>
        <p style="color:#475569;margin:0 0 20px">Merhaba ${userName},</p>
        <p style="color:#475569;line-height:1.6">
          Pusla'daki 30 günlük ücretsiz deneme süreniz doldu. Kaydettiğiniz verilere ve tüm özelliklere erişmeye devam etmek için bir plan seçmeniz gerekiyor.
        </p>
        <div style="background:#f8fafc;border-radius:12px;padding:20px;margin:24px 0">
          <p style="margin:0 0 8px;font-weight:600;color:#0f172a">Pusla ile neler yapabilirsiniz?</p>
          <ul style="margin:0;padding-left:20px;color:#475569;line-height:1.8">
            <li>Satış, gider ve stok takibi</li>
            <li>Reklam ROI hesaplama</li>
            <li>Cari hesap yönetimi</li>
            <li>Anlık finansal raporlar</li>
          </ul>
        </div>
        <a href="https://hisusolutions.com/iletisim"
           style="display:inline-block;background:#4f46e5;color:#fff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:600;font-size:15px">
          Planı Aktifleştir →
        </a>
        <p style="margin:32px 0 0;font-size:12px;color:#94a3b8">
          Hisu Solutions · <a href="https://hisusolutions.com" style="color:#94a3b8">hisusolutions.com</a>
        </p>
      </div>`;

    const adminHtml = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 4px;color:#0f172a;font-size:18px">⏰ Trial Süresi Doldu</h2>
        <p style="color:#64748b;font-size:13px;margin:0 0 20px">Bir kullanıcının 30 günlük denemesi sona erdi.</p>
        <table style="width:100%;border-collapse:collapse;background:#f8fafc;border-radius:8px;overflow:hidden">
          <tr><td style="padding:8px 14px;color:#64748b;font-size:13px;white-space:nowrap">İsim</td><td style="padding:8px 14px;font-weight:500;font-size:13px">${userName}</td></tr>
          <tr><td style="padding:8px 14px;color:#64748b;font-size:13px;white-space:nowrap">E-posta</td><td style="padding:8px 14px;font-weight:500;font-size:13px">${userEmail}</td></tr>
        </table>
      </div>`;

    await Promise.all([
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [userEmail],
          subject: "Pusla deneme süreniz sona erdi — Planı aktifleştirin",
          html: userHtml,
        }),
      }),
      fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: ADMIN_EMAILS,
          subject: `[Hisu] Trial Bitti — ${userName} (${userEmail})`,
          html: adminHtml,
        }),
      }),
    ]);

    await supabase
      .from("profiles")
      .update({ trial_notified_at: new Date().toISOString() })
      .eq("user_id", user.id);

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (err) {
    console.error("notify-trial-expired error:", err);
    return new Response("error", { status: 500, headers: corsHeaders });
  }
});
