import { useEffect, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { formatCurrency, formatDate } from "@/lib/pusla-helpers";
import { friendlyDbError } from "@/lib/pusla-helpers";
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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Package, Search, AlertTriangle, History, Plus, Pencil, Trash2, ChevronUp, ChevronDown, ShoppingCart } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { CsvToolbar, type CsvField } from "@/components/pusla/CsvToolbar";

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
  platform: string | null;
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

export const Route = createFileRoute("/app/pusla/stok")({
  head: () => ({ meta: [{ title: "Pusla — Stok" }] }),
  component: StockPage,
});

const PAGE_SIZE = 100;

function buildQuery(
  catFilter: string,
  stateFilter: "all" | StockState,
  q: string,
  sortKey: keyof Product,
  sortDir: "asc" | "desc",
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (supabase.from("products").select("*") as any);
  query = query.is("deleted_at", null);
  if (catFilter !== "all") query = query.eq("category", catFilter);
  if (stateFilter === "out") query = query.lte("quantity", 0);
  // "low" / "ok" need column-to-column comparison — handled client-side
  if (q.trim()) {
    const safe = q.trim().replace(/[%_]/g, "\\$&");
    query = query.or(
      `name.ilike.%${safe}%,urun_kodu.ilike.%${safe}%,kisa_ismi.ilike.%${safe}%,uretici_kodu.ilike.%${safe}%,category.ilike.%${safe}%`,
    );
  }
  query = query.order(sortKey, { ascending: sortDir === "asc" });
  return query;
}

function StockPage() {
  const [loading, setLoading] = useState(true);
  // Server-side mode: only current page rows
  const [rows, setRows] = useState<Product[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  // Client-side mode (for "low"/"ok" stateFilter that need column comparison)
  const [allRows, setAllRows] = useState<Product[] | null>(null);

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
  const [sortKey, setSortKey] = useState<keyof Product>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [stats, setStats] = useState({ total: 0, low: 0, out: 0 });
  const [reorderProduct, setReorderProduct] = useState<Product | null>(null);
  const [recentSales, setRecentSales] = useState<{ product_name: string; quantity: number }[]>([]);

  // Whether we're in client-side filter mode (stateFilter low/ok)
  const clientMode = stateFilter === "low" || stateFilter === "ok";

  function handleSort(col: keyof Product) {
    if (sortKey === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(col); setSortDir("asc"); }
  }

  function SortIcon({ col }: { col: keyof Product }) {
    if (sortKey !== col) return <ChevronUp className="h-3 w-3 opacity-25" />;
    return sortDir === "asc" ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />;
  }

  async function loadStats() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const uid = session.user.id;
    const [total, outRes] = await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }).eq("user_id", uid).is("deleted_at", null),
      supabase.from("products").select("*", { count: "exact", head: true }).eq("user_id", uid).is("deleted_at", null).lte("quantity", 0),
    ]);
    const totalVal = total.count ?? 0;
    const outVal = outRes.count ?? 0;
    // "low" requires column comparison — approximated from allRows when available
    setStats((s) => ({ ...s, total: totalVal, out: outVal }));
  }

  async function loadCategories() {
    const { data: { session } } = await supabase.auth.getSession();
    const catUid = session?.user?.id;
    const dedup = (rows: Category[]) => rows.filter((r, i, a) => a.findIndex(x => x.name === r.name) === i);
    const { data } = await supabase.from("product_categories").select("id,name").order("name");
    if (!data?.length && catUid) {
      const defaults = ["Genel","Elektronik","Giyim","Aksesuar","Kozmetik","Gıda"];
      await supabase.from("product_categories").insert(defaults.map((name) => ({ name, user_id: catUid })));
      const { data: seeded } = await supabase.from("product_categories").select("id,name").order("name");
      setCategories(dedup((seeded as Category[]) || []));
      return;
    }
    setCategories(dedup((data as Category[]) || []));
  }

  async function loadPage() {
    setLoading(true);
    setAllRows(null);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const uid = session.user.id;
    const query = buildQuery(catFilter, stateFilter, q, sortKey, sortDir).eq("user_id", uid);
    const from = (page - 1) * PAGE_SIZE;
    const { data, count } = await query
      .select("*", { count: "exact" })
      .range(from, from + PAGE_SIZE - 1);
    setRows((data as Product[]) || []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }

  // For "low"/"ok" filters: parallel batch load then client-side filter
  async function loadAllForClientFilter() {
    setLoading(true);
    setRows([]);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const uid = session.user.id;
    // First get total count so we can parallelise
    const base = buildQuery(catFilter, "all", q, sortKey, sortDir).eq("user_id", uid);
    const { count } = await base.select("*", { count: "exact", head: true });
    const total = count ?? 0;
    if (total === 0) { setAllRows([]); setTotalCount(0); setLoading(false); return; }
    const BATCH = 1000;
    const batches = Math.ceil(total / BATCH);
    const baseQuery = buildQuery(catFilter, "all", q, sortKey, sortDir).eq("user_id", uid);
    const promises = Array.from({ length: batches }, (_, i) =>
      baseQuery.select("*").range(i * BATCH, (i + 1) * BATCH - 1),
    );
    const results = await Promise.all(promises);
    const all: Product[] = results.flatMap((r) => (r.data as Product[]) || []);
    setAllRows(all);
    // Update low count for stats
    const lowCount = all.filter((p) => stockState(p) === "low").length;
    setStats((s) => ({ ...s, low: lowCount }));
    setLoading(false);
  }

  async function loadRecentSales() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    const uid = session.user.id;
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0];
    const { data: recentSalesData } = await supabase
      .from("sales")
      .select("product_name, quantity")
      .eq("user_id", uid)
      .is("deleted_at", null)
      .eq("status", "aktif")
      .gte("sale_date", thirtyDaysAgo);
    setRecentSales((recentSalesData as { product_name: string; quantity: number }[]) || []);
  }

  useEffect(() => { loadStats(); loadCategories(); loadRecentSales(); }, []);

  useEffect(() => {
    setPage(1);
  }, [catFilter, stateFilter, q, sortKey, sortDir]);

  useEffect(() => {
    if (clientMode) loadAllForClientFilter();
    else loadPage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [catFilter, stateFilter, q, sortKey, sortDir]);

  useEffect(() => {
    if (!clientMode) loadPage();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  // Client-mode: filter + sort + paginate allRows in memory
  const clientFiltered = useMemo(() => {
    if (!clientMode || !allRows) return null;
    return allRows.filter((p) => stockState(p) === stateFilter);
  }, [allRows, stateFilter, clientMode]);

  const clientSorted = useMemo(() => {
    if (!clientFiltered) return null;
    return [...clientFiltered].sort((a, b) => {
      const av = a[sortKey] ?? "";
      const bv = b[sortKey] ?? "";
      const cmp = String(av).localeCompare(String(bv), "tr", { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [clientFiltered, sortKey, sortDir]);

  const displayRows = clientMode && clientSorted
    ? clientSorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)
    : rows;
  const displayTotal = clientMode && clientSorted ? clientSorted.length : totalCount;
  const totalPages = Math.max(1, Math.ceil(displayTotal / PAGE_SIZE));

  const stockForecast = useMemo(() => {
    const salesByName: Record<string, number> = {};
    recentSales.forEach((s) => {
      const key = (s.product_name || "").trim().toLowerCase();
      if (key) salesByName[key] = (salesByName[key] || 0) + Number(s.quantity || 0);
    });
    return displayRows.map((p) => {
      const key = (p.name || "").trim().toLowerCase();
      const totalSold = salesByName[key] || 0;
      const avgDaily = totalSold / 30;
      const daysLeft = avgDaily > 0 ? Math.floor(Number(p.quantity || 0) / avgDaily) : null;
      return { productId: p.id, avgDaily: +avgDaily.toFixed(1), daysLeft };
    });
  }, [displayRows, recentSales]);

  const forecastMap = useMemo(
    () => Object.fromEntries(stockForecast.map((f) => [f.productId, f])),
    [stockForecast]
  );

  const categoryNames = useMemo(() => {
    const set = new Set<string>(categories.map((c) => c.name));
    return Array.from(set).sort();
  }, [categories]);

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

  const allPageSelected = displayRows.length > 0 && displayRows.every((p) => selectedIds.has(p.id));

  function toggleAll() {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (allPageSelected) displayRows.forEach((p) => next.delete(p.id));
      else displayRows.forEach((p) => next.add(p.id));
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
    const ids = Array.from(selectedIds);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return toast.error("Oturum bulunamadı");
    for (let i = 0; i < ids.length; i += 20) {
      const chunk = ids.slice(i, i + 20);
      const { error } = await supabase.from("products").update({ deleted_at: new Date().toISOString() }).in("id", chunk).eq("user_id", session.user.id);
      if (error) { console.error("bulk delete error", error); return toast.error("Silinemedi: " + friendlyDbError(error)); }
    }
    toast.success(`${ids.length} ürün silindi`);
    setSelectedIds(new Set());
    loadStats();
    if (clientMode) loadAllForClientFilter(); else loadPage();
  }

  // Low-stock alert list: only meaningful when we have full data
  const lowStockProducts = useMemo(() => {
    if (!allRows) return [];
    return allRows
      .filter((p) => stockState(p) !== "ok")
      .sort((a, b) => Number(a.quantity) - Number(b.quantity));
  }, [allRows]);

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
            onCreated={() => { loadStats(); if (clientMode) loadAllForClientFilter(); else { setPage(1); loadPage(); } }}
          />
          <CsvToolbar
            slug="stok"
            table="products"
            upsertOn="name,user_id"
            fields={PRODUCTS_CSV_FIELDS}
            sampleRow={PRODUCTS_CSV_SAMPLE}
            exportRows={displayRows.map((p) => ({
              name: p.name,
              urun_kodu: p.urun_kodu,
              kisa_ismi: p.kisa_ismi,
              uretici_kodu: p.uretici_kodu,
              category: p.category,
              quantity: p.quantity,
              low_stock_threshold: p.low_stock_threshold,
              unit_price: p.unit_price,
            }))}
            onImported={() => { loadStats(); if (clientMode) loadAllForClientFilter(); else loadPage(); }}
            wizardModule="products"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Toplam Ürün" value={String(stats.total)} />
        <StatCard label="Düşük Stok" value={stats.low > 0 ? String(stats.low) : "—"} valueClass="text-amber-600" />
        <StatCard label="Tükenen" value={String(stats.out)} valueClass="text-red-600" />
        <StatCard label="Filtredeki Sonuç" value={String(displayTotal)} />
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
                const qty = Number(p.quantity);
                const threshold = Number(p.low_stock_threshold);
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-white border"
                  >
                    <button
                      onClick={() => openHistory(p)}
                      className="min-w-0 text-left flex-1 hover:text-primary transition-colors"
                    >
                      <p className="text-sm font-medium truncate">{p.name}</p>
                      {st === "out" ? (
                        <span className="inline-flex text-[10px] mt-0.5 px-1.5 py-0.5 rounded border bg-red-100 text-red-700 border-red-200 font-medium">
                          Tükendi
                        </span>
                      ) : (
                        <span className="inline-flex text-[10px] mt-0.5 px-1.5 py-0.5 rounded border bg-amber-100 text-amber-700 border-amber-200 font-medium">
                          Düşük · {qty}/{threshold} eşik
                        </span>
                      )}
                    </button>
                    <Button
                      size="sm" variant="outline"
                      className="h-7 gap-1 shrink-0 border-primary/40 text-primary hover:bg-primary/10"
                      onClick={() => setReorderProduct(p)}
                      title="Sipariş önerisi oluştur"
                    >
                      <ShoppingCart className="h-3.5 w-3.5" /> Sipariş
                    </Button>
                  </div>
                );
              })}
            </div>
            {lowStockProducts.some((p) => stockState(p) === "out") && (
              <p className="text-xs text-red-600 mt-3 font-medium flex items-center gap-1.5">
                <AlertTriangle className="h-3.5 w-3.5" /> Stoğu biten ürünler satışa kapandı
              </p>
            )}
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
              <Label className="text-xs">Ara (ad, kod, kategori…)</Label>
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
            <div className="p-8 text-center text-muted-foreground">Yükleniyor…</div>
          ) : displayRows.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Kayıt bulunamadı</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox checked={allPageSelected} onCheckedChange={toggleAll} />
                  </TableHead>
                  {(["name","urun_kodu","kisa_ismi","uretici_kodu","category"] as (keyof Product)[]).map((col, i) => (
                    <TableHead key={col} className="cursor-pointer select-none" onClick={() => handleSort(col)}>
                      <span className="inline-flex items-center gap-1">
                        {["Ürün Adı","Ürün Kodu","Kısa İsmi","Üretici Kodu","Kategori"][i]}
                        <SortIcon col={col} />
                      </span>
                    </TableHead>
                  ))}
                  {(["quantity","low_stock_threshold","unit_price"] as (keyof Product)[]).map((col, i) => (
                    <TableHead key={col} className="text-right cursor-pointer select-none" onClick={() => handleSort(col)}>
                      <span className="inline-flex items-center justify-end gap-1">
                        {["Mevcut Stok","Eşik","Birim Fiyat"][i]}
                        <SortIcon col={col} />
                      </span>
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Günlük Ort.</TableHead>
                  <TableHead className="text-center">Tahmini Bitiş</TableHead>
                  <TableHead>Durum</TableHead>
                  <TableHead className="text-right">Hareketler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRows.map((p) => {
                  const st = stockState(p);
                  return (
                    <TableRow key={p.id} className={`${selectedIds.has(p.id) ? "bg-muted/50" : ""} border-l-4 ${
                      st === "out" ? "border-l-red-500" :
                      st === "low" ? "border-l-amber-400" :
                      "border-l-transparent"
                    }`}>
                      <TableCell>
                        <Checkbox checked={selectedIds.has(p.id)} onCheckedChange={() => toggleOne(p.id)} />
                      </TableCell>
                      <TableCell className="font-medium max-w-[200px]">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="truncate">{p.name}</span>
                          {p.platform === "trendyol" && (
                            <span className="inline-flex items-center text-[10px] font-medium bg-orange-100 text-orange-700 border border-orange-200 rounded px-1.5 py-0.5 shrink-0">
                              TY
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{p.urun_kodu || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.kisa_ismi || "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{p.uretici_kodu || "-"}</TableCell>
                      <TableCell className="max-w-[120px] truncate text-muted-foreground">{p.category || "-"}</TableCell>
                      <TableCell className="text-right font-medium">{Number(p.quantity)}</TableCell>
                      <TableCell className="text-right text-muted-foreground">{Number(p.low_stock_threshold)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(Number(p.unit_price || 0))}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {forecastMap[p.id]?.avgDaily > 0 ? `${forecastMap[p.id]!.avgDaily}/gün` : "—"}
                      </TableCell>
                      <TableCell className="text-center">
                        {(() => {
                          const d = forecastMap[p.id]?.daysLeft;
                          if (d === null || d === undefined) return <span className="text-xs text-muted-foreground">—</span>;
                          if (d <= 0) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">Tükendi</span>;
                          if (d <= 7) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">{d} gün</span>;
                          if (d <= 30) return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">{d} gün</span>;
                          return <span className="text-xs text-muted-foreground">{d} gün</span>;
                        })()}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded border ${STATE_BADGE[st]}`}>{STATE_LABEL[st]}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {(st === "out" || st === "low") && (
                            <Button size="sm" variant="outline"
                              className="h-7 gap-1 shrink-0 border-primary/40 text-primary hover:bg-primary/10"
                              onClick={() => setReorderProduct(p)}
                              title="Sipariş önerisi oluştur"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" /> Sipariş
                            </Button>
                          )}
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
          {!loading && displayTotal > 0 && (
            <div className="flex items-center justify-between px-4 py-3 border-t text-sm text-muted-foreground">
              <span>{displayTotal} sonuç &mdash; sayfa {page} / {totalPages}</span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setPage(1)} disabled={page === 1}>«</Button>
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹ Önceki</Button>
                <Button size="sm" variant="outline" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Sonraki ›</Button>
                <Button size="sm" variant="outline" onClick={() => setPage(totalPages)} disabled={page === totalPages}>»</Button>
              </div>
            </div>
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
        onSaved={() => { setEditing(null); loadStats(); if (clientMode) loadAllForClientFilter(); else loadPage(); }}
      />
      {reorderProduct && (
        <ReorderSuggestionDialog
          product={reorderProduct}
          onClose={() => setReorderProduct(null)}
        />
      )}
    </div>
  );
}

function ReorderSuggestionDialog({
  product, onClose,
}: { product: Product; onClose: () => void }) {
  const [lastLot, setLastLot] = useState<Lot | null>(null);
  const [lotLoading, setLotLoading] = useState(true);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const threshold = Number(product.low_stock_threshold);
  const qty = Number(product.quantity);
  const suggestedQty = Math.max(1, threshold * 3 - qty);

  useEffect(() => {
    (async () => {
      setLotLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const uid = session?.user?.id;
      const { data } = await supabase
        .from("stock_lots")
        .select("*")
        .eq("product_id", product.id)
        .eq("user_id", uid ?? "")
        .gt("quantity", 0)
        .order("created_at", { ascending: false })
        .limit(1);
      setLastLot(((data as Lot[]) || [])[0] || null);
      setLotLoading(false);
    })();
  }, [product.id]);

  const lastCost = lastLot?.unit_cost != null ? Number(lastLot.unit_cost) : null;

  async function createReminder() {
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return toast.error("Oturum bulunamadı"); }
    const uid = session.user.id;
    const due = new Date();
    due.setDate(due.getDate() + 3);
    const dueDate = due.toISOString().slice(0, 10);
    const costText = lastCost != null ? `, son maliyet: ${formatCurrency(lastCost)}` : "";
    const fullNote = `Sipariş önerisi: ~${suggestedQty} adet${costText}${note.trim() ? ` — ${note.trim()}` : ""}`;
    const { error } = await supabase.from("reminders").insert({
      user_id: uid,
      type: "stok",
      title: `${product.name} için sipariş ver`,
      due_date: dueDate,
      note: fullNote,
      status: "bekliyor",
      related_record: null,
      is_recurring: false,
      recurrence_interval: null,
    });
    setSaving(false);
    if (error) return toast.error("Hatırlatıcı oluşturulamadı: " + friendlyDbError(error));
    toast.success("Sipariş hatırlatıcısı oluşturuldu");
    onClose();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Sipariş Önerisi — {product.name}</DialogTitle></DialogHeader>
        <div className="space-y-3 text-sm">
          <div className="rounded-md border bg-muted/30 p-3 space-y-1.5">
            <p>Mevcut stok: <strong>{qty}</strong> · Eşik: <strong>{threshold}</strong></p>
            {lotLoading ? (
              <p className="text-muted-foreground text-xs">Son stok hareketi yükleniyor...</p>
            ) : lastLot ? (
              <>
                <p className="text-muted-foreground text-xs">
                  Son stok hareketi: {formatDate(lastLot.created_at)} · +{Number(lastLot.quantity)} adet
                </p>
                {lastCost != null && (
                  <p>Son birim maliyet: <strong>{formatCurrency(lastCost)}</strong></p>
                )}
              </>
            ) : (
              <p className="text-muted-foreground text-xs">Geçmiş stok girişi bulunamadı.</p>
            )}
            <p className="pt-1">Önerilen sipariş miktarı: <strong className="text-primary">{suggestedQty} adet</strong></p>
          </div>
          <div>
            <Label>Not (opsiyonel)</Label>
            <Textarea value={note} rows={2} onChange={(e) => setNote(e.target.value)}
              placeholder="Tedarikçi, sipariş detayı vs." />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button onClick={createReminder} disabled={saving} className="gap-1.5">
            <ShoppingCart className="h-4 w-4" /> {saving ? "Oluşturuluyor..." : "Hatırlatıcı Oluştur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
      await supabase.from("product_categories").insert({ name: cat, user_id: userId }).then(() => {});
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
  const [confirmDelete, setConfirmDelete] = useState(false);

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
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return; }
    const uid = session.user.id;
    const newName = form.name.trim();
    if (cat && (newName !== product.name || cat !== (product.category || ""))) {
      const { data: dup } = await supabase
        .from("products")
        .select("id")
        .eq("user_id", uid)
        .is("deleted_at", null)
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
    }).eq("id", product.id).eq("user_id", uid);

    if (!error && diff !== 0) {
      await supabase.from("stock_lots").insert({
        product_id: product.id,
        quantity: diff,
        unit_cost: form.unit_price ? Number(form.unit_price) : 0,
        note: "Manuel düzeltme",
        user_id: uid,
      });
    }
    if (!error && form.category === "__new__" && cat) {
      await supabase.from("product_categories").insert({ name: cat, user_id: uid }).then(() => {});
    }
    setSaving(false);
    if (error) return toast.error("Güncellenemedi: " + friendlyDbError(error));
    toast.success("Ürün güncellendi");
    onSaved();
  }

  async function handleDelete() {
    if (!product) return;
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return; }
    const { error } = await supabase.from("products").update({ deleted_at: new Date().toISOString() }).eq("id", product.id).eq("user_id", session.user.id);
    setSaving(false);
    if (error) return toast.error("Silinemedi: " + friendlyDbError(error));
    toast.success("Ürün silindi");
    onSaved();
  }

  return (
    <>
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
            <Button type="button" variant="destructive" onClick={() => setConfirmDelete(true)} disabled={saving}>
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

    <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Ürünü sil</AlertDialogTitle>
          <AlertDialogDescription>
            "{product.name}" ürününü silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>İptal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
            Sil
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
