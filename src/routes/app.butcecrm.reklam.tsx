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
import { Plus, Search, Megaphone, Target, Pencil } from "lucide-react";
import { toast } from "sonner";

type Campaign = {
  id: string;
  name: string;
  platform: string | null;
  status: string;
  spend: number;
  start_date: string;
  end_date: string | null;
};
type Sale = { campaign_id: string | null; total_amount: number };

const STATUSES = ["aktif", "pasif"] as const;
type Status = (typeof STATUSES)[number];

const STATUS_BADGE: Record<string, string> = {
  aktif: "bg-emerald-100 text-emerald-700 border-emerald-200",
  pasif: "bg-secondary text-muted-foreground border-border",
};

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

  async function load() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const uid = session.user.id;
    const [c, s] = await Promise.all([
      supabase.from("campaigns").select("*").eq("user_id", uid).order("start_date", { ascending: false }),
      supabase.from("sales").select("campaign_id,total_amount").eq("user_id", uid),
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
    return { count: enriched.length, active: active.length, spend, revenue, roas };
  }, [enriched]);

  async function toggleStatus(c: Campaign) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return toast.error("Oturum bulunamadı");
    const next: Status = c.status === "aktif" ? "pasif" : "aktif";
    const { error } = await supabase.from("campaigns").update({ status: next }).eq("id", c.id).eq("user_id", session.user.id);
    if (error) return toast.error("Güncellenemedi: " + friendlyDbError(error));
    toast.success(`Kampanya ${next} olarak işaretlendi`);
    setCampaigns((prev) => prev.map((x) => (x.id === c.id ? { ...x, status: next } : x)));
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

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam Kampanya" value={`${stats.count}`} sub={`${stats.active} aktif`} />
        <StatCard label="Toplam Harcama" value={formatCurrency(stats.spend)} valueClass="text-red-600" />
        <StatCard label="Toplam Gelir" value={formatCurrency(stats.revenue)} valueClass="text-emerald-600" />
        <StatCard
          label="Genel ROAS"
          value={`${stats.roas.toFixed(2)}x`}
          valueClass={stats.roas >= 1 ? "text-emerald-600" : "text-red-600"}
          icon={<Target className="h-5 w-5 text-cyan-600" />}
        />
      </div>

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
                  <TableHead className="text-right">Harcama</TableHead>
                  <TableHead className="text-right">Gelir</TableHead>
                  <TableHead className="text-right">ROAS</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium max-w-[220px] truncate">{c.name}</TableCell>
                    <TableCell className="text-muted-foreground">{c.platform || "-"}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm text-muted-foreground">
                      {formatDate(c.start_date)} {c.end_date ? `→ ${formatDate(c.end_date)}` : "→ ..."}
                    </TableCell>
                    <TableCell className="text-right">{formatCurrency(Number(c.spend || 0))}</TableCell>
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
                      <Button size="icon" variant="ghost" className="h-8 w-8"
                        onClick={() => { setEditingCampaign(c); setEditOpen(true); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
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
      start_date: campaign.start_date,
      end_date: campaign.end_date || "",
    });
  }, [campaign]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const platform = form.platform === "__new__" ? form.newPlatform.trim() : form.platform;
    if (!form.name) return toast.error("Kampanya adı zorunludur");
    if (!platform) return toast.error("Platform seçmelisiniz");
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return toast.error("Oturum bulunamadı"); }
    const { error } = await supabase.from("campaigns").update({
      name: form.name,
      platform: platform || null,
      status: form.status,
      spend: Number(form.spend) || 0,
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
                onChange={(e) => setForm({ ...form, newPlatform: e.target.value })} required />
            </div>
          )}
          <div>
            <Label>Harcama (₺)</Label>
            <Input type="number" step="0.01" value={form.spend}
              onChange={(e) => setForm({ ...form, spend: e.target.value })} />
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
    start_date: today,
    end_date: "",
  });
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm({
      name: "", platform: "", newPlatform: "", status: "aktif",
      spend: "0", start_date: today, end_date: "",
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
    const payload = {
      user_id: session.user.id,
      name: form.name,
      platform: platform || null,
      status: form.status,
      spend: Number(form.spend) || 0,
      start_date: form.start_date,
      end_date: form.end_date || null,
    };
    const { error } = await supabase.from("campaigns").insert(payload);
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
          <div>
            <Label>Harcama (₺)</Label>
            <Input type="number" step="0.01" value={form.spend}
              onChange={(e) => setForm({ ...form, spend: e.target.value })} />
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
