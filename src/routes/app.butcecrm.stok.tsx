import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/butcecrm-helpers";
import { friendlyDbError } from "@/lib/butcecrm-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter,
} from "@/components/ui/dialog";
import { Package, Search, AlertTriangle, History, Plus, Pencil, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CsvToolbar, type CsvField } from "@/components/butcecrm/CsvToolbar";

const PRODUCTS_CSV_FIELDS: CsvField[] = [
  {
    key: "name", label: "Ürün Adı",
    aliases: ["ADI", "URUN ADI", "ÜRÜN", "ACIKLAMA", "AÇIKLAMA", "TANIM", "STOK ADI", "MALZEME ADI", "PRODUCT NAME", "NAME"],
  },
  {
    key: "urun_kodu", label: "Ürün Kodu",
    aliases: ["URUN KODU", "KODU", "KOD", "STOK KODU", "STOK KOD", "SKU", "ITEM CODE", "BARCODE", "BARKOD"],
  },
  {
    key: "kisa_ismi", label: "Kısa İsmi",
    aliases: ["KISA ISM", "KISA İSMİ", "KISA AD", "KISA ADI", "SHORT NAME", "KISAAD"],
  },
  {
    key: "uretici_kodu", label: "Üretici Kodu",
    aliases: ["URETICI KODU", "ÜRETİCİ KODU", "URETICI KOD", "MPN", "MANUFACTURER CODE", "MARKA KODU", "MODEL KODU"],
  },
  {
    key: "category", label: "Kategori",
    aliases: ["ANA GRUP", "KATEGORI KODU", "KATEGORİ", "GRUP", "SEKTOR", "SEKTÖR KODU", "TIP", "TÜR", "CATEGORY"],
  },
  {
    key: "quantity", label: "Stok Miktarı", type: "number",
    aliases: ["MERKEZ MIKTAR", "MERKEZ MİKTAR", "MIKTAR", "MİKTAR", "ADET", "STOK", "QTY", "QUANTITY", "PCS", "TOPLAM MIKTAR"],
  },
  {
    key: "low_stock_threshold", label: "Düşük Stok Eşiği", type: "number",
    aliases: ["MINIMUM SEVIYE", "MİNİMUM SEVİYE", "MIN SEVIYE", "ALT SINIR", "REORDER", "SIPARIS SEVIYE", "SİPARİŞ SEVİYE"],
  },
  {
    key: "unit_price", label: "Birim Fiyat", type: "number",
    aliases: ["FIYAT", "FİYAT", "TL FIYAT", "TL FİYAT", "TL FIYAT KDV", "TL FİYAT + KDV", "SATIS FIYATI", "SATIŞ FİYATI", "BIRIM FIYAT", "BİRİM FİYAT", "PRICE", "UNIT PRICE", "TICARI", "TİCARİ"],
  },
];
const PRODUCTS_CSV_SAMPLE = ["Örnek Ürün", "URN-001", "Kısa Ad", "MPN-001", "Genel", 100, 10, 50];

type Product = {
  id: string;
  name: string;
  urun_kodu: string | null;
  kisa_ismi: string | null;
  uretici_kodu: string | null;
  category: string | null;
  quantity: number;
  low_stock_threshold: number;
  unit_price: number | null;
};
type Category = { id: string; name: string };
type Lot = {
  id: string;
  product_id: string;
  quantity: number;
  unit_cost: number | null;
  created_at: string;
  note: string | null;
};

type StockState = "ok" | "low" | "out";

function stockState(p: Product): StockState {
  const q = Number(p.quantity);
  if (q <= 0) return "out";
  if (q <= Number(p.low_stock_threshold)) return "low";
  return "ok";
}

const STATE_LABEL: Record<StockState, string> = {
  ok: "Normal", low: "Düşük", out: "Tükendi",
};
const STATE_BADGE: Record<StockState, string> = {
  ok: "bg-emerald-100 text-emerald-700 border-emerald-200",
  low: "bg-amber-100 text-amber-700 border-amber-200",
  out: "bg-red-100 text-red-700 border-red-200",
};

export const Route = createFileRoute("/app/butcecrm/stok")({
  head: () => ({ meta: [{ title: "BütçeCRM — Stok" }] }),
  component: StockPage,
});

function StockPage() {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [catFilter, setCatFilter] = useState("all");
  const [stateFilter, setStateFilter] = useState<"all" | StockState>("all");
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<Product | null>(null);
  const [lots, setLots] = useState<Lot[]>([]);
  const [lotsLoading, setLotsLoading] = useState(false);
  const [newOpen, setNewOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  async function load() {
    setLoading(true);
    const [p, c] = await Promise.all([
      supabase.from("products").select("*").order("name"),
      supabase.from("product_categories").select("id,name").order("name"),
    ]);
    setProducts((p.data as Product[]) || []);
    setCategories((c.data as Category[]) || []);
    setLoading(false);
  }
  useEffect(() => { load(); }, []);

  const categoryNames = useMemo(() => {
    const set = new Set<string>(categories.map((c) => c.name));
    products.forEach((p) => p.category && set.add(p.category));
    return Array.from(set).sort();
  }, [categories, products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (catFilter !== "all" && p.category !== catFilter) return false;
      if (stateFilter !== "all" && stockState(p) !== stateFilter) return false;
      if (q && !p.name.toLowerCase().includes(q.toLowerCase())) return false;
      return true;
    });
  }, [products, catFilter, stateFilter, q]);

  const stats = useMemo(() => {
    const total = products.length;
    const low = products.filter((p) => stockState(p) === "low").length;
    const out = products.filter((p) => stockState(p) === "out").length;
    const value = products.reduce(
      (s, p) => s + Number(p.quantity || 0) * Number(p.unit_price || 0),
      0,
    );
    return { total, low, out, value };
  }, [products]);

  async function openHistory(p: Product) {
    setSelected(p);
    setLotsLoading(true);
    const { data } = await supabase
      .from("stock_lots")
      .select("*")
      .eq("product_id", p.id)
      .order("created_at", { ascending: false });
    setLots((data as Lot[]) || []);
    setLotsLoading(false);
  }

  const allPageSelected = filtered.length > 0 && filtered.every((p) => selectedIds.has(p.id));

  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) filtered.forEach((p) => next.delete(p.id));
      else filtered.forEach((p) => next.add(p.id));
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
    if (!confirm(`${selectedIds.size} ürünü silmek istediğinize emin misiniz?`)) return;
    const ids = Array.from(selectedIds);
    const { error } = await supabase.from("products").delete().in("id", ids);
    if (error) return toast.error("Silinemedi: " + friendlyDbError(error));
    toast.success(`${ids.length} ürün silindi`);
    setSelectedIds(new Set());
    load();
  }

  const lowStockProducts = products
    .filter((p) => stockState(p) !== "ok")
    .sort((a, b) => Number(a.quantity) - Number(b.quantity));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> Stok</h1>
          <p className="text-muted-foreground text-sm">Ürün stok seviyeleri ve hareket geçmişi</p>
        </div>
        <div className="flex items-center gap-2">
          <NewProductDialog
            open={newOpen}
            setOpen={setNewOpen}
            categories={categoryNames}
            onCreated={load}
          />
          <CsvToolbar
            slug="stok"
            table="products"
            upsertOn="name,user_id"
            fields={PRODUCTS_CSV_FIELDS}
            sampleRow={PRODUCTS_CSV_SAMPLE}
            exportRows={filtered.map((p) => ({
              name: p.name,
              urun_kodu: p.urun_kodu,
              kisa_ismi: p.kisa_ismi,
              uretici_kodu: p.uretici_kodu,
              category: p.category,
              quantity: p.quantity,
              low_stock_threshold: p.low_stock_threshold,
              unit_price: p.unit_price,
            }))}
            onImported={load}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam Ürün" value={String(stats.total)} />
        <StatCard label="Düşük Stok" value={String(stats.low)} valueClass="text-amber-600" />
        <StatCard label="Tükenen" value={String(stats.out)} valueClass="text-red-600" />
        <StatCard label="Toplam Stok Değeri" value={formatCurrency(stats.value)} />
      </div>

      {lowStockProducts.length > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-700">
              <AlertTriangle className="h-4 w-4" /> Stok Uyarıları ({lowStockProducts.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {lowStockProducts.slice(0, 9).map((p) => {
                const st = stockState(p);
                return (
                  <button
                    key={p.id}
                    onClick={() => openHistory(p)}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-white border text-left hover:border-primary transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      <p className="text-xs text-muted-foreground">eşik: {Number(p.low_stock_threshold)}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded border ${STATE_BADGE[st]}`}>
                      {Number(p.quantity)} {STATE_LABEL[st]}
                    </span>
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader><CardTitle className="text-base">Filtreler</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Kategori</Label>
              <Select value={catFilter} onValueChange={setCatFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  {categoryNames.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Stok Durumu</Label>
              <Select value={stateFilter} onValueChange={(v) => setStateFilter(v as "all" | StockState)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tümü</SelectItem>
                  <SelectItem value="ok">Normal</SelectItem>
                  <SelectItem value="low">Düşük</SelectItem>
                  <SelectItem value="out">Tükendi</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Ara (ürün adı)</Label>
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
                  <TableHead>Ürün Adı</TableHead>
                  <TableHead>Ürün Kodu</TableHead>
                  <TableHead>Kısa İsmi</TableHead>
                  <TableHead>Üretici Kodu</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="text-right">Mevcut Stok</TableHead>
                  <TableHead className="text-right">Eşik</TableHead>
                  <TableHead className="text-right">Birim Fiyat</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Hareketler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => {
                  const st = stockState(p);
                  return (
                    <TableRow key={p.id} className={selectedIds.has(p.id) ? "bg-muted/50" : ""}>
                      <TableCell>
                        <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleOne(p.id)} />
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px] truncate">{p.name}</TableCell>
                      <TableCell className="text-muted-foreground">{p.urun_kodu || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.kisa_ismi || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.uretici_kodu || "-"}</TableCell>
                      <TableCell className="max-w-[120px] truncate text-muted-foreground">{p.category || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{Number(p.quantity)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{Number(p.low_stock_threshold)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(p.unit_price || 0))}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded border ${STATE_BADGE[st]}`}>{STATE_LABEL[st]}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setEditing(p)} className="gap-1">
                            <Pencil className="h-3.5 w-3.5" /> Düzenle
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openHistory(p)} className="gap-1">
                            <History className="h-3.5 w-3.5" /> Geçmiş
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

      <Dialog open={!!selected} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{selected?.name} — Stok Hareketleri</DialogTitle>
          </DialogHeader>
          {lotsLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Yükleniyor...</p>
          ) : lots.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Bu ürün için hareket kaydı yok</p>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tarih</TableHead>
                    <TableHead className="text-right">Miktar</TableHead>
                    <TableHead className="text-right">Birim Maliyet</TableHead>
                    <TableHead>Not</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lots.map((l) => {
                    const qty = Number(l.quantity);
                    return (
                      <TableRow key={l.id}>
                        <TableCell className="whitespace-nowrap">{formatDate(l.created_at)}</TableCell>
                        <TableCell className={`text-right font-medium ${qty < 0 ? "text-red-600" : "text-emerald-600"}`}>
                          {qty > 0 ? `+${qty}` : qty}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(Number(l.unit_cost || 0))}</TableCell>
                        <TableCell className="text-muted-foreground max-w-[220px] truncate">{l.note || "-"}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
      <EditProductDialog
        product={editing}
        categories={categoryNames}
        onClose={() => setEditing(null)}
        onSaved={() => { setEditing(null); load(); }}
      />
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

function NewProductDialog({
  open, setOpen, categories, onCreated,
}: {
  open: boolean; setOpen: (v: boolean) => void;
  categories: string[]; onCreated: () => void;
}) {
  const [form, setForm] = useState({
    name: "", urun_kodu: "", kisa_ismi: "", uretici_kodu: "",
    category: "", newCategory: "", quantity: "0", low_stock_threshold: "5", unit_price: "",
  });
  const [saving, setSaving] = useState(false);

  function reset() {
    setForm({ name: "", urun_kodu: "", kisa_ismi: "", uretici_kodu: "", category: "", newCategory: "", quantity: "0", low_stock_threshold: "5", unit_price: "" });
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return toast.error("Ürün adı zorunludur");
    const cat = (form.category === "__new__" ? form.newCategory.trim() : form.category).trim();
    if (!cat) return toast.error("Kategori zorunludur");
    setSaving(true);
    const { data: sessionData } = await supabase.auth.getSession();
    const userId = sessionData.session?.user.id;
    if (!userId) {
      setSaving(false);
      return toast.error("Oturum bulunamadı, lütfen tekrar giriş yapın");
    }
    const payload = {
      user_id: userId,
      name: form.name.trim(),
      urun_kodu: form.urun_kodu.trim() || null,
      kisa_ismi: form.kisa_ismi.trim() || null,
      uretici_kodu: form.uretici_kodu.trim() || null,
      category: cat || null,
      quantity: Number(form.quantity || 0),
      low_stock_threshold: Number(form.low_stock_threshold || 0),
      unit_price: form.unit_price ? Number(form.unit_price) : null,
    };
    const { error } = await supabase.from("products").insert(payload);
    if (!error && form.category === "__new__" && cat) {
      await supabase.from("product_categories").insert({ name: cat }).then(() => {});
    }
    setSaving(false);
    if (error) return toast.error("Eklenemedi: " + friendlyDbError(error));
    toast.success("Ürün eklendi");
    reset();
    setOpen(false);
    onCreated();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2"><Plus className="h-4 w-4" /> Ürün Ekle</Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Yeni Ürün</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Ürün Adı</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Ürün Kodu</Label>
              <Input value={form.urun_kodu} onChange={(e) => setForm({ ...form, urun_kodu: e.target.value })} placeholder="Opsiyonel" />
            </div>
            <div>
              <Label>Kısa İsmi</Label>
              <Input value={form.kisa_ismi} onChange={(e) => setForm({ ...form, kisa_ismi: e.target.value })} placeholder="Opsiyonel" />
            </div>
            <div>
              <Label>Üretici Kodu</Label>
              <Input value={form.uretici_kodu} onChange={(e) => setForm({ ...form, uretici_kodu: e.target.value })} placeholder="Opsiyonel" />
            </div>
          </div>
          <div>
            <Label>Kategori *</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })} required>
              <SelectTrigger><SelectValue placeholder="Kategori seç" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                <SelectItem value="__new__">+ Yeni kategori</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.category === "__new__" && (
            <div>
              <Label>Yeni Kategori Adı</Label>
              <Input value={form.newCategory}
                onChange={(e) => setForm({ ...form, newCategory: e.target.value })} required />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Başlangıç Stok</Label>
              <Input type="number" step="1" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
            </div>
            <div>
              <Label>Düşük Stok Eşiği</Label>
              <Input type="number" step="1" value={form.low_stock_threshold}
                onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>Birim Fiyat (₺)</Label>
            <Input type="number" step="0.01" value={form.unit_price}
              onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
              placeholder="Opsiyonel" />
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

function EditProductDialog({
  product, categories, onClose, onSaved,
}: {
  product: Product | null;
  categories: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: "", urun_kodu: "", kisa_ismi: "", uretici_kodu: "",
    category: "", newCategory: "", quantity: "0", low_stock_threshold: "0", unit_price: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name,
        urun_kodu: product.urun_kodu || "",
        kisa_ismi: product.kisa_ismi || "",
        uretici_kodu: product.uretici_kodu || "",
        category: product.category || "",
        newCategory: "",
        quantity: String(product.quantity ?? 0),
        low_stock_threshold: String(product.low_stock_threshold ?? 0),
        unit_price: product.unit_price != null ? String(product.unit_price) : "",
      });
    }
  }, [product]);

  if (!product) return null;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!product) return;
    if (!form.name.trim()) return toast.error("Ürün adı zorunludur");
    const cat = (form.category === "__new__" ? form.newCategory.trim() : form.category).trim();
    const newQty = Number(form.quantity || 0);
    const oldQty = Number(product.quantity || 0);
    const diff = newQty - oldQty;

    setSaving(true);
    const newName = form.name.trim();
    if (cat && (newName !== product.name || cat !== (product.category || ""))) {
      const { data: dup } = await supabase
        .from("products")
        .select("id")
        .eq("name", newName)
        .eq("category", cat)
        .neq("id", product.id)
        .maybeSingle();
      if (dup) {
        setSaving(false);
        return toast.error("Bu kategoride aynı isimde başka bir ürün zaten var");
      }
    }
    const { error } = await supabase.from("products").update({
      name: newName,
      urun_kodu: form.urun_kodu.trim() || null,
      kisa_ismi: form.kisa_ismi.trim() || null,
      uretici_kodu: form.uretici_kodu.trim() || null,
      category: cat || null,
      quantity: newQty,
      low_stock_threshold: Number(form.low_stock_threshold || 0),
      unit_price: form.unit_price ? Number(form.unit_price) : null,
    }).eq("id", product.id);

    if (!error && diff !== 0) {
      await supabase.from("stock_lots").insert({
        product_id: product.id,
        quantity: diff,
        unit_cost: form.unit_price ? Number(form.unit_price) : 0,
        note: "Manuel düzeltme",
      });
    }
    if (!error && form.category === "__new__" && cat) {
      await supabase.from("product_categories").insert({ name: cat }).then(() => {});
    }
    setSaving(false);
    if (error) return toast.error("Güncellenemedi: " + friendlyDbError(error));
    toast.success("Ürün güncellendi");
    onSaved();
  }

  async function handleDelete() {
    if (!product) return;
    if (!confirm(`"${product.name}" ürününü silmek istediğinize emin misiniz?`)) return;
    setSaving(true);
    const { error } = await supabase.from("products").delete().eq("id", product.id);
    setSaving(false);
    if (error) return toast.error("Silinemedi: " + friendlyDbError(error));
    toast.success("Ürün silindi");
    onSaved();
  }

  return (
    <Dialog open={!!product} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader><DialogTitle>Ürünü Düzenle</DialogTitle></DialogHeader>
        <form onSubmit={submit} className="space-y-3">
          <div>
            <Label>Ürün Adı</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <Label>Ürün Kodu</Label>
              <Input value={form.urun_kodu} onChange={(e) => setForm({ ...form, urun_kodu: e.target.value })} placeholder="Opsiyonel" />
            </div>
            <div>
              <Label>Kısa İsmi</Label>
              <Input value={form.kisa_ismi} onChange={(e) => setForm({ ...form, kisa_ismi: e.target.value })} placeholder="Opsiyonel" />
            </div>
            <div>
              <Label>Üretici Kodu</Label>
              <Input value={form.uretici_kodu} onChange={(e) => setForm({ ...form, uretici_kodu: e.target.value })} placeholder="Opsiyonel" />
            </div>
          </div>
          <div>
            <Label>Kategori</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger><SelectValue placeholder="Seç (opsiyonel)" /></SelectTrigger>
              <SelectContent>
                {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                <SelectItem value="__new__">+ Yeni kategori</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {form.category === "__new__" && (
            <div>
              <Label>Yeni Kategori Adı</Label>
              <Input value={form.newCategory}
                onChange={(e) => setForm({ ...form, newCategory: e.target.value })} />
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Mevcut Stok</Label>
              <Input type="number" step="1" value={form.quantity}
                onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
              <p className="text-xs text-muted-foreground mt-1">
                Değişim hareket olarak kaydedilir
              </p>
            </div>
            <div>
              <Label>Düşük Stok Eşiği</Label>
              <Input type="number" step="1" value={form.low_stock_threshold}
                onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} required />
            </div>
          </div>
          <div>
            <Label>Birim Fiyat (₺)</Label>
            <Input type="number" step="0.01" value={form.unit_price}
              onChange={(e) => setForm({ ...form, unit_price: e.target.value })}
              placeholder="Opsiyonel" />
          </div>
          <DialogFooter className="flex sm:justify-between gap-2">
            <Button type="button" variant="destructive" onClick={handleDelete} disabled={saving}>
              Sil
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={onClose}>İptal</Button>
              <Button type="submit" disabled={saving}>{saving ? "Kaydediliyor..." : "Kaydet"}</Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
