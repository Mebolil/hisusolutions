import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/butcecrm-helpers";
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
import { Plus, Search, ShoppingCart, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CsvToolbar, type CsvField } from "@/components/butcecrm/CsvToolbar";

const PURCHASES_CSV_FIELDS: CsvField[] = [
  { key: "purchase_date",  label: "Tarih",         required: true, type: "date" },
  { key: "product_name",   label: "Ürün",          required: true },
  { key: "quantity",       label: "Miktar",        required: true, type: "number" },
  { key: "unit_price",     label: "Birim Fiyat",   required: true, type: "number" },
  { key: "amount",         label: "Tutar",         required: true, type: "number" },
  { key: "paid_amount",    label: "Ödenen",        type: "number" },
  { key: "payment_status", label: "Ödeme Durumu",  required: true },
];
const PURCHASES_CSV_SAMPLE = ["2025-05-01", "Örnek Ürün", 10, 50, 500, 500, "ödendi"];

type Purchase = {
  id: string;
  purchase_date: string;
  supplier_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number | null;
  amount: number;
  paid_amount: number | null;
  payment_status: string;
};
type Supplier = { id: string; name: string };

const STATUSES = ["ödendi", "kısmi", "bekliyor"] as const;
type Status = (typeof STATUSES)[number];

export const Route = createFileRoute("/app/butcecrm/alislar")({
  head: () => ({ meta: [{ title: "BütçeCRM — Alışlar" }] }),
  component: PurchasesPage,
});

function statusBadge(s: string) {
  const map: Record<string, string> = {
    "ödendi": "bg-emerald-100 text-emerald-700 border-emerald-200",
    "kısmi": "bg-amber-100 text-amber-700 border-amber-200",
    "bekliyor": "bg-red-100 text-red-700 border-red-200",
  };
  return map[s] || "bg-secondary text-foreground";
}

type Product = { id: string; name: string; unit_price: number | null; quantity: number | null };

function PurchasesPage() {
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [supplierFilter, setSupplierFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 50;
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    const [p, s, pr] = await Promise.all([
      supabase.from("purchases").select("*").order("purchase_date", { ascending: false }),
      supabase.from("suppliers").select("id,name").order("name"),
      supabase.from("products").select("id,name,unit_price,quantity").order("name"),
    ]);
    setPurchases((p.data as Purchase[]) || []);
    setSuppliers((s.data as Supplier[]) || []);
    setProducts((pr.data as Product[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const supplierMap = useMemo(
    () => Object.fromEntries(suppliers.map((s) => [s.id, s.name])),
    [suppliers],
  );

  const filtered = useMemo(() => {
    return purchases.filter((p) => {
      if (statusFilter !== "all" && p.payment_status !== statusFilter) return false;
      if (supplierFilter !== "all" && p.supplier_id !== supplierFilter) return false;
      if (from && p.purchase_date < from) return false;
      if (to && p.purchase_date > to) return false;
      if (q) {
        const text = `${p.product_name} ${supplierMap[p.supplier_id || ""] || ""}`.toLowerCase();
        if (!text.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [purchases, statusFilter, supplierFilter, from, to, q, supplierMap]);

  useEffect(() => { setPage(1); setSelectedIds(new Set()); }, [statusFilter, supplierFilter, from, to, q]);

  const [sortKey, setSortKey] = useState<keyof Purchase>("purchase_date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(col: keyof Purchase) {
    if (sortKey === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col); setSortDir("asc"); }
  }

  function SortIcon({ col }: { col: keyof Purchase }) {
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
  const pagedPurchases = useMemo(
    () => sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [sorted, page],
  );

  const totals = useMemo(() => {
    const total = filtered.reduce((s, x) => s + Number(x.amount || 0), 0);
    const paid = filtered.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
    return { total, paid, remaining: total - paid, count: filtered.length };
  }, [filtered]);

  const pagedIds = pagedPurchases.map((p) => p.id);
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
    const { error } = await supabase.from("purchases").delete().in("id", ids).eq("user_id", session.user.id);
    if (error) return toast.error("Silinemedi: " + friendlyDbError(error));
    toast.success(`${ids.length} alış silindi`);
    setSelectedIds(new Set());
    load();
  }

  async function updateStatus(p: Purchase, newStatus: Status) {
    const patch: Partial<Purchase> = { payment_status: newStatus };
    if (newStatus === "ödendi") patch.paid_amount = Number(p.amount);
    if (newStatus === "bekliyor") patch.paid_amount = 0;
    const { error } = await supabase.from("purchases").update(patch).eq("id", p.id);
    if (error) return toast.error("Güncellenemedi: " + friendlyDbError(error));
    toast.success("Ödeme durumu güncellendi");
    setPurchases((prev) => prev.map((x) => (x.id === p.id ? { ...x, ...patch } as Purchase : x)));
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ShoppingCart className="h-6 w-6 text-primary" /> Alışlar</h1>
          <p className="text-muted-foreground text-sm">Tedarikçi alışları, ödeme durumları ve filtreleme</p>
        </div>
        <NewPurchaseDialog
          open={open} setOpen={setOpen}
          suppliers={suppliers} products={products} onCreated={load}
        />
      </div>

      <CsvToolbar
        slug="alislar"
        table="purchases"
        fields={PURCHASES_CSV_FIELDS}
        sampleRow={PURCHASES_CSV_SAMPLE}
        exportRows={filtered.map((p) => ({
          purchase_date: p.purchase_date,
          product_name: p.product_name,
          quantity: p.quantity,
          unit_price: p.unit_price,
          amount: p.amount,
          paid_amount: p.paid_amount,
          payment_status: p.payment_status,
        }))}
        onImported={load}
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Alış Adedi" value={String(totals.count)} />
        <StatCard label="Toplam Tutar" value={formatCurrency(totals.total)} />
        <StatCard label="Ödenen" value={formatCurrency(totals.paid)} valueClass="text-emerald-600" />
        <StatCard label="Tedarikçi Borcu" value={formatCurrency(totals.remaining)} valueClass="text-amber-600" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filtreler</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">Tedarikçi</Label>
              <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {suppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
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
              <Label className="text-xs">Ara (ürün / tedarikçi)</Label>
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
                  {([["purchase_date","Tarih"],["supplier_id","Tedarikçi"],["product_name","Ürün"]] as [keyof Purchase, string][]).map(([col, label]) => (
                    <TableHead key={col} className="cursor-pointer select-none" onClick={() => handleSort(col)}>
                      <span className="inline-flex items-center gap-1">{label}<SortIcon col={col} /></span>
                    </TableHead>
                  ))}
                  {([["quantity","Miktar"],["unit_price","Birim Fiyat"],["amount","Tutar"],["paid_amount","Ödenen"]] as [keyof Purchase, string][]).map(([col, label]) => (
                    <TableHead key={col} className="text-right cursor-pointer select-none" onClick={() => handleSort(col)}>
                      <span className="inline-flex items-center justify-end gap-1">{label}<SortIcon col={col} /></span>
                    </TableHead>
                  ))}
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pagedPurchases.map((p) => (
                  <TableRow key={p.id} className={selectedIds.has(p.id) ? "bg-muted/50" : ""}>
                    <TableCell>
                      <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleOne(p.id)} />
                    </TableCell>
                    <TableCell className="whitespace-nowrap">{formatDate(p.purchase_date)}</TableCell>
                    <TableCell className="max-w-[160px] truncate">{supplierMap[p.supplier_id || ""] || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{p.product_name}</TableCell>
                    <TableCell className="text-right">{Number(p.quantity)}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(p.unit_price || 0))}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(Number(p.amount))}</TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(p.paid_amount || 0))}</TableCell>
                    <TableCell>
                      <Select value={p.payment_status} onValueChange={(v) => updateStatus(p, v as Status)}>
                        <SelectTrigger className={`h-8 w-[130px] border ${statusBadge(p.payment_status)}`}>
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

function NewPurchaseDialog({
  open, setOpen, suppliers, products, onCreated,
}: {
  open: boolean; setOpen: (v: boolean) => void;
  suppliers: Supplier[]; products: Product[]; onCreated: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    purchase_date: today,
    supplier_id: "",
    product_id: "",
    product_name: "",
    quantity: "1",
    unit_price: "",
    paid_amount: "",
    payment_status: "bekliyor" as Status,
  });
  const [saving, setSaving] = useState(false);
  const [localSuppliers, setLocalSuppliers] = useState<Supplier[]>(suppliers);
  const [supOpen, setSupOpen] = useState(false);
  const [sup, setSup] = useState({
    name: "", phone: "", email: "", address: "",
    tax_no: "", tax_office: "", contact_person: "",
  });
  const [supSaving, setSupSaving] = useState(false);

  useEffect(() => { setLocalSuppliers(suppliers); }, [suppliers]);

  function reset() {
    setForm({
      purchase_date: today, supplier_id: "", product_id: "", product_name: "",
      quantity: "1", unit_price: "", paid_amount: "", payment_status: "bekliyor",
    });
  }

  const computedAmount = (Number(form.quantity) || 0) * (Number(form.unit_price) || 0);

  function selectProduct(id: string) {
    if (id === "__new__") {
      setForm((f) => ({ ...f, product_id: "__new__", product_name: "" }));
      return;
    }
    const p = products.find((x) => x.id === id);
    if (!p) return;
    setForm((f) => ({
      ...f,
      product_id: id,
      product_name: p.name,
      unit_price: p.unit_price != null ? String(p.unit_price) : f.unit_price,
    }));
  }

  async function saveQuickSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!sup.name.trim()) return toast.error("Firma ismi zorunludur");
    setSupSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSupSaving(false); return toast.error("Oturum bulunamadı"); }
    const { data, error } = await supabase.from("suppliers").insert({
      user_id: session.user.id,
      name: sup.name.trim(),
      phone: sup.phone.trim() || null,
      email: sup.email.trim() || null,
      address: sup.address.trim() || null,
      tax_no: sup.tax_no.trim() || null,
      tax_office: sup.tax_office.trim() || null,
      contact_person: sup.contact_person.trim() || null,
    }).select("id,name").single();
    setSupSaving(false);
    if (error || !data) return toast.error("Eklenemedi: " + friendlyDbError(error));
    setLocalSuppliers((prev) => [...prev, data as Supplier].sort((a, b) => a.name.localeCompare(b.name)));
    setForm((f) => ({ ...f, supplier_id: data.id }));
    setSup({ name: "", phone: "", email: "", address: "", tax_no: "", tax_office: "", contact_person: "" });
    setSupOpen(false);
    toast.success("Tedarikçi eklendi");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.product_name || !form.unit_price) {
      return toast.error("Ürün ve birim fiyat zorunludur");
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return toast.error("Oturum bulunamadı"); }
    const total = computedAmount;
    const paid = form.paid_amount
      ? Number(form.paid_amount)
      : (form.payment_status === "ödendi" ? total : 0);
    const payload = {
      user_id: session.user.id,
      purchase_date: form.purchase_date,
      supplier_id: form.supplier_id || null,
      product_name: form.product_name,
      quantity: Number(form.quantity) || 1,
      unit_price: Number(form.unit_price),
      amount: total,
      paid_amount: paid,
      payment_status: form.payment_status,
    };
    const { error } = await supabase.from("purchases").insert(payload);
    if (error) { setSaving(false); return toast.error("Eklenemedi: " + friendlyDbError(error)); }

    // Eşleşen ürünün stok miktarını ve birim fiyatını güncelle
    const matched = products.find(
      (p) => p.name.trim().toLowerCase() === form.product_name.trim().toLowerCase()
    );
    if (matched) {
      await supabase
        .from("products")
        .update({
          quantity: (matched.quantity ?? 0) + (Number(form.quantity) || 1),
          unit_price: Number(form.unit_price),
        })
        .eq("id", matched.id);
    }

    setSaving(false);
    toast.success("Alış eklendi");
    reset();
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Yeni Alış</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Yeni Alış</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tarih</Label>
              <Input type="date" value={form.purchase_date}
                onChange={(e) => setForm({ ...form, purchase_date: e.target.value })} required />
            </div>
            <div>
              <Label>Tedarikçi</Label>
              <Select
                value={form.supplier_id}
                onValueChange={(v) => {
                  if (v === "__new__") { setSupOpen(true); return; }
                  setForm({ ...form, supplier_id: v });
                }}
              >
                <SelectTrigger><SelectValue placeholder="Seç (opsiyonel)" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__new__" className="text-primary font-medium">
                    + Yeni Tedarikçi
                  </SelectItem>
                  {localSuppliers.map((s) => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Ürün</Label>
            <Select
              value={form.product_id}
              onValueChange={selectProduct}
            >
              <SelectTrigger><SelectValue placeholder="Stoktan seç veya yeni ürün" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__new__" className="text-primary font-medium">
                  + Yeni / Listede Olmayan Ürün
                </SelectItem>
                {products.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
              </SelectContent>
            </Select>
            {form.product_id === "__new__" && (
              <Input
                className="mt-2"
                placeholder="Ürün adı"
                value={form.product_name}
                onChange={(e) => setForm({ ...form, product_name: e.target.value })}
                required
              />
            )}
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Miktar</Label>
              <Input type="number" min="1" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <Label>Birim Fiyat (₺)</Label>
              <Input type="number" step="0.01" value={form.unit_price}
                onChange={(e) => setForm({ ...form, unit_price: e.target.value })} required />
            </div>
            <div>
              <Label>Tutar (₺)</Label>
              <Input value={formatCurrency(computedAmount)} disabled />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
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
              <Label>Ödenen (₺)</Label>
              <Input type="number" step="0.01" value={form.paid_amount}
                onChange={(e) => setForm({ ...form, paid_amount: e.target.value })}
                placeholder="Boşsa duruma göre" />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <Dialog open={supOpen} onOpenChange={setSupOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Yeni Tedarikçi</DialogTitle></DialogHeader>
          <form onSubmit={saveQuickSupplier} className="space-y-3">
            <div>
              <Label>Firma / Tedarikçi Adı</Label>
              <Input value={sup.name} maxLength={120} required autoFocus
                onChange={(e) => setSup({ ...sup, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Vergi No / TCKN</Label>
                <Input value={sup.tax_no} maxLength={20}
                  onChange={(e) => setSup({ ...sup, tax_no: e.target.value })} />
              </div>
              <div>
                <Label>Vergi Dairesi</Label>
                <Input value={sup.tax_office} maxLength={80}
                  onChange={(e) => setSup({ ...sup, tax_office: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Yetkili Kişi</Label>
                <Input value={sup.contact_person} maxLength={80}
                  onChange={(e) => setSup({ ...sup, contact_person: e.target.value })} />
              </div>
              <div>
                <Label>Telefon</Label>
                <Input value={sup.phone} maxLength={40}
                  onChange={(e) => setSup({ ...sup, phone: e.target.value })} />
              </div>
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={sup.email} maxLength={255}
                onChange={(e) => setSup({ ...sup, email: e.target.value })} />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setSupOpen(false)}>İptal</Button>
              <Button type="submit" disabled={supSaving}>{supSaving ? "Kaydediliyor..." : "Ekle"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
