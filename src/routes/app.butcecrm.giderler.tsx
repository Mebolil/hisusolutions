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
import { Plus, Search, Receipt, RefreshCw, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CsvToolbar, type CsvField } from "@/components/butcecrm/CsvToolbar";
import { useSettings } from "@/lib/butcecrm-settings";

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

function ExpensesPage() {
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [sales, setSales] = useState<SaleRef[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [catFilter, setCatFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    const [e, c, s] = await Promise.all([
      supabase.from("expenses").select("*").order("expense_date", { ascending: false }),
      supabase.from("expense_categories").select("id,name").order("name"),
      supabase.from("sales").select("id,product_name,sale_date").order("sale_date", { ascending: false }).limit(200),
    ]);
    setExpenses((e.data as Expense[]) || []);
    setCategories((c.data as Category[]) || []);
    setSales((s.data as SaleRef[]) || []);
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
    if (sortKey !== col) return <ChevronUp className="h-3 w-3 opacity-25" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
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
    if (!confirm(`${selectedIds.size} gideri silmek istediğinize emin misiniz?`)) return;
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("expenses").delete().in("id", ids);
    if (error) return toast.error("Silinemedi: " + friendlyDbError(error));
    toast.success(`${ids.length} gider silindi`);
    setSelectedIds(new Set());
    load();
  }

  async function updateStatus(exp: Expense, newStatus: Status) {
    const patch: Partial<Expense> = { payment_status: newStatus };
    if (newStatus === "ödendi") patch.paid_amount = Number(exp.amount);
    if (newStatus === "bekliyor") patch.paid_amount = 0;
    const { error } = await supabase.from("expenses").update(patch).eq("id", exp.id);
    if (error) return toast.error("Güncellenemedi: " + friendlyDbError(error));
    toast.success("Ödeme durumu güncellendi");
    setExpenses((prev) => prev.map((x) => (x.id === exp.id ? { ...x, ...patch } as Expense : x)));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Receipt className="h-6 w-6 text-primary" /> Giderler</h1>
          <p className="text-muted-foreground text-sm">Tüm giderler, kategoriler ve ödeme durumları</p>
        </div>
        <NewExpenseDialog
          open={open}
          setOpen={setOpen}
          categories={categoryNames}
          sales={sales}
          onCreated={load}
        />
      </div>

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

      <Card>
        <CardHeader><CardTitle className="text-base">Filtreler</CardTitle></CardHeader>
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
        <div className="flex items-center justify-between rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm">
          <span className="font-medium text-red-700">{selectedIds.size} kayıt seçildi</span>
          <Button size="sm" variant="destructive" onClick={handleBulkDelete} className="gap-1.5 h-7">
            <Trash2 className="h-3.5 w-3.5" /> Seçilenleri Sil
          </Button>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Kayıt bulunamadı</div>
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
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium bg-blue-100 text-blue-700 border border-blue-200 rounded px-1.5 py-0.5 shrink-0">
                            <RefreshCw className="h-2.5 w-2.5" />{e.recurrence_interval}
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate text-muted-foreground">{e.note || "-"}</TableCell>
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

function NewExpenseDialog({
  open, setOpen, categories, sales, onCreated,
}: {
  open: boolean; setOpen: (v: boolean) => void;
  categories: string[]; sales: SaleRef[]; onCreated: () => void;
}) {
  const [settings] = useSettings();
  // Merge settings categories + DB categories, deduplicated
  const allCategories = Array.from(new Set([...settings.expenseCategories, ...categories])).sort();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
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
  });
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm({
      expense_date: today, category: "", newCategory: "", amount: "",
      paid_amount: "", payment_status: "bekliyor", note: "", sale_id: "",
      is_recurring: false, recurrence_interval: "Aylık",
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const cat = form.category === "__new__" ? form.newCategory.trim() : form.category;
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
    const { error } = await supabase.from("expenses").insert(payload);
    if (!error && form.category === "__new__" && cat) {
      await supabase.from("expense_categories").insert({ name: cat }).then(() => {});
    }
    setSaving(false);
    if (error) return toast.error("Eklenemedi: " + friendlyDbError(error));
    toast.success("Gider eklendi");
    reset();
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Yeni Gider</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Yeni Gider</DialogTitle></DialogHeader>
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
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
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
            <Button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
