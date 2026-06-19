import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { formatCurrency } from "@/lib/butcecrm-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp, TrendingDown, DollarSign, Percent, Clock, Package,
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

interface Sale { id: string; sale_date: string; customer_id: string; product_name: string; quantity: number; total_amount: number; total_cost: number; paid_amount: number; payment_status: string; campaign_id: string | null }
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
        supabase.from("sales").select("*").eq("user_id", uid).is("deleted_at", null).gte("sale_date", fetchFrom),
        supabase.from("expenses").select("*").eq("user_id", uid).is("deleted_at", null).gte("expense_date", fetchFrom),
        supabase.from("products").select("*").eq("user_id", uid).is("deleted_at", null).limit(1000),
        supabase.from("campaigns").select("*").eq("user_id", uid).limit(500),
        supabase.from("customers").select("id,name").eq("user_id", uid).limit(2000),
        supabase.from("purchases").select("id,amount,paid_amount,payment_status").eq("user_id", uid).is("deleted_at", null).limit(2000),
        supabase.from("returns").select("id,return_date,return_amount").eq("user_id", uid).eq("status", "active").is("deleted_at", null).gte("return_date", fetchFrom),
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

  const inRange = (d: string) => {
    try { return isWithinInterval(parseISO(d), range); } catch { return false; }
  };

  const periodSales = sales.filter((s) => inRange(s.sale_date));
  const periodExpenses = expenses.filter((e) => inRange(e.expense_date));
  const periodCampaigns = campaigns.filter((c) => inRange(c.start_date));

  const totalIncome = periodSales.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
  const totalReturnAmount = periodReturns
    .filter((r) => inRange(r.return_date))
    .reduce((s, r) => s + Number(r.return_amount || 0), 0);
  const totalCost = periodSales.reduce((s, x) => s + Number(x.total_cost || 0), 0);
  const adsSpend = periodCampaigns.reduce((s, c) => s + Number(c.spend || 0), 0);
  const expensesPaid = periodExpenses.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
  const totalExpense = expensesPaid + adsSpend;
  const netProfit = totalIncome - totalExpense - totalCost;
  const margin = totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0;

  const potentialIncome = periodSales
    .filter((s) => s.payment_status !== "ödendi")
    .reduce((sum, x) => sum + Math.max(0, Number(x.total_amount) - Number(x.paid_amount || 0)), 0);

  const stockValue = useMemo(
    () => products.reduce((s, p) => s + Number(p.quantity || 0) * Number(p.unit_price || 0), 0),
    [products],
  );

  const activeCampaigns = campaigns.filter((c) => c.status === "aktif");
  const activeAdsSpend = activeCampaigns.reduce((s, c) => s + Number(c.spend || 0), 0);
  const activeRoas = useMemo(() => {
    const rates = activeCampaigns
      .map((c) => {
        const rev = sales.filter((s) => s.campaign_id === c.id).reduce((sum, s) => sum + Number(s.total_amount), 0);
        return Number(c.spend) > 0 ? rev / Number(c.spend) : 0;
      })
      .filter((r) => r > 0);
    return rates.length ? rates.reduce((a, b) => a + b, 0) / rates.length : 0;
  }, [activeCampaigns, sales]);

  const trendData = useMemo(() => {
    const arr = [];
    for (let i = 5; i >= 0; i--) {
      const d = subMonths(now, i);
      const r = { start: startOfMonth(d), end: endOfMonth(d) };
      const within = (x: string) => { try { return isWithinInterval(parseISO(x), r); } catch { return false; } };
      const ms = sales.filter((s) => within(s.sale_date));
      const me = expenses.filter((e) => within(e.expense_date));
      const mc = campaigns.filter((c) => within(c.start_date));
      const inc = ms.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
      const cost = ms.reduce((s, x) => s + Number(x.total_cost || 0), 0);
      const exp = me.reduce((s, x) => s + Number(x.paid_amount || 0), 0) + mc.reduce((s, c) => s + Number(c.spend || 0), 0);
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

  const activeCampaignList = activeCampaigns
    .map((c) => {
      const rev = sales.filter((s) => s.campaign_id === c.id).reduce((sum, s) => sum + Number(s.total_amount), 0);
      return { ...c, roas: Number(c.spend) > 0 ? rev / Number(c.spend) : 0 };
    })
    .sort((a, b) => b.roas - a.roas)
    .slice(0, 5);

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

  const supplierDebt = purchases.reduce((s, p) => s + Math.max(0, Number(p.amount) - Number(p.paid_amount || 0)), 0);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Ana Sayfa</h1>
          <p className="text-muted-foreground text-sm">BütçeCRM — Tüm modüllerin gerçek zamanlı özeti</p>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Toplam Gelir" value={formatCurrency(totalIncome)} icon={<TrendingUp className="h-5 w-5 text-emerald-600" />} bg="bg-emerald-100" valueClass="text-emerald-600" sub={totalReturnAmount > 0 ? `↳ İade: −${formatCurrency(totalReturnAmount)}` : undefined} />
        <MetricCard title="Toplam Gider" value={formatCurrency(totalExpense)} icon={<TrendingDown className="h-5 w-5 text-red-600" />} bg="bg-red-100" valueClass="text-red-600" sub={`Reklam: ${formatCurrency(adsSpend)}`} />
        <MetricCard title="Net Kâr" value={formatCurrency(netProfit)} icon={<DollarSign className={`h-5 w-5 ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`} />} bg={netProfit >= 0 ? "bg-emerald-100" : "bg-red-100"} valueClass={netProfit >= 0 ? "text-emerald-600" : "text-red-600"} sub={`Maliyet: ${formatCurrency(totalCost)}`} />
        <MetricCard title="Kâr Marjı" value={`%${margin.toFixed(1)}`} icon={<Percent className="h-5 w-5 text-blue-600" />} bg="bg-blue-100" valueClass={margin >= 0 ? "text-emerald-600" : "text-red-600"} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard title="Tahmini Gelir" value={formatCurrency(potentialIncome)} icon={<Clock className="h-5 w-5 text-amber-600" />} bg="bg-amber-100" valueClass="text-amber-600" />
        <MetricCard title="Toplam Stok Değeri" value={formatCurrency(stockValue)} icon={<Package className="h-5 w-5 text-indigo-600" />} bg="bg-indigo-100" valueClass="text-foreground" />
        <MetricCard title="Aktif Reklam Harcaması" value={formatCurrency(activeAdsSpend)} icon={<Megaphone className="h-5 w-5 text-fuchsia-600" />} bg="bg-fuchsia-100" valueClass="text-foreground" sub={`${activeCampaigns.length} aktif kampanya`} />
        <MetricCard title="Ortalama ROAS" value={`${activeRoas.toFixed(2)}x`} icon={<Target className="h-5 w-5 text-cyan-600" />} bg="bg-cyan-100" valueClass="text-foreground" />
      </div>

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
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
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
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-4 w-4 text-fuchsia-600" /> Reklam Performansı</CardTitle></CardHeader>
          <CardContent>
            {activeCampaignList.length === 0 ? <p className="text-sm text-muted-foreground">Aktif kampanya yok</p> : (
              <div className="space-y-2">
                {activeCampaignList.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(Number(c.spend))}</p>
                    </div>
                    <p className={`text-sm font-semibold ${c.roas >= 1 ? "text-emerald-600" : "text-red-600"}`}>{c.roas.toFixed(2)}x</p>
                  </div>
                ))}
              </div>
            )}
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

function MetricCard({ title, value, icon, bg, valueClass, sub }: { title: string; value: string; icon: React.ReactNode; bg: string; valueClass?: string; sub?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className={`text-2xl font-bold truncate ${valueClass || ""}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-1">{sub}</p>}
          </div>
          <div className={`h-12 w-12 rounded-full ${bg} flex items-center justify-center shrink-0`}>{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
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
