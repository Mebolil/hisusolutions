import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/butcecrm-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, BarChart,
} from "recharts";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  subMonths, format, parseISO, isWithinInterval, eachDayOfInterval, eachMonthOfInterval,
  differenceInDays,
} from "date-fns";
import { tr } from "date-fns/locale";
import { BarChart3, FileSpreadsheet, FileText, Calendar } from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

type Sale = { id: string; sale_date: string; product_name: string; quantity: number; total_amount: number; total_cost: number | null; paid_amount: number | null; payment_status: string; campaign_id: string | null };
type Expense = { id: string; expense_date: string; category: string; amount: number; paid_amount: number | null };
type Purchase = { id: string; purchase_date: string; amount: number; paid_amount: number | null };
type Product = { id: string; name: string; quantity: number; low_stock_threshold: number; unit_price: number | null; category: string | null };
type Campaign = { id: string; name: string; platform: string | null; status: string; spend: number; start_date: string };

type PeriodKey = "week" | "month" | "3m" | "6m" | "year" | "custom";

const PERIOD_LABELS: Record<PeriodKey, string> = {
  week: "Bu Hafta", month: "Bu Ay", "3m": "Son 3 Ay", "6m": "Son 6 Ay", year: "Bu Yıl", custom: "Özel",
};

const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899", "#84cc16"];

export const Route = createFileRoute("/app/butcecrm/raporlar")({
  head: () => ({ meta: [{ title: "BütçeCRM — Raporlar" }] }),
  component: ReportsPage,
});

function ReportsPage() {
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);

  useEffect(() => {
    (async () => {
      const [s, e, pu, p, c] = await Promise.all([
        supabase.from("sales").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("purchases").select("*"),
        supabase.from("products").select("*"),
        supabase.from("campaigns").select("*"),
      ]);
      setSales((s.data as Sale[]) || []);
      setExpenses((e.data as Expense[]) || []);
      setPurchases((pu.data as Purchase[]) || []);
      setProducts((p.data as Product[]) || []);
      setCampaigns((c.data as Campaign[]) || []);
      setLoading(false);
    })();
  }, []);

  const range = useMemo(() => {
    const now = new Date();
    switch (period) {
      case "week": return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
      case "month": return { start: startOfMonth(now), end: endOfMonth(now) };
      case "3m": return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      case "6m": return { start: startOfMonth(subMonths(now, 5)), end: endOfMonth(now) };
      case "year": return { start: startOfYear(now), end: endOfYear(now) };
      case "custom":
        return {
          start: customFrom ? parseISO(customFrom) : startOfMonth(now),
          end: customTo ? parseISO(customTo) : endOfMonth(now),
        };
    }
  }, [period, customFrom, customTo]);

  const inRange = (d: string) => {
    try { return isWithinInterval(parseISO(d), range); } catch { return false; }
  };

  const periodSales = useMemo(() => sales.filter((s) => inRange(s.sale_date)), [sales, range]);
  const periodExpenses = useMemo(() => expenses.filter((e) => inRange(e.expense_date)), [expenses, range]);
  const periodPurchases = useMemo(() => purchases.filter((p) => inRange(p.purchase_date)), [purchases, range]);
  const periodCampaigns = useMemo(() => campaigns.filter((c) => inRange(c.start_date)), [campaigns, range]);

  const totals = useMemo(() => {
    const income = periodSales.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
    const cost = periodSales.reduce((s, x) => s + Number(x.total_cost || 0), 0);
    const adsSpend = periodCampaigns.reduce((s, c) => s + Number(c.spend || 0), 0);
    const expPaid = periodExpenses.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
    const purchPaid = periodPurchases.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
    const totalExp = expPaid + adsSpend + purchPaid;
    const profit = income - totalExp - cost;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    return { income, cost, adsSpend, expPaid, purchPaid, totalExp, profit, margin };
  }, [periodSales, periodExpenses, periodCampaigns, periodPurchases]);

  // Trend buckets — günlük (≤62 gün) veya aylık
  const trend = useMemo(() => {
    const days = differenceInDays(range.end, range.start);
    const useDays = days <= 62;
    const buckets = useDays
      ? eachDayOfInterval(range).map((d) => ({ d, key: format(d, "yyyy-MM-dd"), label: format(d, "dd MMM", { locale: tr }) }))
      : eachMonthOfInterval(range).map((d) => ({ d, key: format(d, "yyyy-MM"), label: format(d, "MMM yy", { locale: tr }) }));
    return buckets.map((b) => {
      const matchKey = (date: string) => useDays ? date.slice(0, 10) === b.key : date.slice(0, 7) === b.key;
      const sIn = periodSales.filter((s) => matchKey(s.sale_date));
      const eIn = periodExpenses.filter((e) => matchKey(e.expense_date));
      const cIn = periodCampaigns.filter((c) => matchKey(c.start_date));
      const inc = sIn.reduce((sum, x) => sum + Number(x.paid_amount || 0), 0);
      const cost = sIn.reduce((sum, x) => sum + Number(x.total_cost || 0), 0);
      const exp = eIn.reduce((sum, x) => sum + Number(x.paid_amount || 0), 0)
        + cIn.reduce((sum, c) => sum + Number(c.spend || 0), 0);
      return { name: b.label, Gelir: inc, Gider: exp, "Net Kâr": inc - exp - cost };
    });
  }, [periodSales, periodExpenses, periodCampaigns, range]);

  const topProducts = useMemo(() => {
    const m: Record<string, { qty: number; revenue: number }> = {};
    periodSales.forEach((s) => {
      if (!m[s.product_name]) m[s.product_name] = { qty: 0, revenue: 0 };
      m[s.product_name].qty += Number(s.quantity || 0);
      m[s.product_name].revenue += Number(s.total_amount || 0);
    });
    return Object.entries(m)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 8);
  }, [periodSales]);

  const expensesByCategory = useMemo(() => {
    const m: Record<string, number> = {};
    periodExpenses.forEach((e) => { m[e.category || "Diğer"] = (m[e.category || "Diğer"] || 0) + Number(e.amount || 0); });
    return Object.entries(m).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [periodExpenses]);

  const campaignsPerf = useMemo(() => {
    return periodCampaigns.map((c) => {
      const rev = sales.filter((s) => s.campaign_id === c.id).reduce((sum, s) => sum + Number(s.total_amount), 0);
      const spend = Number(c.spend || 0);
      return { name: c.name, platform: c.platform || "-", spend, revenue: rev, roas: spend > 0 ? rev / spend : 0 };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [periodCampaigns, sales]);

  const stockSummary = useMemo(() => {
    const total = products.length;
    const low = products.filter((p) => Number(p.quantity) > 0 && Number(p.quantity) <= Number(p.low_stock_threshold)).length;
    const out = products.filter((p) => Number(p.quantity) <= 0).length;
    const value = products.reduce((s, p) => s + Number(p.quantity || 0) * Number(p.unit_price || 0), 0);
    const byCategory: Record<string, number> = {};
    products.forEach((p) => {
      const cat = p.category || "Diğer";
      byCategory[cat] = (byCategory[cat] || 0) + Number(p.quantity || 0) * Number(p.unit_price || 0);
    });
    const cats = Object.entries(byCategory).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
    return { total, low, out, value, cats };
  }, [products]);

  function exportExcel() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { Metrik: "Dönem", Değer: PERIOD_LABELS[period] },
      { Metrik: "Tarih Aralığı", Değer: `${formatDate(format(range.start, "yyyy-MM-dd"))} - ${formatDate(format(range.end, "yyyy-MM-dd"))}` },
      { Metrik: "Toplam Gelir", Değer: totals.income },
      { Metrik: "Toplam Gider", Değer: totals.totalExp },
      { Metrik: "Maliyet (COGS)", Değer: totals.cost },
      { Metrik: "Net Kâr", Değer: totals.profit },
      { Metrik: "Kâr Marjı (%)", Değer: totals.margin.toFixed(2) },
    ]), "Özet");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(periodSales.map((s) => ({
      Tarih: s.sale_date, Ürün: s.product_name, Miktar: s.quantity,
      Tutar: s.total_amount, Tahsil: s.paid_amount, Maliyet: s.total_cost, Durum: s.payment_status,
    }))), "Satışlar");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(periodExpenses.map((e) => ({
      Tarih: e.expense_date, Kategori: e.category, Tutar: e.amount, Ödenen: e.paid_amount,
    }))), "Giderler");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(campaignsPerf.map((c) => ({
      Kampanya: c.name, Platform: c.platform, Harcama: c.spend, Gelir: c.revenue, ROAS: c.roas.toFixed(2),
    }))), "Reklam");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(products.map((p) => ({
      Ürün: p.name, Kategori: p.category || "-", Stok: p.quantity, Eşik: p.low_stock_threshold,
      "Birim Fiyat": p.unit_price, Değer: Number(p.quantity || 0) * Number(p.unit_price || 0),
    }))), "Stok");
    XLSX.writeFile(wb, `butcecrm-rapor-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Excel dosyası indirildi");
  }

  function exportPDF() {
    const w = window.open("", "_blank");
    if (!w) return toast.error("Tarayıcı yeni pencereyi engelledi");
    const html = `<!doctype html><html><head><meta charset="utf-8"><title>BütçeCRM Rapor</title>
      <style>
        body{font-family:system-ui,sans-serif;padding:24px;color:#111}
        h1{margin:0 0 4px;font-size:22px}h2{margin:24px 0 8px;font-size:16px;border-bottom:1px solid #ddd;padding-bottom:4px}
        table{width:100%;border-collapse:collapse;font-size:12px;margin-top:6px}
        th,td{border:1px solid #ddd;padding:6px 8px;text-align:left}
        th{background:#f5f5f5}
        .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
        .stat{border:1px solid #ddd;border-radius:6px;padding:10px}
        .stat .l{font-size:10px;color:#666;text-transform:uppercase}
        .stat .v{font-size:16px;font-weight:700;margin-top:2px}
        @media print{button{display:none}}
      </style></head><body>
      <button onclick="window.print()" style="float:right;padding:8px 16px">PDF olarak yazdır</button>
      <h1>BütçeCRM Raporu</h1>
      <p style="color:#666;margin:0">${PERIOD_LABELS[period]} — ${formatDate(format(range.start, "yyyy-MM-dd"))} → ${formatDate(format(range.end, "yyyy-MM-dd"))}</p>
      <h2>Özet</h2>
      <div class="grid">
        <div class="stat"><div class="l">Gelir</div><div class="v">${formatCurrency(totals.income)}</div></div>
        <div class="stat"><div class="l">Gider</div><div class="v">${formatCurrency(totals.totalExp)}</div></div>
        <div class="stat"><div class="l">Net Kâr</div><div class="v">${formatCurrency(totals.profit)}</div></div>
        <div class="stat"><div class="l">Marj</div><div class="v">%${totals.margin.toFixed(1)}</div></div>
      </div>
      <h2>En Çok Satan Ürünler</h2>
      <table><tr><th>Ürün</th><th>Adet</th><th>Gelir</th></tr>
      ${topProducts.map((p) => `<tr><td>${p.name}</td><td>${p.qty}</td><td>${formatCurrency(p.revenue)}</td></tr>`).join("")}
      </table>
      <h2>Gider Kategorileri</h2>
      <table><tr><th>Kategori</th><th>Tutar</th></tr>
      ${expensesByCategory.map((e) => `<tr><td>${e.name}</td><td>${formatCurrency(e.value)}</td></tr>`).join("")}
      </table>
      <h2>Reklam Performansı</h2>
      <table><tr><th>Kampanya</th><th>Platform</th><th>Harcama</th><th>Gelir</th><th>ROAS</th></tr>
      ${campaignsPerf.map((c) => `<tr><td>${c.name}</td><td>${c.platform}</td><td>${formatCurrency(c.spend)}</td><td>${formatCurrency(c.revenue)}</td><td>${c.roas.toFixed(2)}x</td></tr>`).join("")}
      </table>
      </body></html>`;
    w.document.write(html);
    w.document.close();
  }

  if (loading) return <div className="flex items-center justify-center h-64"><p className="text-muted-foreground">Yükleniyor...</p></div>;

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="h-6 w-6 text-primary" /> Raporlar</h1>
          <p className="text-muted-foreground text-sm">Dönemsel performans ve detaylı analizler</p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <div>
            <Label className="text-xs">Dönem</Label>
            <Select value={period} onValueChange={(v) => setPeriod(v as PeriodKey)}>
              <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                {(Object.keys(PERIOD_LABELS) as PeriodKey[]).map((k) => (
                  <SelectItem key={k} value={k}>{PERIOD_LABELS[k]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {period === "custom" && (
            <>
              <div>
                <Label className="text-xs">Başlangıç</Label>
                <Input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="w-[150px]" />
              </div>
              <div>
                <Label className="text-xs">Bitiş</Label>
                <Input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="w-[150px]" />
              </div>
            </>
          )}
          <Button variant="outline" onClick={exportExcel} className="gap-2"><FileSpreadsheet className="h-4 w-4" /> Excel</Button>
          <Button variant="outline" onClick={exportPDF} className="gap-2"><FileText className="h-4 w-4" /> PDF</Button>
        </div>
      </div>

      <div className="text-xs text-muted-foreground flex items-center gap-1.5">
        <Calendar className="h-3.5 w-3.5" />
        {formatDate(format(range.start, "yyyy-MM-dd"))} → {formatDate(format(range.end, "yyyy-MM-dd"))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="sales">Satışlar</TabsTrigger>
          <TabsTrigger value="expenses">Giderler</TabsTrigger>
          <TabsTrigger value="ads">Reklam</TabsTrigger>
          <TabsTrigger value="stock">Stok</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Gelir" value={formatCurrency(totals.income)} cls="text-emerald-600" />
            <Stat label="Gider" value={formatCurrency(totals.totalExp)} cls="text-red-600" />
            <Stat label="Net Kâr" value={formatCurrency(totals.profit)} cls={totals.profit >= 0 ? "text-emerald-600" : "text-red-600"} />
            <Stat label="Kâr Marjı" value={`%${totals.margin.toFixed(1)}`} cls={totals.margin >= 0 ? "text-emerald-600" : "text-red-600"} />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Gelir vs Gider Trendi</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `₺${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend />
                    <Bar dataKey="Gelir" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Gider" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Line dataKey="Net Kâr" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sales" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Satış Adedi" value={String(periodSales.length)} />
            <Stat label="Ciro" value={formatCurrency(periodSales.reduce((s, x) => s + Number(x.total_amount || 0), 0))} />
            <Stat label="Tahsil" value={formatCurrency(totals.income)} cls="text-emerald-600" />
            <Stat label="Maliyet" value={formatCurrency(totals.cost)} cls="text-red-600" />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">En Çok Satan Ürünler (Gelir)</CardTitle></CardHeader>
            <CardContent>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topProducts} layout="vertical" margin={{ left: 80 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `₺${(Number(v) / 1000).toFixed(0)}k`} className="text-xs" />
                    <YAxis dataKey="name" type="category" width={120} className="text-xs" />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Bar dataKey="revenue" fill="#10b981" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Ürün</TableHead><TableHead className="text-right">Adet</TableHead><TableHead className="text-right">Gelir</TableHead></TableRow></TableHeader>
                <TableBody>
                  {topProducts.map((p) => (
                    <TableRow key={p.name}><TableCell>{p.name}</TableCell><TableCell className="text-right">{p.qty}</TableCell><TableCell className="text-right font-medium">{formatCurrency(p.revenue)}</TableCell></TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4 mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Gider Kategorileri</CardTitle></CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={expensesByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: { name: string }) => e.name}>
                        {expensesByCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Kategori</TableHead><TableHead className="text-right">Tutar</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {expensesByCategory.map((e) => (
                      <TableRow key={e.name}><TableCell>{e.name}</TableCell><TableCell className="text-right font-medium">{formatCurrency(e.value)}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="ads" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Kampanya" value={String(periodCampaigns.length)} />
            <Stat label="Harcama" value={formatCurrency(totals.adsSpend)} cls="text-red-600" />
            <Stat label="Reklamdan Gelir" value={formatCurrency(campaignsPerf.reduce((s, c) => s + c.revenue, 0))} cls="text-emerald-600" />
            <Stat label="Ortalama ROAS" value={`${(campaignsPerf.reduce((s, c) => s + c.roas, 0) / Math.max(1, campaignsPerf.length)).toFixed(2)}x`} />
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Kampanya</TableHead><TableHead>Platform</TableHead><TableHead className="text-right">Harcama</TableHead><TableHead className="text-right">Gelir</TableHead><TableHead className="text-right">ROAS</TableHead></TableRow></TableHeader>
                <TableBody>
                  {campaignsPerf.map((c) => (
                    <TableRow key={c.name}>
                      <TableCell className="font-medium">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.platform}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.spend)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.revenue)}</TableCell>
                      <TableCell className={`text-right font-semibold ${c.roas >= 1 ? "text-emerald-600" : "text-red-600"}`}>{c.roas.toFixed(2)}x</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stock" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Toplam Ürün" value={String(stockSummary.total)} />
            <Stat label="Düşük Stok" value={String(stockSummary.low)} cls="text-amber-600" />
            <Stat label="Tükenen" value={String(stockSummary.out)} cls="text-red-600" />
            <Stat label="Stok Değeri" value={formatCurrency(stockSummary.value)} />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Kategoriye Göre Stok Değeri</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stockSummary.cats}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `₺${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold truncate ${cls || ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}
