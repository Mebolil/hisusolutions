import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { Check, ArrowRight, Copy, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const PLANS = [
  {
    key: "kurucu-beta",
    label: "Kurucu Beta",
    price: "₺519",
    period: "/ ay + KDV",
    desc: "31 Temmuz'a kadar · Ömür boyu bu fiyat kilitlenir",
    badge: "Sadece 10 Slot",
    isAmber: true,
    features: ["Tüm özellikler dahil", "Kurucu fiyatı her zaman korunur", "Öncelikli destek"],
  },
  {
    key: "aylik",
    label: "Aylık Plan",
    price: "₺719",
    period: "/ ay + KDV",
    desc: "İstediğin zaman iptal",
    badge: null,
    isAmber: false,
    features: ["Tüm özellikler dahil", "Esnek aylık ödeme", "E-posta destek"],
  },
  {
    key: "yillik",
    label: "Yıllık Plan",
    price: "₺7.190",
    period: "/ yıl + KDV",
    desc: "2 ay bedava · Yılda ₺1.438 tasarruf",
    badge: "En Popüler",
    isAmber: false,
    features: ["Tüm özellikler dahil", "2 ay bedava", "Öncelikli destek"],
  },
];

// IBAN — güncelle
const IBAN = "TR00 0000 0000 0000 0000 0000 00";
const IBAN_NAME = "Melih Hata";

export const Route = createFileRoute("/odeme")({
  validateSearch: (search) => ({
    plan: (search.plan as string) ?? null,
  }),
  head: () => ({ meta: [{ title: "Ödeme — BütçeCRM | Hisu Solutions" }] }),
  component: OdemePage,
});

function OdemePage() {
  const { plan: initialPlan } = Route.useSearch();
  const [selectedPlan, setSelectedPlan] = useState<string | null>(initialPlan);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const plan = PLANS.find((p) => p.key === selectedPlan) ?? null;

  async function handleCopy() {
    await navigator.clipboard.writeText(IBAN.replace(/\s/g, ""));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

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
          source: "butcecrm-odeme",
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
                <h2 className="text-2xl font-bold">Havale ile ödeme</h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  Aşağıdaki IBAN'a{" "}
                  <strong>
                    {plan.price} {plan.period}
                  </strong>{" "}
                  gönder, formu doldur — hesabın aktifleştirilir.
                </p>

                {/* IBAN Kutusu */}
                <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-border bg-muted/40 px-5 py-4">
                  <div>
                    <p className="mb-0.5 text-xs text-muted-foreground">
                      Alıcı Adı
                    </p>
                    <p className="font-semibold">{IBAN_NAME}</p>
                    <p className="mb-0.5 mt-2 text-xs text-muted-foreground">
                      IBAN
                    </p>
                    <p className="font-mono text-sm font-semibold tracking-wide">
                      {IBAN}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex shrink-0 items-center gap-1.5 rounded-xl border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent"
                  >
                    {copied ? (
                      <CheckCircle className="h-4 w-4 text-primary" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied ? "Kopyalandı" : "Kopyala"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Açıklama kısmına e-posta adresinizi yazmanız aktivasyonu
                  hızlandırır.
                </p>

                {/* Form */}
                <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
                    <Label htmlFor="od-email">
                      E-posta (hesabınıza bağlı adres)
                    </Label>
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
                    {loading
                      ? "Gönderiliyor..."
                      : "Ödemeyi Yaptım, Hesabımı Aktifleştirin →"}
                  </Button>
                  <p className="text-center text-xs text-muted-foreground">
                    Ödemenizi doğrular doğrulamaz (genellikle birkaç saat
                    içinde) hesabınız aktifleştirilir.
                  </p>
                </form>
              </>
            )}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
