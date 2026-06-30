import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Monitor, Workflow, Lock, ArrowRight, Sparkles, Clock, AlertCircle } from "lucide-react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/panel")({
  head: () => ({ meta: [{ title: "Panelim — Hisu Solutions" }] }),
  component: PanelPage,
});

type Product = {
  key: string;
  to: string;
  icon: typeof BarChart3;
  title: string;
  desc: string;
  plans: string[];
};

const PRODUCTS: Product[] = [
  {
    key: "pusla",
    to: "/app/pusla",
    icon: BarChart3,
    title: "Pusla",
    desc: "Gelir, gider, stok ve reklam ROI'sini tek ekranda yönetin.",
    plans: ["pusla", "pro", "enterprise"],
  },
  {
    key: "web",
    to: "/web-sitesi",
    icon: Monitor,
    title: "Özel Tasarım Site",
    desc: "Marka DNA'nıza özel, dönüşüm odaklı web siteniz.",
    plans: ["web", "pro", "enterprise"],
  },
  {
    key: "otomasyon",
    to: "/otomasyon",
    icon: Workflow,
    title: "Otomasyon Sistemleri",
    desc: "Tekrarlayan işleri sistemlere devredin.",
    plans: ["otomasyon", "pro", "enterprise"],
  },
];

function trialDaysLeft(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

function PanelPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState<string[]>([]);
  const [trialEndsAt, setTrialEndsAt] = useState<string | null>(null);
  const [trialExpiredHandled, setTrialExpiredHandled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        navigate({ to: "/auth" });
        return;
      }
      setUser(session.user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("plan, trial_ends_at")
        .eq("user_id", session.user.id)
        .maybeSingle();

      let planValue: string[] = [];
      const raw = (profile as any)?.plan;
      if (Array.isArray(raw)) planValue = raw;
      else if (typeof raw === "string" && raw.length) planValue = raw.split(",").map((s: string) => s.trim());
      setPlan(planValue);

      const ends = (profile as any)?.trial_ends_at ?? null;
      setTrialEndsAt(ends);

      // Trial süresi dolmuşsa bildirim gönder (bir kez)
      if (planValue.includes("trial") && ends && new Date(ends) < new Date()) {
        const { data: { session: sess } } = await supabase.auth.getSession();
        if (sess?.access_token) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
          fetch(`${supabaseUrl}/functions/v1/notify-trial-expired`, {
            method: "POST",
            headers: {
              Authorization: `Bearer ${sess.access_token}`,
              "Content-Type": "application/json",
            },
          }).catch(() => {});
        }
        setTrialExpiredHandled(true);
      }

      setLoading(false);
    })();
  }, [navigate]);

  const isTrial = plan.includes("trial");
  const daysLeft = trialDaysLeft(trialEndsAt);
  const trialActive = isTrial && trialEndsAt !== null && new Date(trialEndsAt) > new Date();
  const trialExpired = isTrial && trialEndsAt !== null && new Date(trialEndsAt) <= new Date();

  const hasAccess = (p: Product) => {
    if (trialActive && p.key === "pusla") return true;
    return plan.some(x => p.plans.includes(x));
  };

  return (
    <SiteLayout>
      <section className="mx-auto max-w-7xl px-4 py-16 lg:px-8 lg:py-24">
        <div className="mb-10">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-sm font-medium text-accent-foreground">
            <Sparkles className="h-4 w-4" /> Panelim
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Hoş geldin{user?.user_metadata?.full_name ? `, ${user.user_metadata.full_name}` : ""} 👋
          </h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            Sahip olduğun ürünleri buradan aç.
          </p>
        </div>

        {/* Trial Banner */}
        {!loading && trialActive && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4">
            <Clock className="h-5 w-5 shrink-0 text-primary" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">
                {daysLeft === 0 ? "Deneme süreniz bugün bitiyor!" : `Deneme sürenizde ${daysLeft} gün kaldı`}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Pusla'e tam erişiminiz var. Süre bitmeden planı aktifleştirin.
              </p>
            </div>
            <Link
              to="/odeme"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Planı Al <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {/* Trial Expired Banner */}
        {!loading && trialExpired && (
          <div className="mb-8 flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 px-5 py-4">
            <AlertCircle className="h-5 w-5 shrink-0 text-destructive" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground">30 günlük deneme süreniz sona erdi</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                E-posta adresinize bilgi gönderdik. Devam etmek için bir plan seçin.
              </p>
            </div>
            <Link
              to="/odeme"
              className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
            >
              Plan Seç <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-64 animate-pulse rounded-3xl bg-muted" />
            ))}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {PRODUCTS.map(p => {
              const access = hasAccess(p);
              const isTrialProduct = isTrial && p.key === "pusla";
              const Icon = p.icon;
              return (
                <div
                  key={p.key}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border p-6 transition ${
                    access && !trialExpired
                      ? "border-border bg-card shadow-sm hover:-translate-y-1 hover:shadow-lg"
                      : "border-border/60 bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`grid h-12 w-12 place-items-center rounded-2xl ${access && !trialExpired ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    {isTrialProduct && trialActive && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        <Clock className="h-3 w-3" /> {daysLeft}g kaldı
                      </span>
                    )}
                    {(!access || trialExpired) && !(isTrialProduct && trialActive) && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                        <Lock className="h-3 w-3" /> {trialExpired && isTrialProduct ? "Süre Doldu" : "Kilitli"}
                      </span>
                    )}
                  </div>
                  <h3 className={`mt-5 text-xl font-bold ${access && !trialExpired ? "" : "text-muted-foreground"}`}>{p.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.desc}</p>

                  <div className="mt-6">
                    {access && !trialExpired ? (
                      <Link
                        to={p.to}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                      >
                        Aç <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <Link
                        to="/odeme"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                      >
                        {trialExpired && isTrialProduct ? "Planı Aktifleştir" : "Yükselt"}
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </SiteLayout>
  );
}
