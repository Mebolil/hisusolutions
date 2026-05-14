import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { formatDate } from "@/lib/butcecrm-helpers";
import { friendlyDbError } from "@/lib/butcecrm-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Bell, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { differenceInCalendarDays, parseISO } from "date-fns";

type Reminder = {
  id: string;
  title: string;
  type: string;
  due_date: string;
  status: string;
  related_record: string | null;
  note: string | null;
};

const TYPES = ["ödeme", "tahsilat", "stok", "görev", "diğer"] as const;
const STATUSES = ["bekliyor", "tamamlandı"] as const;
type Status = (typeof STATUSES)[number];

const TYPE_BADGE: Record<string, string> = {
  "ödeme": "bg-red-100 text-red-700 border-red-200",
  "tahsilat": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "stok": "bg-orange-100 text-orange-700 border-orange-200",
  "görev": "bg-blue-100 text-blue-700 border-blue-200",
  "diğer": "bg-secondary text-foreground border-border",
};

const reminderSchema = z.object({
  title: z.string().trim().min(1, "Başlık zorunludur").max(200),
  type: z.string().trim().min(1).max(40),
  due_date: z.string().min(1, "Tarih zorunludur"),
  status: z.string().min(1),
  related_record: z.string().trim().max(200).optional().or(z.literal("")),
  note: z.string().trim().max(1000).optional().or(z.literal("")),
});

export const Route = createFileRoute("/app/butcecrm/hatirlaticilar")({
  head: () => ({ meta: [{ title: "BütçeCRM — Hatırlatıcılar" }] }),
  component: RemindersPage,
});

function isOverdue(r: Reminder) {
  if (r.status === "tamamlandı") return false;
  try { return differenceInCalendarDays(parseISO(r.due_date), new Date()) < 0; }
  catch { return false; }
}

function RemindersPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Reminder[]>([]);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Reminder | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase
      .from("reminders")
      .select("*")
      .order("due_date", { ascending: true });
    setItems((data as Reminder[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    return items.filter((r) => {
      if (typeFilter !== "all" && r.type !== typeFilter) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (from && r.due_date < from) return false;
      if (to && r.due_date > to) return false;
      if (q) {
        const t = `${r.title} ${r.related_record || ""} ${r.note || ""}`.toLowerCase();
        if (!t.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [items, typeFilter, statusFilter, from, to, q]);

  const stats = useMemo(() => {
    const pending = items.filter((r) => r.status === "bekliyor");
    const overdue = items.filter(isOverdue);
    const today = items.filter((r) => {
      if (r.status === "tamamlandı") return false;
      try { return differenceInCalendarDays(parseISO(r.due_date), new Date()) === 0; }
      catch { return false; }
    });
    return { total: items.length, pending: pending.length, overdue: overdue.length, today: today.length };
  }, [items]);

  async function toggleDone(r: Reminder, done: boolean) {
    const next: Status = done ? "tamamlandı" : "bekliyor";
    const { error } = await supabase.from("reminders").update({ status: next }).eq("id", r.id);
    if (error) return toast.error("Güncellenemedi: " + error.message);
    setItems((prev) => prev.map((x) => (x.id === r.id ? { ...x, status: next } : x)));
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await supabase.from("reminders").delete().eq("id", deleting.id);
    if (error) return toast.error("Silinemedi: " + error.message);
    toast.success("Hatırlatıcı silindi");
    setItems((prev) => prev.filter((x) => x.id !== deleting.id));
    setDeleting(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Bell className="h-6 w-6 text-primary" /> Hatırlatıcılar</h1>
          <p className="text-muted-foreground text-sm">Görev, ödeme ve tahsilat hatırlatıcıları</p>
        </div>
        <NewReminderDialog open={open} setOpen={setOpen} onCreated={load} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam" value={String(stats.total)} />
        <StatCard label="Bekleyen" value={String(stats.pending)} valueClass="text-amber-600" />
        <StatCard label="Bugün" value={String(stats.today)} valueClass="text-blue-600" />
        <StatCard label="Gecikmiş" value={String(stats.overdue)} valueClass="text-red-600" />
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Filtreler</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">Tür</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
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
              <Label className="text-xs">Başlangıç</Label>
              <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Bitiş</Label>
              <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
            </div>
            <div>
              <Label className="text-xs">Ara</Label>
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
                  <TableHead className="w-10"></TableHead>
                  <TableHead>Başlık</TableHead>
                  <TableHead>Tür</TableHead>
                  <TableHead>Tarih</TableHead>
                  <TableHead>İlgili Kayıt</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => {
                  const overdue = isOverdue(r);
                  const done = r.status === "tamamlandı";
                  return (
                    <TableRow key={r.id} className={overdue ? "bg-red-50/60" : ""}>
                      <TableCell>
                        <Checkbox
                          checked={done}
                          onCheckedChange={(v) => toggleDone(r, !!v)}
                        />
                      </TableCell>
                      <TableCell className={`font-medium max-w-[260px] truncate ${done ? "line-through text-muted-foreground" : ""}`}>
                        {r.title}
                        {r.note && <p className="text-xs text-muted-foreground font-normal truncate">{r.note}</p>}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded border ${TYPE_BADGE[r.type] || TYPE_BADGE["diğer"]}`}>
                          {r.type}
                        </span>
                      </TableCell>
                      <TableCell className={`whitespace-nowrap ${overdue ? "text-red-600 font-medium" : ""}`}>
                        <div className="flex items-center gap-1.5">
                          {overdue && <AlertCircle className="h-3.5 w-3.5" />}
                          {formatDate(r.due_date)}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[180px] truncate text-muted-foreground">{r.related_record || "-"}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded border ${done ? "bg-emerald-100 text-emerald-700 border-emerald-200" : overdue ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-700 border-amber-200"}`}>
                          {done ? "tamamlandı" : overdue ? "gecikmiş" : "bekliyor"}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700"
                          onClick={() => setDeleting(r)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Silmek istediğinize emin misiniz?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleting?.title}</strong> kalıcı olarak silinecek.
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

function StatCard({ label, value, valueClass }: { label: string; value: string; valueClass?: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`text-2xl font-bold ${valueClass || ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function NewReminderDialog({
  open, setOpen, onCreated,
}: { open: boolean; setOpen: (v: boolean) => void; onCreated: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({
    title: "", type: "görev", due_date: today,
    status: "bekliyor" as Status, related_record: "", note: "",
  });
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm({ title: "", type: "görev", due_date: today, status: "bekliyor", related_record: "", note: "" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = reminderSchema.safeParse(form);
    if (!parsed.success) return toast.error(parsed.error.issues[0]?.message || "Form geçersiz");
    setSaving(true);
    const payload = {
      title: parsed.data.title,
      type: parsed.data.type,
      due_date: parsed.data.due_date,
      status: parsed.data.status,
      related_record: parsed.data.related_record || null,
      note: parsed.data.note || null,
    };
    const { error } = await supabase.from("reminders").insert(payload);
    setSaving(false);
    if (error) return toast.error("Eklenemedi: " + error.message);
    toast.success("Hatırlatıcı eklendi");
    reset();
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Yeni Hatırlatıcı</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Yeni Hatırlatıcı</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Başlık</Label>
            <Input value={form.title} maxLength={200}
              onChange={(e) => setForm({ ...form, title: e.target.value })} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tür</Label>
              <Select value={form.type} onValueChange={(v) => setForm({ ...form, type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tarih</Label>
              <Input type="date" value={form.due_date}
                onChange={(e) => setForm({ ...form, due_date: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>İlgili Kayıt (opsiyonel)</Label>
            <Input value={form.related_record} maxLength={200}
              placeholder="Müşteri / fatura no / vs."
              onChange={(e) => setForm({ ...form, related_record: e.target.value })} />
          </div>
          <div>
            <Label>Not</Label>
            <Textarea value={form.note} rows={2} maxLength={1000}
              onChange={(e) => setForm({ ...form, note: e.target.value })} />
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
