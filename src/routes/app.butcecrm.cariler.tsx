import { friendlyDbError, formatCurrency, formatDate } from "@/lib/butcecrm-helpers";
import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Search, Users, Pencil, Trash2, ChevronRight, TrendingUp,
  TrendingDown, Clock, ArrowUpDown, ArrowUp, ArrowDown, Phone,
  Mail, MapPin, FileText, Building2, User, Landmark,
} from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as ReTooltip, ResponsiveContainer,
} from "recharts";
import { format, parseISO, startOfMonth } from "date-fns";
import { tr } from "date-fns/locale";

type Party = {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  tax_no: string | null;
  tax_office: string | null;
  contact_person: string | null;
  note: string | null;
  bank_info?: string | null;
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
type SortKey = "name" | "total" | "pending" | "count";
type SortDir = "asc" | "desc";

const customerSchema = z.object({
  name: z.string().trim().min(1, "İsim zorunludur").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email("Geçersiz email").max(255).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

const supplierSchema = z.object({
  name: z.string().trim().min(1, "Firma adı zorunludur").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z.string().trim().email("Geçersiz email").max(255).optional().or(z.literal("")),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  tax_no: z.string().trim().max(20).optional().or(z.literal("")),
  tax_office: z.string().trim().max(80).optional().or(z.literal("")),
  contact_person: z.string().trim().max(80).optional().or(z.literal("")),
  bank_info: z.string().trim().max(500).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
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

function SortIcon({ col, active, dir }: { col: string; active: SortKey; dir: SortDir }) {
  if (col !== active) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
  return dir === "asc"
    ? <ArrowUp className="h-3.5 w-3.5 text-primary" />
    : <ArrowDown className="h-3.5 w-3.5 text-primary" />;
}

function PartiesPage() {
  const [tab, setTab] = useState<Kind>("customers");
  const [ghostCustomers, setGhostCustomers] = useState<{
    customer_id: string; customer_name: string; last_sale_date: string | null;
    days_since: number | null; lifetime_revenue: number;
  }[]>([]);
  const [showGhostList, setShowGhostList] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase.rpc("get_ghost_customers", {
        p_user_id: session.user.id,
        p_days_threshold: 60,
      });
      setGhostCustomers((data || []) as typeof ghostCustomers);
    })();
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Users className="h-6 w-6 text-primary" /> Cariler
        </h1>
        <p className="text-muted-foreground text-sm">Müşteri ve tedarikçi yönetimi</p>
      </div>

      {ghostCustomers.length > 0 && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
              <Users className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-purple-800">{ghostCustomers.length} müşteri 60+ gündür sessiz</p>
              <p className="text-xs text-purple-600">Bu müşteriler daha önce sizden alışveriş yaptı — geri kazanmak ister misiniz?</p>
            </div>
          </div>
          <Button variant="outline" size="sm" className="border-purple-300 text-purple-700 hover:bg-purple-100 flex-shrink-0"
            onClick={() => setShowGhostList((v) => !v)}>
            {showGhostList ? "Gizle" : "Listeyi Gör"}
          </Button>
        </div>
      )}

      {showGhostList && ghostCustomers.length > 0 && (
        <div className="rounded-lg border bg-card">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-sm">Sessiz Müşteriler</h3>
            <p className="text-xs text-muted-foreground">Son 60 günde alışveriş yapmayan müşteriler (en uzun süreden kısaya)</p>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Müşteri</TableHead>
                <TableHead className="text-center">Son Alışveriş</TableHead>
                <TableHead className="text-center">Sessiz</TableHead>
                <TableHead className="text-right">Toplam Alışveriş</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ghostCustomers.slice(0, 10).map((g) => (
                <TableRow key={g.customer_id}>
                  <TableCell className="font-medium">{g.customer_name}</TableCell>
                  <TableCell className="text-center text-sm text-muted-foreground">{g.last_sale_date ?? "Hiç alışveriş yok"}</TableCell>
                  <TableCell className="text-center">
                    {g.days_since !== null ? (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${g.days_since > 90 ? "bg-red-100 text-red-700" : "bg-purple-100 text-purple-700"}`}>
                        {g.days_since} gün
                      </span>
                    ) : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell className="text-right text-sm font-medium">
                    {g.lifetime_revenue > 0 ? formatCurrency(g.lifetime_revenue) : "—"}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as Kind)}>
        <TabsList>
          <TabsTrigger value="customers">Müşteriler</TabsTrigger>
          <TabsTrigger value="suppliers">Tedarikçiler</TabsTrigger>
          <TabsTrigger value="profitability">Müşteri Karlılığı</TabsTrigger>
        </TabsList>
        <TabsContent value="customers" className="mt-4">
          <PartyList kind="customers" title="Müşteri" />
        </TabsContent>
        <TabsContent value="suppliers" className="mt-4">
          <PartyList kind="suppliers" title="Tedarikçi" />
        </TabsContent>
        <TabsContent value="profitability" className="mt-4">
          <CustomerProfitabilityTab />
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
  const [sortKey, setSortKey] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkDeleting, setBulkDeleting] = useState(false);

  async function load() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const uid = session.user.id;
    const { data } = await supabase.from(kind).select("*").eq("user_id", uid).is("deleted_at", null).order("name");
    const parties = (data as Party[]) || [];
    setItems(parties);

    if (parties.length > 0) {
      const ids = parties.map((p) => p.id);
      if (kind === "customers") {
        const { data: sales } = await supabase
          .from("sales")
          .select("customer_id, total_amount, paid_amount, payment_status")
          .eq("user_id", uid)
          .is("deleted_at", null)
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
          .eq("user_id", uid)
          .is("deleted_at", null)
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

  useEffect(() => { load(); setSelected(new Set()); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [kind]);

  const filtered = useMemo(() => {
    let list = items;
    if (q) {
      const t = q.toLowerCase();
      list = list.filter((p) =>
        [p.name, p.phone, p.email, p.address, p.contact_person, p.note]
          .filter(Boolean)
          .some((v) => String(v).toLowerCase().includes(t)),
      );
    }
    list = [...list].sort((a, b) => {
      let diff = 0;
      if (sortKey === "name") diff = a.name.localeCompare(b.name, "tr");
      else if (sortKey === "total") diff = (statsMap[a.id]?.total || 0) - (statsMap[b.id]?.total || 0);
      else if (sortKey === "pending") diff = (statsMap[a.id]?.pending || 0) - (statsMap[b.id]?.pending || 0);
      else if (sortKey === "count") diff = (statsMap[a.id]?.count || 0) - (statsMap[b.id]?.count || 0);
      return sortDir === "asc" ? diff : -diff;
    });
    return list;
  }, [items, q, sortKey, sortDir, statsMap]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  function openNew() { setEditing(null); setOpen(true); }
  function openEdit(p: Party) { setEditing(p); setOpen(true); }

  async function confirmDelete() {
    if (!deleting) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return toast.error("Oturum bulunamadı");
    const { error } = await supabase.from(kind).update({ deleted_at: new Date().toISOString() })
      .eq("id", deleting.id)
      .eq("user_id", session.user.id);
    if (error) return toast.error("Silinemedi: " + friendlyDbError(error));
    toast.success(`${title} silindi`);
    setItems((prev) => prev.filter((x) => x.id !== deleting.id));
    setDeleting(null);
  }

  async function confirmBulkDelete() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return toast.error("Oturum bulunamadı");
    const ids = Array.from(selected);
    const { error } = await supabase.from(kind).update({ deleted_at: new Date().toISOString() })
      .in("id", ids)
      .eq("user_id", session.user.id);
    if (error) return toast.error("Silinemedi: " + friendlyDbError(error));
    toast.success(`${ids.length} ${title.toLowerCase()} silindi`);
    setItems((prev) => prev.filter((x) => !ids.includes(x.id)));
    setSelected(new Set());
    setBulkDeleting(false);
  }

  const allFilteredSelected = filtered.length > 0 && filtered.every((p) => selected.has(p.id));
  const someSelected = filtered.some((p) => selected.has(p.id));

  function toggleAll() {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.delete(p.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((p) => next.add(p.id));
        return next;
      });
    }
  }

  function toggleOne(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const totals = useMemo(() => {
    let total = 0, paid = 0, pending = 0;
    for (const s of Object.values(statsMap)) {
      total += s.total; paid += s.paid; pending += s.pending;
    }
    return { total, paid, pending };
  }, [statsMap]);

  const deletingStats = deleting ? statsMap[deleting.id] : null;

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
            <div className="text-xs text-muted-foreground mt-1">{items.length} {title.toLowerCase()}</div>
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
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={`${title} ara (isim, telefon, email, not)...`}
            className="pl-8"
          />
        </div>
        {selected.size > 0 && (
          <Button variant="destructive" onClick={() => setBulkDeleting(true)} className="gap-2">
            <Trash2 className="h-4 w-4" /> {selected.size} Seçili Sil
          </Button>
        )}
        <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Yeni {title}</Button>
      </div>

      {q && (
        <div className="text-xs text-muted-foreground">
          {filtered.length} / {items.length} {title.toLowerCase()} gösteriliyor
          {filtered.length === 0 && (
            <button className="ml-2 text-primary underline" onClick={() => setQ("")}>Aramayı temizle</button>
          )}
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Henüz {title.toLowerCase()} yok</p>
              <p className="text-sm mt-1">Yeni {title.toLowerCase()} ekleyerek başlayın</p>
              <Button className="mt-4 gap-2" onClick={openNew}><Plus className="h-4 w-4" /> Yeni {title}</Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Search className="h-10 w-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">Arama sonucu bulunamadı</p>
              <button className="mt-2 text-primary text-sm underline" onClick={() => setQ("")}>Aramayı temizle</button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10" onClick={(e) => e.stopPropagation()}>
                    <Checkbox
                      checked={allFilteredSelected}
                      data-state={someSelected && !allFilteredSelected ? "indeterminate" : undefined}
                      onCheckedChange={toggleAll}
                      aria-label="Tümünü seç"
                    />
                  </TableHead>
                  <TableHead>
                    <button className="flex items-center gap-1 hover:text-foreground" onClick={() => toggleSort("name")}>
                      İsim <SortIcon col="name" active={sortKey} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead>İletişim</TableHead>
                  <TableHead className="text-right">
                    <button className="flex items-center gap-1 ml-auto hover:text-foreground" onClick={() => toggleSort("total")}>
                      {kind === "customers" ? "Toplam Satış" : "Toplam Alış"}
                      <SortIcon col="total" active={sortKey} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    {kind === "customers" ? "Tahsil Edilen" : "Ödenen"}
                  </TableHead>
                  <TableHead className="text-right">
                    <button className="flex items-center gap-1 ml-auto hover:text-foreground" onClick={() => toggleSort("pending")}>
                      Bekleyen <SortIcon col="pending" active={sortKey} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">
                    <button className="flex items-center gap-1 ml-auto hover:text-foreground" onClick={() => toggleSort("count")}>
                      İşlem <SortIcon col="count" active={sortKey} dir={sortDir} />
                    </button>
                  </TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const s = statsMap[p.id] || { total: 0, paid: 0, pending: 0, count: 0 };
                  return (
                    <TableRow key={p.id} className="cursor-pointer hover:bg-muted/40" onClick={() => setDetail(p)}>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selected.has(p.id)}
                          onCheckedChange={() => toggleOne(p.id)}
                          aria-label={`${p.name} seç`}
                        />
                      </TableCell>
                      <TableCell className="font-medium max-w-[180px]">
                        <div className="truncate">{p.name}</div>
                        {p.contact_person && (
                          <div className="text-xs text-muted-foreground truncate">{p.contact_person}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {p.phone && <div className="whitespace-nowrap">{p.phone}</div>}
                        {p.email && <div className="truncate max-w-[160px] text-xs">{p.email}</div>}
                        {!p.phone && !p.email && <span>-</span>}
                      </TableCell>
                      <TableCell className="text-right font-medium">{s.total > 0 ? formatCurrency(s.total) : "-"}</TableCell>
                      <TableCell className="text-right text-green-700">{s.paid > 0 ? formatCurrency(s.paid) : "-"}</TableCell>
                      <TableCell className="text-right">
                        {s.pending > 0
                          ? <span className="text-orange-600 font-medium">{formatCurrency(s.pending)}</span>
                          : s.total > 0 ? <span className="text-green-600 text-xs">Tamamlandı</span> : "-"}
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground text-sm">
                        {s.count > 0 ? s.count : "-"}
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
          onEdit={() => { setDetail(null); openEdit(detail); }}
        />
      )}

      <AlertDialog open={bulkDeleting} onOpenChange={(v) => !v && setBulkDeleting(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{selected.size} {title.toLowerCase()} silinecek</AlertDialogTitle>
            <AlertDialogDescription>
              Seçili {selected.size} kayıt kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmBulkDelete} className="bg-red-600 hover:bg-red-700">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleting?.name}</strong> kalıcı olarak silinecek.
              {deletingStats && deletingStats.count > 0 && (
                <span className="block mt-2 text-orange-600 font-medium">
                  Uyarı: Bu {title.toLowerCase()} ile ilişkili {deletingStats.count} işlem kaydı bulunmaktadır.
                  {deletingStats.pending > 0 && ` (${formatCurrency(deletingStats.pending)} bekleyen bakiye)`}
                </span>
              )}
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
  party, kind, stats, onClose, onEdit,
}: {
  party: Party; kind: Kind; stats: PartyStats; onClose: () => void; onEdit: () => void;
}) {
  const [txs, setTxs] = useState<TxRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTxs() {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      if (kind === "customers") {
        const { data } = await supabase
          .from("sales")
          .select("id, sale_date, product_name, total_amount, paid_amount, payment_status")
          .eq("customer_id", party.id)
          .eq("user_id", uid!)
          .order("sale_date", { ascending: false });
        setTxs((data || []).map((r) => ({
          id: r.id, date: r.sale_date, product_name: r.product_name,
          amount: r.total_amount, paid_amount: r.paid_amount, payment_status: r.payment_status,
        })));
      } else {
        const { data } = await supabase
          .from("purchases")
          .select("id, purchase_date, product_name, amount, paid_amount, payment_status")
          .eq("supplier_id", party.id)
          .eq("user_id", uid!)
          .order("purchase_date", { ascending: false });
        setTxs((data || []).map((r) => ({
          id: r.id, date: r.purchase_date, product_name: r.product_name,
          amount: r.amount, paid_amount: r.paid_amount, payment_status: r.payment_status,
        })));
      }
      setLoading(false);
    }
    fetchTxs();
  }, [party.id, kind]);

  const amountLabel = kind === "customers" ? "Toplam Satış" : "Toplam Alış";
  const paidLabel = kind === "customers" ? "Tahsil Edilen" : "Ödenen";

  // Monthly trend for chart — last 6 months
  const chartData = useMemo(() => {
    const months: Record<string, number> = {};
    for (const tx of txs) {
      if (!tx.date) continue;
      const key = format(startOfMonth(parseISO(tx.date)), "MMM yy", { locale: tr });
      months[key] = (months[key] || 0) + tx.amount;
    }
    return Object.entries(months)
      .slice(-6)
      .map(([ay, tutar]) => ({ ay, tutar }));
  }, [txs]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            {party.name}
          </DialogTitle>
        </DialogHeader>

        {/* Info grid */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-1.5 text-sm">
          {party.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" /> {party.phone}
            </div>
          )}
          {party.email && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{party.email}</span>
            </div>
          )}
          {party.address && (
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <MapPin className="h-3.5 w-3.5 shrink-0" /> {party.address}
            </div>
          )}
          {party.contact_person && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-3.5 w-3.5 shrink-0" /> {party.contact_person}
            </div>
          )}
          {(party.tax_no || party.tax_office) && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5 shrink-0" />
              {party.tax_no}{party.tax_office ? ` / ${party.tax_office}` : ""}
            </div>
          )}
          {party.bank_info && (
            <div className="flex items-center gap-2 text-muted-foreground col-span-2">
              <Landmark className="h-3.5 w-3.5 shrink-0" /> {party.bank_info}
            </div>
          )}
          {party.note && (
            <div className="flex items-start gap-2 text-muted-foreground col-span-2">
              <FileText className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <span className="text-xs">{party.note}</span>
            </div>
          )}
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

        {/* Monthly trend chart */}
        {chartData.length > 1 && (
          <Card className="shrink-0">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-sm">Aylık {kind === "customers" ? "Satış" : "Alış"} Trendi</CardTitle>
            </CardHeader>
            <CardContent className="pb-3 px-4">
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="ay" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${(v / 1000).toFixed(0)}K`} />
                  <ReTooltip formatter={(v: number) => formatCurrency(v)} />
                  <Bar dataKey="tutar" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

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
                    <TableCell className="max-w-[200px] truncate">{tx.product_name || "-"}</TableCell>
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

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose}>Kapat</Button>
          <Button variant="outline" onClick={onEdit} className="gap-2">
            <Pencil className="h-3.5 w-3.5" /> Düzenle
          </Button>
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
    bank_info: "", note: "",
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
        bank_info: editing?.bank_info || "",
        note: editing?.note || "",
      });
    }
  }, [open, editing]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const schema = isSupplier ? supplierSchema : customerSchema;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      return toast.error(parsed.error.issues[0]?.message || "Form geçersiz");
    }
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return toast.error("Oturum bulunamadı"); }

    let payload: Record<string, unknown>;
    if (isSupplier) {
      const d = parsed.data as z.infer<typeof supplierSchema>;
      payload = {
        user_id: session.user.id,
        name: d.name,
        phone: d.phone || null,
        email: d.email || null,
        address: d.address || null,
        tax_no: d.tax_no || null,
        tax_office: d.tax_office || null,
        contact_person: d.contact_person || null,
        bank_info: d.bank_info || null,
        note: d.note || null,
      };
    } else {
      const d = parsed.data as z.infer<typeof customerSchema>;
      payload = {
        user_id: session.user.id,
        name: d.name,
        phone: d.phone || null,
        email: d.email || null,
        address: d.address || null,
        note: d.note || null,
      };
    }

    const { error } = editing
      ? await supabase.from(kind).update(payload).eq("id", editing.id).eq("user_id", session.user.id)
      : await supabase.from(kind).insert(payload);
    setSaving(false);
    if (error) return toast.error("Kaydedilemedi: " + friendlyDbError(error));
    toast.success(editing ? `${title} güncellendi` : `${title} eklendi`);
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `${title} Düzenle` : `Yeni ${title}`}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>{isSupplier ? "Firma / Tedarikçi Adı *" : "İsim *"}</Label>
            <Input value={form.name} maxLength={120}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>

          {isSupplier && (
            <>
              <div>
                <Label>Yetkili Kişi</Label>
                <Input value={form.contact_person} maxLength={80}
                  onChange={(e) => setForm({ ...form, contact_person: e.target.value })} />
              </div>
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
                <Label>Banka / IBAN Bilgisi</Label>
                <Input value={form.bank_info} maxLength={500}
                  onChange={(e) => setForm({ ...form, bank_info: e.target.value })}
                  placeholder="Banka adı / IBAN / Hesap No" />
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
          <div>
            <Label>Not</Label>
            <Textarea value={form.note} rows={2} maxLength={1000}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Ödeme koşulları, özel anlaşmalar vb." />
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

function CustomerProfitabilityTab() {
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<{
    customerId: string; customerName: string; grossRevenue: number;
    totalCost: number; returnAmount: number; netProfit: number; profitMargin: number;
  }[]>([]);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) { setLoading(false); return; }
      const uid = session.user.id;

      const [salesRes, returnsRes, customersRes] = await Promise.all([
        supabase.from("sales")
          .select("id, customer_id, total_amount, total_cost")
          .eq("user_id", uid)
          .is("deleted_at", null)
          .eq("status", "aktif")
          .not("customer_id", "is", null),
        supabase.from("returns")
          .select("sale_id, return_amount")
          .eq("user_id", uid)
          .is("deleted_at", null)
          .eq("status", "active"),
        supabase.from("customers")
          .select("id, name")
          .eq("user_id", uid)
          .is("deleted_at", null),
      ]);

      const returnsBySale: Record<string, number> = {};
      ((returnsRes.data || []) as { sale_id: string; return_amount: number }[]).forEach((r) => {
        returnsBySale[r.sale_id] = (returnsBySale[r.sale_id] || 0) + Number(r.return_amount || 0);
      });

      const customerNameMap: Record<string, string> = Object.fromEntries(
        ((customersRes.data || []) as { id: string; name: string }[]).map((c) => [c.id, c.name])
      );

      const profMap: Record<string, { revenue: number; cost: number; returns: number }> = {};
      ((salesRes.data || []) as { id: string; customer_id: string; total_amount: number; total_cost: number }[]).forEach((s) => {
        if (!s.customer_id) return;
        if (!profMap[s.customer_id]) profMap[s.customer_id] = { revenue: 0, cost: 0, returns: 0 };
        profMap[s.customer_id].revenue += Number(s.total_amount || 0);
        profMap[s.customer_id].cost += Number(s.total_cost || 0);
        profMap[s.customer_id].returns += returnsBySale[s.id] || 0;
      });

      const result = Object.entries(profMap).map(([cid, m]) => ({
        customerId: cid,
        customerName: customerNameMap[cid] || "Bilinmiyor",
        grossRevenue: m.revenue,
        totalCost: m.cost,
        returnAmount: m.returns,
        netProfit: m.revenue - m.cost - m.returns,
        profitMargin: m.revenue > 0 ? ((m.revenue - m.cost - m.returns) / m.revenue) * 100 : 0,
      })).sort((a, b) => b.netProfit - a.netProfit);

      setRows(result);
      setLoading(false);
    })();
  }, []);

  if (loading) return <div className="py-8 text-center text-muted-foreground">Hesaplanıyor...</div>;
  if (rows.length === 0) return <div className="py-8 text-center text-muted-foreground">Henüz yeterli satış verisi yok</div>;

  return (
    <div className="space-y-4">
      {rows[0] && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
            <p className="text-xs text-emerald-600 font-medium mb-1">🏆 En Karlı Müşteri</p>
            <p className="font-bold text-emerald-800 truncate">{rows[0].customerName}</p>
            <p className="text-lg font-bold text-emerald-600">{formatCurrency(rows[0].netProfit)}</p>
          </div>
          {rows[rows.length - 1]?.netProfit < 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-xs text-red-600 font-medium mb-1">⚠ Zarar Eden Müşteri</p>
              <p className="font-bold text-red-800 truncate">{rows[rows.length - 1].customerName}</p>
              <p className="text-lg font-bold text-red-600">{formatCurrency(rows[rows.length - 1].netProfit)}</p>
            </div>
          )}
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Müşteri</TableHead>
            <TableHead className="text-right">Ciro</TableHead>
            <TableHead className="text-right">Maliyet</TableHead>
            <TableHead className="text-right">İade</TableHead>
            <TableHead className="text-right">Net Kâr</TableHead>
            <TableHead className="text-center">Marj</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r, i) => (
            <TableRow key={r.customerId}>
              <TableCell className="text-muted-foreground text-sm">{i + 1}</TableCell>
              <TableCell className="font-medium">{r.customerName}</TableCell>
              <TableCell className="text-right text-sm">{formatCurrency(r.grossRevenue)}</TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">{formatCurrency(r.totalCost)}</TableCell>
              <TableCell className="text-right text-sm text-muted-foreground">{r.returnAmount > 0 ? `-${formatCurrency(r.returnAmount)}` : "—"}</TableCell>
              <TableCell className={`text-right font-bold ${r.netProfit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
                {formatCurrency(r.netProfit)}
              </TableCell>
              <TableCell className="text-center">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                  r.profitMargin >= 20 ? "bg-emerald-100 text-emerald-700" :
                  r.profitMargin >= 0 ? "bg-amber-100 text-amber-700" :
                  "bg-red-100 text-red-700"
                }`}>
                  %{r.profitMargin.toFixed(1)}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
