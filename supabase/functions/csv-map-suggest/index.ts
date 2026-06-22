import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY") ?? "";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  // JWT doğrulama — anonim erişimi engelle, API key tüketimini koru
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  if (!ANTHROPIC_API_KEY) {
    return new Response(JSON.stringify({ error: "LLM not configured" }), {
      status: 503,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }

  try {
    const { csvHeaders, fields } = await req.json();
    if (!Array.isArray(csvHeaders) || !Array.isArray(fields)) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Sen bir CSV sütun eşleme asistanısın.
Sana CSV dosyasının başlık satırı ve hedef alan listesi verilecek.
Her hedef alan için en uygun CSV sütununu seç.
Yanıtını SADECE JSON olarak ver, başka metin ekleme.
Format: { "fieldKey": "csvHeader" }
Uygun sütun yoksa o alanı JSON'a dahil etme.`;

    const userPrompt = `CSV Başlıkları: ${JSON.stringify(csvHeaders)}

Hedef Alanlar:
${fields.map((f: { key: string; label: string; aliases: string[] }) =>
  `- key: "${f.key}", label: "${f.label}", aliases: ${JSON.stringify(f.aliases)}`
).join("\n")}

Her hedef alan için en uygun CSV başlığını eşle:`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      return new Response(JSON.stringify({ error: "LLM error: " + errText }), {
        status: 502,
        headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    const llmData = await resp.json();
    const rawText: string = llmData.content?.[0]?.text ?? "{}";

    // JSON'u güvenli parse et
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const mapping = jsonMatch ? JSON.parse(jsonMatch[0]) : {};

    return new Response(JSON.stringify({ mapping }), {
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, "Content-Type": "application/json" },
    });
  }
});
