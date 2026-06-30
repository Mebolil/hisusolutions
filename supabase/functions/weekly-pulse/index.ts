import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FROM_EMAIL = "Hisu Pusla <bildirim@hisusolutions.com>";

const corsHeaders = {
  "Access-Control-Allow-Origin": "https://hisusolutions.com",
  "Access-Control-Allow-Headers": "authorization, content-type",
};

function fmt(n: number): string {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(n);
}

function ymd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Belirli bir tarihin içinde bulunduğu haftadan N hafta önceki Pazartesi-Pazar aralığını döner
function weekRange(weeksAgo: number): { monday: string; sunday: string } {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Pazar, 1=Pazartesi ...
  const diffToMonday = (day + 6) % 7; // bu haftanın Pazartesi'sine kaç gün
  const thisMonday = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  thisMonday.setUTCDate(thisMonday.getUTCDate() - diffToMonday);
  const monday = new Date(thisMonday);
  monday.setUTCDate(monday.getUTCDate() - weeksAgo * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(sunday.getUTCDate() + 6);
  return { monday: ymd(monday), sunday: ymd(sunday) };
}

type Totals = { gelir: number; maliyet: number; gider: number; reklam: number; net: number };

async function computeTotals(
  supabase: ReturnType<typeof createClient>,
  uid: string,
  from: string,
  to: string,
): Promise<Totals> {
  const [salesRes, expensesRes, campaignsRes] = await Promise.all([
    supabase
      .from("sales")
      .select("paid_amount, total_cost")
      .eq("user_id", uid)
      .is("deleted_at", null)
      .gte("sale_date", from)
      .lte("sale_date", to),
    supabase
      .from("expenses")
      .select("paid_amount")
      .eq("user_id", uid)
      .is("deleted_at", null)
      .gte("expense_date", from)
      .lte("expense_date", to),
    supabase
      .from("campaigns")
      .select("spend")
      .eq("user_id", uid)
      .is("deleted_at", null)
      .gte("start_date", from)
      .lte("start_date", to),
  ]);

  const sales = (salesRes.data as { paid_amount: number; total_cost: number }[]) || [];
  const expenses = (expensesRes.data as { paid_amount: number }[]) || [];
  const campaigns = (campaignsRes.data as { spend: number }[]) || [];

  const gelir = sales.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
  const maliyet = sales.reduce((s, x) => s + Number(x.total_cost || 0), 0);
  const gider = expenses.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
  const reklam = campaigns.reduce((s, x) => s + Number(x.spend || 0), 0);
  const net = gelir - gider - reklam - maliyet;

  return { gelir, maliyet, gider, reklam, net };
}

async function findWeakCampaign(
  supabase: ReturnType<typeof createClient>,
  uid: string,
): Promise<string | null> {
  const { data: campaigns } = await supabase
    .from("campaigns")
    .select("id, name, spend")
    .eq("user_id", uid)
    .eq("status", "aktif")
    .is("deleted_at", null);

  const list = (campaigns as { id: string; name: string; spend: number }[]) || [];
  for (const c of list) {
    if (Number(c.spend || 0) <= 0) continue;
    const { data: sales } = await supabase
      .from("sales")
      .select("total_amount")
      .eq("user_id", uid)
      .eq("campaign_id", c.id)
      .is("deleted_at", null);
    const rev = ((sales as { total_amount: number }[]) || []).reduce(
      (s, x) => s + Number(x.total_amount || 0),
      0,
    );
    const roas = rev / Number(c.spend);
    if (roas < 1) return c.name;
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || authHeader.replace("Bearer ", "") !== SUPABASE_SERVICE_ROLE_KEY) {
      return new Response("unauthorized", { status: 401, headers: corsHeaders });
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: users } = await supabase
      .from("profiles")
      .select("user_id, id")
      .eq("weekly_pulse_enabled", true);

    const recipients = (users as { user_id: string; id: string }[]) || [];

    const last = weekRange(1);
    const prev = weekRange(2);

    let processed = 0;

    for (const u of recipients) {
      try {
        const uid = u.user_id;
        if (!uid) continue;

        const cur = await computeTotals(supabase, uid, last.monday, last.sunday);
        const before = await computeTotals(supabase, uid, prev.monday, prev.sunday);

        const pctChange =
          before.gelir > 0
            ? ((cur.gelir - before.gelir) / before.gelir) * 100
            : cur.gelir > 0
              ? 100
              : 0;
        const arrow = pctChange >= 0 ? "↑" : "↓";
        const pctLabel = `${pctChange >= 0 ? "+" : ""}${pctChange.toFixed(0)}%`;

        const weakCampaign = await findWeakCampaign(supabase, uid);

        const { data: { user } } = await supabase.auth.admin.getUserById(uid);
        const userEmail = user?.email;
        if (!userEmail) continue;

        const insightLine = weakCampaign
          ? `<p style="margin:16px 0 0;padding:12px 14px;background:#fef3c7;border-radius:8px;color:#92400e;font-size:14px">
              Dikkat: <strong>${weakCampaign}</strong> reklamın ROAS'ı 1x'in altında — gözden geçir.
            </p>`
          : "";

        const html = `
          <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
            <h2 style="margin:0 0 20px;color:#0f172a;font-size:20px">Bu Haftanın Nabzı</h2>
            <table style="width:100%;border-collapse:collapse">
              <tr>
                <td style="padding:8px 0;color:#475569;font-size:15px">Gelir</td>
                <td style="padding:8px 0;text-align:right;font-weight:600;color:#0f172a;font-size:15px">
                  ${fmt(cur.gelir)} <span style="color:${pctChange >= 0 ? "#16a34a" : "#dc2626"};font-size:13px">(${pctLabel} geçen haftaya göre) ${arrow}</span>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#475569;font-size:15px">Gider</td>
                <td style="padding:8px 0;text-align:right;font-weight:600;color:#0f172a;font-size:15px">${fmt(cur.gider + cur.reklam)}</td>
              </tr>
              <tr>
                <td style="padding:8px 0;color:#475569;font-size:15px;border-top:1px solid #e2e8f0">Net Kâr</td>
                <td style="padding:8px 0;text-align:right;font-weight:700;color:${cur.net >= 0 ? "#16a34a" : "#dc2626"};font-size:16px;border-top:1px solid #e2e8f0">${fmt(cur.net)}</td>
              </tr>
            </table>
            ${insightLine}
            <p style="margin:32px 0 0;font-size:12px;color:#94a3b8">
              —<br/>Pusla<br/>
              Bildirimleri durdurmak için:
              <a href="https://hisusolutions.com/app/pusla/ayarlar" style="color:#94a3b8">ayarlar</a>
            </p>
          </div>`;

        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: FROM_EMAIL,
            to: [userEmail],
            subject: "Pusla — Bu haftanın finansal nabzı 📊",
            html,
          }),
        });

        processed += 1;
      } catch (userErr) {
        console.error("weekly-pulse user error:", u.user_id, userErr);
      }
    }

    return new Response(JSON.stringify({ processed }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("weekly-pulse error:", err);
    return new Response("error", { status: 500, headers: corsHeaders });
  }
});
