import { friendlyDbError } from "@/lib/butcecrm-helpers";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Search, Users, Pencil, Trash2 } from "lucide-react";
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
  const [q, setQ] = useState("");
  const [editing, setEditing] = useState<Party | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<Party | null>(null);

  async function load() {
    setLoading(true);
    const { data } = await supabase.from(kind).select("*").order("name");
    setItems((data as Party[]) || []);
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

  function openNew() {
    setEditing(null);
    setOpen(true);
  }
  function openEdit(p: Party) {
    setEditing(p);
    setOpen(true);
  }

  async function confirmDelete() {
    if (!deleting) return;
    const { error } = await supabase.from(kind).delete().eq("id", deleting.id);
    if (error) return toast.error("Silinemedi: " + friendlyDbError(error));
    toast.success(`${title} silindi`);
    setItems((prev) => prev.filter((x) => x.id !== deleting.id));
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
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
                  <TableHead>Email</TableHead>
                  <TableHead>Adres</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{p.name}</TableCell>
                    <TableCell className="whitespace-nowrap">{p.phone || "-"}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{p.email || "-"}</TableCell>
                    <TableCell className="max-w-[260px] truncate text-muted-foreground">{p.address || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => openEdit(p)}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-600 hover:text-red-700" onClick={() => setDeleting(p)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <PartyDialog
        open={open}
        setOpen={setOpen}
        kind={kind}
        title={title}
        editing={editing}
        onSaved={load}
      />

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
    const base = {
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      email: parsed.data.email || null,
      address: parsed.data.address || null,
    };
    const payload = isSupplier
      ? {
          ...base,
          tax_no: parsed.data.tax_no || null,
          tax_office: parsed.data.tax_office || null,
          contact_person: parsed.data.contact_person || null,
        }
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
