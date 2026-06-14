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
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Megaphone, Target, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import {
  ResponsiveContainer, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from "recharts";
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, subMonths,
  format, parseISO, isWithinInterval, eachWeekOfInterval,
} from "date-fns";
import { tr } from "date-fns/locale";

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
type Sale = { campaign_id: string | null; total_amount: number; sale_date: string };

const STATUSES = ["aktif", "pasif"] as const;
type Status = (typeof STATUSES)[number];
type Period = "hafta" | "ay" | "3ay";

const STATUS_BADGE: Record<string, string> = {
  aktif: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pasif: "bg-secondary text-muted-foreground border-border",
};

const PERIOD_LABELS: Record<Period, string> = { hafta: "Son 7 Gün", ay: "Bu Ay", "3ay": "Son 3 Ay" };

export const Route = createFileRoute("/app/butcecrm/reklam")({
  head: () => ({ meta: [{ title: "BütçeCRM — Reklam" }] }),
  component: AdsPage,
});

function AdsPage() {
  const [loading, setLoading] = useState(true);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [deletingCampaign, setDeletingCampaign] = useState<Campaign | null>(null);
  const [period, setPeriod] = useState<Period>("ay");

  async function load() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const uid = session.user.id;
    const [c, s] = await Promise.all([
      supabase.from("campaigns").select("*").eq("user_id", uid).order("start_date", { ascending: false }),
      supabase.from("sales").select("campaign_id,total_amount,sale_date").eq("user_id", uid).limit(2000),
    ]);
    setCampaigns((c.data as Campaign[]) || []);
    setSales((s.data as Sale[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const platforms = useMemo(() => {
    const set = new Set<string>();
    campaigns.forEach((c) => c.platform && set.add(c.platform));
    return Array.from(set).sort();
  }, [campaigns]);

  const revenueByCampaign = useMemo(() => {
    const m: Record<string, number> = {};
    sales.forEach((s) => {
      if (!s.campaign_id) return;
      m[s.campaign_id] = (m[s.campaign_id] || 0) + Number(s.total_amount || 0);
    });
    return m;
  }, [sales]);

  const enriched = useMemo(() => {
    return campaigns.map((c) => {
      const rev = revenueByCampaign[c.id] || 0;
      const spend = Number(c.spend || 0);
      return { ...c, revenue: rev, roas: spend > 0 ? rev / spend : 0 };
    });
  }, [campaigns, revenueByCampaign]);

  const filtered = useMemo(() => {
    return enriched.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (platformFilter !== "all" && c.platform !== platformFilter) return false;
      if (q && !c.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [enriched, statusFilter, platformFilter, q]);

  const stats = useMemo(() => {
    const active = enriched.filter((c) => c.status === "aktif");
    const spend = enriched.reduce((s, c) => s + Number(c.spend || 0), 0);
    const revenue = enriched.reduce((s, c) => s + c.revenue, 0);
    const roas = spend > 0 ? revenue / spend : 0;
    const totalBudget = enriched.reduce((s, c) => s + Number(c.budget || 0), 0);
    return { count: enriched.length, active: active.length, spend, revenue, roas, totalBudget };
  }, [enriched]);

  // Platform bazlı ROAS
  const platformStats = useMemo(() => {
    const map: Record<string, { spend: number; revenue: number }> = {};
    enriched.forEach((c) => {
      const p = c.platform || "Diğer";
      if (!map[p]) map[p] = { spend: 0, revenue: 0 };
      map[p].spend += Number(c.spend || 0);
      map[p].revenue += c.revenue;
    });
    return Object.entries(map).map(([platform, d]) => ({
      platform,
      Harcama: Math.round(d.spend),
      Gelir: Math.round(d.revenue),
      ROAS: d.spend > 0 ? +(d.revenue / d.spend).toFixed(2) : 0,
    })).sort((a, b) => b.ROAS - a.ROAS);
  }, [enriched]);

  // Trend verisi
  const trendData = useMemo(() => {
    const now = new Date();
    if (period === "hafta") {
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        const day = format(d, "yyyy-MM-dd");
        return {
          label: format(d, "d MMM", { locale: tr }),
          Gelir: sales.filter((s) => s.sale_date === day).reduce((sum, s) => sum + Number(s.total_amount || 0), 0),
        };
      });
    }
    if (period === "ay") {
      const start = startOfMonth(now);
      const end = endOfMonth(now);
      const weeks = eachWeekOfInterval({ start, end }, { weekStartsOn: 1 });
      return weeks.map((weekStart) => {
        const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
        return {
          label: format(weekStart, "d MMM", { locale: tr }),
          Gelir: sales.filter((s) => {
            try { return isWithinInterval(parseISO(s.sale_date), { start: weekStart, end: weekEnd }); }
            catch { return false; }
          }).reduce((sum, s) => sum + Number(s.total_amount || 0), 0),
        };
      });
    }
    // 3ay
    return Array.from({ length: 3 }, (_, i) => {
      const m = subMonths(now, 2 - i);
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
  }, [sales, period]);

  async function toggleStatus(c: Campaign) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return toast.error("Oturum bulunamadı");
    const next: Status = c.status === "aktif" ? "pasif" : "aktif";
    const { error } = await supabase.from("campaigns").update({ status: next }).eq("id", c.id).eq("user_id", session.user.id);
    if (error) return toast.error("Güncellenemedi: " + friendlyDbError(error));
    toast.success(`Kampanya ${next} olarak işaretlendi`);
    setCampaigns((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
  }

  async function confirmDelete() {
    if (!deletingCampaign) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const { error } = await supabase.from("campaigns").delete().eq("id", deletingCampaign.id).eq("user_id", session.user.id);
    if (error) return toast.error("Silinemedi: " + friendlyDbError(error));
    toast.success("Kampanya silindi");
    setDeletingCampaign(null);
    load();
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Megaphone className="h-6 w-6 text-primary" /> Reklam</h1>
          <p className="text-muted-foreground text-sm">Reklam kampanyaları ve ROAS performansı</p>
        </div>
        <NewCampaignDialog open={open} setOpen={setOpen} platforms={platforms} onCreated={load} />
        {editingCampaign && (
          <EditCampaignDialog
            open={editOpen} setOpen={setEditOpen}
            campaign={editingCampaign} platforms={platforms}
            onSaved={() => { setEditingCampaign(null); load(); }}
          />
        )}
      </div>

      <AlertDialog open={!!deletingCampaign} onOpenChange={(o) => { if (!o) setDeletingCampaign(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Kampanyayı sil?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deletingCampaign?.name}</strong> kampanyası kalıcı olarak silinecek. Bu işlem geri alınamaz.
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

      {/* Özet kartlar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam Kampanya" value={`${stats.count}`} sub={`${stats.active} aktif`} />
        <StatCard label="Toplam Harcama" value={formatCurrency(stats.spend)} valueClass="text-red-600"
          sub={stats.totalBudget > 0 ? `Bütçe: ${formatCurrency(stats.totalBudget)}` : undefined} />
        <StatCard label="Toplam Gelir" value={formatCurrency(stats.revenue)} valueClass="text-emerald-600" />
        <StatCard
          label="Genel ROAS"
          value={`${stats.roas.toFixed(2)}x`}
          valueClass={stats.roas >= 1 ? "text-emerald-600" : "text-red-600"}
          icon={<Target className="h-5 w-5 text-cyan-600" />}
        />
      </div>

      {/* Grafikler */}
      {enriched.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Platform bazlı ROAS */}
          {platformStats.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Platform Karşılaştırması</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={platformStats} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                    <Tooltip formatter={(v: number) => formatCurrency(v)} />
                    <Legend />
                    <Bar dataKey="Harcama" fill="#f87171" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Gelir" fill="#34d399" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                {/* ROAS rozetleri */}
                <div className="flex flex-wrap gap-2 mt-3">
                  {platformStats.map((p) => (
                    <span key={p.platform} className={`text-xs px-2 py-0.5 rounded-full border font-medium ${p.ROAS >= 1 ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                      {p.platform}: {p.ROAS.toFixed(2)}x ROAS
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Gelir trendi */}
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Gelir Trendi</CardTitle>
                <div className="flex gap-1">
                  {(["hafta", "ay", "3ay"] as Period[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => setPeriod(p)}
                      className={`text-xs px-2.5 py-1 rounded border transition-colors ${period === p ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border text-muted-foreground hover:bg-muted"}`}
                    >
                      {PERIOD_LABELS[p]}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trendData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₺${(v / 1000).toFixed(0)}K`} />
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                  <Line type="monotone" dataKey="Gelir" stroke="#34d399" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filtreler */}
      <Card>
        <CardHeader><CardTitle className="text-base">Filtreler</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Platform</Label>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {platforms.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Durum</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Ara (kampanya adı)</Label>
              <div className="relative">
                <Search className="h-4 w-4 absolute left-2.5 top-2.5 text-muted-foreground" />
                <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Ara..." className="pl-8" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tablo */}
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
                  <TableHead>Kampanya</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Tarih Aralığı</TableHead>
                  <TableHead className="text-right">Harcama / Bütçe</TableHead>
                  <TableHead className="text-right">Gelir</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-20"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => {
                  const budget = Number(c.budget || 0);
                  const spend = Number(c.spend || 0);
                  const pct = budget > 0 ? (spend / budget) * 100 : 0;
                  return (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium max-w-[200px] truncate">{c.name}</TableCell>
                      <TableCell className="text-muted-foreground">{c.platform || "-"}</TableCell>
                      <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                        {formatDate(c.start_date)} {c.end_date ? `→ ${formatDate(c.end_date)}` : "→ ..."}
                      </TableCell>
                      <TableCell className="text-right">
                        {budget > 0 ? (
                          <div className="min-w-[110px]">
                            <div className="flex justify-between text-xs mb-1">
                              <span className="font-medium">{formatCurrency(spend)}</span>
                              <span className="text-muted-foreground">{formatCurrency(budget)}</span>
                            </div>
                            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-primary"}`}
                                style={{ width: `${Math.min(100, pct)}%` }}
                              />
                            </div>
                            <div className={`text-xs mt-0.5 text-right ${pct >= 100 ? "text-red-600" : "text-muted-foreground"}`}>
                              %{pct.toFixed(0)}
                            </div>
                          </div>
                        ) : (
                          formatCurrency(spend)
                        )}
                      </TableCell>
                      <TableCell className="text-right">{formatCurrency(c.revenue)}</TableCell>
                      <TableCell className={`text-right font-semibold ${c.roas >= 1 ? "text-emerald-600" : c.roas > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                        {c.roas > 0 ? `${c.roas.toFixed(2)}x` : "-"}
                      </TableCell>
                      <TableCell>
                        <button
                          onClick={() => toggleStatus(c)}
                          className={`text-xs px-2.5 py-1 rounded border transition-colors ${STATUS_BADGE[c.status] || STATUS_BADGE.pasif} hover:opacity-80`}
                          title="Durumu değiştirmek için tıkla"
                        >
                          {c.status}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-8 w-8"
                            onClick={() => { setEditingCampaign(c); setEditOpen(true); }}>
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeletingCampaign(c)}>
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
    </div>
  );
}

function StatCard({ label, value, valueClass, sub, icon }: { label: string; value: string; valueClass?: string; sub?: string; icon?: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className={`text-xl font-bold truncate ${valueClass || ""}`}>{value}</p>
            {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
          </div>
          {icon && <div className="h-10 w-10 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">{icon}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function EditCampaignDialog({
  open, setOpen, campaign, platforms, onSaved,
}: {
  open: boolean; setOpen: (v: boolean) => void;
  campaign: Campaign; platforms: string[]; onSaved: () => void;
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

  useEffect(() => {
    setForm({
      name: campaign.name,
      platform: campaign.platform || "",
      newPlatform: "",
      status: campaign.status as Status,
      spend: String(campaign.spend ?? "0"),
      budget: String(campaign.budget ?? ""),
      start_date: campaign.start_date,
      end_date: campaign.end_date || "",
    });
  }, [campaign]);

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
                  {["Meta", "Google", "TikTok", "Instagram", ...platforms.filter((p) => !["Meta", "Google", "TikTok", "Instagram"].includes(p))].map((p) => (
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
              <Input value={form.newPlatform}
                onChange={(e) => setForm({ ...form, newPlatform: e.target.value })} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Harcama (₺)</Label>
              <Input type="number" step="0.01" value={form.spend}
                onChange={(e) => setForm({ ...form, spend: e.target.value })} />
            </div>
            <div>
              <Label>Hedef Bütçe (₺) <span className="text-muted-foreground text-xs">opsiyonel</span></Label>
              <Input type="number" step="0.01" placeholder="Yok" value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Başlangıç Tarihi</Label>
              <Input type="date" value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div>
              <Label>Bitiş Tarihi</Label>
              <Input type="date" value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
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

function NewCampaignDialog({
  open, setOpen, platforms, onCreated,
}: {
  open: boolean; setOpen: (v: boolean) => void;
  platforms: string[]; onCreated: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    name: "",
    platform: "",
    newPlatform: "",
    status: "aktif" as Status,
    spend: "0",
    budget: "",
    start_date: today,
    end_date: "",
  });
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm({
      name: "", platform: "", newPlatform: "", status: "aktif",
      spend: "0", budget: "", start_date: today, end_date: "",
    });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const platform = form.platform === "__new__" ? form.newPlatform.trim() : form.platform;
    if (!form.name) return toast.error("Kampanya adı zorunludur");
    if (!platform) return toast.error("Platform seçmelisiniz");
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return toast.error("Oturum bulunamadı"); }
    const { error } = await supabase.from("campaigns").insert({
      user_id: session.user.id,
      name: form.name,
      platform: platform || null,
      status: form.status,
      spend: Number(form.spend) || 0,
      budget: form.budget ? Number(form.budget) : null,
      start_date: form.start_date,
      end_date: form.end_date || null,
    });
    setSaving(false);
    if (error) return toast.error("Eklenemedi: " + friendlyDbError(error));
    toast.success("Kampanya eklendi");
    reset();
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Yeni Kampanya</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Yeni Kampanya</DialogTitle></DialogHeader>
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
                  {["Meta", "Google", "TikTok", "Instagram", ...platforms.filter((p) => !["Meta", "Google", "TikTok", "Instagram"].includes(p))].map((p) => (
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
              <Input value={form.newPlatform}
                onChange={(e) => setForm({ ...form, newPlatform: e.target.value })} required />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Harcama (₺)</Label>
              <Input type="number" step="0.01" value={form.spend}
                onChange={(e) => setForm({ ...form, spend: e.target.value })} />
            </div>
            <div>
              <Label>Hedef Bütçe (₺) <span className="text-muted-foreground text-xs">opsiyonel</span></Label>
              <Input type="number" step="0.01" placeholder="Yok" value={form.budget}
                onChange={(e) => setForm({ ...form, budget: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Başlangıç Tarihi</Label>
              <Input type="date" value={form.start_date}
                onChange={(e) => setForm({ ...form, start_date: e.target.value })} required />
            </div>
            <div>
              <Label>Bitiş Tarihi</Label>
              <Input type="date" value={form.end_date}
                onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
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
