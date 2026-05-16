import { friendlyDbError, formatCurrency, formatDate } from "@/lib/butcecrm-helpers";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Users, Pencil, Trash2, ChevronRight, TrendingUp, TrendingDown, Clock } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

type Party = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_no: string | null;
  tax_office: string | null;
  contact_person: string | null;
};

type PartyStats = {
  total: number;
  paid: number;
  pending: number;
  count: number;
};

type TxRow = {
  id: string;
  date: string;
  product_name: string;
  amount: number;
  paid_amount: number;
  payment_status: string;
};

type Kind = "customers" | "suppliers";

const partySchema = z.object({
  name: z.string().trim().min(1, "İsim zorunludur").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email("Geçersiz email").max(255).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  tax_no: z.string().trim().max(20).optional().or(z.literal("")),
  tax_office: z.string().trim().max(80).optional().or(z.literal("")),
  contact_person: z.string().trim().max(80).optional().or(z.literal("")),
});

export const Route = createFileRoute("/app/butcecrm/cariler")({
  head: () => ({ meta: [{ title: "BütçeCRM — Cariler" }] }),
  component: PartiesPage,
});

function statusLabel(s: string) {
  if (s === "ödendi") return "Ödendi";
  if (s === "kısmi") return "Kısmi";
  if (s === "bekliyor") return "Bekliyor";
  if (s === "ödenmedi") return "Ödenmedi";
  return s;
}

function statusColor(s: string) {
  if (s === "ödendi") return "text-green-600";
  if (s === "kısmi") return "text-yellow-600";
  return "text-red-600";
}

function PartiesPage() {
  const [tab, setTab] = useState<Kind>("customers");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="h-6 w-6 text-primary" /> Cariler</h1>
        <p className="text-muted-foreground text-sm">Müşteri ve tedarikçi yönetimi</p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Kind)}>
        <TabsList>
          <TabsTrigger value="customers">Müşteriler</TabsTrigger>
          <TabsTrigger value="suppliers">Tedarikçiler</TabsTrigger>
        </TabsList>
        <TabsContent value="customers" className="mt-4">
          <PartyList kind="customers" title="Müşteri" />
        </TabsContent>
        <TabsContent value="suppliers" className="mt-4">
          <PartyList kind="suppliers" title="Tedarikçi" />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PartyList({ kind, title }: { kind: Kind; title: string }) {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Party[]>([]);
  const [statsMap, setStatsMap] = useState<Record<string, PartyStats>>({});
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Party | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Party | null>(null);
  const [detail, setDetail] = useState<Party | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from(kind).select("*").order("name");
    const parties = (data as Party[]) || [];
    setItems(parties);

    // Fetch financial summary for all parties at once
    if (parties.length > 0) {
      const ids = parties.map((p) => p.id);
      if (kind === "customers") {
        const { data: sales } = await supabase
          .from("sales")
          .select("customer_id, total_amount, paid_amount, payment_status")
          .in("customer_id", ids);
        const map: Record<string, PartyStats> = {};
        for (const s of sales || []) {
          if (!s.customer_id) continue;
          if (!map[s.customer_id]) map[s.customer_id] = { total: 0, paid: 0, pending: 0, count: 0 };
          const total = Number(s.total_amount || 0);
          const paid = Number(s.paid_amount || 0);
          map[s.customer_id].total += total;
          map[s.customer_id].paid += paid;
          map[s.customer_id].pending += total - paid;
          map[s.customer_id].count += 1;
        }
        setStatsMap(map);
      } else {
        const { data: purchases } = await supabase
          .from("purchases")
          .select("supplier_id, amount, paid_amount, payment_status")
          .in("supplier_id", ids);
        const map: Record<string, PartyStats> = {};
        for (const p of purchases || []) {
          if (!p.supplier_id) continue;
          if (!map[p.supplier_id]) map[p.supplier_id] = { total: 0, paid: 0, pending: 0, count: 0 };
          const total = Number(p.amount || 0);
          const paid = Number(p.paid_amount || 0);
          map[p.supplier_id].total += total;
          map[p.supplier_id].paid += paid;
          map[p.supplier_id].pending += total - paid;
          map[p.supplier_id].count += 1;
        }
        setStatsMap(map);
      }
    }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [kind]);

  const filtered = useMemo(() => {
    if (!q) return items;
    const t = q.toLowerCase();
    return items.filter((p) =>
      [p.name, p.phone, p.email, p.address]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(t)),
    );
  }, [items, q]);

  function openNew() { setEditing(null); setOpen(true); }
  function openEdit(p: Party) { setEditing(p); setOpen(true); }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await supabase.from(kind).delete().eq("id", deleting.id);
    if (error) return toast.error("Silinemedi: " + friendlyDbError(error));
    toast.success(`${title} silindi`);
    setItems((prev) => prev.filter((x) => x.id !== deleting.id));
    setDeleting(null);
  }

  const totals = useMemo(() => {
    let total = 0, paid = 0, pending = 0;
    for (const s of Object.values(statsMap)) {
      total += s.total; paid += s.paid; pending += s.pending;
    }
    return { total, paid, pending };
  }, [statsMap]);

  return (
    <div className="space-y-4">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              {kind === "customers" ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {kind === "customers" ? "Toplam Satış" : "Toplam Alış"}
            </div>
            <div className="font-bold text-lg">{formatCurrency(totals.total)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600 text-xs mb-1">
              <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
              {kind === "customers" ? "Tahsil Edilen" : "Ödenen"}
            </div>
            <div className="font-bold text-lg text-green-700">{formatCurrency(totals.paid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-orange-600 text-xs mb-1">
              <Clock className="h-3.5 w-3.5" />
              Bekleyen
            </div>
            <div className="font-bold text-lg text-orange-600">{formatCurrency(totals.pending)}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={`${title} ara...`} className="pl-8" />
        </div>
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Yeni {title}</Button>
      </div>

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
                  <TableHead>İsim</TableHead>
                  <TableHead>Telefon</TableHead>
                  <TableHead className="text-right">{kind === "customers" ? "Toplam Satış" : "Toplam Alış"}</TableHead>
                  <TableHead className="text-right">{kind === "customers" ? "Tahsil Edilen" : "Ödenen"}</TableHead>
                  <TableHead className="text-right">Bekleyen</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const s = statsMap[p.id] || { total: 0, paid: 0, pending: 0, count: 0 };
                  return (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetail(p)}>
                      <TableCell className="font-medium max-w-[180px] truncate">
                        <div>{p.name}</div>
                        {s.count > 0 && <div className="text-xs text-muted-foreground">{s.count} işlem</div>}
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">{p.phone || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{s.total > 0 ? formatCurrency(s.total) : "-"}</TableCell>
                      <TableCell className="text-right text-green-700">{s.paid > 0 ? formatCurrency(s.paid) : "-"}</TableCell>
                      <TableCell className="text-right">
                        {s.pending > 0
                          ? <span className="text-orange-600 font-medium">{formatCurrency(s.pending)}</span>
                          : s.total > 0 ? <span className="text-green-600 text-xs">Tamamlandı</span> : "-"}
                      </TableCell>
                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setDetail(p)} title="Detay">
                            <ChevronRight className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => setDeleting(p)}>
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PartyDialog open={open} setOpen={setOpen} kind={kind} title={title} editing={editing} onSaved={load} />

      {detail && (
        <PartyDetailDialog
          party={detail}
          kind={kind}
          stats={statsMap[detail.id] || { total: 0, paid: 0, pending: 0, count: 0 }}
          onClose={() => setDetail(null)}
        />
      )}

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleting?.name}</strong> kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-red-600 hover:bg-red-700">Sil</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PartyDetailDialog({
  party, kind, stats, onClose,
}: {
  party: Party; kind: Kind; stats: PartyStats; onClose: () => void;
}) {
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetch() {
      setLoading(true);
      if (kind === "customers") {
        const { data } = await supabase
          .from("sales")
          .select("id, sale_date, product_name, total_amount, paid_amount, payment_status")
          .eq("customer_id", party.id)
          .order("sale_date", { ascending: false });
        setTxs((data || []).map((r: { id: string; sale_date: string; product_name: string; total_amount: number; paid_amount: number; payment_status: string }) => ({
          id: r.id, date: r.sale_date, product_name: r.product_name,
          amount: r.total_amount, paid_amount: r.paid_amount, payment_status: r.payment_status,
        })));
      } else {
        const { data } = await supabase
          .from("purchases")
          .select("id, purchase_date, product_name, amount, paid_amount, payment_status")
          .eq("supplier_id", party.id)
          .order("purchase_date", { ascending: false });
        setTxs((data || []).map((r: { id: string; purchase_date: string; product_name: string; amount: number; paid_amount: number; payment_status: string }) => ({
          id: r.id, date: r.purchase_date, product_name: r.product_name,
          amount: r.amount, paid_amount: r.paid_amount, payment_status: r.payment_status,
        })));
      }
      setLoading(false);
    }
    fetch();
  }, [party.id, kind]);

  const amountLabel = kind === "customers" ? "Toplam Satış" : "Toplam Alış";
  const paidLabel = kind === "customers" ? "Tahsil Edilen" : "Ödenen";

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {party.name}
          </DialogTitle>
        </DialogHeader>

        {/* Info row */}
        <div className="flex gap-4 text-sm text-muted-foreground flex-wrap">
          {party.phone && <span>📞 {party.phone}</span>}
          {party.email && <span>✉️ {party.email}</span>}
          {party.address && <span>📍 {party.address}</span>}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-muted-foreground mb-1">{amountLabel}</div>
            <div className="font-bold">{formatCurrency(stats.total)}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-green-600 mb-1">{paidLabel}</div>
            <div className="font-bold text-green-700">{formatCurrency(stats.paid)}</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-xs text-orange-600 mb-1">Bekleyen</div>
            <div className={`font-bold ${stats.pending > 0 ? "text-orange-600" : "text-muted-foreground"}`}>
              {formatCurrency(stats.pending)}
            </div>
          </div>
        </div>

        {/* Transaction list */}
        <div className="flex-1 overflow-auto min-h-0">
          {loading ? (
            <div className="p-6 text-center text-muted-foreground">Yükleniyor...</div>
          ) : txs.length === 0 ? (
            <div className="p-6 text-center text-muted-foreground">Henüz işlem yok</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Ürün / Hizmet</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                  <TableHead className="text-right">{paidLabel}</TableHead>
                  <TableHead>Durum</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {txs.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="whitespace-nowrap text-muted-foreground text-sm">{formatDate(tx.date)}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{tx.product_name}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(tx.amount)}</TableCell>
                    <TableCell className="text-right text-green-700">{formatCurrency(tx.paid_amount)}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${statusColor(tx.payment_status)}`}>
                        {statusLabel(tx.payment_status)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function PartyDialog({
  open, setOpen, kind, title, editing, onSaved,
}: {
  open: boolean; setOpen: (v: boolean) => void;
  kind: Kind; title: string;
  editing: Party | null; onSaved: () => void;
}) {
  const isSupplier = kind === "suppliers";
  const [form, setForm] = useState({
    name: "", phone: "", email: "", address: "",
    tax_no: "", tax_office: "", contact_person: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm({
        name: editing?.name || "",
        phone: editing?.phone || "",
        email: editing?.email || "",
        address: editing?.address || "",
        tax_no: editing?.tax_no || "",
        tax_office: editing?.tax_office || "",
        contact_person: editing?.contact_person || "",
      });
    }
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = partySchema.safeParse(form);
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0]?.message || "Form geçersiz");
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return toast.error("Oturum bulunamadı"); }
    const base = {
      user_id: session.user.id,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
    };
    const payload = isSupplier
      ? { ...base, tax_no: parsed.data.tax_no || null, tax_office: parsed.data.tax_office || null, contact_person: parsed.data.contact_person || null }
      : base;
    const { error } = editing
      ? await supabase.from(kind).update(payload).eq("id", editing.id)
      : await supabase.from(kind).insert(payload);
    setSaving(false);
    if (error) return toast.error("Kaydedilemedi: " + friendlyDbError(error));
    toast.success(editing ? `${title} güncellendi` : `${title} eklendi`);
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{editing ? `${title} Düzenle` : `Yeni ${title}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>{isSupplier ? "Firma / Tedarikçi Adı" : "İsim"}</Label>
            <Input value={form.name} maxLength={120}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          {isSupplier && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Vergi No / TCKN</Label>
                  <Input value={form.tax_no} maxLength={20}
                    onChange={(e) => setForm({ ...form, tax_no: e.target.value })} />
                </div>
                <div>
                  <Label>Vergi Dairesi</Label>
                  <Input value={form.tax_office} maxLength={80}
                    onChange={(e) => setForm({ ...form, tax_office: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Yetkili Kişi</Label>
                <Input value={form.contact_person} maxLength={80}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Telefon</Label>
              <Input value={form.phone} maxLength={40}
                onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} maxLength={255}
                onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
          </div>
          <div>
            <Label>Adres</Label>
            <Textarea value={form.address} rows={2} maxLength={500}
              onChange={(e) => setForm({ ...form, address: e.target.value })} />
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
