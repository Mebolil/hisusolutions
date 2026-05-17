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
  PieChart, Pie, Cell, BarChart, AreaChart, Area, ReferenceLine, ReferenceDot,
} from "recharts";
import {
  startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfYear, endOfYear,
  subMonths, format, parseISO, isWithinInterval, eachDayOfInterval, eachMonthOfInterval,
  differenceInDays, differenceInCalendarDays, addDays,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  BarChart3, FileSpreadsheet, FileText, Calendar, TrendingUp, TrendingDown,
  Wallet, AlertTriangle, ArrowDownCircle, ArrowUpCircle, Clock,
  Info, CheckCircle2, XCircle,
} from "lucide-react";
import * as XLSX from "xlsx";
import { toast } from "sonner";

type Sale = {
  id: string; sale_date: string; due_date: string | null; customer_id: string | null; product_name: string;
  quantity: number; total_amount: number; total_cost: number | null;
  paid_amount: number | null; payment_status: string;
  campaign_id: string | null; platform: string | null;
};
type Expense = { id: string; expense_date: string; category: string; amount: number; paid_amount: number | null };
type Purchase = { id: string; purchase_date: string; amount: number; paid_amount: number | null };
type Product = { id: string; name: string; quantity: number; low_stock_threshold: number; unit_price: number | null; category: string | null };
type Campaign = { id: string; name: string; platform: string | null; status: string; spend: number; start_date: string };
type Customer = { id: string; name: string };

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
  const [customers, setCustomers] = useState<Customer[]>([]);

  useEffect(() => {
    (async () => {
      const [s, e, pu, p, c, cu] = await Promise.all([
        supabase.from("sales").select("*"),
        supabase.from("expenses").select("*"),
        supabase.from("purchases").select("*"),
        supabase.from("products").select("*"),
        supabase.from("campaigns").select("*"),
        supabase.from("customers").select("id,name"),
      ]);
      setSales((s.data as Sale[]) || []);
      setExpenses((e.data as Expense[]) || []);
      setPurchases((pu.data as Purchase[]) || []);
      setProducts((p.data as Product[]) || []);
      setCampaigns((c.data as Campaign[]) || []);
      setCustomers((cu.data as Customer[]) || []);
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

  // Önceki eşit uzunluktaki dönem
  const prevRange = useMemo(() => {
    const days = differenceInCalendarDays(range.end, range.start) + 1;
    const end = addDays(range.start, -1);
    const start = addDays(end, -(days - 1));
    return { start, end };
  }, [range]);

  const inRange = (d: string, r = range) => {
    try { return isWithinInterval(parseISO(d), r); } catch { return false; }
  };

  const periodSales = useMemo(() => sales.filter((s) => inRange(s.sale_date)), [sales, range]);
  const periodExpenses = useMemo(() => expenses.filter((e) => inRange(e.expense_date)), [expenses, range]);
  const periodPurchases = useMemo(() => purchases.filter((p) => inRange(p.purchase_date)), [purchases, range]);
  const periodCampaigns = useMemo(() => campaigns.filter((c) => inRange(c.start_date)), [campaigns, range]);

  const prevSales = useMemo(() => sales.filter((s) => inRange(s.sale_date, prevRange)), [sales, prevRange]);
  const prevExpenses = useMemo(() => expenses.filter((e) => inRange(e.expense_date, prevRange)), [expenses, prevRange]);
  const prevPurchases = useMemo(() => purchases.filter((p) => inRange(p.purchase_date, prevRange)), [purchases, prevRange]);
  const prevCampaigns = useMemo(() => campaigns.filter((c) => inRange(c.start_date, prevRange)), [campaigns, prevRange]);

  function calcTotals(
    s: Sale[], e: Expense[], c: Campaign[], pu: Purchase[],
  ) {
    const income = s.reduce((sum, x) => sum + Number(x.paid_amount || 0), 0);
    const revenue = s.reduce((sum, x) => sum + Number(x.total_amount || 0), 0);
    const cost = s.reduce((sum, x) => sum + Number(x.total_cost || 0), 0);
    const adsSpend = c.reduce((sum, x) => sum + Number(x.spend || 0), 0);
    const expPaid = e.reduce((sum, x) => sum + Number(x.paid_amount || 0), 0);
    const purchPaid = pu.reduce((sum, x) => sum + Number(x.paid_amount || 0), 0);
    const totalExp = expPaid + adsSpend + purchPaid;
    const profit = income - totalExp - cost;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    return { income, revenue, cost, adsSpend, expPaid, purchPaid, totalExp, profit, margin };
  }

  const totals = useMemo(
    () => calcTotals(periodSales, periodExpenses, periodCampaigns, periodPurchases),
    [periodSales, periodExpenses, periodCampaigns, periodPurchases],
  );
  const prevTotals = useMemo(
    () => calcTotals(prevSales, prevExpenses, prevCampaigns, prevPurchases),
    [prevSales, prevExpenses, prevCampaigns, prevPurchases],
  );

  // Tahsilat / Borç durumu (tüm açık bakiyeler)
  const outstanding = useMemo(() => {
    const ar = sales.reduce(
      (s, x) => s + Math.max(0, Number(x.total_amount || 0) - Number(x.paid_amount || 0)), 0,
    );
    const apPurch = purchases.reduce(
      (s, x) => s + Math.max(0, Number(x.amount || 0) - Number(x.paid_amount || 0)), 0,
    );
    const apExp = expenses.reduce(
      (s, x) => s + Math.max(0, Number(x.amount || 0) - Number(x.paid_amount || 0)), 0,
    );
    return { receivable: ar, payable: apPurch + apExp, payableSplit: { purchases: apPurch, expenses: apExp } };
  }, [sales, purchases, expenses]);

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

  // Kümülatif (cumulative) gelir trend — büyüme ivmesi
  const cumulative = useMemo(() => {
    let g = 0, k = 0;
    return trend.map((t) => { g += Number(t.Gelir || 0); k += Number(t["Net Kâr"] || 0); return { name: t.name, "Kümülatif Gelir": g, "Kümülatif Net Kâr": k }; });
  }, [trend]);

  const topProducts = useMemo(() => {
    const m: Record<string, { qty: number; revenue: number; cost: number }> = {};
    periodSales.forEach((s) => {
      if (!m[s.product_name]) m[s.product_name] = { qty: 0, revenue: 0, cost: 0 };
      m[s.product_name].qty += Number(s.quantity || 0);
      m[s.product_name].revenue += Number(s.total_amount || 0);
      m[s.product_name].cost += Number(s.total_cost || 0);
    });
    return Object.entries(m)
      .map(([name, v]) => ({ name, ...v, profit: v.revenue - v.cost, margin: v.revenue > 0 ? ((v.revenue - v.cost) / v.revenue) * 100 : 0 }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
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

  // Platform bazlı satış kırılımı
  const platformBreakdown = useMemo(() => {
    const m: Record<string, { revenue: number; orders: number; profit: number }> = {};
    periodSales.forEach((s) => {
      const k = s.platform || "Belirtilmemiş";
      if (!m[k]) m[k] = { revenue: 0, orders: 0, profit: 0 };
      m[k].revenue += Number(s.total_amount || 0);
      m[k].orders += 1;
      m[k].profit += Number(s.total_amount || 0) - Number(s.total_cost || 0);
    });
    return Object.entries(m).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.revenue - a.revenue);
  }, [periodSales]);

  // Müşteri analizi
  const customerMap = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  );
  const customerInsights = useMemo(() => {
    const m: Record<string, { orders: number; revenue: number; lastDate: string }> = {};
    periodSales.forEach((s) => {
      const k = s.customer_id || "__guest__";
      if (!m[k]) m[k] = { orders: 0, revenue: 0, lastDate: s.sale_date };
      m[k].orders += 1;
      m[k].revenue += Number(s.total_amount || 0);
      if (s.sale_date > m[k].lastDate) m[k].lastDate = s.sale_date;
    });
    const arr = Object.entries(m).map(([id, v]) => ({
      id,
      name: id === "__guest__" ? "Misafir / Tanımsız" : (customerMap[id] || "Bilinmeyen"),
      ...v,
      aov: v.orders > 0 ? v.revenue / v.orders : 0,
    }));
    const named = arr.filter((x) => x.id !== "__guest__");
    const repeatBuyers = named.filter((x) => x.orders >= 2).length;
    const totalCustomers = named.length;
    const repeatRate = totalCustomers > 0 ? (repeatBuyers / totalCustomers) * 100 : 0;
    const aov = periodSales.length > 0
      ? periodSales.reduce((s, x) => s + Number(x.total_amount || 0), 0) / periodSales.length
      : 0;
    const top = arr.sort((a, b) => b.revenue - a.revenue).slice(0, 10);
    return { top, repeatBuyers, totalCustomers, repeatRate, aov };
  }, [periodSales, customerMap]);

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

  // Yavaş hareket eden / ölü stok (dönemde hiç satılmamış, stoğu olan)
  const slowMovers = useMemo(() => {
    const sold = new Set(periodSales.map((s) => s.product_name));
    return products
      .filter((p) => !sold.has(p.name) && Number(p.quantity || 0) > 0)
      .map((p) => ({
        name: p.name,
        category: p.category || "-",
        quantity: Number(p.quantity || 0),
        value: Number(p.quantity || 0) * Number(p.unit_price || 0),
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 15);
  }, [products, periodSales]);

  // --- NAKİT AKIŞI ---
  const cashFlowData = useMemo(() => {
    const months = eachMonthOfInterval({ start: range.start, end: range.end });
    let cumulative = 0;
    return months.map((d) => {
      const key = format(d, "yyyy-MM");
      const inflow = sales
        .filter((s) => s.sale_date.startsWith(key))
        .reduce((sum, s) => sum + Number(s.paid_amount || 0), 0);
      const outflow =
        expenses.filter((e) => e.expense_date.startsWith(key)).reduce((sum, e) => sum + Number(e.paid_amount || 0), 0) +
        purchases.filter((p) => p.purchase_date.startsWith(key)).reduce((sum, p) => sum + Number(p.paid_amount || 0), 0) +
        campaigns.filter((c) => c.start_date.startsWith(key)).reduce((sum, c) => sum + Number(c.spend || 0), 0);
      const net = inflow - outflow;
      cumulative += net;
      return { name: format(d, "MMM yy", { locale: tr }), "Nakit Giriş": inflow, "Nakit Çıkış": outflow, "Net Nakit": net, Kümülatif: cumulative };
    });
  }, [sales, expenses, purchases, campaigns, range]);

  const cashFlowTotals = useMemo(() => {
    const inflow = cashFlowData.reduce((s, d) => s + d["Nakit Giriş"], 0);
    const outflow = cashFlowData.reduce((s, d) => s + d["Nakit Çıkış"], 0);
    return { inflow, outflow, net: inflow - outflow };
  }, [cashFlowData]);

  // --- ALACAK YAŞLANDıRMA ---
  const agingRows = useMemo(() => {
    const today = new Date();
    return sales
      .filter((s) => Number(s.total_amount) > Number(s.paid_amount || 0) && s.payment_status !== "ödendi")
      .map((s) => {
        const remaining = Number(s.total_amount) - Number(s.paid_amount || 0);
        const dueDate = s.due_date ? parseISO(s.due_date) : parseISO(s.sale_date);
        const days = differenceInCalendarDays(today, dueDate);
        const bucket = days <= 0 ? "vadesi_gelmedi" : days <= 30 ? "0-30" : days <= 60 ? "31-60" : days <= 90 ? "61-90" : "90+";
        return { ...s, remaining, days, bucket, customerName: customerMap[s.customer_id || ""] || "—" };
      })
      .filter((s) => s.days > 0)
      .sort((a, b) => b.days - a.days);
  }, [sales, customerMap]);

  const agingSummary = useMemo(() => {
    const buckets = ["0-30", "31-60", "61-90", "90+"] as const;
    return buckets.map((b) => {
      const rows = agingRows.filter((r) => r.bucket === b);
      return { bucket: b, count: rows.length, total: rows.reduce((s, r) => s + r.remaining, 0) };
    });
  }, [agingRows]);

  // --- BAŞA BAŞ ---
  const [bbFixedCost, setBbFixedCost] = useState("");
  const [bbAvgRevenue, setBbAvgRevenue] = useState("");
  const [bbAvgVarCost, setBbAvgVarCost] = useState("");

  const breakevenAuto = useMemo(() => {
    const fixedCosts = totals.expPaid;
    const avgRev = periodSales.length > 0 ? totals.revenue / periodSales.length : 0;
    const avgVar = periodSales.length > 0 ? totals.cost / periodSales.length : 0;
    return { fixedCosts, avgRev, avgVar };
  }, [totals, periodSales]);

  useEffect(() => {
    setBbFixedCost(breakevenAuto.fixedCosts.toFixed(2));
    setBbAvgRevenue(breakevenAuto.avgRev.toFixed(2));
    setBbAvgVarCost(breakevenAuto.avgVar.toFixed(2));
  }, [breakevenAuto]);

  const breakeven = useMemo(() => {
    const fixed = Number(bbFixedCost) || 0;
    const avgRev = Number(bbAvgRevenue) || 0;
    const avgVar = Number(bbAvgVarCost) || 0;
    const contribution = avgRev - avgVar;
    const units = contribution > 0 ? Math.ceil(fixed / contribution) : 0;
    const revenue = units * avgRev;
    const current = periodSales.length;
    const safetyMargin = current > 0 && units > 0 ? ((current - units) / current) * 100 : 0;
    const breakevenData = Array.from({ length: Math.max(units * 2, current + 5, 10) }, (_, i) => {
      const u = i + 1;
      return { units: u, "Toplam Gelir": u * avgRev, "Toplam Maliyet": fixed + u * avgVar };
    }).filter((_, i) => i % Math.max(1, Math.floor(Math.max(units * 2, current + 5, 10) / 20)) === 0 || _ === null);
    return { fixed, avgRev, avgVar, contribution, units, revenue, current, safetyMargin, breakevenData };
  }, [bbFixedCost, bbAvgRevenue, bbAvgVarCost, periodSales]);

  function exportExcel() {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet([
      { Metrik: "Dönem", Değer: PERIOD_LABELS[period] },
      { Metrik: "Tarih Aralığı", Değer: `${formatDate(format(range.start, "yyyy-MM-dd"))} - ${formatDate(format(range.end, "yyyy-MM-dd"))}` },
      { Metrik: "Ciro", Değer: totals.revenue },
      { Metrik: "Tahsil Edilen Gelir", Değer: totals.income },
      { Metrik: "Toplam Gider", Değer: totals.totalExp },
      { Metrik: "Maliyet (COGS)", Değer: totals.cost },
      { Metrik: "Net Kâr", Değer: totals.profit },
      { Metrik: "Kâr Marjı (%)", Değer: totals.margin.toFixed(2) },
      { Metrik: "Önceki Dönem Geliri", Değer: prevTotals.income },
      { Metrik: "Önceki Dönem Net Kâr", Değer: prevTotals.profit },
      { Metrik: "Açık Alacak (Müşteri)", Değer: outstanding.receivable },
      { Metrik: "Açık Borç (Toplam)", Değer: outstanding.payable },
    ]), "Özet");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(periodSales.map((s) => ({
      Tarih: s.sale_date, Müşteri: customerMap[s.customer_id || ""] || "-",
      Platform: s.platform || "-", Ürün: s.product_name, Miktar: s.quantity,
      Tutar: s.total_amount, Tahsil: s.paid_amount, Maliyet: s.total_cost, Durum: s.payment_status,
    }))), "Satışlar");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(topProducts.map((p) => ({
      Ürün: p.name, Adet: p.qty, Gelir: p.revenue, Maliyet: p.cost, Kâr: p.profit, "Marj %": p.margin.toFixed(1),
    }))), "Top Ürünler");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(platformBreakdown.map((p) => ({
      Platform: p.name, Sipariş: p.orders, Ciro: p.revenue, Kâr: p.profit,
    }))), "Platformlar");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(customerInsights.top.map((c) => ({
      Müşteri: c.name, Sipariş: c.orders, Ciro: c.revenue, "Sepet Ort.": c.aov.toFixed(2), "Son Sipariş": c.lastDate,
    }))), "Top Müşteriler");
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
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(slowMovers.map((p) => ({
      Ürün: p.name, Kategori: p.category, Stok: p.quantity, "Stok Değeri": p.value,
    }))), "Yavaş Stok");
    XLSX.writeFile(wb, `butcecrm-rapor-${format(new Date(), "yyyy-MM-dd")}.xlsx`);
    toast.success("Excel dosyası indirildi");
  }

  function deltaPct(curr: number, prev: number) {
    if (prev === 0) return curr === 0 ? 0 : 100;
    return ((curr - prev) / Math.abs(prev)) * 100;
  }

  function exportPDF() {
    const w = window.open("", "_blank");
    if (!w) return toast.error("Tarayıcı yeni pencereyi engelledi");
    const dGelir = deltaPct(totals.income, prevTotals.income);
    const dKar = deltaPct(totals.profit, prevTotals.profit);
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
        .stat .d{font-size:11px;margin-top:2px}
        .up{color:#059669}.down{color:#dc2626}
        @media print{button{display:none}}
      </style></head><body>
      <button onclick="window.print()" style="float:right;padding:8px 16px">PDF olarak yazdır</button>
      <h1>BütçeCRM Raporu</h1>
      <p style="color:#666;margin:0">${PERIOD_LABELS[period]} — ${formatDate(format(range.start, "yyyy-MM-dd"))} → ${formatDate(format(range.end, "yyyy-MM-dd"))}</p>
      <p style="color:#666;margin:0;font-size:11px">Karşılaştırma: ${formatDate(format(prevRange.start, "yyyy-MM-dd"))} → ${formatDate(format(prevRange.end, "yyyy-MM-dd"))}</p>
      <h2>Özet</h2>
      <div class="grid">
        <div class="stat"><div class="l">Gelir (Tahsil)</div><div class="v">${formatCurrency(totals.income)}</div><div class="d ${dGelir >= 0 ? "up" : "down"}">${dGelir >= 0 ? "▲" : "▼"} %${Math.abs(dGelir).toFixed(1)} önceki döneme göre</div></div>
        <div class="stat"><div class="l">Gider</div><div class="v">${formatCurrency(totals.totalExp)}</div></div>
        <div class="stat"><div class="l">Net Kâr</div><div class="v">${formatCurrency(totals.profit)}</div><div class="d ${dKar >= 0 ? "up" : "down"}">${dKar >= 0 ? "▲" : "▼"} %${Math.abs(dKar).toFixed(1)}</div></div>
        <div class="stat"><div class="l">Marj</div><div class="v">%${totals.margin.toFixed(1)}</div></div>
      </div>
      <h2>Tahsilat & Borç Durumu</h2>
      <div class="grid" style="grid-template-columns:repeat(2,1fr)">
        <div class="stat"><div class="l">Açık Alacak (Müşteri)</div><div class="v" style="color:#059669">${formatCurrency(outstanding.receivable)}</div></div>
        <div class="stat"><div class="l">Açık Borç (Tedarikçi + Gider)</div><div class="v" style="color:#dc2626">${formatCurrency(outstanding.payable)}</div></div>
      </div>
      <h2>En Çok Satan Ürünler</h2>
      <table><tr><th>Ürün</th><th>Adet</th><th>Gelir</th><th>Kâr</th><th>Marj</th></tr>
      ${topProducts.map((p) => `<tr><td>${p.name}</td><td>${p.qty}</td><td>${formatCurrency(p.revenue)}</td><td>${formatCurrency(p.profit)}</td><td>%${p.margin.toFixed(1)}</td></tr>`).join("")}
      </table>
      <h2>Platform Performansı</h2>
      <table><tr><th>Platform</th><th>Sipariş</th><th>Ciro</th><th>Kâr</th></tr>
      ${platformBreakdown.map((p) => `<tr><td>${p.name}</td><td>${p.orders}</td><td>${formatCurrency(p.revenue)}</td><td>${formatCurrency(p.profit)}</td></tr>`).join("")}
      </table>
      <h2>Top Müşteriler</h2>
      <table><tr><th>Müşteri</th><th>Sipariş</th><th>Ciro</th><th>Sepet Ort.</th></tr>
      ${customerInsights.top.map((c) => `<tr><td>${c.name}</td><td>${c.orders}</td><td>${formatCurrency(c.revenue)}</td><td>${formatCurrency(c.aov)}</td></tr>`).join("")}
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
          <p className="text-muted-foreground text-sm">Dönemsel performans, karşılaştırmalar ve detaylı analizler</p>
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

      <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap">
        <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" />
          {formatDate(format(range.start, "yyyy-MM-dd"))} → {formatDate(format(range.end, "yyyy-MM-dd"))}
        </span>
        <span className="text-muted-foreground/70">
          Karşılaştırma: {formatDate(format(prevRange.start, "yyyy-MM-dd"))} → {formatDate(format(prevRange.end, "yyyy-MM-dd"))}
        </span>
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="overview">Genel Bakış</TabsTrigger>
          <TabsTrigger value="sales">Satışlar</TabsTrigger>
          <TabsTrigger value="customers">Müşteriler</TabsTrigger>
          <TabsTrigger value="expenses">Giderler</TabsTrigger>
          <TabsTrigger value="ads">Reklam</TabsTrigger>
          <TabsTrigger value="stock">Stok</TabsTrigger>
          <TabsTrigger value="cashflow">Nakit Akışı</TabsTrigger>
          <TabsTrigger value="aging">Alacak Yaşlandırma</TabsTrigger>
          <TabsTrigger value="breakeven">Başa Baş</TabsTrigger>
        </TabsList>

        {/* GENEL BAKIŞ */}
        <TabsContent value="overview" className="space-y-4 mt-4">
          {totals.profit < 0 && (
            <InsightBanner type="danger" message={`Bu dönem net zarar var (${formatCurrency(totals.profit)}). Gider ve maliyet kalemlerini gözden geçirin.`} />
          )}
          {totals.profit >= 0 && totals.margin < 10 && totals.income > 0 && (
            <InsightBanner type="warning" message={`Kâr marjı düşük (%${totals.margin.toFixed(1)}). Maliyet azaltma veya fiyat artışı değerlendirilebilir.`} />
          )}
          {totals.income > 0 && outstanding.receivable > totals.income * 0.5 && (
            <InsightBanner type="warning" message={`Açık alacak (${formatCurrency(outstanding.receivable)}), tahsil edilen gelirin %${((outstanding.receivable / totals.income) * 100).toFixed(0)}'i. Tahsilat takibi önerilir.`} />
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Gelir (Tahsil)" value={formatCurrency(totals.income)} delta={deltaPct(totals.income, prevTotals.income)} positive />
            <KPI label="Gider" value={formatCurrency(totals.totalExp)} delta={deltaPct(totals.totalExp, prevTotals.totalExp)} positive={false} />
            <KPI label="Net Kâr" value={formatCurrency(totals.profit)} delta={deltaPct(totals.profit, prevTotals.profit)} positive />
            <KPI label="Kâr Marjı" value={`%${totals.margin.toFixed(1)}`} delta={totals.margin - prevTotals.margin} unit="pp" positive />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Wallet className="h-3.5 w-3.5" /> Açık Alacak</p>
                    <p className="text-xl font-bold text-emerald-600">{formatCurrency(outstanding.receivable)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Müşterilerden tahsil edilecek</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Açık Borç</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(outstanding.payable)}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Tedarikçi: {formatCurrency(outstanding.payableSplit.purchases)} · Gider: {formatCurrency(outstanding.payableSplit.expenses)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Net Nakit Pozisyonu (Alacak − Borç)</p>
                <p className={`text-xl font-bold ${outstanding.receivable - outstanding.payable >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                  {formatCurrency(outstanding.receivable - outstanding.payable)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">Açık bakiyelerin net etkisi</p>
              </CardContent>
            </Card>
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

          <Card>
            <CardHeader><CardTitle className="text-base">Kümülatif Büyüme</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cumulative}>
                    <defs>
                      <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `₺${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend />
                    <Area type="monotone" dataKey="Kümülatif Gelir" stroke="#10b981" fill="url(#g1)" strokeWidth={2} />
                    <Area type="monotone" dataKey="Kümülatif Net Kâr" stroke="#3b82f6" fill="url(#g2)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SATIŞLAR */}
        <TabsContent value="sales" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Satış Adedi" value={String(periodSales.length)} delta={deltaPct(periodSales.length, prevSales.length)} positive />
            <KPI label="Ciro" value={formatCurrency(totals.revenue)} delta={deltaPct(totals.revenue, prevTotals.revenue)} positive />
            <KPI label="Tahsil" value={formatCurrency(totals.income)} delta={deltaPct(totals.income, prevTotals.income)} positive />
            <KPI label="Maliyet (COGS)" value={formatCurrency(totals.cost)} delta={deltaPct(totals.cost, prevTotals.cost)} positive={false} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Platform Kırılımı (Ciro)</CardTitle></CardHeader>
              <CardContent>
                {platformBreakdown.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-12 text-center">Bu dönem için platform verisi yok</p>
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={platformBreakdown} dataKey="revenue" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: { name: string }) => e.name}>
                          {platformBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                        </Pie>
                        <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base">Platform Detayı</CardTitle></CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Platform</TableHead><TableHead className="text-right">Sipariş</TableHead><TableHead className="text-right">Ciro</TableHead><TableHead className="text-right">Kâr</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {platformBreakdown.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Veri yok</TableCell></TableRow>
                    ) : platformBreakdown.map((p) => (
                      <TableRow key={p.name}>
                        <TableCell className="font-medium">{p.name}</TableCell>
                        <TableCell className="text-right">{p.orders}</TableCell>
                        <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                        <TableCell className={`text-right font-semibold ${p.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(p.profit)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead className="text-right">Adet</TableHead>
                    <TableHead className="text-right">Gelir</TableHead>
                    <TableHead className="text-right">Kâr</TableHead>
                    <TableHead className="text-right">Marj</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="font-medium max-w-[260px] truncate">{p.name}</TableCell>
                      <TableCell className="text-right">{p.qty}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(p.revenue)}</TableCell>
                      <TableCell className={`text-right ${p.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(p.profit)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">%{p.margin.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* MÜŞTERİLER */}
        <TabsContent value="customers" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Stat label="Aktif Müşteri" value={String(customerInsights.totalCustomers)} />
            <Stat label="Tekrar Eden" value={String(customerInsights.repeatBuyers)} cls="text-emerald-600" />
            <Stat label="Tekrar Oranı" value={`%${customerInsights.repeatRate.toFixed(1)}`} cls={customerInsights.repeatRate >= 30 ? "text-emerald-600" : "text-amber-600"} />
            <Stat label="Sepet Ortalaması" value={formatCurrency(customerInsights.aov)} />
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">En Değerli Müşteriler</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Müşteri</TableHead>
                    <TableHead className="text-right">Sipariş</TableHead>
                    <TableHead className="text-right">Ciro</TableHead>
                    <TableHead className="text-right">Sepet Ort.</TableHead>
                    <TableHead className="whitespace-nowrap">Son Sipariş</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customerInsights.top.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-6">Veri yok</TableCell></TableRow>
                  ) : customerInsights.top.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium max-w-[260px] truncate">{c.name}</TableCell>
                      <TableCell className="text-right">{c.orders}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(c.revenue)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(c.aov)}</TableCell>
                      <TableCell className="text-muted-foreground whitespace-nowrap">{formatDate(c.lastDate)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* GİDERLER */}
        <TabsContent value="expenses" className="space-y-4 mt-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <KPI label="Toplam Gider" value={formatCurrency(totals.totalExp)} delta={deltaPct(totals.totalExp, prevTotals.totalExp)} positive={false} />
            <Stat label="Operasyonel" value={formatCurrency(totals.expPaid)} cls="text-red-600" />
            <Stat label="Tedarikçi Ödemesi" value={formatCurrency(totals.purchPaid)} cls="text-red-600" />
            <Stat label="Reklam Harcaması" value={formatCurrency(totals.adsSpend)} cls="text-red-600" />
          </div>
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

        {/* REKLAM */}
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

        {/* STOK */}
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
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" /> Yavaş Hareket Eden Stok
              </CardTitle>
              <p className="text-xs text-muted-foreground">Bu dönemde hiç satılmamış ama elinizde stoğu olan ürünler</p>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow><TableHead>Ürün</TableHead><TableHead>Kategori</TableHead><TableHead className="text-right">Stok</TableHead><TableHead className="text-right">Bağlı Sermaye</TableHead></TableRow></TableHeader>
                <TableBody>
                  {slowMovers.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-6">Yavaş hareket eden ürün yok 🎉</TableCell></TableRow>
                  ) : slowMovers.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="font-medium max-w-[260px] truncate">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.category}</TableCell>
                      <TableCell className="text-right">{p.quantity}</TableCell>
                      <TableCell className="text-right font-medium text-amber-600">{formatCurrency(p.value)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
        {/* NAKİT AKIŞI */}
        <TabsContent value="cashflow" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">Gerçek nakit hareketleri — tahsil edilen gelir ve ödenen giderler. Fatura tutarları değil, kasaya giren/çıkan para.</p>
          {cashFlowTotals.net < 0 && (
            <InsightBanner type="danger" message={`Bu dönem nakit çıkışları girişleri aşıyor (${formatCurrency(Math.abs(cashFlowTotals.net))} açık). Tahsilat hızlandırılması veya gider ertelenmesi değerlendirilebilir.`} />
          )}
          {cashFlowTotals.net >= 0 && cashFlowData.filter((d) => d["Net Nakit"] < 0).length > 1 && (
            <InsightBanner type="warning" message={`${cashFlowData.filter((d) => d["Net Nakit"] < 0).length} ayda negatif nakit akışı yaşandı. Aylık nakit dengesini yakından takip edin.`} />
          )}
          {cashFlowTotals.net > 0 && cashFlowData.filter((d) => d["Net Nakit"] < 0).length <= 1 && (
            <InsightBanner type="success" message={`Bu dönem nakit akışı pozitif. ${formatCurrency(cashFlowTotals.net)} net nakit fazlası oluştu.`} />
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowDownCircle className="h-3.5 w-3.5 text-emerald-600" /> Toplam Nakit Giriş</p>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(cashFlowTotals.inflow)}</p>
                <p className="text-xs text-muted-foreground mt-1">Tahsil edilen ödemeler</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><ArrowUpCircle className="h-3.5 w-3.5 text-red-600" /> Toplam Nakit Çıkış</p>
                <p className="text-xl font-bold text-red-600">{formatCurrency(cashFlowTotals.outflow)}</p>
                <p className="text-xs text-muted-foreground mt-1">Ödenen giderler + alışlar + reklam</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Net Nakit Akışı</p>
                <p className={`text-xl font-bold ${cashFlowTotals.net >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(cashFlowTotals.net)}</p>
                <p className="text-xs text-muted-foreground mt-1">Giriş − Çıkış</p>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Aylık Nakit Giriş / Çıkış</CardTitle></CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={cashFlowData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `₺${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Legend />
                    <Bar dataKey="Nakit Giriş" fill="#10b981" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Nakit Çıkış" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Line dataKey="Net Nakit" stroke="#3b82f6" strokeWidth={2.5} dot={{ r: 3 }} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Kümülatif Nakit Akışı</CardTitle></CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <defs>
                      <linearGradient id="cfGrad" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" tickFormatter={(v) => `₺${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Area type="monotone" dataKey="Kümülatif" stroke="#3b82f6" fill="url(#cfGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Aylık Detay</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ay</TableHead>
                    <TableHead className="text-right text-emerald-700">Nakit Giriş</TableHead>
                    <TableHead className="text-right text-red-700">Nakit Çıkış</TableHead>
                    <TableHead className="text-right">Net Nakit</TableHead>
                    <TableHead className="text-right">Kümülatif</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cashFlowData.map((row) => (
                    <TableRow key={row.name}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right text-emerald-600">{formatCurrency(row["Nakit Giriş"])}</TableCell>
                      <TableCell className="text-right text-red-600">{formatCurrency(row["Nakit Çıkış"])}</TableCell>
                      <TableCell className={`text-right font-semibold ${row["Net Nakit"] >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(row["Net Nakit"])}</TableCell>
                      <TableCell className={`text-right ${row.Kümülatif >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(row.Kümülatif)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ALACAK YAŞLANDıRMA */}
        <TabsContent value="aging" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">Vadesi geçmiş ve henüz tahsil edilmemiş alacaklar. Renk dilimleri riski gösterir: sarı dikkat, turuncu riskli, kırmızı kritik.</p>
          {agingRows.length === 0 && (
            <InsightBanner type="success" message="Vadesi geçmiş alacak yok. Tahsilat durumu iyi görünüyor." />
          )}
          {agingSummary.find((b) => b.bucket === "90+" && b.total > 0) && (
            <InsightBanner type="danger" message={`${formatCurrency(agingSummary.find((b) => b.bucket === "90+")!.total)} tutarında 90+ gün vadesi geçmiş alacak var — şüpheli alacak riski. Acil takip ve hukuki süreç değerlendirilebilir.`} />
          )}
          {!agingSummary.find((b) => b.bucket === "90+" && b.total > 0) && agingSummary.find((b) => b.bucket === "61-90" && b.total > 0) && (
            <InsightBanner type="warning" message={`${formatCurrency(agingSummary.find((b) => b.bucket === "61-90")!.total)} tutarında 61–90 gün vadesi geçmiş alacak var. Ödeme hatırlatması gönderin.`} />
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="h-3.5 w-3.5" /> Toplam Açık Alacak</p>
                <p className="text-xl font-bold">{formatCurrency(agingRows.reduce((s, r) => s + r.remaining, 0))}</p>
                <p className="text-xs text-muted-foreground mt-1">{agingRows.length} vadesi geçmiş kayıt</p>
              </CardContent>
            </Card>
            {agingSummary.map((b) => {
              const color = b.bucket === "0-30" ? "text-amber-600" : b.bucket === "31-60" ? "text-orange-600" : b.bucket === "61-90" ? "text-red-600" : "text-red-800";
              return (
                <Card key={b.bucket}>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground">{b.bucket} gün</p>
                    <p className={`text-xl font-bold ${color}`}>{formatCurrency(b.total)}</p>
                    <p className="text-xs text-muted-foreground mt-1">{b.count} kayıt</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <Card>
            <CardHeader><CardTitle className="text-base">Dilime Göre Alacak Tutarı</CardTitle></CardHeader>
            <CardContent>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={agingSummary.filter((b) => b.total > 0)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="bucket" className="text-xs" tickFormatter={(v) => `${v} gün`} />
                    <YAxis className="text-xs" tickFormatter={(v) => `₺${(Number(v) / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(v) => formatCurrency(Number(v))} />
                    <Bar dataKey="total" name="Alacak Tutarı" radius={[4, 4, 0, 0]}>
                      {agingSummary.map((b, i) => (
                        <Cell key={i} fill={["#f59e0b", "#f97316", "#ef4444", "#991b1b"][i]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-red-500" /> Vadesi Geçmiş Alacaklar
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead>Müşteri</TableHead>
                    <TableHead className="text-right">Tutar</TableHead>
                    <TableHead className="text-right">Ödenen</TableHead>
                    <TableHead className="text-right text-red-700">Kalan</TableHead>
                    <TableHead>Vade Tarihi</TableHead>
                    <TableHead className="text-right">Geçen Gün</TableHead>
                    <TableHead>Dilim</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {agingRows.length === 0 ? (
                    <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-6">Vadesi geçmiş alacak yok 🎉</TableCell></TableRow>
                  ) : agingRows.map((r) => {
                    const bucketColor = r.bucket === "0-30" ? "bg-amber-100 text-amber-700 border-amber-200" : r.bucket === "31-60" ? "bg-orange-100 text-orange-700 border-orange-200" : r.bucket === "61-90" ? "bg-red-100 text-red-700 border-red-200" : "bg-red-200 text-red-900 border-red-300";
                    return (
                      <TableRow key={r.id}>
                        <TableCell className="max-w-[200px] truncate font-medium">{r.product_name}</TableCell>
                        <TableCell className="max-w-[160px] truncate">{r.customerName}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(r.total_amount))}</TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(r.paid_amount || 0))}</TableCell>
                        <TableCell className="text-right font-semibold text-red-600">{formatCurrency(r.remaining)}</TableCell>
                        <TableCell className="whitespace-nowrap">{r.due_date ? formatDate(r.due_date) : formatDate(r.sale_date)}</TableCell>
                        <TableCell className="text-right font-semibold text-red-600">{r.days} gün</TableCell>
                        <TableCell><span className={`text-xs px-2 py-0.5 rounded border ${bucketColor}`}>{r.bucket} gün</span></TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* BAŞA BAŞ ANALİZİ */}
        <TabsContent value="breakeven" className="space-y-4 mt-4">
          <p className="text-sm text-muted-foreground">Kaç satış yaparsanız tüm giderlerinizi karşılarsınız? İki çizginin kesiştiği nokta kâra geçiş noktanızdır.</p>
          {breakeven.units > 0 && breakeven.current < breakeven.units && (
            <InsightBanner type="danger" message={`Bu dönem başa baş noktasının altındasınız. Kâra geçmek için ${breakeven.units - breakeven.current} satış daha gerekiyor.`} />
          )}
          {breakeven.units > 0 && breakeven.current >= breakeven.units && breakeven.safetyMargin < 20 && (
            <InsightBanner type="warning" message={`Güvenlik marjı düşük (%${breakeven.safetyMargin.toFixed(1)}). Küçük bir satış düşüşü sizi zarara sokabilir.`} />
          )}
          {breakeven.units > 0 && breakeven.current >= breakeven.units && breakeven.safetyMargin >= 20 && (
            <InsightBanner type="success" message={`Başa baş noktasını aşmışsınız. %${breakeven.safetyMargin.toFixed(1)} güvenlik marjıyla kâr bölgesindesiniz.`} />
          )}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base">Parametreler (otomatik doldurulur, düzenlenebilir)</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-xs">Sabit Giderler (₺) — dönem operasyonel giderler</Label>
                  <Input type="number" value={bbFixedCost} onChange={(e) => setBbFixedCost(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs">Ortalama Satış Tutarı (₺) — dönem ortalaması</Label>
                  <Input type="number" value={bbAvgRevenue} onChange={(e) => setBbAvgRevenue(e.target.value)} placeholder="0" />
                </div>
                <div>
                  <Label className="text-xs">Ortalama Değişken Maliyet (₺) — ürün maliyeti ortalaması</Label>
                  <Input type="number" value={bbAvgVarCost} onChange={(e) => setBbAvgVarCost(e.target.value)} placeholder="0" />
                </div>
              </CardContent>
            </Card>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground">Katkı Payı / Satış</p>
                    <p className={`text-xl font-bold ${breakeven.contribution >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(breakeven.contribution)}</p>
                    <p className="text-xs text-muted-foreground mt-1">Gelir − Değişken Maliyet</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground">Başa Baş Noktası</p>
                    <p className="text-xl font-bold">{breakeven.units > 0 ? `${breakeven.units} satış` : "—"}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatCurrency(breakeven.revenue)} ciro</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground">Bu Dönem Satış Adedi</p>
                    <p className={`text-xl font-bold ${breakeven.current >= breakeven.units ? "text-emerald-600" : "text-red-600"}`}>{breakeven.current}</p>
                    <p className="text-xs text-muted-foreground mt-1">{breakeven.current >= breakeven.units ? "✅ Kâr bölgesinde" : `❌ ${breakeven.units - breakeven.current} satış eksik`}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <p className="text-xs text-muted-foreground">Güvenlik Marjı</p>
                    <p className={`text-xl font-bold ${breakeven.safetyMargin >= 20 ? "text-emerald-600" : breakeven.safetyMargin >= 0 ? "text-amber-600" : "text-red-600"}`}>
                      {breakeven.safetyMargin > 0 ? `%${breakeven.safetyMargin.toFixed(1)}` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">Başa baştan ne kadar uzakta</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
          {breakeven.units > 0 && (() => {
            const maxUnits = Math.max(Math.ceil(breakeven.units * 1.6), breakeven.current + 5, 10);
            const step = Math.max(1, Math.ceil(maxUnits / 60));
            const pts: number[] = [];
            for (let u = 0; u <= maxUnits; u += step) pts.push(u);
            if (!pts.includes(breakeven.units)) pts.push(breakeven.units);
            if (breakeven.current > 0 && !pts.includes(breakeven.current)) pts.push(breakeven.current);
            pts.sort((a, b) => a - b);
            const chartData = pts.map((u) => ({
              units: u,
              "Toplam Gelir": u * breakeven.avgRev,
              "Toplam Maliyet": breakeven.fixed + u * breakeven.avgVar,
            }));
            const beY = breakeven.units * breakeven.avgRev;
            return (
              <Card>
                <CardHeader><CardTitle className="text-base">Gelir vs Maliyet Grafiği</CardTitle></CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartData} margin={{ bottom: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="units" className="text-xs" label={{ value: "Satış Adedi", position: "insideBottom", offset: -10 }} />
                        <YAxis className="text-xs" tickFormatter={(v) => `₺${(Number(v) / 1000).toFixed(0)}k`} width={60} />
                        <Tooltip
                          formatter={(v, name) => [formatCurrency(Number(v)), name]}
                          labelFormatter={(l) => `${l} satış`}
                        />
                        <Legend />
                        <ReferenceLine
                          x={breakeven.units}
                          stroke="#6366f1"
                          strokeDasharray="5 3"
                          label={{ value: `Başa Baş: ${breakeven.units}`, position: "top", fontSize: 11, fill: "#6366f1" }}
                        />
                        {breakeven.current > 0 && breakeven.current !== breakeven.units && (
                          <ReferenceLine
                            x={breakeven.current}
                            stroke="#3b82f6"
                            strokeDasharray="5 3"
                            label={{ value: `Şu An: ${breakeven.current}`, position: "insideTopRight", fontSize: 11, fill: "#3b82f6" }}
                          />
                        )}
                        <Line dataKey="Toplam Gelir" stroke="#10b981" strokeWidth={2.5} dot={false} />
                        <Line dataKey="Toplam Maliyet" stroke="#ef4444" strokeWidth={2.5} dot={false} />
                        <ReferenceDot x={breakeven.units} y={beY} r={6} fill="#6366f1" stroke="#fff" strokeWidth={2} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-xs text-muted-foreground text-center mt-1">
                    Mor nokta = başa baş ({breakeven.units} satış, {formatCurrency(beY)})
                    {breakeven.current > 0 && ` · Mavi çizgi = bu dönem gerçekleşen (${breakeven.current} satış)`}
                  </p>
                </CardContent>
              </Card>
            );
          })()}
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

function InsightBanner({ type, message }: { type: "info" | "warning" | "danger" | "success"; message: string }) {
  const styles = {
    info:    { bg: "bg-blue-50 border-blue-200 text-blue-800",    Icon: Info },
    warning: { bg: "bg-amber-50 border-amber-200 text-amber-800", Icon: AlertTriangle },
    danger:  { bg: "bg-red-50 border-red-200 text-red-800",       Icon: XCircle },
    success: { bg: "bg-emerald-50 border-emerald-200 text-emerald-800", Icon: CheckCircle2 },
  }[type];
  return (
    <div className={`flex items-start gap-2 rounded-lg border px-4 py-3 text-sm ${styles.bg}`}>
      <styles.Icon className="h-4 w-4 mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

function KPI({
  label, value, delta, positive = true, unit = "%",
}: {
  label: string; value: string; delta: number; positive?: boolean; unit?: string;
}) {
  // delta > 0 değişimin "yukarı" olduğunu gösterir; positive=true ise yukarı = iyi
  const up = delta >= 0;
  const good = positive ? up : !up;
  const arrowCls = good ? "text-emerald-600" : "text-red-600";
  const Arrow = up ? TrendingUp : TrendingDown;
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-xl font-bold truncate">{value}</p>
        <p className={`text-xs mt-1 flex items-center gap-1 ${arrowCls}`}>
          <Arrow className="h-3 w-3" />
          {unit === "pp"
            ? `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} pp`
            : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)}%`}
          <span className="text-muted-foreground font-normal">önceki</span>
        </p>
      </CardContent>
    </Card>
  );
}
