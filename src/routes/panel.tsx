import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { BarChart3, Monitor, Workflow, Lock, ArrowRight, Sparkles } from "lucide-react";
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
  plans: string[]; // plans that grant access
};

const PRODUCTS: Product[] = [
  {
    key: "butceleme",
    to: "/app/butcecrm",
    icon: BarChart3,
    title: "BütçeCRM",
    desc: "Gelir, gider, stok ve reklam ROI'sini tek ekranda yönetin.",
    plans: ["butceleme", "pro", "enterprise"],
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

function PanelPage() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [plan, setPlan] = useState<string[]>([]);
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
        .select("plan")
        .eq("id", session.user.id)
        .maybeSingle();

      // plan can be a string ("pro"), comma list ("butceleme,web") or array
      let planValue: string[] = [];
      const raw = (profile as any)?.plan;
      if (Array.isArray(raw)) planValue = raw;
      else if (typeof raw === "string" && raw.length) planValue = raw.split(",").map(s => s.trim());
      setPlan(planValue);
      setLoading(false);
    })();
  }, [navigate]);

  const hasAccess = (p: Product) => plan.some(x => p.plans.includes(x));

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
            Sahip olduğun ürünleri buradan aç. Yeni ürünleri yükselterek erişim kazan.
          </p>
        </div>

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
              const Icon = p.icon;
              return (
                <div
                  key={p.key}
                  className={`group relative flex flex-col overflow-hidden rounded-3xl border p-6 transition ${
                    access
                      ? "border-border bg-card shadow-sm hover:-translate-y-1 hover:shadow-lg"
                      : "border-border/60 bg-muted/40"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`grid h-12 w-12 place-items-center rounded-2xl ${access ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                      <Icon className="h-6 w-6" />
                    </span>
                    {!access && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
                        <Lock className="h-3 w-3" /> Kilitli
                      </span>
                    )}
                  </div>
                  <h3 className={`mt-5 text-xl font-bold ${access ? "" : "text-muted-foreground"}`}>{p.title}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{p.desc}</p>

                  <div className="mt-6">
                    {access ? (
                      <Link
                        to={p.to}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
                      >
                        Aç <ArrowRight className="h-4 w-4" />
                      </Link>
                    ) : (
                      <Link
                        to="/iletisim"
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-primary px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-primary hover:text-primary-foreground"
                      >
                        Yükselt
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
