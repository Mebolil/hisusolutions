import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Check, ArrowRight, CheckCircle, MessageCircle, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PLANS = [
  {
    key: "kurucu-beta",
    label: "Kurucu Beta",
    price: "₺499",
    period: "/ ay + KDV",
    desc: "31 Temmuz'a kadar · Ömür boyu bu fiyat kilitlenir",
    badge: "Sadece 10 Slot",
    isAmber: true,
    features: ["Tüm özellikler dahil", "Kurucu fiyatı her zaman korunur", "Öncelikli destek"],
  },
  {
    key: "aylik",
    label: "Aylık Plan",
    price: "₺629",
    period: "/ ay + KDV",
    desc: "İstediğin zaman iptal",
    badge: null,
    isAmber: false,
    features: ["Tüm özellikler dahil", "Esnek aylık ödeme", "E-posta destek"],
  },
  {
    key: "yillik",
    label: "Yıllık Plan",
    price: "₺6.290",
    period: "/ yıl + KDV",
    desc: "2 ay bedava · Yılda ₺1.258 tasarruf",
    badge: "En Popüler",
    isAmber: false,
    features: ["Tüm özellikler dahil", "2 ay bedava", "Öncelikli destek"],
  },
];

const WHATSAPP_URL = "https://wa.me/905539003459";
const MAIL_URL = "mailto:info@hisusolutions.com";

export const Route = createFileRoute("/odeme")({
  validateSearch: (search) => ({
    plan: (search.plan as string) ?? null,
  }),
  head: () => ({ meta: [{ title: "Ödeme — Pusla | Hisu Solutions" }] }),
  component: OdemePage,
});

function OdemePage() {
  const { plan: initialPlan } = Route.useSearch();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(initialPlan);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const plan = PLANS.find((p) => p.key === selectedPlan) ?? null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!plan) return;
    setLoading(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;
      const res = await fetch(`${supabaseUrl}/functions/v1/notify-lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({
          source: "pusla-odeme",
          payload: {
            name,
            email,
            plan: plan.label,
            tutar: `${plan.price} ${plan.period}`,
          },
        }),
      });
      if (!res.ok) throw new Error("notify-lead error");
      setSubmitted(true);
    } catch {
      toast.error("Bir hata oluştu, lütfen tekrar deneyin.");
    }
    setLoading(false);
  }

  return (
    <SiteLayout>
      <section className="mx-auto max-w-4xl px-4 py-16 lg:px-8 lg:py-24">
        <div className="mb-10 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Planını seç</h1>
          <p className="mt-3 text-muted-foreground">
            15 günlük denemenin ardından devam etmek için bir plan seç
          </p>
        </div>

        {/* Plan Kartları */}
        <div className="grid gap-5 md:grid-cols-3">
          {PLANS.map((p) => {
            const isSelected = selectedPlan === p.key;
            return (
              <button
                key={p.key}
                onClick={() => setSelectedPlan(p.key)}
                className={`relative rounded-2xl border-2 p-6 text-left transition-all ${
                  isSelected
                    ? p.isAmber
                      ? "border-amber-400 bg-amber-50"
                      : "border-primary bg-primary-soft"
                    : "border-border bg-card hover:border-primary/40"
                }`}
              >
                {p.badge && (
                  <span
                    className={`absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-xs font-bold ${
                      p.isAmber
                        ? "bg-amber-100 text-amber-800"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    {p.badge}
                  </span>
                )}
                <p
                  className={`text-sm font-semibold ${
                    p.isAmber
                      ? "text-amber-700"
                      : p.key === "yillik"
                      ? "text-primary"
                      : "text-muted-foreground"
                  }`}
                >
                  {p.label}
                </p>
                <p className="mt-2 text-3xl font-bold">
                  {p.price}{" "}
                  <span className="text-sm font-normal text-muted-foreground">
                    {p.period}
                  </span>
                </p>
                <p
                  className={`mt-1 text-xs ${
                    p.isAmber ? "text-amber-700" : "text-muted-foreground"
                  }`}
                >
                  {p.desc}
                </p>
                <ul className="mt-4 space-y-1.5">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-sm">
                      <Check
                        className={`h-3.5 w-3.5 shrink-0 ${
                          p.isAmber ? "text-amber-600" : "text-primary"
                        }`}
                      />
                      {f}
                    </li>
                  ))}
                </ul>
                {isSelected && (
                  <div
                    className={`mt-4 rounded-full py-1.5 text-center text-xs font-semibold ${
                      p.isAmber
                        ? "bg-amber-500 text-white"
                        : "bg-primary text-primary-foreground"
                    }`}
                  >
                    Seçildi ✓
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Ödeme Adımı */}
        {plan && (
          <div className="mt-10 rounded-3xl border border-border bg-card p-8 md:p-10">
            {submitted ? (
              <div className="py-6 text-center">
                <CheckCircle className="mx-auto mb-4 h-16 w-16 text-primary" />
                <h2 className="text-2xl font-bold">Harika! Bildirim aldık.</h2>
                <p className="mt-2 text-muted-foreground">
                  Ödemenizi doğrular doğrulamaz hesabınızı aktifleştireceğiz.
                  Genellikle birkaç saat içinde.
                </p>
                <Link
                  to="/panel"
                  className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
                >
                  Panele Dön <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold">Nasıl devam edelim?</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Seçtiğin plan: <strong>{plan.label} — {plan.price} {plan.period}</strong>
                </p>

                {/* İletişim Seçenekleri */}
                <div className="mt-6 grid gap-4 sm:grid-cols-2">
                  <a
                    href={`${WHATSAPP_URL}?text=${encodeURIComponent(`Merhaba, ${plan.label} planını almak istiyorum (${plan.price} ${plan.period}).`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 rounded-2xl border border-border bg-[#25D366]/5 p-5 transition-colors hover:bg-[#25D366]/10"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-[#25D366] text-white">
                      <MessageCircle className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="font-semibold">WhatsApp</p>
                      <p className="text-sm text-muted-foreground">En hızlı yol — birkaç dakika içinde yanıt</p>
                    </div>
                  </a>
                  <a
                    href={`${MAIL_URL}?subject=${encodeURIComponent(`${plan.label} Planı — Satın Alma Talebi`)}&body=${encodeURIComponent(`Merhaba,\n\n${plan.label} planını (${plan.price} ${plan.period}) satın almak istiyorum.\n\nAdım:\nE-postam:`)}`}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-muted/30 p-5 transition-colors hover:bg-muted/60"
                  >
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                      <Mail className="h-6 w-6" />
                    </span>
                    <div>
                      <p className="font-semibold">E-posta</p>
                      <p className="text-sm text-muted-foreground">info@hisusolutions.com</p>
                    </div>
                  </a>
                </div>

                <div className="mt-6 flex items-center gap-3">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground">veya formu doldur, biz seni arayalım</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="od-name">Ad Soyad</Label>
                    <Input
                      id="od-name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="od-email">E-posta</Label>
                    <Input
                      id="od-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full rounded-full py-6 text-base font-semibold"
                  >
                    {loading ? "Gönderiliyor..." : "Bilgi Bırak, Seni Arayalım →"}
                  </Button>
                </form>
              </>
            )}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
