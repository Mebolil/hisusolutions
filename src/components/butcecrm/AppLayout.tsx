import { type ReactNode, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ShoppingBag, Receipt, ShoppingCart, Package,
  Megaphone, Users, Bell, BarChart3, Menu, X, LogOut, Settings, Clock,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

type NavItem = {
  label: string;
  path: string;
  icon: typeof LayoutDashboard;
  enabled: boolean;
};

const navItems: NavItem[] = [
  { label: "Ana Sayfa",      path: "/app/butcecrm",                icon: LayoutDashboard, enabled: true  },
  { label: "Satışlar",       path: "/app/butcecrm/satislar",       icon: ShoppingBag,     enabled: true  },
  { label: "Giderler",       path: "/app/butcecrm/giderler",       icon: Receipt,         enabled: true  },
  { label: "Alışlar",        path: "/app/butcecrm/alislar",        icon: ShoppingCart,    enabled: true  },
  { label: "Stok",           path: "/app/butcecrm/stok",           icon: Package,         enabled: true  },
  { label: "Reklam",         path: "/app/butcecrm/reklam",         icon: Megaphone,       enabled: true  },
  { label: "Cariler",        path: "/app/butcecrm/cariler",        icon: Users,           enabled: true  },
  { label: "Hatırlatıcılar", path: "/app/butcecrm/hatirlaticilar", icon: Bell,            enabled: true  },
  { label: "Raporlar",       path: "/app/butcecrm/raporlar",       icon: BarChart3,       enabled: true  },
  { label: "Ayarlar",        path: "/app/butcecrm/ayarlar",        icon: Settings,        enabled: true  },
];

function trialDaysLeft(trialEndsAt: string | null): number {
  if (!trialEndsAt) return 0;
  const diff = new Date(trialEndsAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

type Props = { children: ReactNode; trialEndsAt?: string | null };

export function ButceCrmLayout({ children, trialEndsAt = null }: Props) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const daysLeft = trialDaysLeft(trialEndsAt);
  const isTrial = trialEndsAt !== null;

  const isActive = (path: string) =>
    path === "/app/butcecrm" ? pathname === "/app/butcecrm" : pathname.startsWith(path);

  const renderItem = (item: NavItem, onClick?: () => void) => {
    const active = isActive(item.path);
    const base = "flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors";
    const cls = active
      ? "bg-white/10 text-white"
      : item.enabled
        ? "text-white/70 hover:text-white hover:bg-white/5"
        : "text-white/30 cursor-not-allowed";
    const inner = (
      <>
        <span className="flex items-center gap-3">
          <item.icon className="h-5 w-5" />
          {item.label}
        </span>
        {!item.enabled && <span className="text-[10px] uppercase tracking-wide text-white/40">Yakında</span>}
      </>
    );
    if (!item.enabled) return <div key={item.path} className={`${base} ${cls}`}>{inner}</div>;
    return (
      <Link key={item.path} to={item.path} onClick={onClick} className={`${base} ${cls}`}>
        {inner}
      </Link>
    );
  };

  const TrialBadge = () => {
    if (!isTrial) return null;
    return (
      <div className="mx-3 mb-3 rounded-xl bg-white/5 border border-white/10 p-3">
        <div className="flex items-center gap-2 mb-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-semibold text-white">Deneme Modu</span>
        </div>
        <p className="text-[11px] text-white/50 leading-relaxed">
          {daysLeft === 0 ? "Bugün bitiyor" : `${daysLeft} gün kaldı`}
        </p>
        <Link
          to="/iletisim"
          className="mt-2 block w-full rounded-lg bg-primary/90 py-1.5 text-center text-[11px] font-semibold text-white hover:bg-primary transition-colors"
        >
          Planı Al →
        </Link>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-[oklch(0.18_0.02_160)] text-white">
        <div className="p-6">
          <h1 className="text-xl font-bold tracking-tight text-primary">BütçeCRM</h1>
          <p className="text-xs text-white/40 mt-1">E-Ticaret Finans Takibi</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((i) => renderItem(i))}
        </nav>
        <TrialBadge />
        <div className="p-3">
          <button
            onClick={() => supabase.auth.signOut().then(() => (window.location.href = "/"))}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 w-full transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Mobile sidebar */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="relative w-64 h-full bg-[oklch(0.18_0.02_160)] text-white flex flex-col">
            <div className="p-6 flex items-center justify-between">
              <h1 className="text-xl font-bold text-primary">BütçeCRM</h1>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <nav className="flex-1 px-3 space-y-1">
              {navItems.map((i) => renderItem(i, () => setOpen(false)))}
            </nav>
            <TrialBadge />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        <header className="lg:hidden flex items-center justify-between p-4 border-b bg-card">
          <button onClick={() => setOpen(true)}><Menu className="h-6 w-6" /></button>
          <h1 className="text-lg font-bold text-primary">BütçeCRM</h1>
          <div className="w-6" />
        </header>
        <main className="flex-1 p-4 lg:p-8 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
