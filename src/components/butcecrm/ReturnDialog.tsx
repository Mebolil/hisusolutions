import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { formatCurrency, parseCostItems, friendlyDbError } from "@/lib/butcecrm-helpers";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { ChevronDown, ChevronUp } from "lucide-react";

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

const REASON_LABELS: Record<string, string> = {
  musteri_vazgecti: "Müşteri Vazgeçti",
  urun_hasarli: "Ürün Hasarlı",
  yanlis_urun: "Yanlış Ürün",
  beden_renk: "Boyut / Renk",
  gec_teslimat: "Geç Teslimat",
  diger: "Diğer",
};

const REASONS = Object.keys(REASON_LABELS) as (keyof typeof REASON_LABELS)[];

type Props = {
  sale: Sale | null;
  products?: ProductRef[];
  alreadyReturned?: number;
  onClose: () => void;
  onCreated: (ret: ReturnRecord) => void;
};

export function ReturnDialog({ sale, products = [], onClose, onCreated, alreadyReturned = 0 }: Props) {
  const [reason, setReason] = useState("");
  const [reasonDetail, setReasonDetail] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [returnAmount, setReturnAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState(false);
  const [refundMethod, setRefundMethod] = useState("nakit");
  const [restock, setRestock] = useState(true);
  const [returnDate, setReturnDate] = useState("");
  const [note, setNote] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [saving, setSaving] = useState(false);
  const [costReversed, setCostReversed] = useState(0);

  useEffect(() => {
    if (sale) {
      const today = new Date().toISOString().split("T")[0];
      setReturnDate(today);
      setQuantity(1);
      const perUnit = Number(sale.total_amount) / Math.max(1, Number(sale.quantity));
      setReturnAmount(parseFloat(perUnit.toFixed(2)));
      setReason("");
      setReasonDetail("");
      setRefundMethod("nakit");
      setRestock(true);
      setCustomAmount(false);
      setNote("");
      setShowDetails(false);
      // Maliyet parse
      const costItems = parseCostItems(sale.note);
      const totalCost = costItems.reduce((s, i) => s + i.amount, 0) || Number(sale.total_cost || 0);
      const perUnitCost = totalCost / Math.max(1, Number(sale.quantity));
      setCostReversed(parseFloat(perUnitCost.toFixed(2)));
    }
  }, [sale]);

  useEffect(() => {
    if (!customAmount && sale) {
      const perUnit = Number(sale.total_amount) / Math.max(1, Number(sale.quantity));
      setReturnAmount(parseFloat((perUnit * quantity).toFixed(2)));
      const costItems = parseCostItems(sale.note);
      const totalCost = costItems.reduce((s, i) => s + i.amount, 0) || Number(sale.total_cost || 0);
      const perUnitCost = totalCost / Math.max(1, Number(sale.quantity));
      setCostReversed(parseFloat((perUnitCost * quantity).toFixed(2)));
    }
  }, [quantity, customAmount, sale]);

  if (!sale) return null;

  // product_id sales kaydında güvenilmez olabilir — isimle eşleştir
  function resolveProductId(): string | null {
    if (sale!.product_id) return sale!.product_id;
    const match = products.find((p) => p.name === sale!.product_name);
    return match?.id ?? null;
  }

  async function handleSave() {
    if (!sale) return;
    if (!reason) return toast.error("İade nedeni seçmelisiniz");
    const maxReturnable = Number(sale.quantity) - alreadyReturned;
    if (quantity < 1) return toast.error("Miktar en az 1 olmalıdır");
    if (quantity > maxReturnable) return toast.error(`İade edilebilir maksimum miktar: ${maxReturnable} adet`);
    setSaving(true);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setSaving(false); return toast.error("Oturum bulunamadı"); }
    const uid = session.user.id;

    const productId = resolveProductId();

    const { data, error } = await supabase.rpc("process_return", {
      p_user_id: uid,
      p_sale_id: sale.id,
      p_product_id: productId,
      p_product_name: sale.product_name,
      p_quantity: quantity,
      p_return_amount: returnAmount,
      p_refund_method: refundMethod,
      p_reason_category: reason,
      p_reason_detail: reasonDetail || null,
      p_restock: restock,
      p_cost_reversed: costReversed,
      p_note: note || null,
      p_return_date: returnDate,
    });

    setSaving(false);
    if (error) return toast.error("İade kaydedilemedi: " + friendlyDbError(error));

    // İade başarılı — satışın status'unu 'iade_edildi' yap
    // (status kolonu migration henüz uygulanmadıysa sessizce başarısız olur, hata fırlatmaz)
    await supabase
      .from("sales")
      .update({ status: "iade_edildi" })
      .eq("id", sale.id)
      .eq("user_id", uid);

    const newReturn: ReturnRecord = {
      id: data as string,
      sale_id: sale.id,
      product_name: sale.product_name,
      quantity,
      return_amount: returnAmount,
      refund_method: refundMethod,
      reason_category: reason,
      reason_detail: reasonDetail || null,
      restock,
      cost_reversed: costReversed,
      return_date: returnDate,
      status: "active",
      note: note || null,
    };

    const stockMsg = restock && productId ? ` · Stok güncellendi (+${quantity})` : "";
    toast.success(
      `İade tamamlandı${stockMsg} · ₺${costReversed.toFixed(2)} maliyetin kontrolü sizde`,
      { duration: 7000 }
    );
    onCreated(newReturn);
    onClose();
  }

  return (
    <Dialog open={!!sale} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>İade Oluştur</DialogTitle>
          <p className="text-sm text-muted-foreground">{sale.product_name} — {formatCurrency(Number(sale.total_amount))}</p>
        </DialogHeader>

        <div className="space-y-4">
          {/* İade Miktarı */}
          <div>
            <Label>İade Miktarı <span className="text-destructive">*</span></Label>
            <Input
              type="number"
              min={1}
              max={Number(sale.quantity) - alreadyReturned}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Orijinal satış: {sale.quantity} adet
              {alreadyReturned > 0 && (
                <> · Daha önce iade: {alreadyReturned} adet · <span className="font-medium text-foreground">Kalan: {sale.quantity - alreadyReturned} adet</span></>
              )}
            </p>
          </div>

          {/* İade Nedeni */}
          <div>
            <Label>İade Nedeni <span className="text-destructive">*</span></Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setReason(r);
                    if (r === "urun_hasarli") setRestock(false);
                    else setRestock(true);
                  }}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    reason === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background hover:bg-muted border-border"
                  }`}
                >
                  {REASON_LABELS[r]}
                </button>
              ))}
            </div>
            {reason && (
              <Textarea
                className="mt-2"
                rows={2}
                placeholder="Ek açıklama (opsiyonel)"
                value={reasonDetail}
                onChange={(e) => setReasonDetail(e.target.value)}
              />
            )}
          </div>

          {/* Detay Akordiyon */}
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            Detay ekle
          </button>

          {showDetails && (
            <div className="space-y-3 border-l-2 border-border pl-4">
              <div>
                <Label>İade Tarihi</Label>
                <Input type="date" value={returnDate} onChange={(e) => setReturnDate(e.target.value)} />
              </div>

              <div>
                <Label>İade Tutarı</Label>
                <div className={`relative ${customAmount ? "ring-2 ring-amber-400 rounded-md" : ""}`}>
                  <Input
                    type="number"
                    step="0.01"
                    value={returnAmount}
                    readOnly={!customAmount}
                    onChange={(e) => setReturnAmount(parseFloat(e.target.value) || 0)}
                    className={!customAmount ? "bg-muted cursor-not-allowed" : ""}
                  />
                </div>
                <label className="flex items-center gap-2 mt-1 text-xs text-muted-foreground cursor-pointer">
                  <Checkbox checked={customAmount} onCheckedChange={(v) => setCustomAmount(!!v)} />
                  Tutarı özelleştir
                  {customAmount && <span className="text-amber-600">— orijinalden farklı tutar girildi</span>}
                </label>
              </div>

              <div>
                <Label>İade Yöntemi</Label>
                <Select value={refundMethod} onValueChange={setRefundMethod}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nakit">Nakit</SelectItem>
                    <SelectItem value="cari" disabled>Cariye Ekle (Yakında)</SelectItem>
                    <SelectItem value="banka">Banka Transferi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox checked={restock} onCheckedChange={(v) => setRestock(!!v)} />
                <span className="text-sm">Stok geri gelsin</span>
                {reason === "urun_hasarli" && (
                  <span className="text-xs text-amber-600">(Hasarlı ürün — stok geri alınmadı)</span>
                )}
              </label>

              <div>
                <Label>Not (opsiyonel)</Label>
                <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>İptal</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? "Kaydediliyor..." : "İadeyi Kaydet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
