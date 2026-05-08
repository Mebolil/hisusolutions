import { type ReactNode, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard, ShoppingBag, Receipt, ShoppingCart, Package,
  Megaphone, Users, Bell, BarChart3, Menu, X, LogOut,
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
  { label: "Satışlar",       path: "/app/butcecrm/satislar",       icon: ShoppingBag,     enabled: false },
  { label: "Giderler",       path: "/app/butcecrm/giderler",       icon: Receipt,         enabled: false },
  { label: "Alışlar",        path: "/app/butcecrm/alislar",        icon: ShoppingCart,    enabled: false },
  { label: "Stok",           path: "/app/butcecrm/stok",           icon: Package,         enabled: false },
  { label: "Reklam",         path: "/app/butcecrm/reklam",         icon: Megaphone,       enabled: false },
  { label: "Cariler",        path: "/app/butcecrm/cariler",        icon: Users,           enabled: false },
  { label: "Hatırlatıcılar", path: "/app/butcecrm/hatirlaticilar", icon: Bell,            enabled: false },
  { label: "Raporlar",       path: "/app/butcecrm/raporlar",       icon: BarChart3,       enabled: false },
];

export function ButceCrmLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

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
          <aside className="relative w-64 h-full bg-[oklch(0.18_0.02_160)] text-white">
            <div className="p-6 flex items-center justify-between">
              <h1 className="text-xl font-bold text-primary">BütçeCRM</h1>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
            </div>
            <nav className="px-3 space-y-1">
              {navItems.map((i) => renderItem(i, () => setOpen(false)))}
            </nav>
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
