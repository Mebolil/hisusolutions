import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/butcecrm-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Package, Search, AlertTriangle, History } from "lucide-react";
import { CsvToolbar, type CsvField } from "@/components/butcecrm/CsvToolbar";

const PRODUCTS_CSV_FIELDS: CsvField[] = [
  { key: "name",                 label: "Ürün Adı",        required: true },
  { key: "category",             label: "Kategori" },
  { key: "quantity",             label: "Stok Miktarı",    required: true, type: "number" },
  { key: "low_stock_threshold",  label: "Düşük Stok Eşiği", type: "number" },
  { key: "unit_price",           label: "Birim Fiyat",     type: "number" },
];
const PRODUCTS_CSV_SAMPLE = ["Örnek Ürün", "Genel", 100, 10, 50];

type Product = {
  id: string;
  name: string;
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

  const lowStockProducts = products
    .filter((p) => stockState(p) !== "ok")
    .sort((a, b) => Number(a.quantity) - Number(b.quantity));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Package className="h-6 w-6 text-primary" /> Stok</h1>
        <p className="text-muted-foreground text-sm">Ürün stok seviyeleri ve hareket geçmişi</p>
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
                  <TableHead>Ürün</TableHead>
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
                    <TableRow key={p.id}>
                      <TableCell className="font-medium max-w-[260px] truncate">{p.name}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-muted-foreground">{p.category || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{Number(p.quantity)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{Number(p.low_stock_threshold)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(p.unit_price || 0))}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded border ${STATE_BADGE[st]}`}>{STATE_LABEL[st]}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button size="sm" variant="ghost" onClick={() => openHistory(p)} className="gap-1">
                          <History className="h-3.5 w-3.5" /> Geçmiş
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
