import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/butcecrm-helpers";
import { KazanilmamisFirsatKart } from "@/components/butcecrm/KayipKarKart";
import { loadOnboarding } from "@/lib/butcecrm-onboarding";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingDown, DollarSign, Percent, Clock,
  Megaphone, Target, AlertTriangle, Trophy, Users, Tag, Building2, CalendarClock,
} from "lucide-react";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  parseISO, isWithinInterval, subMonths, format, differenceInDays, startOfDay,
  addDays, endOfDay, isSameDay,
} from "date-fns";
import { tr } from "date-fns/locale";

type Period = "week" | "month" | "year";

interface Sale { id: string; sale_date: string; customer_id: string; product_name: string; quantity: number; total_amount: number; total_cost: number; paid_amount: number; payment_status: string; campaign_id: string | null; status?: string | null }
interface Expense { id: string; expense_date: string; amount: number; paid_amount: number; category: string; campaign_id: string | null; payment_status: string }
interface Product { id: string; name: string; quantity: number; low_stock_threshold: number; unit_price?: number }
interface Campaign { id: string; name: string; status: string; spend: number; start_date: string; end_date: string | null }
interface Customer { id: string; name: string }
interface Purchase { id: string; amount: number; paid_amount: number; payment_status: string }
interface Return { id: string; return_date: string; return_amount: number }
interface PaymentReminder { id: string; title: string; due_date: string; type: string; status: string }

export const Route = createFileRoute("/app/butcecrm/")({
  component: ButceCrmDashboard,
});

function ButceCrmDashboard() {
  const [period, setPeriod] = useState<Period>("month");
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [periodReturns, setPeriodReturns] = useState<Return[]>([]);
  const [paymentReminders, setPaymentReminders] = useState<PaymentReminder[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      const uid = session.user.id;
      // Trend chart 6 ay + year period için yılın başı — hangisi daha eskiyse onu al
      const now = new Date();
      const fetchFrom = format(
        startOfDay(subMonths(now, 11) < startOfYear(now) ? subMonths(now, 11) : startOfYear(now)),
        "yyyy-MM-dd"
      );
      const [s, e, p, c, cu, pu, ret] = await Promise.all([
        supabase.from("sales").select("*").eq("user_id", uid).is("deleted_at", null).gte("sale_date", fetchFrom).limit(50000),
        supabase.from("expenses").select("*").eq("user_id", uid).is("deleted_at", null).gte("expense_date", fetchFrom).limit(50000),
        supabase.from("products").select("*").eq("user_id", uid).is("deleted_at", null).limit(1000),
        supabase.from("campaigns").select("*").eq("user_id", uid).is("deleted_at", null).limit(500),
        supabase.from("customers").select("id,name").eq("user_id", uid).is("deleted_at", null).limit(2000),
        supabase.from("purchases").select("id,amount,paid_amount,payment_status").eq("user_id", uid).is("deleted_at", null).limit(2000),
        supabase.from("returns").select("id,return_date,return_amount").eq("user_id", uid).eq("status", "active").is("deleted_at", null).gte("return_date", fetchFrom).limit(20000),
      ]);
      setSales((s.data as Sale[]) || []);
      setExpenses((e.data as Expense[]) || []);
      setProducts((p.data as Product[]) || []);
      setCampaigns((c.data as Campaign[]) || []);
      setCustomers((cu.data as Customer[]) || []);
      setPurchases((pu.data as Purchase[]) || []);
      setPeriodReturns((ret.data as Return[]) || []);
      setLoading(false);
    })();
  }, []);

  // "Bu Hafta Ne Ödeyeceğim?" kartı için bekleyen ödeme hatırlatıcıları (ayrı fetch)
  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const uid = session.user.id;
      const todayStr = format(startOfDay(new Date()), "yyyy-MM-dd");
      const next7Str = format(addDays(startOfDay(new Date()), 6), "yyyy-MM-dd");
      const { data } = await supabase
        .from("reminders")
        .select("id,title,due_date,type,status")
        .eq("user_id", uid)
        .eq("type", "ödeme")
        .eq("status", "bekliyor")
        .gte("due_date", todayStr)
        .lte("due_date", next7Str);
      setPaymentReminders((data as PaymentReminder[]) || []);
    })();
  }, []);

  const now = new Date();
  const range = useMemo(() => {
    if (period === "week") return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
    if (period === "month") return { start: startOfMonth(now), end: endOfMonth(now) };
    return { start: startOfYear(now), end: endOfYear(now) };
  }, [period]);

  const customerMap = useMemo(() => Object.fromEntries(customers.map((c) => [c.id, c.name])), [customers]);

  const campaignRevenueMap = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => {
      if (s.campaign_id) {
        map.set(s.campaign_id, (map.get(s.campaign_id) || 0) + Number(s.total_amount || 0));
      }
    });
    return map;
  }, [sales]);

  const inRange = (d: string) => {
    try { return isWithinInterval(parseISO(d), range); } catch { return false; }
  };

  const periodSales = sales.filter((s) => inRange(s.sale_date));
  const periodExpenses = expenses.filter((e) => inRange(e.expense_date));
  const periodCampaigns = campaigns.filter((c) => c.status === "aktif" || inRange(c.start_date));

  const totalIncome = periodSales.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
  const totalReturnAmount = periodReturns
    .filter((r) => inRange(r.return_date))
    .reduce((s, r) => s + Number(r.return_amount || 0), 0);
  const totalCost = periodSales.reduce((s, x) => s + Number(x.total_cost || 0), 0);
  const adsSpend = periodCampaigns.reduce((s, c) => s + Number(c.spend || 0), 0);
  const expensesPaid = periodExpenses.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
  const totalExpense = expensesPaid + adsSpend;
  const netProfit = totalIncome - totalExpense - totalCost - totalReturnAmount;
  const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const potentialIncome = periodSales
    .filter((s) => s.payment_status !== "ödendi" && s.status !== "iptal")
    .reduce((sum, x) => sum + Math.max(0, Number(x.total_amount) - Number(x.paid_amount || 0)), 0);

  const activeCampaigns = campaigns.filter((c) => c.status === "aktif");
  const activeAdsSpend = activeCampaigns.reduce((s, c) => s + Number(c.spend || 0), 0);
  const activeRoas = useMemo(() => {
    let totalRevenue = 0;
    let totalSpend = 0;
    activeCampaigns.forEach((c) => {
      const rev = campaignRevenueMap.get(c.id) || 0;
      totalRevenue += rev;
      totalSpend += Number(c.spend || 0);
    });
    return totalSpend > 0 ? totalRevenue / totalSpend : 0;
  }, [activeCampaigns, campaignRevenueMap]);

  const onboardingProfile = loadOnboarding();

  const kayipKar = useMemo(() => {
    const bosReklam = periodCampaigns.reduce((sum, c) => {
      const rev = campaignRevenueMap.get(c.id) || 0;
      const roas = Number(c.spend) > 0 ? rev / Number(c.spend) : 0;
      return sum + (roas < 1 ? Number(c.spend) : 0);
    }, 0);

    const iadeMaliyeti = periodReturns
      .filter((r) => {
        try { return isWithinInterval(parseISO(r.return_date), range); } catch { return false; }
      })
      .reduce((s, r) => s + Number(r.return_amount || 0), 0);

    const negatifMarjin = periodSales
      .filter((s) => Number(s.total_cost || 0) > Number(s.total_amount || 0))
      .reduce((sum, s) => sum + (Number(s.total_cost || 0) - Number(s.total_amount || 0)), 0);

    return {
      bosReklam,
      iadeMaliyeti,
      negatifMarjin,
      total: bosReklam + iadeMaliyeti + negatifMarjin,
    };
  }, [periodCampaigns, periodSales, periodReturns, campaignRevenueMap, range]);

  const trendData = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const r = { start: startOfMonth(d), end: endOfMonth(d) };
      const within = (x: string) => { try { return isWithinInterval(parseISO(x), r); } catch { return false; } };
      const ms = sales.filter((s) => within(s.sale_date));
      const me = expenses.filter((e) => within(e.expense_date));
      // Kampanya spend'ini aktif olduğu aylara orantılı dağıt
      const campaignSpend = campaigns.reduce((total, c) => {
        try {
          const cStart = parseISO(c.start_date);
          const cEnd = c.end_date ? parseISO(c.end_date) : now;
          const overlapStart = new Date(Math.max(cStart.getTime(), r.start.getTime()));
          const overlapEnd = new Date(Math.min(cEnd.getTime(), r.end.getTime()));
          if (overlapStart > overlapEnd) return total;
          const totalDays = Math.max(1, differenceInDays(cEnd, cStart) + 1);
          const overlapDays = differenceInDays(overlapEnd, overlapStart) + 1;
          return total + (Number(c.spend || 0) * overlapDays / totalDays);
        } catch { return total; }
      }, 0);
      const inc = ms.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
      const cost = ms.reduce((s, x) => s + Number(x.total_cost || 0), 0);
      const exp = me.reduce((s, x) => s + Number(x.paid_amount || 0), 0) + campaignSpend;
      arr.push({ name: format(d, "MMM yy", { locale: tr }), Gelir: inc, Gider: exp, "Net Kâr": inc - exp - cost });
    }
    return arr;
  }, [sales, expenses, campaigns]);

  const pendingCollections = sales
    .filter((s) => s.payment_status !== "ödendi" && Number(s.total_amount) - Number(s.paid_amount || 0) > 0)
    .map((s) => ({
      id: s.id,
      customer: customerMap[s.customer_id] || "?",
      remaining: Number(s.total_amount) - Number(s.paid_amount || 0),
      overdue: (() => { try { return differenceInDays(now, parseISO(s.sale_date)); } catch { return 0; } })(),
    }))
    .sort((a, b) => b.overdue - a.overdue)
    .slice(0, 5);

  const criticalStock = products
    .filter((p) => Number(p.quantity) <= Number(p.low_stock_threshold))
    .sort((a, b) => Number(a.quantity) - Number(b.quantity))
    .slice(0, 5);

  const activeCampaignsScored = activeCampaigns
    .map((c) => {
      const rev = campaignRevenueMap.get(c.id) || 0;
      const spend = Number(c.spend || 0);
      const roas = spend > 0 ? rev / spend : 0;
      const netKar = rev - spend;
      return { ...c, roas, netKar };
    })
    .sort((a, b) => b.roas - a.roas);

  const activeCampaignList = activeCampaignsScored.slice(0, 5);
  // ROAS < 1 olan aktif kampanyalar — harcaması olup geri dönüşü zayıf
  const underperformingAds = activeCampaignsScored.filter((c) => Number(c.spend || 0) > 0 && c.roas < 1).length;

  const topProduct = useMemo(() => {
    const m: Record<string, number> = {};
    periodSales.forEach((s) => { m[s.product_name] = (m[s.product_name] || 0) + Number(s.quantity || 0); });
    const e = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
    return e ? { name: e[0], qty: e[1] } : null;
  }, [periodSales]);

  const topCustomer = useMemo(() => {
    const m: Record<string, number> = {};
    periodSales.forEach((s) => {
      const profit = Number(s.total_amount) - Number(s.total_cost || 0);
      m[s.customer_id] = (m[s.customer_id] || 0) + profit;
    });
    const e = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
    return e ? { name: customerMap[e[0]] || "?", profit: e[1] } : null;
  }, [periodSales, customerMap]);

  const topExpenseCat = useMemo(() => {
    const m: Record<string, number> = {};
    periodExpenses.forEach((x) => { m[x.category] = (m[x.category] || 0) + Number(x.amount || 0); });
    const e = Object.entries(m).sort((a, b) => b[1] - a[1])[0];
    return e ? { name: e[0], amount: e[1] } : null;
  }, [periodExpenses]);

  // İade Oranı
  const returnCount = periodReturns.filter((r) => inRange(r.return_date)).length;
  const returnRate = periodSales.length > 0 ? (returnCount / periodSales.length) * 100 : 0;

  // Ortalama Sipariş Değeri (AOV) — iptal hariç aktif satışlardan
  const activePeriodSales = periodSales.filter((s) => s.status !== "iptal");
  const aovBase = activePeriodSales.filter((s) => s.status !== "iade_edildi");
  const aov = aovBase.length > 0
    ? aovBase.reduce((s, x) => s + Number(x.total_amount || 0), 0) / aovBase.length
    : 0;

  const supplierDebt = purchases.reduce((s, p) => s + Math.max(0, Number(p.amount) - Number(p.paid_amount || 0)), 0);

  const debtRatio = useMemo(() => {
    const totalReceivable = sales
      .filter((s) => s.payment_status !== "ödendi" && (!s.status || s.status === "aktif"))
      .reduce((sum, s) => sum + Math.max(0, Number(s.total_amount || 0) - Number(s.paid_amount || 0)), 0);
    const expenseDebt = expenses
      .filter((e) => e.payment_status !== "ödendi")
      .reduce((sum, e) => sum + Math.max(0, Number(e.amount || 0) - Number(e.paid_amount || 0)), 0);
    const totalPayable = expenseDebt + supplierDebt;
    const ratio = totalPayable > 0 ? totalReceivable / totalPayable : null;
    return { totalReceivable, totalPayable, ratio };
  }, [sales, expenses, supplierDebt]);

  const ghostCustomerCount = useMemo(() => {
    const sixtyDaysAgo = new Date(Date.now() - 60 * 86400000);
    const lastSaleByCustomer: Record<string, Date> = {};
    sales.forEach((s) => {
      if (!s.customer_id) return;
      try {
        const d = parseISO(s.sale_date);
        if (!lastSaleByCustomer[s.customer_id] || d > lastSaleByCustomer[s.customer_id]) {
          lastSaleByCustomer[s.customer_id] = d;
        }
      } catch { /* */ }
    });
    return customers.filter((c) => {
      const last = lastSaleByCustomer[c.id];
      return !last || last < sixtyDaysAgo;
    }).length;
  }, [sales, customers]);

  // "Bu Hafta Ne Ödeyeceğim?" — önümüzdeki 7 gün, bekleyen giderler + ödeme hatırlatıcıları
  const upcomingWeek = useMemo(() => {
    const today = startOfDay(now);
    const next7 = endOfDay(addDays(today, 6));
    type DueItem = { date: Date; amount: number };
    const items: DueItem[] = [];

    expenses.forEach((e) => {
      if (e.payment_status === "ödendi") return;
      let d: Date;
      try { d = parseISO(e.expense_date); } catch { return; }
      if (d < today || d > next7) return;
      const remaining = Math.max(0, Number(e.amount || 0) - Number(e.paid_amount || 0));
      items.push({ date: d, amount: remaining });
    });

    paymentReminders.forEach((r) => {
      let d: Date;
      try { d = parseISO(r.due_date); } catch { return; }
      if (d < today || d > next7) return;
      // Hatırlatıcının tutarı yok; ödeme adedi olarak sayılır
      items.push({ date: d, amount: 0 });
    });

    // Güne göre grupla
    const groups: { date: Date; total: number; count: number }[] = [];
    items.forEach((it) => {
      const g = groups.find((x) => isSameDay(x.date, it.date));
      if (g) { g.total += it.amount; g.count += 1; }
      else groups.push({ date: it.date, total: it.amount, count: 1 });
    });
    groups.sort((a, b) => a.date.getTime() - b.date.getTime());

    const total = groups.reduce((s, g) => s + g.total, 0);
    const totalCount = groups.reduce((s, g) => s + g.count, 0);
    return { groups, total, totalCount, days: groups.length };
  }, [expenses, paymentReminders, now]);

  function dayLabel(d: Date) {
    const today = startOfDay(now);
    if (isSameDay(d, today)) return "Bugün";
    if (isSameDay(d, addDays(today, 1))) return "Yarın";
    return format(d, "EEEE", { locale: tr });
  }

  const upcomingBorder = upcomingWeek.totalCount === 0
    ? "border-emerald-300 bg-emerald-50/40"
    : upcomingWeek.total < 5000
      ? "border-amber-300 bg-amber-50/40"
      : "border-red-300 bg-red-50/40";

  const periodLabels: Record<Period, string> = { week: "Bu Hafta", month: "Bu Ay", year: "Bu Yıl" };

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Yükleniyor...</p></div>;

  if (sales.length === 0 && expenses.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Ana Sayfa</h1>
          <p className="text-muted-foreground text-sm">BütçeCRM — Tüm modüllerin gerçek zamanlı özeti</p>
        </div>
        <Card className="border-2 border-primary/20">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="mb-4 text-5xl">📊</div>
            <h2 className="text-xl font-semibold mb-2">Henüz veri yok</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              İlk satışını veya giderini ekle — panel hemen canlanıyor.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="/app/butcecrm/satislar"
                className="inline-flex items-center justify-center rounded-md bg-primary text-primary-foreground h-9 px-4 text-sm font-medium hover:bg-primary/90 transition-colors"
              >
                İlk Satışı Ekle
              </a>
              <a
                href="/app/butcecrm/giderler"
                className="inline-flex items-center justify-center rounded-md border border-input bg-background h-9 px-4 text-sm font-medium hover:bg-accent transition-colors"
              >
                Gider Ekle
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ana Sayfa</h1>
          <p className="text-muted-foreground text-sm">
            {onboardingProfile?.sector === "eticaret"
              ? "E-ticaret finans takibi — tüm modüllerin gerçek zamanlı özeti"
              : onboardingProfile?.sector === "perakende"
              ? "Perakende finans takibi — tüm modüllerin gerçek zamanlı özeti"
              : onboardingProfile?.sector === "hizmet"
              ? "Hizmet işletmesi finans takibi — gerçek zamanlı özet"
              : "BütçeCRM — Tüm modüllerin gerçek zamanlı özeti"}
          </p>
        </div>
        <div className="flex gap-1 bg-secondary rounded-lg p-1">
          {(["week", "month", "year"] as Period[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                period === p ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {periodLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KATMAN 1 — ALARM BANDI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {kayipKar.total > 0 && (
          <KazanilmamisFirsatKart
            bosReklam={kayipKar.bosReklam}
            iadeMaliyeti={kayipKar.iadeMaliyeti}
            negatifMarjin={kayipKar.negatifMarjin}
            total={kayipKar.total}
            formatCurrency={formatCurrency}
          />
        )}

        <Card className={`border-2 ${upcomingBorder}`}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-primary" /> Bu Hafta Ne Ödeyeceğim?
            </CardTitle>
            <p className="text-xs text-muted-foreground">Önümüzdeki 7 gün</p>
          </CardHeader>
          <CardContent>
            {upcomingWeek.total === 0 && upcomingWeek.totalCount === 0 ? (
              <p className="text-sm text-emerald-700 font-medium">Bu hafta ödemeniz yok 🎉</p>
            ) : (
              <div className="space-y-2">
                {upcomingWeek.groups.slice(0, 5).map((g, i) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="inline-flex items-center gap-2">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-secondary capitalize">{dayLabel(g.date)}</span>
                    </span>
                    <span className="font-medium">
                      {formatCurrency(g.total)}
                      <span className="text-xs text-muted-foreground ml-1.5">· {g.count} ödeme</span>
                    </span>
                  </div>
                ))}
                {upcomingWeek.groups.length > 5 && (
                  <p className="text-xs text-muted-foreground">+{upcomingWeek.groups.length - 5} gün daha</p>
                )}
                <div className="border-t pt-2 mt-2 flex items-center justify-between text-sm font-semibold">
                  <span>Toplam: {formatCurrency(upcomingWeek.total)}</span>
                  <span className="text-muted-foreground font-normal text-xs">
                    {upcomingWeek.days} gün · {upcomingWeek.totalCount} ödeme
                  </span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={`border-2 ${criticalStock.length === 0 ? "border-emerald-300 bg-emerald-50/40" : "border-orange-300 bg-orange-50/40"} ${onboardingProfile?.focus === "stok" ? "ring-2 ring-primary" : ""}`}>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-orange-600" /> Kritik Stok</CardTitle></CardHeader>
          <CardContent>
            {criticalStock.length === 0 ? <p className="text-sm text-muted-foreground">Tüm stoklar normal seviyede ✓</p> : (
              <div className="space-y-2">
                {criticalStock.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50">
                    <p className="text-sm font-medium truncate">{p.name}</p>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-orange-600">{Number(p.quantity)}</p>
                      <p className="text-xs text-muted-foreground">eşik: {Number(p.low_stock_threshold)}</p>
                    </div>
                  </div>
                ))}
                <a href="/app/butcecrm/stok" className="text-xs text-orange-700 hover:underline inline-block pt-1">→ Stok sayfasına git</a>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* KATMAN 2 — SAĞLIK METRİKLERİ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Net Kâr" value={formatCurrency(netProfit)} icon={<DollarSign className={`h-5 w-5 ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`} />} bg={netProfit >= 0 ? "bg-emerald-100" : "bg-red-100"} valueClass={netProfit >= 0 ? "text-emerald-600" : "text-red-600"} sub={`Gelir: ${formatCurrency(totalIncome)} · Maliyet: ${formatCurrency(totalCost)}${totalReturnAmount > 0 ? ` · İade: −${formatCurrency(totalReturnAmount)}` : ""}`} />
        <MetricCard title="Kâr Marjı" value={`%${margin.toFixed(1)}`} icon={<Percent className="h-5 w-5 text-blue-600" />} bg="bg-blue-100" valueClass={margin >= 0 ? "text-emerald-600" : "text-red-600"} />
        <MetricCard
          title="Net Pozisyon"
          value={formatCurrency(debtRatio.totalReceivable - debtRatio.totalPayable)}
          icon={<Building2 className={`h-5 w-5 ${
            debtRatio.totalReceivable >= debtRatio.totalPayable
              ? "text-emerald-600"
              : "text-red-600"
          }`} />}
          bg={debtRatio.totalReceivable >= debtRatio.totalPayable ? "bg-emerald-100" : "bg-red-100"}
          valueClass={debtRatio.totalReceivable >= debtRatio.totalPayable ? "text-emerald-600" : "text-red-600"}
          sub={`Alacak: ${formatCurrency(debtRatio.totalReceivable)} · Borç: ${formatCurrency(debtRatio.totalPayable)}${debtRatio.ratio !== null ? ` · Oran: ${debtRatio.ratio.toFixed(2)}x` : ""}`}
        />
        <MetricCard title="Bekleyen Tahsilat" value={formatCurrency(potentialIncome)} icon={<Clock className="h-5 w-5 text-amber-600" />} bg="bg-amber-100" valueClass="text-amber-600" href={potentialIncome > 0 ? "/app/butcecrm/satislar" : undefined} action={potentialIncome > 0 ? "Tahsilatları gör" : undefined} />
      </div>

      {/* KATMAN 2b — YENİ METRİKLER */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <MetricCard
          title="İade Oranı"
          value={`%${returnRate.toFixed(1)}`}
          icon={<TrendingDown className={`h-5 w-5 ${returnCount > 0 ? "text-amber-600" : "text-emerald-600"}`} />}
          bg={returnCount > 0 ? "bg-amber-100" : "bg-emerald-100"}
          valueClass={returnCount > 0 ? "text-amber-600" : "text-emerald-600"}
          sub={`${returnCount} iade / ${periodSales.length} satış`}
        />
        <MetricCard
          title="Ort. Sipariş Değeri"
          value={formatCurrency(aov)}
          icon={<DollarSign className="h-5 w-5 text-blue-600" />}
          bg="bg-blue-100"
          valueClass="text-foreground"
          sub={`${activePeriodSales.length} aktif satış`}
        />
        {ghostCustomerCount > 0 ? (
          <div className="rounded-xl border-2 border-purple-200 bg-purple-50/40 p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Users className="h-4 w-4 text-purple-600" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Sessiz Müşteriler</p>
            </div>
            <p className="text-2xl font-bold text-purple-600">{ghostCustomerCount}</p>
            <p className="text-xs text-muted-foreground mt-0.5">60+ gündür alışveriş yapmadı</p>
            <a href="/app/butcecrm/cariler" className="text-xs text-purple-600 hover:underline mt-2 inline-block">→ Cariler'e git</a>
          </div>
        ) : (
          <MetricCard title="Sessiz Müşteriler" value="0" icon={<Users className="h-5 w-5 text-emerald-600" />} bg="bg-emerald-100" valueClass="text-emerald-600" sub="Tüm müşteriler aktif" />
        )}
      </div>

      {/* KATMAN 3 — DETAY */}
      <Card>
        <CardHeader><CardTitle className="text-base">Gelir vs Gider Trendi (Son 6 Ay)</CardTitle></CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={(v) => `₺${(Number(v) / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                <Legend />
                <Bar dataKey="Gelir" fill="hsl(152, 60%, 36%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Gider" fill="hsl(0, 72%, 51%)" radius={[4, 4, 0, 0]} />
                <Line dataKey="Net Kâr" stroke="hsl(217, 91%, 60%)" strokeWidth={2.5} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" /> Bekleyen Tahsilatlar</CardTitle></CardHeader>
          <CardContent>
            {pendingCollections.length === 0 ? <p className="text-sm text-muted-foreground">Bekleyen tahsilat yok 🎉</p> : (
              <div className="space-y-2">
                {pendingCollections.map((p) => (
                  <div key={p.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.customer}</p>
                      {p.overdue > 0 && <p className="text-xs text-destructive">{p.overdue} gün geçti</p>}
                    </div>
                    <p className="text-sm font-semibold whitespace-nowrap">{formatCurrency(p.remaining)}</p>
                  </div>
                ))}
                <a href="/app/butcecrm/satislar" className="text-xs text-amber-700 hover:underline inline-block pt-1">→ Tüm tahsilatları gör</a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className={onboardingProfile?.focus === "reklam" ? "ring-2 ring-primary" : undefined}>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4 text-fuchsia-600" /> Reklam Performansı</CardTitle>
            <p className="text-xs text-muted-foreground">
              {activeCampaigns.length} aktif kampanya · Harcama: {formatCurrency(activeAdsSpend)} · Ort. ROAS: {activeRoas.toFixed(2)}x
            </p>
          </CardHeader>
          <CardContent>
            {activeCampaignList.length === 0 ? <p className="text-sm text-muted-foreground">Aktif kampanya yok</p> : (
              <div className="space-y-2">
                {activeCampaignList.map((c) => (
                  <a key={c.id} href={`/app/butcecrm/reklam/${c.id}`} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatCurrency(Number(c.spend))}
                        <span className={`ml-1.5 ${c.netKar >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                          {c.netKar >= 0 ? "+" : "−"}{formatCurrency(Math.abs(c.netKar))}
                        </span>
                      </p>
                    </div>
                    <p className={`text-sm font-semibold ${c.roas >= 1 ? "text-emerald-600" : "text-red-600"}`}>{c.roas.toFixed(2)}x</p>
                  </a>
                ))}
                <a href="/app/butcecrm/reklam" className="text-xs text-fuchsia-700 hover:underline inline-block pt-1">→ Reklam sayfasına git</a>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4 text-cyan-600" /> Reklam Özeti</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-cyan-50/60">
              <span className="text-sm text-muted-foreground">Aktif Reklam Harcaması</span>
              <span className="text-sm font-semibold">{formatCurrency(activeAdsSpend)}</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
              <span className="text-sm text-muted-foreground">Ortalama ROAS</span>
              <span className={`text-sm font-semibold ${activeRoas >= 1 ? "text-emerald-600" : "text-red-600"}`}>{activeRoas.toFixed(2)}x</span>
            </div>
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
              <span className="text-sm text-muted-foreground">Aktif Kampanya</span>
              <span className="text-sm font-semibold">{activeCampaigns.length}</span>
            </div>
            <div className={`flex items-center justify-between p-2.5 rounded-lg ${underperformingAds > 0 ? "bg-red-50/60" : "bg-secondary/50"}`}>
              <span className="text-sm text-muted-foreground">Verimi Düşük Kampanya (ROAS&lt;1)</span>
              <span className={`text-sm font-semibold ${underperformingAds > 0 ? "text-red-600" : "text-emerald-600"}`}>{underperformingAds}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickCard icon={<Trophy className="h-5 w-5 text-amber-600" />} bg="bg-amber-100" label="En Çok Satan Ürün" value={topProduct?.name || "-"} sub={topProduct ? `${topProduct.qty} adet` : "Veri yok"} />
        <QuickCard icon={<Users className="h-5 w-5 text-emerald-600" />} bg="bg-emerald-100" label="En Kârlı Müşteri" value={topCustomer?.name || "-"} sub={topCustomer ? formatCurrency(topCustomer.profit) : "Veri yok"} />
        <QuickCard icon={<Tag className="h-5 w-5 text-red-600" />} bg="bg-red-100" label="En Yüksek Gider Kategorisi" value={topExpenseCat?.name || "-"} sub={topExpenseCat ? formatCurrency(topExpenseCat.amount) : "Veri yok"} />
        <QuickCard icon={<Building2 className="h-5 w-5 text-indigo-600" />} bg="bg-indigo-100" label="Tedarikçi Borcu" value={formatCurrency(supplierDebt)} sub={`${purchases.filter((p) => p.payment_status !== "ödendi").length} açık alış`} />
      </div>
    </div>
  );
}

function MetricCard({ title, value, icon, bg, valueClass, sub, href, action }: { title: string; value: string; icon: React.ReactNode; bg: string; valueClass?: string; sub?: string; href?: string; action?: string }) {
  const card = (
    <Card className={href ? "transition-colors hover:border-primary/40 hover:bg-secondary/30 cursor-pointer h-full" : undefined}>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold truncate ${valueClass || ""}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
            {href && action && <p className="text-xs text-primary mt-1.5">{action} →</p>}
          </div>
          <div className={`h-12 w-12 rounded-full ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
  return href ? <a href={href} className="block">{card}</a> : card;
}

function QuickCard({ icon, bg, label, value, sub }: { icon: React.ReactNode; bg: string; label: string; value: string; sub: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-start gap-3">
          <div className={`h-10 w-10 rounded-full ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-sm font-semibold truncate">{value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
