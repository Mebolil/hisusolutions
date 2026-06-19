import { useEffect, useState, useMemo } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { supabase } from "@/lib/supabase";
import { formatDate, formatCurrency, friendlyDbError } from "@/lib/butcecrm-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ReturnKpiCards } from "@/components/butcecrm/ReturnKpiCards";
import { ReturnDialog } from "@/components/butcecrm/ReturnDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Search, RotateCcw, Plus } from "lucide-react";
import {
  PieChart, Pie, Cell, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartTooltip, ResponsiveContainer,
} from "recharts";
import { parseISO, format } from "date-fns";
import { tr } from "date-fns/locale";

type ReturnRecord = {
  id: string;
  sale_id: string;
  product_name: string;
  quantity: number;
  return_amount: number;
  refund_method: string;
  reason_category: string;
  reason_detail: string | null;
  restock: boolean;
  cost_reversed: number;
  return_date: string;
  status: string;
  note: string | null;
};

type Sale = {
  id: string;
  sale_date: string;
  product_name: string;
  product_id?: string | null;
  quantity: number;
  total_amount: number;
  total_cost: number | null;
  note?: string | null;
};

type ProductRef = { id: string; name: string };

const REASON_LABELS: Record<string, string> = {
  musteri_vazgecti: "Müşteri Vazgeçti",
  urun_hasarli: "Ürün Hasarlı",
  yanlis_urun: "Yanlış Ürün",
  beden_renk: "Boyut / Renk",
  gec_teslimat: "Geç Teslimat",
  diger: "Diğer",
};

const REFUND_LABELS: Record<string, string> = {
  nakit: "Nakit",
  cari: "Cariye Ekle",
  banka: "Banka Transferi",
};

const ANALYSIS_PIE_COLORS = ["#ef4444","#f59e0b","#6366f1","#3b82f6","#8b5cf6","#ec4899","#14b8a6","#64748b"];

export const Route = createFileRoute("/app/butcecrm/iadeler")({
  head: () => ({ meta: [{ title: "BütçeCRM — İadeler" }] }),
  component: IadelerPage,
});

function IadelerPage() {
  const [loading, setLoading] = useState(true);
  const [returns, setReturns] = useState<ReturnRecord[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [products, setProducts] = useState<ProductRef[]>([]);
  const [q, setQ] = useState("");
  const [returnDialogSale, setReturnDialogSale] = useState<Sale | null>(null);
  const [currentSaleReturned, setCurrentSaleReturned] = useState(0);
  const [picker, setPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");
  const [showCancelled, setShowCancelled] = useState(false);
  const [cancelledReturns, setCancelledReturns] = useState<ReturnRecord[]>([]);

  async function load() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setLoading(false); return; }
    const uid = session.user.id;
    const [ret, sal, prod] = await Promise.all([
      supabase.from("returns")
        .select("*")
        .eq("user_id", uid)
        .eq("status", "active")
        .is("deleted_at", null)
        .order("return_date", { ascending: false }),
      supabase.from("sales")
        .select("id, sale_date, product_name, product_id, quantity, total_amount, total_cost, note")
        .eq("user_id", uid)
        .is("deleted_at", null)
        .order("sale_date", { ascending: false }),
      supabase.from("products").select("id,name").eq("user_id", uid).is("deleted_at", null),
    ]);
    setReturns((ret.data as ReturnRecord[]) || []);
    setSales((sal.data as Sale[]) || []);
    setProducts((prod.data as ProductRef[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    if (!showCancelled) { setCancelledReturns([]); return; }
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase.from("returns")
        .select("*")
        .eq("user_id", session.user.id)
        .eq("status", "cancelled")
        .is("deleted_at", null)
        .order("return_date", { ascending: false });
      setCancelledReturns((data as ReturnRecord[]) || []);
    })();
  }, [showCancelled]);

  const filtered = useMemo(() => {
    const pool = showCancelled ? [...returns, ...cancelledReturns] : returns;
    if (!q) return pool;
    const lower = q.toLowerCase();
    return pool.filter((r) =>
      r.product_name.toLowerCase().includes(lower) ||
      (REASON_LABELS[r.reason_category] || "").toLowerCase().includes(lower)
    );
  }, [returns, cancelledReturns, showCancelled, q]);

  const returnMap = useMemo(() => {
    const map: Record<string, number> = {};
    returns.forEach((r) => {
      map[r.sale_id] = (map[r.sale_id] || 0) + r.quantity;
    });
    return map;
  }, [returns]);

  // Analiz: neden dağılımı (adet)
  const reasonData = useMemo(() => (
    Object.entries(
      returns.reduce((acc, r) => {
        const label = REASON_LABELS[r.reason_category] || r.reason_category;
        acc[label] = (acc[label] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    ).map(([name, value]) => ({ name, value }))
  ), [returns]);

  // Analiz: toplam kayıp
  const totalLoss = useMemo(
    () => returns.reduce((s, r) => s + Number(r.return_amount || 0), 0),
    [returns],
  );

  // Analiz: neden bazlı tablo (kayba göre azalan)
  const reasonTable = useMemo(() => {
    const acc: Record<string, { count: number; loss: number }> = {};
    returns.forEach((r) => {
      const label = REASON_LABELS[r.reason_category] || r.reason_category;
      if (!acc[label]) acc[label] = { count: 0, loss: 0 };
      acc[label].count += 1;
      acc[label].loss += Number(r.return_amount || 0);
    });
    return Object.entries(acc)
      .map(([name, v]) => ({ name, count: v.count, loss: v.loss }))
      .sort((a, b) => b.loss - a.loss);
  }, [returns]);

  // Analiz: son 3 ay trend
  const trendData = useMemo(() => {
    const months: { label: string; key: string }[] = [];
    for (let i = 2; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months.push({ label: format(d, "MMM yy", { locale: tr }), key });
    }
    return months.map(({ label, key }) => ({
      label,
      tutar: returns
        .filter((r) => {
          try { return format(parseISO(r.return_date), "yyyy-MM") === key; }
          catch { return false; }
        })
        .reduce((s, r) => s + Number(r.return_amount || 0), 0),
    }));
  }, [returns]);

  const pickerSales = useMemo(() => {
    if (!pickerQuery) return sales.slice(0, 100);
    const lower = pickerQuery.toLowerCase();
    return sales.filter((s) => s.product_name.toLowerCase().includes(lower)).slice(0, 100);
  }, [sales, pickerQuery]);

  async function cancelReturn(ret: ReturnRecord) {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return toast.error("Oturum bulunamadı");
    const uid = session.user.id;
    const { error } = await supabase
      .from("returns")
      .update({ status: "cancelled" })
      .eq("id", ret.id)
      .eq("user_id", uid);
    if (error) return toast.error("İptal edilemedi: " + friendlyDbError(error));

    // Eğer iadede stok geri gelmişti, şimdi tekrar düş
    if (ret.restock) {
      const { data: retFull } = await supabase
        .from("returns")
        .select("product_id")
        .eq("id", ret.id)
        .eq("user_id", uid)
        .single();
      if (retFull?.product_id) {
        // Mevcut stoğu taze oku, sonra azalt
        const { data: prod } = await supabase
          .from("products")
          .select("quantity")
          .eq("id", retFull.product_id)
          .eq("user_id", uid)
          .single();
        if (prod) {
          const newQty = Math.max(0, Number(prod.quantity || 0) - Number(ret.quantity));
          await supabase
            .from("products")
            .update({ quantity: newQty })
            .eq("id", retFull.product_id)
            .eq("user_id", uid);
        }
      }
    }

    // O satışa ait kalan aktif iade sayısını kontrol et
    const { data: remainingReturns } = await supabase
      .from("returns")
      .select("id")
      .eq("sale_id", ret.sale_id)
      .eq("user_id", uid)
      .eq("status", "active")
      .is("deleted_at", null);

    // Başka aktif iade yoksa satışı 'aktif' statüsüne geri döndür
    if (!remainingReturns || remainingReturns.length === 0) {
      await supabase
        .from("sales")
        .update({ status: "aktif" })
        .eq("id", ret.sale_id)
        .eq("user_id", uid);
    }

    setReturns((prev) => prev.filter((r) => r.id !== ret.id));
    toast.success("İade iptal edildi");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">İadeler</h1>
          <p className="text-muted-foreground text-sm">Tüm iade kayıtlarınızı buradan yönetin</p>
        </div>
        <Button
          onClick={() => { setPickerQuery(""); setPicker(true); }}
          className="gap-2"
          disabled={sales.length === 0}
        >
          <Plus className="h-4 w-4" />
          Yeni İade
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-muted-foreground">Yükleniyor...</div>
      ) : (
        <>
          <ReturnKpiCards returns={returns} sales={sales} />

          <Tabs defaultValue="liste">
            <TabsList>
              <TabsTrigger value="liste">İade Listesi</TabsTrigger>
              <TabsTrigger value="analiz">Analiz</TabsTrigger>
            </TabsList>

            <TabsContent value="liste" className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">İade Kayıtları</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant={showCancelled ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setShowCancelled(!showCancelled)}
                    className="text-xs"
                  >
                    {showCancelled ? "Sadece Aktif" : "İptal Edilenleri Göster"}
                  </Button>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Ürün veya neden ara..."
                      value={q}
                      onChange={(e) => setQ(e.target.value)}
                      className="pl-9 h-9 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {filtered.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <RotateCcw className="h-10 w-10 mx-auto mb-3 opacity-20" />
                  <p className="font-medium">İade kaydınız bulunmuyor</p>
                  <p className="text-sm mt-1">Tüm satışlarınız sorunsuz görünüyor.</p>
                  <p className="text-sm">İlk iade geldiğinde buradan takip edebilirsiniz.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tarih</TableHead>
                        <TableHead>Ürün</TableHead>
                        <TableHead className="text-right">Miktar</TableHead>
                        <TableHead className="text-right">İade Tutarı</TableHead>
                        <TableHead className="text-right">Maliyet Geri Alındı</TableHead>
                        <TableHead>Neden</TableHead>
                        <TableHead>Yöntem</TableHead>
                        <TableHead>Stok</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r) => (
                        <TableRow key={r.id} className={r.status === "cancelled" ? "opacity-50" : ""}>
                          <TableCell className="whitespace-nowrap">{formatDate(r.return_date)}</TableCell>
                          <TableCell className="max-w-[200px] truncate">{r.product_name}</TableCell>
                          <TableCell className="text-right">{r.quantity}</TableCell>
                          <TableCell className="text-right text-red-600 font-medium">
                            {formatCurrency(Number(r.return_amount))}
                          </TableCell>
                          <TableCell className="text-right text-muted-foreground">
                            {r.cost_reversed > 0 ? formatCurrency(Number(r.cost_reversed)) : "—"}
                          </TableCell>
                          <TableCell>
                            <div>
                              <Badge variant="secondary" className="text-xs">
                                {REASON_LABELS[r.reason_category] || r.reason_category}
                              </Badge>
                              {r.reason_detail && (
                                <p className="text-xs text-muted-foreground mt-1 italic truncate max-w-[160px]" title={r.reason_detail}>
                                  {r.reason_detail}
                                </p>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{REFUND_LABELS[r.refund_method] || r.refund_method}</TableCell>
                          <TableCell>
                            {r.restock ? (
                              <span className="text-xs text-emerald-600">✓ Stoğa döndü</span>
                            ) : (
                              <span className="text-xs text-muted-foreground">— Stoğa dönmedi</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {r.status === "cancelled" ? (
                              <span className="text-xs text-muted-foreground italic">İptal edildi</span>
                            ) : (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-600 text-xs">
                                  İptal
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>İadeyi iptal et?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    "{r.product_name}" için iade kaydı iptal edilecek.
                                    {r.restock && " Stoğa eklenen miktar geri düşülecek."}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Vazgeç</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => cancelReturn(r)}>İptal Et</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
            </TabsContent>

            <TabsContent value="analiz" className="mt-4 space-y-4">
              {returns.length === 0 ? (
                <Card>
                  <CardContent className="py-16 text-center text-muted-foreground">
                    <RotateCcw className="h-10 w-10 mx-auto mb-3 opacity-20" />
                    <p className="font-medium">Analiz için iade kaydı bulunmuyor</p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <Card className="border-red-200 bg-red-50/50">
                    <CardContent className="pt-6">
                      <p className="text-sm text-muted-foreground">Bu dönemde toplam iade kaybı</p>
                      <p className="text-3xl font-bold text-red-600 mt-1">{formatCurrency(totalLoss)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{returns.length} iade kaydı üzerinden</p>
                    </CardContent>
                  </Card>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Neden Dağılımı (adet)</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={reasonData}
                              dataKey="value"
                              nameKey="name"
                              cx="40%"
                              cy="50%"
                              outerRadius={75}
                              label={false}
                            >
                              {reasonData.map((_, i) => (
                                <Cell key={i} fill={ANALYSIS_PIE_COLORS[i % ANALYSIS_PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Legend
                              layout="vertical"
                              align="right"
                              verticalAlign="middle"
                              iconSize={8}
                              formatter={(value, entry) => (
                                <span className="text-[11px]">{value} <span className="text-muted-foreground">({(entry as { payload?: { value?: number } })?.payload?.value ?? 0})</span></span>
                              )}
                            />
                            <RechartTooltip formatter={(v: number) => `${v} adet`} />
                          </PieChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Son 3 Ay İade Trendi</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ResponsiveContainer width="100%" height={220}>
                          <BarChart data={trendData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                            <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `₺${(v/1000).toFixed(0)}K`} width={48} />
                            <RechartTooltip formatter={(v: number) => formatCurrency(v)} />
                            <Bar dataKey="tutar" fill="#ef4444" radius={[3, 3, 0, 0]} name="İade" />
                          </BarChart>
                        </ResponsiveContainer>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Neden Bazlı Kayıp</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Neden</TableHead>
                            <TableHead className="text-right">Adet</TableHead>
                            <TableHead className="text-right">Toplam Kayıp</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {reasonTable.map((row) => (
                            <TableRow key={row.name}>
                              <TableCell>
                                <Badge variant="secondary" className="text-xs">{row.name}</Badge>
                              </TableCell>
                              <TableCell className="text-right">{row.count}</TableCell>
                              <TableCell className="text-right text-red-600 font-medium">{formatCurrency(row.loss)}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Satış seçici — Yeni İade için */}
      <Dialog open={picker} onOpenChange={setPicker}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>İade Edilecek Satışı Seçin</DialogTitle>
          </DialogHeader>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Ürün adıyla ara..."
              value={pickerQuery}
              onChange={(e) => setPickerQuery(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="max-h-80 overflow-y-auto space-y-1 mt-2">
            {pickerSales.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Satış bulunamadı</p>
            ) : (
              pickerSales.map((s) => {
                const remaining = s.quantity - (returnMap[s.id] || 0);
                return (
                  <button
                    key={s.id}
                    type="button"
                    disabled={remaining <= 0}
                    onClick={remaining > 0 ? () => { setPicker(false); setReturnDialogSale(s); setCurrentSaleReturned(returnMap[s.id] || 0); } : undefined}
                    className={`w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-colors ${
                      remaining <= 0
                        ? "opacity-40 cursor-not-allowed bg-muted"
                        : "hover:bg-muted"
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{s.product_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(s.sale_date)} · {s.quantity} adet
                        {remaining <= 0 && " · Tamamen iade edildi"}
                        {remaining > 0 && remaining < s.quantity && ` · ${remaining} adet iade edilebilir`}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold whitespace-nowrap ${remaining <= 0 ? "text-muted-foreground" : ""}`}>
                      {formatCurrency(Number(s.total_amount))}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ReturnDialog
        sale={returnDialogSale}
        products={products}
        alreadyReturned={currentSaleReturned}
        onClose={() => { setReturnDialogSale(null); setCurrentSaleReturned(0); }}
        onCreated={(ret) => setReturns((prev) => [ret, ...prev])}
      />
    </div>
  );
}
