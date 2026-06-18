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
import { toast } from "sonner";
import { Search, RotateCcw, Plus } from "lucide-react";

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
  const [picker, setPicker] = useState(false);
  const [pickerQuery, setPickerQuery] = useState("");

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
        .order("return_date", { ascending: false }),
      supabase.from("sales")
        .select("id, sale_date, product_name, quantity, total_amount, total_cost, note")
        .eq("user_id", uid)
        .order("sale_date", { ascending: false }),
      supabase.from("products").select("id,name").eq("user_id", uid),
    ]);
    setReturns((ret.data as ReturnRecord[]) || []);
    setSales((sal.data as Sale[]) || []);
    setProducts((prod.data as ProductRef[]) || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!q) return returns;
    const lower = q.toLowerCase();
    return returns.filter((r) =>
      r.product_name.toLowerCase().includes(lower) ||
      (REASON_LABELS[r.reason_category] || "").toLowerCase().includes(lower)
    );
  }, [returns, q]);

  const pickerSales = useMemo(() => {
    if (!pickerQuery) return sales.slice(0, 50);
    const lower = pickerQuery.toLowerCase();
    return sales.filter((s) => s.product_name.toLowerCase().includes(lower)).slice(0, 50);
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

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">İade Kayıtları</CardTitle>
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
                        <TableRow key={r.id}>
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
                            <Badge variant="secondary" className="text-xs">
                              {REASON_LABELS[r.reason_category] || r.reason_category}
                            </Badge>
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
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
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
              pickerSales.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => { setPicker(false); setReturnDialogSale(s); }}
                  className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-muted text-left transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{s.product_name}</p>
                    <p className="text-xs text-muted-foreground">{formatDate(s.sale_date)} · {s.quantity} adet</p>
                  </div>
                  <span className="text-sm font-semibold whitespace-nowrap">{formatCurrency(Number(s.total_amount))}</span>
                </button>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      <ReturnDialog
        sale={returnDialogSale}
        products={products}
        onClose={() => setReturnDialogSale(null)}
        onCreated={(ret) => setReturns((prev) => [ret, ...prev])}
      />
    </div>
  );
}
