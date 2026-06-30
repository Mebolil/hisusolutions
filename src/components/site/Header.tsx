import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown } from "lucide-react";

import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { HisuLogo } from "@/components/HisuLogo";

const CALCULATORS = [
  { to: "/kar-hesaplayici", label: "Trendyol", active: true },
  { to: "/hepsiburada-kar-hesaplayici", label: "Hepsiburada", active: true },
  { label: "N11", active: false },
  { label: "Çiçeksepeti", active: false },
];

function CalcDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        Kâr Hesaplayıcılar
        <ChevronDown
          className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-52 overflow-hidden rounded-xl border border-border/60 bg-background shadow-lg">
          <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Platform Seç
          </div>
          {CALCULATORS.map((c) =>
            c.active && c.to ? (
              <Link
                key={c.label}
                to={c.to}
                onClick={() => setOpen(false)}
                className="flex items-center justify-between px-3 py-2 text-sm font-medium text-foreground transition hover:bg-accent"
              >
                {c.label}
              </Link>
            ) : (
              <div
                key={c.label}
                className="flex items-center justify-between px-3 py-2 text-sm text-muted-foreground/50"
              >
                {c.label}
                <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                  Yakında
                </span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

export function Header() {
  const [open, setOpen] = useState(false);
  const [mobileCalcOpen, setMobileCalcOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);

  const nav = [
    { to: "/pusla", label: "Pusla" },
    { to: "/uctan-uca-yazilim", label: "Uçtan Uca" },
    { to: "/blog", label: "Blog" },
    { to: "/hakkimizda", label: "Hakkımızda" },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 lg:px-8">
        <Link to="/">
          <HisuLogo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-foreground"
              activeProps={{ className: "rounded-full px-4 py-2 text-sm font-semibold text-foreground bg-accent" }}
            >
              {n.label}
            </Link>
          ))}
          <CalcDropdown />
        </nav>

        <div className="hidden items-center gap-2 lg:flex">
          {user ? (
            <>
              <Link to="/panel" className="rounded-full px-4 py-2 text-sm font-semibold text-foreground hover:bg-accent">
                Panelim
              </Link>
              <Button variant="ghost" onClick={async () => { await supabase.auth.signOut(); navigate({ to: "/" }); }}>
                Çıkış Yap
              </Button>
            </>
          ) : (
            <Link to="/auth" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">
              Giriş Yap
            </Link>
          )}
          <Link
            to="/iletisim"
            className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90"
          >
            Ücretsiz Görüşme Al
          </Link>
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)} aria-label="Menü">
          {open ? <X /> : <Menu />}
        </button>
      </div>

      {open && (
        <div className="border-t border-border/60 bg-background lg:hidden">
          <div className="flex flex-col gap-1 px-4 py-4">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">
                {n.label}
              </Link>
            ))}

            <button
              onClick={() => setMobileCalcOpen((v) => !v)}
              className="flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent"
            >
              Kâr Hesaplayıcılar
              <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${mobileCalcOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileCalcOpen && (
              <div className="ml-4 flex flex-col gap-0.5">
                {CALCULATORS.map((c) =>
                  c.active && c.to ? (
                    <Link
                      key={c.label}
                      to={c.to}
                      onClick={() => { setOpen(false); setMobileCalcOpen(false); }}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-foreground hover:bg-accent"
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <div key={c.label} className="flex items-center justify-between rounded-lg px-3 py-2 text-sm text-muted-foreground/50">
                      {c.label}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium text-muted-foreground">Yakında</span>
                    </div>
                  )
                )}
              </div>
            )}

            <Link to="/auth" onClick={() => setOpen(false)} className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-accent">Giriş Yap</Link>
            <Link to="/iletisim" onClick={() => setOpen(false)} className="mt-2 rounded-full bg-primary px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground">
              Ücretsiz Görüşme Al
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
