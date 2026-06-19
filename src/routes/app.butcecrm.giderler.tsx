import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/butcecrm-helpers";
import { friendlyDbError } from "@/lib/butcecrm-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Plus, Search, Receipt, RefreshCw, Trash2, ArrowUpDown, ArrowUp, ArrowDown,
  CheckCircle, Pencil, TrendingDown, Copy,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CsvToolbar, type CsvField } from "@/components/butcecrm/CsvToolbar";
import { useSettings } from "@/lib/butcecrm-settings";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartTooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from "recharts";

const EXPENSES_CSV_FIELDS: CsvField[] = [
  { key: "expense_date",   label: "Tarih",         required: true, type: "date" },
  { key: "category",       label: "Kategori",      required: true },
  { key: "amount",         label: "Tutar",         required: true, type: "number" },
  { key: "paid_amount",    label: "Ödenen",        type: "number" },
  { key: "payment_status", label: "Ödeme Durumu",  required: true },
  { key: "note",           label: "Not" },
];
const EXPENSES_CSV_SAMPLE = ["2025-05-01", "Kira", 5000, 5000, "ödendi", "Mayıs ayı"];

const RECURRENCE_OPTIONS = ["Günlük", "Haftalık", "Aylık", "Senelik"] as const;
type RecurrenceInterval = (typeof RECURRENCE_OPTIONS)[number];

type Expense = {
  id: string;
  expense_date: string;
  category: string;
  amount: number;
  paid_amount: number | null;
  payment_status: string;
  note: string | null;
  sale_id: string | null;
  is_recurring: boolean | null;
  recurrence_interval: RecurrenceInterval | null;
};
type Category = { id: string; name: string };
type SaleRef = { id: string; product_name: string; sale_date: string };

const STATUSES = ["ödendi", "kısmi", "bekliyor"] as const;
type Status = (typeof STATUSES)[number];

const PIE_COLORS = ["#6366f1","#f59e0b","#10b981","#ef4444","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#f97316","#64748b"];

export const Route = createFileRoute("/app/butcecrm/giderler")({
  head: () => ({ meta: [{ title: "BütçeCRM — Giderler" }] }),
  component: ExpensesPage,
});

function statusBadge(s: string) {
  const map: Record<string, string> = {
    "ödendi": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "kısmi": "bg-amber-100 text-amber-700 border-amber-200",
    "bekliyor": "bg-red-100 text-red-700 border-red-200",
  };
  return map[s] || "bg-secondary text-foreground";
}

function getMonthRange(offset: number) {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth() + offset;
  const start = new Date(y, m, 1);
  const end = new Date(y, m + 1, 0);
  return {
    from: start.toISOString().slice(0, 10),
    to: end.toISOString().slice(0, 10),
  };
}

function ExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<SaleRef[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  // Varsayılan: bu ayın 1'i → son günü
  const [from, setFrom] = useState(() => getMonthRange(0).from);
  const [to, setTo] = useState(() => getMonthRange(0).to);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editExpense, setEditExpense] = useState<Expense | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [copyMonthDialogOpen, setCopyMonthDialogOpen] = useState(false);
  const [copying, setCopying] = useState(false);

  async function load() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const uid = session.user.id;
    const [e, c, s] = await Promise.all([
      supabase.from("expenses").select("*").eq("user_id", uid).is("deleted_at", null).order("expense_date", { ascending: false }),
      supabase.from("expense_categories").select("id,name").order("name"),
      supabase.from("sales").select("id,product_name,sale_date").eq("user_id", uid).is("deleted_at", null).order("sale_date", { ascending: false }).limit(200),
    ]);
    setExpenses((e.data as Expense[]) || []);
    setSales((s.data as SaleRef[]) || []);

    if (!c.data?.length) {
      const defaults = ["Kira","Elektrik","Su","İnternet","Personel","Muhasebe","Reklam","Vergi","Kargo","Diğer"];
      await supabase.from("expense_categories").insert(defaults.map((name) => ({ name })));
      const { data: seeded } = await supabase.from("expense_categories").select("id,name").order("name");
      setCategories((seeded as Category[]) || []);
    } else {
      setCategories((c.data as Category[]) || []);
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const categoryNames = useMemo(() => {
    const set = new Set<string>(categories.map((c) => c.name));
    expenses.forEach((e) => e.category && set.add(e.category));
    return Array.from(set).sort();
  }, [categories, expenses]);

  const filtered = useMemo(() => {
    return expenses.filter((e) => {
      if (statusFilter !== "all" && e.payment_status !== statusFilter) return false;
      if (catFilter !== "all" && e.category !== catFilter) return false;
      if (from && e.expense_date < from) return false;
      if (to && e.expense_date > to) return false;
      if (q) {
        const text = `${e.category} ${e.note || ""}`.toLowerCase();
        if (!text.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [expenses, statusFilter, catFilter, from, to, q]);

  useEffect(() => { setPage(1); setSelectedIds(new Set()); }, [statusFilter, catFilter, from, to, q]);

  const [sortKey, setSortKey] = useState<keyof Expense>("expense_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(col: keyof Expense) {
    if (sortKey === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col); setSortDir("asc"); }
  }

  function SortIcon({ col }: { col: keyof Expense }) {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 opacity-30" />;
    return sortDir === "asc" ? <ArrowUp className="h-3 w-3 text-primary" /> : <ArrowDown className="h-3 w-3 text-primary" />;
  }

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "tr", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pagedExpenses = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page],
  );

  const totals = useMemo(() => {
    const total = filtered.reduce((s, x) => s + Number(x.amount || 0), 0);
    const paid = filtered.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
    return { total, paid, remaining: total - paid, count: filtered.length };
  }, [filtered]);

  // Kategori bazlı pie verisi
  const categoryChartData = useMemo(() => {
    const map: Record<string, number> = {};
    filtered.forEach((e) => {
      const cat = e.category || "Diğer";
      map[cat] = (map[cat] || 0) + Number(e.amount || 0);
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);
  }, [filtered]);

  // Son 6 ay trend verisi (tüm giderler, filtreden bağımsız)
  const trendData = useMemo(() => {
    const months: { label: string; key: string }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const label = d.toLocaleDateString("tr-TR", { month: "short", year: "2-digit" });
      months.push({ label, key });
    }
    return months.map(({ label, key }) => ({
      label,
      tutar: expenses
        .filter((e) => e.expense_date.startsWith(key))
        .reduce((s, e) => s + Number(e.amount || 0), 0),
    }));
  }, [expenses]);

  const pagedIds = pagedExpenses.map((e) => e.id);
  const allPageSelected = pagedIds.length > 0 && pagedIds.every((id) => selectedIds.has(id));

  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) pagedIds.forEach((id) => next.delete(id));
      else pagedIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function toggleOne(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function handleBulkDelete() {
    const ids = Array.from(selectedIds);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return toast.error("Oturum bulunamadı");
    for (let i = 0; i < ids.length; i += 20) {
      const chunk = ids.slice(i, i + 20);
      const { error } = await supabase.from("expenses").update({ deleted_at: new Date().toISOString() }).in("id", chunk).eq("user_id", session.user.id);
      if (error) { console.error("bulk delete error", error); return toast.error("Silinemedi: " + friendlyDbError(error)); }
    }
    toast.success(`${ids.length} gider silindi`);
    setSelectedIds(new Set());
    load();
  }

  async function handleBulkMarkPaid() {
    const ids = Array.from(selectedIds);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return toast.error("Oturum bulunamadı");
    const items = expenses.filter((e) => ids.includes(e.id));
    for (let i = 0; i < ids.length; i += 20) {
      const chunk = items.slice(i, i + 20);
      for (const item of chunk) {
        const { error } = await supabase.from("expenses")
          .update({ payment_status: "ödendi", paid_amount: Number(item.amount) })
          .eq("id", item.id)
          .eq("user_id", session.user.id);
        if (error) return toast.error("Güncellenemedi: " + friendlyDbError(error));
      }
    }
    toast.success(`${ids.length} gider ödendi olarak işaretlendi`);
    setSelectedIds(new Set());
    load();
  }

  async function updateStatus(exp: Expense, newStatus: Status) {
    const patch: Partial<Expense> = { payment_status: newStatus };
    if (newStatus === "ödendi") patch.paid_amount = Number(exp.amount);
    if (newStatus === "bekliyor") patch.paid_amount = 0;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return toast.error("Oturum bulunamadı");
    const { error } = await supabase.from("expenses").update(patch).eq("id", exp.id).eq("user_id", session.user.id);
    if (error) return toast.error("Güncellenemedi: " + friendlyDbError(error));
    toast.success("Ödeme durumu güncellendi");
    setExpenses((prev) => prev.map((x) => (x.id === exp.id ? { ...x, ...patch } as Expense : x)));
  }

  const defaultFrom = getMonthRange(0).from;
  const defaultTo = getMonthRange(0).to;
  const hasActiveFilters = statusFilter !== "all" || catFilter !== "all" || from !== defaultFrom || to !== defaultTo || q;

  function clearFilters() {
    setStatusFilter("all"); setCatFilter("all");
    setFrom(defaultFrom); setTo(defaultTo); setQ("");
  }

  function applyPreset(preset: "thisMonth" | "lastMonth" | "thisYear") {
    if (preset === "thisMonth") { const r = getMonthRange(0); setFrom(r.from); setTo(r.to); }
    if (preset === "lastMonth") { const r = getMonthRange(-1); setFrom(r.from); setTo(r.to); }
    if (preset === "thisYear") {
      const y = new Date().getFullYear();
      setFrom(`${y}-01-01`); setTo(`${y}-12-31`);
    }
  }

  // Geçen ayın giderleri (kopyalama için)
  const lastMonthRange = useMemo(() => getMonthRange(-1), []);
  const lastMonthExpenses = useMemo(
    () => expenses.filter(
      (e) => e.expense_date >= lastMonthRange.from && e.expense_date <= lastMonthRange.to,
    ),
    [expenses, lastMonthRange],
  );
  const lastMonthTotal = useMemo(
    () => lastMonthExpenses.reduce((s, e) => s + Number(e.amount || 0), 0),
    [lastMonthExpenses],
  );

  async function handleCopyLastMonth() {
    if (lastMonthExpenses.length === 0) return;
    setCopying(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setCopying(false); return toast.error("Oturum bulunamadı"); }
    const uid = session.user.id;

    // Bu ayın yıl/ay bilgisi ve son günü
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth(); // 0-indexed
    const daysInThisMonth = new Date(year, month + 1, 0).getDate();

    const payloads = lastMonthExpenses.map((e) => {
      const srcDay = Number(e.expense_date.slice(8, 10)) || 1;
      const targetDay = Math.min(srcDay, daysInThisMonth);
      const newDate = `${year}-${String(month + 1).padStart(2, "0")}-${String(targetDay).padStart(2, "0")}`;
      return {
        user_id: uid,
        expense_date: newDate,
        category: e.category,
        amount: Number(e.amount || 0),
        paid_amount: 0,
        payment_status: "bekliyor",
        note: e.note || "",
        sale_id: null,
        is_recurring: e.is_recurring,
        recurrence_interval: e.recurrence_interval,
      };
    });

    const { error } = await supabase.from("expenses").insert(payloads);
    setCopying(false);
    if (error) return toast.error("Kopyalanamadı: " + friendlyDbError(error));
    const currentRange = getMonthRange(0);
    setFrom(currentRange.from);
    setTo(currentRange.to);
    toast.success(`${payloads.length} gider kopyalandı`);
    setCopyMonthDialogOpen(false);
    load();
  }

  return (
    <TooltipProvider>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Receipt className="h-6 w-6 text-primary" /> Giderler
            </h1>
            <p className="text-muted-foreground text-sm">Tüm giderler, kategoriler ve ödeme durumları</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => setCopyMonthDialogOpen(true)}>
              <Copy className="h-4 w-4" /> Geçen Ayı Kopyala
            </Button>
            <ExpenseDialog
              open={open || editExpense !== null}
              setOpen={(v) => { setOpen(v); if (!v) setEditExpense(null); }}
              categories={categoryNames}
              sales={sales}
              onCreated={load}
              expense={editExpense}
              trigger={
                <Button className="gap-2" onClick={() => { setEditExpense(null); setOpen(true); }}>
                  <Plus className="h-4 w-4" /> Yeni Gider
                </Button>
              }
            />
          </div>
        </div>

        <Dialog open={copyMonthDialogOpen} onOpenChange={setCopyMonthDialogOpen}>
          <DialogContent>
            <DialogHeader><DialogTitle>Geçen Ayı Kopyala</DialogTitle></DialogHeader>
            {lastMonthExpenses.length === 0 ? (
              <p className="text-sm text-muted-foreground">Geçen ay gider kaydı bulunamadı.</p>
            ) : (
              <>
                <p className="text-sm">
                  Geçen aydan <strong>{lastMonthExpenses.length} gider</strong> kopyalanacak.
                  Toplam tutar: <strong>{formatCurrency(lastMonthTotal)}</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Tüm giderler bu ayın karşılık gelen tarihlerine kopyalanacak. Ödeme durumu "bekliyor" olarak ayarlanacak.
                </p>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCopyMonthDialogOpen(false)}>İptal</Button>
                  <Button onClick={handleCopyLastMonth} disabled={copying}>
                    {copying ? "Kopyalanıyor..." : `${lastMonthExpenses.length} Gideri Kopyala`}
                  </Button>
                </DialogFooter>
              </>
            )}
          </DialogContent>
        </Dialog>

        <CsvToolbar
          slug="giderler"
          table="expenses"
          fields={EXPENSES_CSV_FIELDS}
          sampleRow={EXPENSES_CSV_SAMPLE}
          exportRows={filtered.map((e) => ({
            expense_date: e.expense_date,
            category: e.category,
            amount: e.amount,
            paid_amount: e.paid_amount,
            payment_status: e.payment_status,
            note: e.note,
          }))}
          onImported={load}
        />

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Gider Adedi" value={String(totals.count)} />
          <StatCard label="Toplam Tutar" value={formatCurrency(totals.total)} valueClass="text-red-600" />
          <StatCard label="Ödenen" value={formatCurrency(totals.paid)} valueClass="text-emerald-600" />
          <StatCard label="Kalan Borç" value={formatCurrency(totals.remaining)} valueClass="text-amber-600" />
        </div>

        {/* Grafikler */}
        {expenses.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-1.5">
                  <TrendingDown className="h-4 w-4 text-red-500" /> Son 6 Ay Gider Trendi
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} width={48} />
                    <RechartTooltip formatter={(v: number) => formatCurrency(v)} />
                    <Bar dataKey="tutar" fill="#ef4444" radius={[3, 3, 0, 0]} name="Gider" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {categoryChartData.length > 0 && (
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium">Kategoriye Göre Dağılım</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={categoryChartData}
                        dataKey="value"
                        nameKey="name"
                        cx="40%"
                        cy="50%"
                        outerRadius={70}
                        label={false}
                      >
                        {categoryChartData.map((_, i) => (
                          <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend
                        layout="vertical"
                        align="right"
                        verticalAlign="middle"
                        iconSize={8}
                        formatter={(value, entry: any) => (
                          <span className="text-[11px]">{value} <span className="text-muted-foreground">{formatCurrency(entry.payload.value)}</span></span>
                        )}
                      />
                      <RechartTooltip formatter={(v: number) => formatCurrency(v)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Filtreler</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-7 text-muted-foreground">
                  Filtreleri Temizle
                </Button>
              )}
            </div>
            {/* Tarih presetleri */}
            <div className="flex gap-1.5 flex-wrap pt-1">
              {[
                { label: "Bu Ay", preset: "thisMonth" as const },
                { label: "Geçen Ay", preset: "lastMonth" as const },
                { label: "Bu Yıl", preset: "thisYear" as const },
              ].map(({ label, preset }) => (
                <Button key={preset} variant="outline" size="sm" className="h-7 text-xs"
                  onClick={() => applyPreset(preset)}>
                  {label}
                </Button>
              ))}
              <Button variant="outline" size="sm" className="h-7 text-xs"
                onClick={() => { setFrom(""); setTo(""); }}>
                Tüm Zamanlar
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <div>
                <Label className="text-xs">Kategori</Label>
                <Select value={catFilter} onValueChange={setCatFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {categoryNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Ödeme Durumu</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tümü</SelectItem>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Başlangıç</Label>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Bitiş</Label>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
              </div>
              <div>
                <Label className="text-xs">Ara (kategori / not)</Label>
                <div className="relative">
                  <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                  <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara..." className="pl-8" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedIds.size > 0 && (
          <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 text-sm gap-2 flex-wrap">
            <span className="font-medium text-blue-700">{selectedIds.size} kayıt seçildi</span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleBulkMarkPaid}
                className="gap-1.5 h-7 border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                <CheckCircle className="h-3.5 w-3.5" /> Ödendi İşaretle
              </Button>
              <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="gap-1.5 h-7">
                <Trash2 className="h-3.5 w-3.5" /> Seçilenleri Sil
              </Button>
            </div>
          </div>
        )}

        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
            ) : filtered.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <Receipt className="h-10 w-10 mx-auto text-muted-foreground/40" />
                {hasActiveFilters ? (
                  <>
                    <p className="text-muted-foreground font-medium">Bu kriterlere uygun gider bulunamadı</p>
                    <Button variant="outline" size="sm" onClick={clearFilters}>Filtreleri Temizle</Button>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground font-medium">Henüz gider kaydı yok</p>
                    <p className="text-sm text-muted-foreground">İlk giderinizi eklemek için "Yeni Gider" butonunu kullanın</p>
                  </>
                )}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox checked={allPageSelected} onCheckedChange={toggleAll} />
                    </TableHead>
                    {([["expense_date","Tarih"],["category","Kategori"],["note","Not"]] as [keyof Expense, string][]).map(([col, label]) => (
                      <TableHead key={col} className="cursor-pointer select-none" onClick={() => handleSort(col)}>
                        <span className="inline-flex items-center gap-1">{label}<SortIcon col={col} /></span>
                      </TableHead>
                    ))}
                    {([["amount","Tutar"],["paid_amount","Ödenen"]] as [keyof Expense, string][]).map(([col, label]) => (
                      <TableHead key={col} className="text-right cursor-pointer select-none" onClick={() => handleSort(col)}>
                        <span className="inline-flex items-center justify-end gap-1">{label}<SortIcon col={col} /></span>
                      </TableHead>
                    ))}
                    <TableHead>Durum</TableHead>
                    <TableHead className="w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pagedExpenses.map((e) => (
                    <TableRow key={e.id} className={selectedIds.has(e.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox checked={selectedIds.has(e.id)} onCheckedChange={() => toggleOne(e.id)} />
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(e.expense_date)}</TableCell>
                      <TableCell className="max-w-[180px]">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate">{e.category || "-"}</span>
                          {e.is_recurring && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 shrink-0 cursor-default">
                                  <RefreshCw className="h-2.5 w-2.5" />{e.recurrence_interval}
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>Tekrar eden gider</TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[260px]">
                        {e.note ? (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate block text-muted-foreground cursor-default max-w-[240px]">{e.note}</span>
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs whitespace-pre-wrap">{e.note}</TooltipContent>
                          </Tooltip>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(e.amount))}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(e.paid_amount || 0))}</TableCell>
                      <TableCell>
                        <Select value={e.payment_status} onValueChange={(v) => updateStatus(e, v as Status)}>
                          <SelectTrigger className={`h-8 w-[130px] border ${statusBadge(e.payment_status)}`}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"
                              onClick={() => setEditExpense(e)}>
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Düzenle</TooltipContent>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
          {!loading && filtered.length > PAGE_SIZE && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
              <span>{((page - 1) * PAGE_SIZE) + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} / {filtered.length} kayıt</span>
              <div className="flex items-center gap-1">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹ Önceki</Button>
                <span className="px-3 py-1 rounded border text-xs font-medium">{page} / {totalPages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Sonraki ›</Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </TooltipProvider>
  );
}

function StatCard({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-xl font-bold truncate ${valueClass || ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function ExpenseDialog({
  open, setOpen, categories, sales, onCreated, expense, trigger,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
  categories: string[];
  sales: SaleRef[];
  onCreated: () => void;
  expense: Expense | null;
  trigger: React.ReactNode;
}) {
  const [settings] = useSettings();
  const allCategories = Array.from(new Set([...settings.expenseCategories, ...categories])).sort();
  const today = new Date().toISOString().slice(0, 10);
  const isEdit = expense !== null;

  const defaultForm = {
    expense_date: today,
    category: "",
    newCategory: "",
    amount: "",
    paid_amount: "",
    payment_status: "bekliyor" as Status,
    note: "",
    sale_id: "",
    is_recurring: false,
    recurrence_interval: "Aylık" as RecurrenceInterval,
  };

  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (expense) {
      setForm({
        expense_date: expense.expense_date,
        category: expense.category || "",
        newCategory: "",
        amount: String(expense.amount || ""),
        paid_amount: String(expense.paid_amount || ""),
        payment_status: (expense.payment_status as Status) || "bekliyor",
        note: expense.note || "",
        sale_id: expense.sale_id || "",
        is_recurring: expense.is_recurring || false,
        recurrence_interval: (expense.recurrence_interval as RecurrenceInterval) || "Aylık",
      });
    } else {
      setForm({ ...defaultForm, expense_date: today });
    }
  }, [expense, open]);

  function reset() {
    setForm({ ...defaultForm, expense_date: today });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const rawCat = form.category === "__new__" ? form.newCategory.trim() : form.category;
    const cat = rawCat.replace(/\s+/g, " ").trim().replace(/^./, (c) => c.toLocaleUpperCase("tr-TR"));
    if (!cat || !form.amount) return toast.error("Kategori ve tutar zorunludur");
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return toast.error("Oturum bulunamadı"); }
    const total = Number(form.amount);
    const paid = form.paid_amount
      ? Number(form.paid_amount)
      : (form.payment_status === "ödendi" ? total : 0);
    const payload = {
      user_id: session.user.id,
      expense_date: form.expense_date,
      category: cat,
      amount: total,
      paid_amount: paid,
      payment_status: form.payment_status,
      note: form.note || "",
      sale_id: form.sale_id || null,
      is_recurring: form.is_recurring,
      recurrence_interval: form.is_recurring ? form.recurrence_interval : null,
    };

    if (isEdit && expense) {
      const { error } = await supabase.from("expenses").update(payload).eq("id", expense.id).eq("user_id", session.user.id);
      setSaving(false);
      if (error) return toast.error("Güncellenemedi: " + friendlyDbError(error));
      toast.success("Gider güncellendi");
    } else {
      const { error } = await supabase.from("expenses").insert(payload);
      if (!error && form.category === "__new__" && cat) {
        await supabase.from("expense_categories").insert({ name: cat }).then(() => {});
      }
      setSaving(false);
      if (error) return toast.error("Eklenemedi: " + friendlyDbError(error));
      toast.success("Gider eklendi");
    }

    reset();
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Gider Düzenle" : "Yeni Gider"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tarih</Label>
              <Input type="date" value={form.expense_date}
                onChange={(e) => setForm({ ...form, expense_date: e.target.value })} required />
            </div>
            <div>
              <Label>Kategori</Label>
              <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
                <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                <SelectContent>
                  {allCategories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  <SelectItem value="__new__">+ Yeni kategori</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.category === "__new__" && (
            <div>
              <Label>Yeni Kategori Adı</Label>
              <Input value={form.newCategory}
                onChange={(e) => setForm({ ...form, newCategory: e.target.value })} required />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tutar (₺)</Label>
              <Input type="number" step="0.01" value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })} required />
            </div>
            <div>
              <Label>Ödenen (₺)</Label>
              <Input type="number" step="0.01" value={form.paid_amount}
                onChange={(e) => setForm({ ...form, paid_amount: e.target.value })}
                placeholder="Boşsa duruma göre" />
            </div>
          </div>
          <div>
            <Label>Ödeme Durumu</Label>
            <Select value={form.payment_status}
              onValueChange={(v) => setForm({ ...form, payment_status: v as Status })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>İlgili Satış (Opsiyonel)</Label>
            <Select value={form.sale_id} onValueChange={(v) => setForm({ ...form, sale_id: v === "__none__" ? "" : v })}>
              <SelectTrigger><SelectValue placeholder="Bağımsız gider" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Bağımsız gider</SelectItem>
                {sales.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.sale_date.slice(0, 10)} — {s.product_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Not</Label>
            <Textarea value={form.note} rows={2}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Opsiyonel açıklama" />
          </div>
          <div className="rounded-md border bg-muted/30 p-3 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium flex items-center gap-1.5">
                  <RefreshCw className="h-3.5 w-3.5 text-blue-600" /> Tekrar Eden Gider
                </p>
                <p className="text-[11px] text-muted-foreground">Bu gider belirli aralıklarla tekrar ediyorsa açın</p>
              </div>
              <Switch
                checked={form.is_recurring}
                onCheckedChange={(v) => setForm({ ...form, is_recurring: v })}
              />
            </div>
            {form.is_recurring && (
              <div>
                <Label className="text-xs">Tekrar Sıklığı</Label>
                <Select
                  value={form.recurrence_interval}
                  onValueChange={(v) => setForm({ ...form, recurrence_interval: v as RecurrenceInterval })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RECURRENCE_OPTIONS.map((o) => (
                      <SelectItem key={o} value={o}>{o}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : (isEdit ? "Güncelle" : "Kaydet")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
