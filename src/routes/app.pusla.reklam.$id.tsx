import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/pusla-helpers";
import { friendlyDbError } from "@/lib/pusla-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ArrowLeft, Megaphone, Target, TrendingUp, TrendingDown, Calendar, Trash2, Pencil } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
} from "recharts";
import {
  startOfMonth, endOfMonth, subMonths, format, parseISO, isWithinInterval,
} from "date-fns";
import { tr } from "date-fns/locale";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

type Campaign = {
  id: string;
  name: string;
  platform: string | null;
  status: string;
  spend: number;
  budget: number | null;
  start_date: string;
  end_date: string | null;
};

type Sale = {
  id: string;
  sale_date: string;
  total_amount: number;
  product_name: string | null;
  quantity: number | null;
  customers: { name: string } | null;
};

const STATUSES = ["aktif", "pasif"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_BADGE: Record<string, string> = {
  aktif: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pasif: "bg-secondary text-muted-foreground border-border",
};

export const Route = createFileRoute("/app/pusla/reklam/$id")({
  head: () => ({ meta: [{ title: "Pusla — Kampanya Detayı" }] }),
  component: CampaignDetail,
});

function CampaignDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [sales, setSales] = useState<Sale[]>([]);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  async function load() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const uid = session.user.id;
    const [c, s] = await Promise.all([
      supabase.from("campaigns").select("*").eq("id", id).eq("user_id", uid).is("deleted_at", null).single(),
      supabase.from("sales").select("id,sale_date,total_amount,product_name,quantity,customers(name)")
        .eq("campaign_id", id).eq("user_id", uid).is("deleted_at", null).order("sale_date", { ascending: false }).limit(500),
    ]);
    if (c.error || !c.data) {
      toast.error("Kampanya bulunamadı");
      navigate({ to: "/app/pusla/reklam" });
      return;
    }
    setCampaign(c.data as Campaign);
    setSales((s.data as Sale[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, [id]);

  const stats = useMemo(() => {
    if (!campaign) return null;
    const spend = Number(campaign.spend || 0);
    const revenue = sales.reduce((sum, s) => sum + Number(s.total_amount || 0), 0);
    const roas = spend > 0 ? revenue / spend : 0;
    const profit = revenue - spend;
    const budget = Number(campaign.budget || 0);
    const budgetPct = budget > 0 ? (spend / budget) * 100 : 0;
    return { spend, revenue, roas, profit, budget, budgetPct };
  }, [campaign, sales]);

  // Aylık gelir trendi (son 6 ay)
  const monthlyTrend = useMemo(() => {
    return Array.from({ length: 6 }, (_, i) => {
      const m = subMonths(new Date(), 5 - i);
      const start = startOfMonth(m);
      const end = endOfMonth(m);
      return {
        label: format(m, "MMM yy", { locale: tr }),
        Gelir: sales.filter((s) => {
          try { return isWithinInterval(parseISO(s.sale_date), { start, end }); }
          catch { return false; }
        }).reduce((sum, s) => sum + Number(s.total_amount || 0), 0),
      };
    });
  }, [sales]);

  // Günlük gelir (son 30 gün)
  const dailyTrend = useMemo(() => {
    const now = new Date();
    return Array.from({ length: 30 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (29 - i));
      const day = format(d, "yyyy-MM-dd");
      return {
        label: format(d, "d MMM", { locale: tr }),
        Gelir: sales.filter((s) => s.sale_date === day).reduce((sum, s) => sum + Number(s.total_amount || 0), 0),
      };
    });
  }, [sales]);

  // En çok satan ürünler
  const topProducts = useMemo(() => {
    const m: Record<string, { revenue: number; count: number }> = {};
    sales.forEach((s) => {
      const k = s.product_name || "Bilinmiyor";
      if (!m[k]) m[k] = { revenue: 0, count: 0 };
      m[k].revenue += Number(s.total_amount || 0);
      m[k].count += Number(s.quantity || 1);
    });
    return Object.entries(m)
      .map(([name, d]) => ({ name, ...d }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [sales]);

  async function confirmDelete() {
    if (!campaign) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { error } = await supabase.from("campaigns").update({ deleted_at: new Date().toISOString() }).eq("id", campaign.id).eq("user_id", session.user.id);
    if (error) return toast.error("Silinemedi: " + friendlyDbError(error));
    toast.success("Kampanya silindi");
    navigate({ to: "/app/pusla/reklam" });
  }

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>;
  }
  if (!campaign || !stats) {
    return <div className="p-8 text-center text-muted-foreground">Kampanya bulunamadı</div>;
  }

  return (
    <div className="space-y-6">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <Link to="/app/pusla/reklam" className="mt-1 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Megaphone className="h-6 w-6 text-primary" />
                {campaign.name}
              </h1>
              <span className={`text-xs px-2.5 py-1 rounded border font-medium ${STATUS_BADGE[campaign.status] || STATUS_BADGE.pasif}`}>
                {campaign.status}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
              {campaign.platform && <Badge variant="outline">{campaign.platform}</Badge>}
              <span className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(campaign.start_date)}
                {campaign.end_date ? ` → ${formatDate(campaign.end_date)}` : " → devam ediyor"}
              </span>
            </div>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => setEditOpen(true)}>
            <Pencil className="h-3.5 w-3.5" /> Düzenle
          </Button>
          <Button variant="outline" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-3.5 w-3.5" /> Sil
          </Button>
        </div>
      </div>

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Toplam Harcama</p>
            <p className="text-xl font-bold text-red-600">{formatCurrency(stats.spend)}</p>
            {stats.budget > 0 && (
              <>
                <div className="mt-2 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${stats.budgetPct >= 100 ? "bg-red-500" : stats.budgetPct >= 80 ? "bg-amber-500" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, stats.budgetPct)}%` }}
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bütçe: {formatCurrency(stats.budget)} (%{stats.budgetPct.toFixed(0)})
                </p>
              </>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Kampanya Geliri</p>
            <p className="text-xl font-bold text-emerald-600">{formatCurrency(stats.revenue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{sales.length} satış</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">Net Kâr</p>
            <p className={`text-xl font-bold ${stats.profit >= 0 ? "text-emerald-600" : "text-red-600"}`}>
              {stats.profit >= 0 ? "+" : ""}{formatCurrency(stats.profit)}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              {stats.profit >= 0
                ? <TrendingUp className="h-3 w-3 text-emerald-500" />
                : <TrendingDown className="h-3 w-3 text-red-500" />}
              Gelir − Harcama
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <p className="text-xs text-muted-foreground">ROAS</p>
            <p className={`text-xl font-bold ${stats.roas >= 1 ? "text-emerald-600" : "text-red-600"}`}>
              {stats.roas > 0 ? `${stats.roas.toFixed(2)}x` : "-"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
              <Target className="h-3 w-3 text-cyan-500" />
              {stats.roas >= 1 ? "Kârlı kampanya" : stats.roas > 0 ? "Zararlı kampanya" : "Henüz gelir yok"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Aylık gelir trendi */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Aylık Gelir Trendi</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={monthlyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Line type="monotone" dataKey="Gelir" stroke="#34d399" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Günlük gelir (son 30 gün) */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Son 30 Gün</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyTrend} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={6} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} />
                <Bar dataKey="Gelir" fill="#34d399" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* En çok satan ürünler */}
      {topProducts.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Bu Kampanyadan En Çok Satılan Ürünler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topProducts.map((p, i) => {
                const maxRevenue = topProducts[0].revenue;
                const pct = maxRevenue > 0 ? (p.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={p.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium truncate max-w-[60%]">{i + 1}. {p.name}</span>
                      <span className="text-muted-foreground shrink-0">{formatCurrency(p.revenue)} · {p.count} adet</span>
                    </div>
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Satış listesi */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Satışlar ({sales.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {sales.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Bu kampanyaya henüz satış bağlanmamış</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tarih</TableHead>
                  <TableHead>Müşteri</TableHead>
                  <TableHead>Ürün</TableHead>
                  <TableHead className="text-right">Miktar</TableHead>
                  <TableHead className="text-right">Tutar</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((s) => (
                  <TableRow key={s.id}>
                    <TableCell className="whitespace-nowrap text-sm">{formatDate(s.sale_date)}</TableCell>
                    <TableCell className="text-muted-foreground">{s.customers?.name || "-"}</TableCell>
                    <TableCell className="text-muted-foreground">{s.product_name || "-"}</TableCell>
                    <TableCell className="text-right text-muted-foreground">{s.quantity ?? "-"}</TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(s.total_amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Silme onayı */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kampanyayı sil?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{campaign.name}</strong> kampanyası kalıcı olarak silinecek. Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit dialog */}
      {editOpen && (
        <EditCampaignDialog
          open={editOpen}
          setOpen={setEditOpen}
          campaign={campaign}
          onSaved={() => { setEditOpen(false); load(); }}
        />
      )}
    </div>
  );
}

function EditCampaignDialog({
  open, setOpen, campaign, onSaved,
}: {
  open: boolean; setOpen: (v: boolean) => void;
  campaign: Campaign; onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: campaign.name,
    platform: campaign.platform || "",
    newPlatform: "",
    status: campaign.status as Status,
    spend: String(campaign.spend ?? "0"),
    budget: String(campaign.budget ?? ""),
    start_date: campaign.start_date,
    end_date: campaign.end_date || "",
  });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const platform = form.platform === "__new__" ? form.newPlatform.trim() : form.platform;
    if (!form.name) return toast.error("Kampanya adı zorunludur");
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return toast.error("Oturum bulunamadı"); }
    const { error } = await supabase.from("campaigns").update({
      name: form.name,
      platform: platform || null,
      status: form.status,
      spend: Number(form.spend) || 0,
      budget: form.budget ? Number(form.budget) : null,
      start_date: form.start_date,
      end_date: form.end_date || null,
    }).eq("id", campaign.id).eq("user_id", session.user.id);
    setSaving(false);
    if (error) return toast.error("Güncellenemedi: " + friendlyDbError(error));
    toast.success("Kampanya güncellendi");
    setOpen(false);
    onSaved();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Kampanyayı Düzenle</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Kampanya Adı</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Platform</Label>
              <Select value={form.platform} onValueChange={(v) => setForm({ ...form, platform: v })}>
                <SelectTrigger><SelectValue placeholder="Seç" /></SelectTrigger>
                <SelectContent>
                  {["Meta", "Google", "TikTok", "Instagram"].map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                  <SelectItem value="__new__">+ Yeni platform</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Durum</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as Status })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          {form.platform === "__new__" && (
            <div>
              <Label>Yeni Platform Adı</Label>
              <Input value={form.newPlatform} onChange={(e) => setForm({ ...form, newPlatform: e.target.value })} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Harcama (₺)</Label>
              <Input type="number" step="0.01" value={form.spend} onChange={(e) => setForm({ ...form, spend: e.target.value })} />
            </div>
            <div>
              <Label>Hedef Bütçe (₺) <span className="text-muted-foreground text-xs">opsiyonel</span></Label>
              <Input type="number" step="0.01" placeholder="Yok" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Başlangıç Tarihi</Label>
              <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div>
              <Label>Bitiş Tarihi</Label>
              <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>İptal</Button>
            <Button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : "Güncelle"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
