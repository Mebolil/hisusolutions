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
import { Plus, Search, ShoppingBag, Trash2, TrendingUp, BarChart3, Award } from "lucide-react";
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
  customer_id: string | null;
  product_name: string;
  quantity: number;
  total_amount: number;
  total_cost: number | null;
  paid_amount: number | null;
  payment_status: string;
  campaign_id: string | null;
  platform: string | null;
};
type Customer = { id: string; name: string };
type Campaign = { id: string; name: string };
type Product = { id: string; name: string; quantity: number; unit_price: number | null };

const STATUSES = ["ödendi", "kısmi", "bekliyor"] as const;
type Status = (typeof STATUSES)[number];

const DEFAULT_PLATFORMS = ["Trendyol", "Hepsiburada", "Amazon", "N11", "Kendi Sitem"];
const PLATFORMS_LS_KEY = "butcecrm:sale-platforms";

function loadPlatforms(): string[] {
  if (typeof window === "undefined") return DEFAULT_PLATFORMS;
  try {
    const raw = window.localStorage.getItem(PLATFORMS_LS_KEY);
    if (raw) {
      const arr = JSON.parse(raw);
      if (Array.isArray(arr) && arr.length) return arr;
    }
  } catch {}
  return DEFAULT_PLATFORMS;
}
function savePlatforms(list: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PLATFORMS_LS_KEY, JSON.stringify(list));
}


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
  const [loading, setLoading] = useState(true);
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);

  async function load() {
    setLoading(true);
    const [s, c, ca] = await Promise.all([
      supabase.from("sales").select("*").order("sale_date", { ascending: false }),
      supabase.from("customers").select("id,name").order("name"),
      supabase.from("campaigns").select("id,name").order("name"),
    ]);
    setSales((s.data as Sale[]) || []);
    setCustomers((c.data as Customer[]) || []);
    setCampaigns((ca.data as Campaign[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const customerMap = useMemo(
    () => Object.fromEntries(customers.map((c) => [c.id, c.name])),
    [customers],
  );

  const filtered = useMemo(() => {
    return sales.filter((s) => {
      if (statusFilter !== "all" && s.payment_status !== statusFilter) return false;
      if (from && s.sale_date < from) return false;
      if (to && s.sale_date > to) return false;
      if (q) {
        const text = `${s.product_name} ${customerMap[s.customer_id || ""] || ""}`.toLowerCase();
        if (!text.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [sales, statusFilter, from, to, q, customerMap]);

  const totals = useMemo(() => {
    const total = filtered.reduce((s, x) => s + Number(x.total_amount || 0), 0);
    const paid = filtered.reduce((s, x) => s + Number(x.paid_amount || 0), 0);
    return { total, paid, remaining: total - paid, count: filtered.length };
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

  return (
    <div className="space-y-6">
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

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
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
              <Label className="text-xs">Ara (ürün / müşteri)</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara..." className="pl-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

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
                  <TableHead>Tarih</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead className="text-right">Miktar</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="text-right">Tahsil</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap">{formatDate(s.sale_date)}</TableCell>
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
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
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
  open, setOpen, customers, campaigns, onCreated,
}: {
  open: boolean; setOpen: (v: boolean) => void;
  customers: Customer[]; campaigns: Campaign[]; onCreated: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    sale_date: today,
    customer_id: "",
    product_name: "",
    quantity: "1",
    total_amount: "",
    total_cost: "",
    paid_amount: "",
    payment_status: "bekliyor" as Status,
    campaign_id: "",
    platform: "",
  });
  const [saving, setSaving] = useState(false);
  const [localCustomers, setLocalCustomers] = useState<Customer[]>(customers);
  const [quickOpen, setQuickOpen] = useState(false);
  const [quick, setQuick] = useState({ name: "", phone: "", email: "" });
  const [quickSaving, setQuickSaving] = useState(false);
  const [platforms, setPlatforms] = useState<string[]>(loadPlatforms);
  const [newPlatformOpen, setNewPlatformOpen] = useState(false);
  const [newPlatformName, setNewPlatformName] = useState("");

  useEffect(() => { setLocalCustomers(customers); }, [customers]);

  function reset() {
    setForm({
      sale_date: today, customer_id: "", product_name: "", quantity: "1",
      total_amount: "", total_cost: "", paid_amount: "",
      payment_status: "bekliyor", campaign_id: "", platform: "",
    });
  }

  function addPlatform(name: string) {
    const v = name.trim();
    if (!v) return;
    if (platforms.includes(v)) {
      setForm((f) => ({ ...f, platform: v }));
      return;
    }
    const next = [...platforms, v];
    setPlatforms(next);
    savePlatforms(next);
    setForm((f) => ({ ...f, platform: v }));
  }


  async function saveQuickCustomer(e: React.FormEvent) {
    e.preventDefault();
    if (!quick.name.trim()) return toast.error("İsim zorunludur");
    setQuickSaving(true);
    const { data, error } = await supabase.from("customers").insert({
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
    const paid = form.paid_amount ? Number(form.paid_amount) : (form.payment_status === "ödendi" ? total : 0);
    const payload = {
      user_id: session.user.id,
      sale_date: form.sale_date,
      customer_id: form.customer_id || null,
      product_name: form.product_name,
      quantity: Number(form.quantity) || 1,
      total_amount: total,
      total_cost: form.total_cost ? Number(form.total_cost) : 0,
      paid_amount: paid,
      payment_status: form.payment_status,
      campaign_id: form.campaign_id || null,
      platform: form.platform || null,
    };
    const { error } = await supabase.from("sales").insert(payload);
    setSaving(false);
    if (error) return toast.error("Eklenemedi: " + friendlyDbError(error));
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
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Yeni Satış</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tarih</Label>
              <Input type="date" value={form.sale_date}
                onChange={(e) => setForm({ ...form, sale_date: e.target.value })} required />
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
          </div>
          <div>
            <Label>Ürün</Label>
            <Input value={form.product_name}
              onChange={(e) => setForm({ ...form, product_name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Miktar</Label>
              <Input type="number" min="1" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} />
            </div>
            <div>
              <Label>Tutar (₺)</Label>
              <Input type="number" step="0.01" value={form.total_amount}
                onChange={(e) => setForm({ ...form, total_amount: e.target.value })} required />
            </div>
            <div>
              <Label>Maliyet (₺)</Label>
              <Input type="number" step="0.01" value={form.total_cost}
                onChange={(e) => setForm({ ...form, total_cost: e.target.value })} />
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
              <Label>Tahsil Edilen (₺)</Label>
              <Input type="number" step="0.01" value={form.paid_amount}
                onChange={(e) => setForm({ ...form, paid_amount: e.target.value })}
                placeholder="Boşsa duruma göre hesaplanır" />
            </div>
          </div>
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
                <Input type="email" value={quick.email} maxLength={255}
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
