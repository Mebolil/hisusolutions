import { useEffect, useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/butcecrm-helpers";
import { parseISO, differenceInDays } from "date-fns";
import { friendlyDbError } from "@/lib/butcecrm-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, ShoppingBag, Trash2, TrendingUp, BarChart3, Award, Pencil, ChevronUp, ChevronDown } from "lucide-react";
import { useSettings } from "@/lib/butcecrm-settings";
import { Link } from "@tanstack/react-router";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { CsvToolbar, type CsvField } from "@/components/butcecrm/CsvToolbar";

const SALES_CSV_FIELDS: CsvField[] = [
  { key: "sale_date",      label: "Tarih",          required: true, type: "date" },
  { key: "product_name",   label: "Ürün",           required: true },
  { key: "quantity",       label: "Miktar",         required: true, type: "number" },
  { key: "total_amount",   label: "Tutar",          required: true, type: "number" },
  { key: "total_cost",     label: "Maliyet",        type: "number" },
  { key: "paid_amount",    label: "Tahsil Edilen",  type: "number" },
  { key: "payment_status", label: "Ödeme Durumu",   required: true },
];
const SALES_CSV_SAMPLE = ["2025-05-01", "Örnek Ürün", 1, 100, 60, 100, "ödendi"];

type Sale = {
  id: string;
  sale_date: string;
  due_date: string | null;
  customer_id: string | null;
  product_name: string;
  quantity: number;
  total_amount: number;
  total_cost: number | null;
  paid_amount: number | null;
  payment_status: string;
  campaign_id: string | null;
  platform: string | null;
  note?: string | null;
};


function parseNoteField(notes: string | null | undefined, label: string): string {
  if (!notes) return "";
  const re = new RegExp(`^${label}:\\s*(.+)$`, "im");
  const m = notes.match(re);
  return m ? m[1].trim() : "";
}
type Customer = { id: string; name: string };
type Campaign = { id: string; name: string };
type Product = { id: string; name: string; quantity: number; unit_price: number | null };

const STATUSES = ["ödendi", "kısmi", "bekliyor"] as const;
type Status = (typeof STATUSES)[number];



export const Route = createFileRoute("/app/butcecrm/satislar")({
  head: () => ({ meta: [{ title: "BütçeCRM — Satışlar" }] }),
  component: SalesPage,
});

function statusBadge(s: string) {
  const map: Record<string, string> = {
    "ödendi": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "kısmi": "bg-amber-100 text-amber-700 border-amber-200",
    "bekliyor": "bg-red-100 text-red-700 border-red-200",
  };
  return map[s] || "bg-secondary text-foreground";
}

function SalesPage() {
  const [settings] = useSettings();
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;

  async function load() {
    setLoading(true);
    const [s, c, ca, p] = await Promise.all([
      supabase.from("sales").select("*").order("sale_date", { ascending: false }),
      supabase.from("customers").select("id,name").order("name"),
      supabase.from("campaigns").select("id,name").order("name"),
      supabase.from("products").select("id,name,quantity,unit_price").order("name"),
    ]);
    setSales((s.data as Sale[]) || []);
    setCustomers((c.data as Customer[]) || []);
    setCampaigns((ca.data as Campaign[]) || []);
    setProducts((p.data as Product[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const customerMap = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  );

  const platformList = useMemo(() => {
    const set = new Set<string>();
    sales.forEach((s) => s.platform && set.add(s.platform));
    return Array.from(set).sort();
  }, [sales]);

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (statusFilter !== "all" && s.payment_status !== statusFilter) return false;
      if (platformFilter !== "all" && (s.platform || "") !== platformFilter) return false;
      if (from && s.sale_date < from) return false;
      if (to && s.sale_date > to) return false;
      if (q) {
        const text = `${s.product_name} ${customerMap[s.customer_id || ""] || ""} ${s.note || ""}`.toLowerCase();
        if (!text.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [sales, statusFilter, platformFilter, from, to, q, customerMap]);

  // Filter değişince sayfayı sıfırla
  useEffect(() => { setPage(1); setSelectedIds(new Set()); }, [statusFilter, platformFilter, from, to, q]);

  const [sortKey, setSortKey] = useState<keyof Sale>("sale_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(col: keyof Sale) {
    if (sortKey === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col); setSortDir("asc"); }
  }

  function SortIcon({ col }: { col: keyof Sale }) {
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
  const pagedSales = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page],
  );

  const totals = useMemo(() => {
    const total = filtered.reduce((s, x) => s + Number(x.total_amount || 0), 0);
    const paid = filtered.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
    const cost = filtered.reduce((s, x) => s + Number(x.total_cost || 0), 0);
    const profit = total - cost;
    const margin = total > 0 ? (profit / total) * 100 : 0;
    const avg = filtered.length > 0 ? total / filtered.length : 0;
    return { total, paid, cost, profit, margin, avg, remaining: total - paid, count: filtered.length };
  }, [filtered]);

  const platformBreakdown = useMemo(() => {
    const map = new Map<string, { revenue: number; profit: number; count: number }>();
    filtered.forEach((s) => {
      const k = s.platform || "Belirtilmemiş";
      const cur = map.get(k) || { revenue: 0, profit: 0, count: 0 };
      cur.revenue += Number(s.total_amount || 0);
      cur.profit += Number(s.total_amount || 0) - Number(s.total_cost || 0);
      cur.count += 1;
      map.set(k, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  const topProducts = useMemo(() => {
    const map = new Map<string, { qty: number; revenue: number; profit: number }>();
    filtered.forEach((s) => {
      const k = s.product_name || "—";
      const cur = map.get(k) || { qty: 0, revenue: 0, profit: 0 };
      cur.qty += Number(s.quantity || 0);
      cur.revenue += Number(s.total_amount || 0);
      cur.profit += Number(s.total_amount || 0) - Number(s.total_cost || 0);
      map.set(k, cur);
    });
    return Array.from(map.entries())
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filtered]);

  async function updateStatus(sale: Sale, newStatus: Status) {
    const patch: Partial<Sale> = { payment_status: newStatus };
    if (newStatus === "ödendi") patch.paid_amount = Number(sale.total_amount);
    if (newStatus === "bekliyor") patch.paid_amount = 0;
    const { error } = await supabase.from("sales").update(patch).eq("id", sale.id);
    if (error) return toast.error("Güncellenemedi: " + friendlyDbError(error));
    toast.success("Ödeme durumu güncellendi");
    setSales((prev) => prev.map((s) => (s.id === sale.id ? { ...s, ...patch } as Sale : s)));
  }

  async function deleteSale(sale: Sale) {
    const { error } = await supabase.from("sales").delete().eq("id", sale.id);
    if (error) return toast.error("Silinemedi: " + friendlyDbError(error));
    setSales((prev) => prev.filter((s) => s.id !== sale.id));

    // Restore stock for the matching product
    const matched = products.find(
      (p) => p.name.trim().toLowerCase() === sale.product_name.trim().toLowerCase()
    );
    if (matched) {
      const newQty = (matched.quantity ?? 0) + (Number(sale.quantity) || 0);
      const { error: stockErr } = await supabase
        .from("products").update({ quantity: newQty }).eq("id", matched.id);
      if (stockErr) {
        toast.warning("Satış silindi ancak stok güncellenemedi: " + friendlyDbError(stockErr));
      } else {
        setProducts((prev) => prev.map((p) => p.id === matched.id ? { ...p, quantity: newQty } : p));
        toast.success("Satış silindi, stok geri yüklendi");
      }
    } else {
      toast.success("Satış silindi");
    }
  }

  const [editing, setEditing] = useState<Sale | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const pagedIds = pagedSales.map((s) => s.id);
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
    const { error } = await supabase.from("sales").delete().in("id", ids).eq("user_id", session.user.id);
    if (error) { console.error("bulk delete error", error); return toast.error("Silinemedi: " + friendlyDbError(error)); }
    toast.success(`${ids.length} satış silindi`);
    setSelectedIds(new Set());
    load();
  }

  return (
    <div className="space-y-6">
      <EditSaleDialog
        sale={editing}
        onClose={() => setEditing(null)}
        platforms={platformList}
        onSaved={(updated) => {
          setSales((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
          setEditing(null);
        }}
      />
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingBag className="h-6 w-6 text-primary" /> Satışlar</h1>
          <p className="text-muted-foreground text-sm">Tüm satışlar, ödeme durumları ve filtreleme</p>
        </div>
        <NewSaleDialog
          open={open}
          setOpen={setOpen}
          customers={customers}
          campaigns={campaigns}
          products={products}
          onCreated={load}
        />
      </div>

      <CsvToolbar
        slug="satislar"
        table="sales"
        fields={SALES_CSV_FIELDS}
        sampleRow={SALES_CSV_SAMPLE}
        exportRows={filtered.map((s) => ({
          sale_date: s.sale_date,
          product_name: s.product_name,
          quantity: s.quantity,
          total_amount: s.total_amount,
          total_cost: s.total_cost,
          paid_amount: s.paid_amount,
          payment_status: s.payment_status,
        }))}
        onImported={load}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Satış Adedi" value={String(totals.count)} />
        <StatCard label="Toplam Tutar" value={formatCurrency(totals.total)} />
        <StatCard label="Tahsil Edilen" value={formatCurrency(totals.paid)} valueClass="text-emerald-600" />
        <StatCard label="Kalan" value={formatCurrency(totals.remaining)} valueClass="text-amber-600" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam Maliyet" value={formatCurrency(totals.cost)} valueClass="text-muted-foreground" />
        <StatCard label="Net Kâr" value={formatCurrency(totals.profit)} valueClass={totals.profit >= 0 ? "text-emerald-600" : "text-red-600"} />
        <StatCard label="Kâr Marjı" value={`${totals.margin.toFixed(1)}%`} valueClass={totals.margin >= 0 ? "text-emerald-600" : "text-red-600"} />
        <StatCard label="Ortalama Sepet" value={formatCurrency(totals.avg)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3">
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
              <Label className="text-xs">Platform</Label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {platformList.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
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
              <Label className="text-xs">Ara (ürün / müşteri)</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara..." className="pl-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" /> Platform Dağılımı
            </CardTitle>
          </CardHeader>
          <CardContent>
            {platformBreakdown.length === 0 ? (
              <p className="text-sm text-muted-foreground">Veri yok</p>
            ) : (
              <div className="space-y-3">
                {platformBreakdown.map((p) => {
                  const pct = totals.total > 0 ? (p.revenue / totals.total) * 100 : 0;
                  return (
                    <div key={p.name}>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="font-medium">{p.name}</span>
                        <span className="text-muted-foreground text-xs">
                          {p.count} satış · {formatCurrency(p.revenue)} · kâr {formatCurrency(p.profit)}
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" /> En Çok Satan 5 Ürün
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topProducts.length === 0 ? (
              <p className="text-sm text-muted-foreground">Veri yok</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ürün</TableHead>
                    <TableHead className="text-right">Adet</TableHead>
                    <TableHead className="text-right">Ciro</TableHead>
                    <TableHead className="text-right">Kâr</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topProducts.map((p) => (
                    <TableRow key={p.name}>
                      <TableCell className="max-w-[180px] truncate">{p.name}</TableCell>
                      <TableCell className="text-right">{p.qty}</TableCell>
                      <TableCell className="text-right">{formatCurrency(p.revenue)}</TableCell>
                      <TableCell className={`text-right ${p.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                        {formatCurrency(p.profit)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

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
                  {([["sale_date","Tarih"],["due_date","Vade"],["customer_id","Müşteri"],["product_name","Ürün"],["platform","Platform"]] as [keyof Sale, string][]).map(([col, label]) => (
                    <TableHead key={col} className="cursor-pointer select-none" onClick={() => handleSort(col)}>
                      <span className="inline-flex items-center gap-1">{label}<SortIcon col={col} /></span>
                    </TableHead>
                  ))}
                  {([["quantity","Miktar"],["total_amount","Tutar"],["total_cost","Maliyet"]] as [keyof Sale, string][]).map(([col, label]) => (
                    <TableHead key={col} className="text-right cursor-pointer select-none" onClick={() => handleSort(col)}>
                      <span className="inline-flex items-center justify-end gap-1">{label}<SortIcon col={col} /></span>
                    </TableHead>
                  ))}
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("total_amount")}>
                    <span className="inline-flex items-center justify-end gap-1">Kâr</span>
                  </TableHead>
                  <TableHead className="text-right cursor-pointer select-none" onClick={() => handleSort("paid_amount")}>
                    <span className="inline-flex items-center justify-end gap-1">Tahsil<SortIcon col="paid_amount" /></span>
                  </TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-[90px]">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedSales.map((s) => {
                  const profit = Number(s.total_amount || 0) - Number(s.total_cost || 0);
                  return (
                  <TableRow key={s.id} className={selectedIds.has(s.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleOne(s.id)} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(s.sale_date)}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      {s.due_date ? (() => {
                        const overdue = s.payment_status !== "ödendi" ? differenceInDays(new Date(), parseISO(s.due_date)) : -1;
                        return (
                          <span className={overdue > 0 ? "text-red-600 font-medium" : "text-muted-foreground"}>
                            {formatDate(s.due_date)}{overdue > 0 && ` (${overdue}g geçti)`}
                          </span>
                        );
                      })() : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate">{customerMap[s.customer_id || ""] || "-"}</TableCell>
                    <TableCell className="max-w-[220px] truncate">{s.product_name}</TableCell>
                    <TableCell>
                      {s.platform ? (
                        <span className="inline-flex items-center rounded-full border px-2 py-0.5 text-xs bg-secondary">
                          {s.platform}
                        </span>
                      ) : <span className="text-muted-foreground text-xs">—</span>}
                    </TableCell>
                    <TableCell className="text-right">{Number(s.quantity)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(Number(s.total_amount))}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{formatCurrency(Number(s.total_cost || 0))}</TableCell>
                    <TableCell className={`text-right font-medium ${profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                      {formatCurrency(profit)}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(s.paid_amount || 0))}</TableCell>
                    <TableCell>
                      <Select value={s.payment_status} onValueChange={(v) => updateStatus(s, v as Status)}>
                        <SelectTrigger className={`h-8 w-[130px] border ${statusBadge(s.payment_status)}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {STATUSES.map((st) => <SelectItem key={st} value={st}>{st}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditing(s)} title="Düzenle">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600" title="Sil">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Satışı sil?</AlertDialogTitle>
                              <AlertDialogDescription>
                                Bu işlem geri alınamaz. "{s.product_name}" satışı kalıcı olarak silinecek.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>İptal</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteSale(s)}>Sil</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
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

function NewSaleDialog({
  open, setOpen, customers, campaigns, products, onCreated,
}: {
  open: boolean; setOpen: (v: boolean) => void;
  customers: Customer[]; campaigns: Campaign[]; products: Product[]; onCreated: () => void;
}) {
  const [settings, setSettings] = useSettings();
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    sale_date: today,
    due_date: "",
    customer_id: "",
    product_id: "",
    product_name: "",
    quantity: "1",
    unit_price: "",
    discount: "",
    total_amount: "",
    total_cost: "",
    paid_amount: "",
    payment_status: "bekliyor" as Status,
    campaign_id: "",
    platform: "",
    notes: "",
  });
  type CostItem = { id: string; label: string; amount: string };
  const defaultCosts = (): CostItem[] =>
    settings.costItems.map((label) => ({ id: label, label, amount: "" }));
  const [costs, setCosts] = useState<CostItem[]>(defaultCosts());
  const costsRef = useRef(costs);
  costsRef.current = costs; // always latest, safe to read in async handlers
  const [lastPurchasePrice, setLastPurchasePrice] = useState<number | null>(null);
  const [commissionPct, setCommissionPct] = useState("");
  const [decrementStock, setDecrementStock] = useState(true);
  const [saving, setSaving] = useState(false);
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quick, setQuick] = useState({ name: "", phone: "", email: "" });
  const [quickSaving, setQuickSaving] = useState(false);
  const platforms = settings.platforms;
  const [newPlatformOpen, setNewPlatformOpen] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState("");

  useEffect(() => { setLocalCustomers(customers); }, [customers]);

  function reset() {
    setForm({
      sale_date: today, due_date: "", customer_id: "", product_id: "", product_name: "", quantity: "1",
      unit_price: "", discount: "",
      total_amount: "", total_cost: "", paid_amount: "",
      payment_status: "bekliyor", campaign_id: "", platform: "", notes: "",
    });
    setCosts(defaultCosts());
    setCommissionPct("");
    setLastPurchasePrice(null);
    setDecrementStock(true);
  }

  // Auto-calc total from unit_price * quantity - discount
  useEffect(() => {
    const qty = Number(form.quantity) || 0;
    const up = Number(form.unit_price) || 0;
    const disc = Number(form.discount) || 0;
    if (up > 0 && qty > 0) {
      const t = +(Math.max(0, up * qty - disc)).toFixed(2);
      setForm((f) => (f.total_amount === String(t) ? f : { ...f, total_amount: String(t) }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.unit_price, form.quantity, form.discount]);

  // Auto-calc commission amount from percentage of total_amount
  useEffect(() => {
    const pct = Number(commissionPct) || 0;
    const total = Number(form.total_amount) || 0;
    if (pct > 0 && total > 0) {
      const c = ((total * pct) / 100).toFixed(2);
      setCosts((prev) => prev.map((item) => /komisyon/i.test(item.label) && item.amount !== c ? { ...item, amount: c } : item));
    }
  }, [commissionPct, form.total_amount]);

  // When quantity changes and we have a purchase price, update Ürün Maliyeti
  useEffect(() => {
    if (lastPurchasePrice == null) return;
    const qty = Number(form.quantity) || 1;
    setCosts((prev) =>
      prev.map((c) =>
        /ürün maliyeti/i.test(c.label)
          ? { ...c, amount: (lastPurchasePrice * qty).toFixed(2) }
          : c
      )
    );
  }, [form.quantity, lastPurchasePrice]);

  // Sum cost breakdown -> total_cost
  const breakdownSum = useMemo(() => costs.reduce((s, item) => s + (Number(item.amount) || 0), 0), [costs]);

  useEffect(() => {
    const anyFilled = costs.some((item) => item.amount !== "");
    if (anyFilled) {
      setForm((f) => (f.total_cost === breakdownSum.toFixed(2) ? f : { ...f, total_cost: breakdownSum.toFixed(2) }));
    }
  }, [breakdownSum, costs]);

  async function selectProduct(id: string) {
    if (id === "__manual__") {
      setForm((f) => ({ ...f, product_id: "", product_name: "" }));
      setLastPurchasePrice(null);
      return;
    }
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setForm((f) => ({
      ...f,
      product_id: p.id,
      product_name: p.name,
      unit_price: p.unit_price != null ? String(p.unit_price) : f.unit_price,
    }));
    // Fetch latest purchase unit_price for this product by name
    const { data } = await supabase
      .from("purchases")
      .select("unit_price")
      .eq("product_name", p.name)
      .order("purchase_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    const purchasePrice = data?.unit_price ? Number(data.unit_price) : null;
    setLastPurchasePrice(purchasePrice);
    if (purchasePrice != null) {
      const qty = Number(form.quantity) || 1;
      setCosts((prev) =>
        prev.map((c) =>
          /ürün maliyeti/i.test(c.label)
            ? { ...c, amount: (purchasePrice * qty).toFixed(2) }
            : c
        )
      );
    }
  }

  function addPlatform(name: string) {
    const v = name.trim();
    if (!v) return;
    if (!platforms.includes(v)) {
      setSettings({ ...settings, platforms: [...platforms, v] });
    }
    setForm((f) => ({ ...f, platform: v }));
  }


  async function saveQuickCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!quick.name.trim()) return toast.error("İsim zorunludur");
    setQuickSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setQuickSaving(false); return toast.error("Oturum bulunamadı"); }
    const { data, error } = await supabase.from("customers").insert({
      user_id: session.user.id,
      name: quick.name.trim(),
      phone: quick.phone.trim() || null,
      email: quick.email.trim() || null,
    }).select("id,name").single();
    setQuickSaving(false);
    if (error || !data) return toast.error("Eklenemedi: " + friendlyDbError(error));
    setLocalCustomers((prev) => [...prev, data as Customer].sort((a, b) => a.name.localeCompare(b.name)));
    setForm((f) => ({ ...f, customer_id: data.id }));
    setQuick({ name: "", phone: "", email: "" });
    setQuickOpen(false);
    toast.success("Müşteri eklendi");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.product_name || !form.total_amount) {
      return toast.error("Ürün ve tutar zorunludur");
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      setSaving(false);
      return toast.error("Oturum bulunamadı, lütfen tekrar giriş yapın");
    }
    const total = Number(form.total_amount);
    // Derive paid from status — don't trust paid_amount string which can be "0" from early Ödendi click
    const paid = form.payment_status === "ödendi" ? total
               : form.payment_status === "bekliyor" ? 0
               : (Number(form.paid_amount) || 0);
    // Use ref to get the latest costs even if the closure is stale
    const latestCosts = costsRef.current;
    const costSum = latestCosts.reduce((s, item) => s + (Number(item.amount) || 0), 0);
    const finalCost = costSum > 0 ? costSum : (form.total_cost ? Number(form.total_cost) : 0);
    const payload: Record<string, unknown> = {
      user_id: session.user.id,
      sale_date: form.sale_date,
      customer_id: form.customer_id || null,
      product_name: form.product_name,
      quantity: Number(form.quantity) || 1,
      total_amount: total,
      total_cost: finalCost,
      paid_amount: paid,
      payment_status: form.payment_status,
      campaign_id: form.campaign_id || null,
      platform: form.platform || null,
    };
    // Only include due_date if the user entered one (column may not exist in DB yet)
    if (form.due_date) payload.due_date = form.due_date;
    // Build a cost-breakdown summary and append to notes for record-keeping
    const breakdownLines = latestCosts
      .filter((item) => Number(item.amount) > 0)
      .map((item) => `${item.label}: ${Number(item.amount).toFixed(2)} ₺`);
    let combinedNotes = form.notes.trim();
    if (breakdownLines.length) {
      const header = "[Maliyet Kalemleri]\n" + breakdownLines.join("\n");
      combinedNotes = combinedNotes ? `${combinedNotes}\n\n${header}` : header;
    }
    if (combinedNotes) payload.note = combinedNotes;
    console.debug("INSERT payload", JSON.stringify(payload));
    let { error, data: insertedData } = await supabase.from("sales").insert(payload).select("id,total_cost").single();
    console.debug("INSERT result", error, insertedData);
    if (error) {
      // Retry without note if column doesn't exist yet
      if (payload.note && /\bnote\b/i.test(error.message)) {
        delete payload.note;
        ({ error } = await supabase.from("sales").insert(payload));
      }
    }
    if (error) {
      setSaving(false);
      return toast.error("Eklenemedi: " + friendlyDbError(error));
    }
    // Decrement product stock if linked
    if (decrementStock && form.product_id) {
      const prod = products.find((p) => p.id === form.product_id);
      if (prod) {
        const newQty = Math.max(0, Number(prod.quantity || 0) - (Number(form.quantity) || 1));
        const { error: stockErr } = await supabase
          .from("products").update({ quantity: newQty }).eq("id", form.product_id);
        if (stockErr) toast.warning("Satış kaydedildi ancak stok güncellenemedi: " + friendlyDbError(stockErr));
      }
    }
    setSaving(false);
    toast.success("Satış eklendi");
    reset();
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Yeni Satış</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Yeni Satış</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Satış Tarihi</Label>
              <Input type="date" value={form.sale_date}
                onChange={(e) => setForm({ ...form, sale_date: e.target.value })} required />
            </div>
            <div>
              <Label>Ödeme Vadesi</Label>
              <Input type="date" value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Müşteri</Label>
            <Select
              value={form.customer_id}
              onValueChange={(v) => {
                if (v === "__new__") { setQuickOpen(true); return; }
                setForm({ ...form, customer_id: v });
              }}
            >
              <SelectTrigger><SelectValue placeholder="Seç (opsiyonel)" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__new__" className="text-primary font-medium">
                  + Yeni Müşteri
                </SelectItem>
                {localCustomers.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Ürün</Label>
            <Select
              value={form.product_id || (form.product_name ? "__manual__" : "")}
              onValueChange={selectProduct}
            >
              <SelectTrigger>
                <SelectValue placeholder="Stoktan seç veya manuel gir" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__manual__" className="text-primary font-medium">
                  + Manuel Ürün (stokta yok)
                </SelectItem>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.quantity != null ? `(stok: ${p.quantity})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!form.product_id && (
              <Input
                className="mt-2"
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                placeholder="Ürün adı"
                required
              />
            )}
            {form.product_id && (
              <label className="mt-2 flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <Checkbox
                  checked={decrementStock}
                  onCheckedChange={(v) => setDecrementStock(!!v)}
                />
                Satış kaydedilince stoktan düş
              </label>
            )}
          </div>
          <div className="grid grid-cols-4 gap-3">
            <div>
              <Label>Miktar</Label>
              <Input type="number" min="1" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <Label>Birim Fiyat (₺)</Label>
              <Input type="number" step="0.01" value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
                placeholder="opsiyonel" />
            </div>
            <div>
              <Label>İskonto (₺)</Label>
              <Input type="number" step="0.01" value={form.discount}
                onChange={(e) => setForm({ ...form, discount: e.target.value })}
                placeholder="0" />
            </div>
            <div>
              <Label>Toplam (₺)</Label>
              <Input type="number" step="0.01" value={form.total_amount}
                onChange={(e) => setForm({ ...form, total_amount: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>Tahsilat</Label>
            <div className="flex rounded-md overflow-hidden border text-sm font-medium">
              {(["ödendi", "bekliyor", "kısmi"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    const total = Number(form.total_amount) || 0;
                    setForm((f) => ({
                      ...f,
                      payment_status: s,
                      paid_amount: s === "ödendi" ? String(total) : s === "bekliyor" ? "0" : f.paid_amount,
                    }));
                  }}
                  className={`flex-1 py-2 capitalize transition-colors ${
                    form.payment_status === s
                      ? s === "ödendi"
                        ? "bg-emerald-500 text-white"
                        : s === "bekliyor"
                        ? "bg-red-500 text-white"
                        : "bg-amber-400 text-white"
                      : "bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
            {form.payment_status === "kısmi" && (
              <Input
                type="number"
                step="0.01"
                className="mt-2"
                value={form.paid_amount}
                onChange={(e) => setForm({ ...form, paid_amount: e.target.value })}
                placeholder="Tahsil edilen tutar (₺)"
              />
            )}
          </div>

          <div className="rounded-md border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Maliyet Kalemleri</p>
              <p className="text-xs text-muted-foreground">
                Toplam Maliyet: <span className="font-bold text-foreground">{formatCurrency(breakdownSum)}</span>
              </p>
            </div>
            <div className="space-y-2">
              {costs.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Input
                    className="flex-1 h-8 text-sm"
                    value={item.label}
                    onChange={(e) => setCosts((prev) => prev.map((c) => c.id === item.id ? { ...c, label: e.target.value } : c))}
                    placeholder="Kalem adı"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    className="w-28 h-8 text-sm"
                    value={item.amount}
                    onChange={(e) => {
                      if (/komisyon/i.test(item.label)) setCommissionPct("");
                      setCosts((prev) => prev.map((c) => c.id === item.id ? { ...c, amount: e.target.value } : c));
                    }}
                    placeholder="₺"
                  />
                  {/komisyon/i.test(item.label) && (
                    <Input
                      type="number"
                      step="0.1"
                      className="w-16 h-8 text-sm"
                      value={commissionPct}
                      onChange={(e) => setCommissionPct(e.target.value)}
                      placeholder="%"
                    />
                  )}
                  <button
                    type="button"
                    onClick={() => setCosts((prev) => prev.filter((c) => c.id !== item.id))}
                    className="text-muted-foreground hover:text-red-500 px-1 text-sm font-bold leading-none"
                    title="Kaldır"
                  >×</button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setCosts((prev) => [...prev, { id: `custom_${Date.now()}`, label: "", amount: "" }])}
              className="text-xs text-primary hover:underline"
            >+ Kalem ekle</button>
            <p className="text-[11px] text-muted-foreground">
              Kalemler doldurulunca Toplam Maliyet otomatik hesaplanır ve notlara eklenir.
            </p>
          </div>

          <div>
            <Label>Toplam Maliyet (₺)</Label>
            {costs.some((c) => Number(c.amount) > 0) ? (
              <div className="flex h-9 w-full rounded-md border border-input bg-muted px-3 py-2 text-sm font-medium">
                {formatCurrency(breakdownSum)}
                <span className="ml-auto text-[10px] text-muted-foreground self-center">kalemlerden</span>
              </div>
            ) : (
              <Input type="number" step="0.01" value={form.total_cost}
                onChange={(e) => setForm({ ...form, total_cost: e.target.value })}
                placeholder="Manuel gir" />
            )}
          </div>

          {/* Dynamic profit summary */}
          {(() => {
            const gelir = Number(form.total_amount) || 0;
            const maliyet = breakdownSum > 0 ? breakdownSum : (Number(form.total_cost) || 0);
            const kar = gelir - maliyet;
            return (
              <div className="rounded-md border bg-muted/40 divide-y text-sm">
                <div className="flex justify-between px-3 py-2">
                  <span className="text-muted-foreground">Gelir</span>
                  <span className="font-medium">{formatCurrency(gelir)}</span>
                </div>
                <div className="flex justify-between px-3 py-2">
                  <span className="text-muted-foreground">Toplam Maliyet</span>
                  <span className="font-medium text-red-500">-{formatCurrency(maliyet)}</span>
                </div>
                <div className="flex justify-between px-3 py-2 font-semibold">
                  <span>Net Kâr</span>
                  <span className={kar >= 0 ? "text-emerald-600" : "text-red-600"}>
                    {formatCurrency(kar)}
                  </span>
                </div>
              </div>
            );
          })()}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Platform</Label>
              <Select
                value={form.platform}
                onValueChange={(v) => {
                  if (v === "__new__") { setNewPlatformOpen(true); return; }
                  setForm({ ...form, platform: v });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Seç (opsiyonel)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__new__" className="text-primary font-medium">
                    + Yeni Platform
                  </SelectItem>
                  {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Kampanya (opsiyonel)</Label>
              <Select value={form.campaign_id} onValueChange={(v) => setForm({ ...form, campaign_id: v })}>
                <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                <SelectContent>
                  {campaigns.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Notlar (opsiyonel)</Label>
            <Textarea
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              placeholder="Sipariş notu, kargo bilgisi, vb."
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Yeni Müşteri</DialogTitle></DialogHeader>
          <form onSubmit={saveQuickCustomer} className="space-y-3">
            <div>
              <Label>İsim</Label>
              <Input value={quick.name} maxLength={120}
                onChange={(e) => setQuick({ ...quick, name: e.target.value })} required autoFocus />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Telefon</Label>
                <Input value={quick.phone} maxLength={40}
                  onChange={(e) => setQuick({ ...quick, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={quick.email} maxLength={255}
                  onChange={(e) => setQuick({ ...quick, email: e.target.value })} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setQuickOpen(false)}>İptal</Button>
              <Button type="submit" disabled={quickSaving}>{quickSaving ? "Kaydediliyor..." : "Ekle"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={newPlatformOpen} onOpenChange={setNewPlatformOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Yeni Platform</DialogTitle></DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!newPlatformName.trim()) return;
              addPlatform(newPlatformName);
              setNewPlatformName("");
              setNewPlatformOpen(false);
            }}
            className="space-y-3"
          >
            <div>
              <Label>Platform adı</Label>
              <Input value={newPlatformName} maxLength={60} autoFocus
                onChange={(e) => setNewPlatformName(e.target.value)}
                placeholder="Örn. Çiçeksepeti" required />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewPlatformOpen(false)}>İptal</Button>
              <Button type="submit">Ekle</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}

type EditCostItem = { id: string; label: string; amount: string };

function parseCostsFromNote(note: string | null | undefined): { costs: EditCostItem[]; baseNote: string } {
  if (!note) return { costs: [], baseNote: "" };
  const marker = "[Maliyet Kalemleri]";
  const idx = note.indexOf(marker);
  if (idx === -1) return { costs: [], baseNote: note };
  const baseNote = note.slice(0, idx).trim();
  const block = note.slice(idx + marker.length).trim();
  const costs: EditCostItem[] = block
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // "Komisyon: 200.00 ₺" → label=Komisyon, amount=200.00
      const m = line.match(/^(.+?):\s*([\d.]+)/);
      if (m) return { id: `parsed_${m[1]}`, label: m[1].trim(), amount: m[2] };
      return { id: `parsed_${line}`, label: line, amount: "" };
    });
  return { costs, baseNote };
}

function EditSaleDialog({
  sale, onClose, onSaved, platforms,
}: {
  sale: Sale | null;
  onClose: () => void;
  onSaved: (updated: Sale) => void;
  platforms: string[];
}) {
  const [form, setForm] = useState<Sale | null>(sale);
  const [saving, setSaving] = useState(false);
  const [editCosts, setEditCosts] = useState<EditCostItem[]>([]);
  const [baseNote, setBaseNote] = useState("");

  useEffect(() => {
    setForm(sale);
    if (sale) {
      const parsed = parseCostsFromNote(sale.note);
      setEditCosts(parsed.costs.length > 0 ? parsed.costs : [{ id: "default_0", label: "Ürün Maliyeti", amount: "" }]);
      setBaseNote(parsed.baseNote);
    }
  }, [sale]);

  if (!form) return null;

  const costSum = editCosts.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const netProfit = Number(form.total_amount || 0) - costSum;

  async function save() {
    if (!form) return;
    setSaving(true);
    const breakdownLines = editCosts
      .filter((c) => Number(c.amount) > 0)
      .map((c) => `${c.label}: ${Number(c.amount).toFixed(2)} ₺`);
    let combinedNote = baseNote.trim();
    if (breakdownLines.length) {
      const header = "[Maliyet Kalemleri]\n" + breakdownLines.join("\n");
      combinedNote = combinedNote ? `${combinedNote}\n\n${header}` : header;
    }
    const totalCost = costSum > 0 ? costSum : (form.total_cost ? Number(form.total_cost) : null);
    const payload: Record<string, unknown> = {
      sale_date: form.sale_date,
      due_date: form.due_date || null,
      product_name: form.product_name,
      quantity: Number(form.quantity) || 0,
      total_amount: Number(form.total_amount) || 0,
      total_cost: totalCost,
      paid_amount: form.paid_amount == null || form.paid_amount === ("" as unknown) ? null : Number(form.paid_amount),
      payment_status: form.payment_status,
      platform: form.platform || null,
      note: combinedNote || null,
    };
    let { error } = await supabase.from("sales").update(payload).eq("id", form.id);
    if (error && /\bnote\b/i.test(error.message)) {
      delete payload.note;
      ({ error } = await supabase.from("sales").update(payload).eq("id", form.id));
    }
    setSaving(false);
    if (error) return toast.error("Güncellenemedi: " + friendlyDbError(error));
    toast.success("Satış güncellendi");
    onSaved({ ...form, ...(payload as Partial<Sale>) } as Sale);
  }

  return (
    <Dialog open={!!sale} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Satışı Düzenle</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Satış Tarihi</Label>
            <Input type="date" value={form.sale_date}
              onChange={(e) => setForm({ ...form, sale_date: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Ödeme Vadesi</Label>
            <Input type="date" value={form.due_date || ""}
              onChange={(e) => setForm({ ...form, due_date: e.target.value || null })} />
          </div>
          <div>
            <Label className="text-xs">Platform</Label>
            <Select value={form.platform || ""} onValueChange={(v) => setForm({ ...form, platform: v })}>
              <SelectTrigger><SelectValue placeholder="Seçin" /></SelectTrigger>
              <SelectContent>
                {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Ürün</Label>
            <Input value={form.product_name}
              onChange={(e) => setForm({ ...form, product_name: e.target.value })} />
          </div>
          <div>
            <Label className="text-xs">Miktar</Label>
            <Input type="number" value={form.quantity}
              onChange={(e) => setForm({ ...form, quantity: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Tutar (₺)</Label>
            <Input type="number" step="0.01" value={form.total_amount}
              onChange={(e) => setForm({ ...form, total_amount: Number(e.target.value) })} />
          </div>
          <div>
            <Label className="text-xs">Tahsil Edilen (₺)</Label>
            <Input type="number" step="0.01" value={form.paid_amount ?? ""}
              onChange={(e) => setForm({ ...form, paid_amount: e.target.value === "" ? null : Number(e.target.value) })} />
          </div>
          <div className="col-span-2">
            <Label className="text-xs">Ödeme Durumu</Label>
            <Select value={form.payment_status} onValueChange={(v) => setForm({ ...form, payment_status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Cost items breakdown */}
          <div className="col-span-2 rounded-md border bg-muted/30 p-3 space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Maliyet Kalemleri</p>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span>Toplam Maliyet: <span className="font-bold text-foreground">{formatCurrency(costSum)}</span></span>
                <span>Net Kâr: <span className={`font-bold ${netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>{formatCurrency(netProfit)}</span></span>
              </div>
            </div>
            <div className="space-y-2">
              {editCosts.map((item) => (
                <div key={item.id} className="flex items-center gap-2">
                  <Input
                    className="flex-1 h-8 text-sm"
                    value={item.label}
                    onChange={(e) => setEditCosts((prev) => prev.map((c) => c.id === item.id ? { ...c, label: e.target.value } : c))}
                    placeholder="Kalem adı"
                  />
                  <Input
                    type="number"
                    step="0.01"
                    className="w-28 h-8 text-sm"
                    value={item.amount}
                    onChange={(e) => setEditCosts((prev) => prev.map((c) => c.id === item.id ? { ...c, amount: e.target.value } : c))}
                    placeholder="₺"
                  />
                  <button
                    type="button"
                    onClick={() => setEditCosts((prev) => prev.filter((c) => c.id !== item.id))}
                    className="text-muted-foreground hover:text-red-500 px-1 text-sm font-bold leading-none"
                    title="Kaldır"
                  >×</button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setEditCosts((prev) => [...prev, { id: `custom_${Date.now()}`, label: "", amount: "" }])}
              className="text-xs text-primary hover:underline"
            >+ Kalem ekle</button>
          </div>

          <div className="col-span-2">
            <Label className="text-xs">Notlar</Label>
            <Textarea rows={3} value={baseNote}
              onChange={(e) => setBaseNote(e.target.value)}
              placeholder="Sipariş Durumu: Kargoda&#10;Kargo Firması: Yurtiçi Kargo&#10;..." />
            <p className="text-[10px] text-muted-foreground mt-1">
              "Sipariş Durumu: ...", "Kargo Firması: ..." satırları filtrelerde kullanılır.
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button onClick={save} disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
