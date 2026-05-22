import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;
const NOTIFY_EMAILS = ["hatamelih245@gmail.com", "info@hisusolutions.com"];
const FROM_EMAIL = "bildirim@hisusolutions.com";

const SOURCE_LABELS: Record<string, string> = {
  "iletisim": "İletişim Formu",
  "butcecrm-demo": "BütçeCRM Demo Talebi",
  "otomasyon": "Otomasyon Keşif Görüşmesi",
  "websitesi": "Web Sitesi Teklif Talebi",
};

function buildCalendarLink(
  title: string,
  dateStr: string,
  timeStr: string,
  details: string,
): string {
  const [year, month, day] = dateStr.split("-");
  const [hour, minute] = timeStr.split(":");
  const startDt = `${year}${month}${day}T${hour}${minute}00`;
  // 1 saat sonra biter
  const endHour = String(parseInt(hour) + 1).padStart(2, "0");
  const endDt = `${year}${month}${day}T${endHour}${minute}00`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${startDt}/${endDt}`,
    details,
    sf: "true",
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

serve(async (req) => {
  try {
    const body = await req.json();
    // Supabase Database Webhook: { type, table, record, schema, old_record }
    const record = body.record ?? body;
    const { source, payload, created_at } = record;
    const bookedDate: string | undefined = record.booked_date;
    const bookedTime: string | undefined = record.booked_time;

    const isBooking = !!bookedDate && !!bookedTime;
    const sourceLabel = SOURCE_LABELS[source] ?? source;
    const name = payload?.name ?? payload?.isim ?? "—";
    const company = payload?.company ?? payload?.sirket ?? "";
    const replyTo: string | undefined = payload?.email;

    const dateFormatted = bookedDate
      ? new Date(bookedDate + "T12:00:00").toLocaleDateString("tr-TR", {
          weekday: "long", day: "numeric", month: "long", year: "numeric",
        })
      : undefined;

    // E-posta konusu
    const subject = isBooking
      ? `[Hisu] ${sourceLabel} — ${name}${company ? ` (${company})` : ""} — ${dateFormatted} ${bookedTime}`
      : `[Hisu] ${sourceLabel} — ${name}${company ? ` (${company})` : ""}`;

    // Form alanları tablosu
    const rows = Object.entries(payload as Record<string, string>)
      .map(([k, v]) =>
        `<tr>
          <td style="padding:6px 14px;color:#64748b;white-space:nowrap;font-size:13px">${k}</td>
          <td style="padding:6px 14px;font-weight:500;font-size:13px">${v}</td>
        </tr>`
      )
      .join("");

    // Google Calendar linki (sadece randevular için)
    let calSection = "";
    if (isBooking) {
      const details = Object.entries(payload as Record<string, string>)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\n");
      const calTitle = `${sourceLabel} — ${name}${company ? ` (${company})` : ""}`;
      const calLink = buildCalendarLink(calTitle, bookedDate!, bookedTime!, details);
      calSection = `
        <p style="margin:24px 0 0">
          <a href="${calLink}"
             style="display:inline-block;background:#4f46e5;color:#fff;padding:11px 22px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px">
            📅 Google Calendar'a Ekle
          </a>
        </p>`;
    }

    const createdStr = new Date(created_at).toLocaleString("tr-TR");

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;padding:24px">
        <h2 style="margin:0 0 4px;color:#0f172a;font-size:20px">Yeni ${sourceLabel}</h2>
        <p style="color:#64748b;margin:0 0 20px;font-size:13px">${createdStr}</p>
        ${isBooking ? `<div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:14px">
          📅 <strong>${dateFormatted}</strong>, <strong>${bookedTime}</strong>
        </div>` : ""}
        <table style="border-collapse:collapse;width:100%;background:#f8fafc;border-radius:10px;overflow:hidden">
          ${rows}
        </table>
        ${calSection}
        ${replyTo ? `<p style="margin:20px 0 0;font-size:12px;color:#94a3b8">Bu e-postayı yanıtlayarak doğrudan <strong>${replyTo}</strong> adresine ulaşabilirsiniz.</p>` : ""}
      </div>`;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: NOTIFY_EMAILS,
        reply_to: replyTo,
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Resend error:", err);
      return new Response("email_error", { status: 500 });
    }

    return new Response("ok", { status: 200 });
  } catch (err) {
    console.error("notify-lead error:", err);
    return new Response("error", { status: 500 });
  }
});
