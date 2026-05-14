import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Trash2, Settings as SettingsIcon, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import {
  useSettings, DEFAULT_SETTINGS,
  type AppSettings, type InstallmentPlan, type PaymentMethod,
} from "@/lib/butcecrm-settings";

export const Route = createFileRoute("/app/butcecrm/ayarlar")({
  component: AyarlarPage,
});

function AyarlarPage() {
  const [settings, setSettings] = useSettings();

  const update = <K extends keyof AppSettings>(k: K, v: AppSettings[K]) =>
    setSettings({ ...settings, [k]: v });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <SettingsIcon className="h-6 w-6 text-primary" /> Ayarlar
          </h1>
          <p className="text-muted-foreground text-sm">
            Tüm dinamik listeler ve oranlar burada yönetilir. Değişiklikler tarayıcınızda kalıcı olarak saklanır.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            if (confirm("Tüm ayarlar varsayılana sıfırlansın mı?")) {
              setSettings(DEFAULT_SETTINGS);
              toast.success("Varsayılana sıfırlandı");
            }
          }}
        >
          <RotateCcw className="h-4 w-4 mr-2" /> Varsayılana Sıfırla
        </Button>
      </div>

      <Tabs defaultValue="installments">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="installments">Vade / Taksit Oranları</TabsTrigger>
          <TabsTrigger value="payments">Ödeme Yöntemleri</TabsTrigger>
          <TabsTrigger value="platforms">Platformlar</TabsTrigger>
          <TabsTrigger value="carriers">Kargo Firmaları</TabsTrigger>
          <TabsTrigger value="orderStatuses">Sipariş Durumları</TabsTrigger>
        </TabsList>

        <TabsContent value="installments">
          <InstallmentEditor
            plans={settings.installmentPlans}
            onChange={(v) => update("installmentPlans", v)}
          />
        </TabsContent>

        <TabsContent value="payments">
          <PaymentMethodEditor
            items={settings.paymentMethods}
            onChange={(v) => update("paymentMethods", v)}
          />
        </TabsContent>

        <TabsContent value="platforms">
          <StringListEditor
            title="Satış Platformları"
            description="Yeni satış formundaki platform seçim listesi."
            items={settings.platforms}
            onChange={(v) => update("platforms", v)}
            placeholder="Örn: Trendyol"
          />
        </TabsContent>

        <TabsContent value="carriers">
          <StringListEditor
            title="Kargo Firmaları"
            items={settings.carriers}
            onChange={(v) => update("carriers", v)}
            placeholder="Örn: Yurtiçi Kargo"
          />
        </TabsContent>

        <TabsContent value="orderStatuses">
          <StringListEditor
            title="Sipariş Durumları"
            items={settings.orderStatuses}
            onChange={(v) => update("orderStatuses", v)}
            placeholder="Örn: Hazırlanıyor"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function StringListEditor({
  title, description, items, onChange, placeholder,
}: {
  title: string;
  description?: string;
  items: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState("");
  const add = () => {
    const v = input.trim();
    if (!v) return;
    if (items.includes(v)) return toast.error("Bu kayıt zaten var");
    onChange([...items, v]);
    setInput("");
  };
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), add())}
            placeholder={placeholder}
          />
          <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> Ekle</Button>
        </div>
        <ul className="divide-y rounded-md border">
          {items.length === 0 && (
            <li className="text-sm text-muted-foreground p-4 text-center">Henüz kayıt yok</li>
          )}
          {items.map((it, i) => (
            <li key={`${it}-${i}`} className="flex items-center justify-between gap-2 px-3 py-2">
              <span className="text-sm">{it}</span>
              <Button
                variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600"
                onClick={() => onChange(items.filter((_, j) => j !== i))}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function InstallmentEditor({
  plans, onChange,
}: { plans: InstallmentPlan[]; onChange: (v: InstallmentPlan[]) => void }) {
  const [count, setCount] = useState("");
  const [rate, setRate] = useState("");
  const sorted = [...plans].sort((a, b) => a.count - b.count);

  const add = () => {
    const c = parseInt(count, 10);
    const r = parseFloat(rate);
    if (!c || c < 1) return toast.error("Geçerli bir taksit sayısı girin");
    if (isNaN(r) || r < 0) return toast.error("Geçerli bir oran girin");
    if (plans.some((p) => p.count === c)) return toast.error("Bu taksit sayısı zaten var");
    onChange([...plans, { count: c, rate: r }]);
    setCount(""); setRate("");
  };

  const updateRate = (idx: number, r: string) => {
    const v = parseFloat(r);
    onChange(plans.map((p, i) => (i === idx ? { ...p, rate: isNaN(v) ? 0 : v } : p)));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kredi Kartı Vade / Taksit Oranları</CardTitle>
        <p className="text-xs text-muted-foreground">
          Her taksit sayısı için komisyon oranı (%). Yeni satış formunda kredi kartı seçildiğinde
          buradaki oranlar kullanılır.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2 items-end">
          <div>
            <Label className="text-xs">Taksit Sayısı</Label>
            <Input type="number" min="1" value={count} onChange={(e) => setCount(e.target.value)} placeholder="Örn: 6" />
          </div>
          <div>
            <Label className="text-xs">Oran (%)</Label>
            <Input type="number" step="0.1" min="0" value={rate} onChange={(e) => setRate(e.target.value)} placeholder="Örn: 5" />
          </div>
          <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> Ekle</Button>
        </div>
        <div className="rounded-md border divide-y">
          {sorted.length === 0 && (
            <div className="text-sm text-muted-foreground p-4 text-center">Henüz vade tanımı yok</div>
          )}
          {sorted.map((p) => {
            const idx = plans.findIndex((x) => x.count === p.count);
            return (
              <div key={p.count} className="grid grid-cols-3 gap-2 items-center px-3 py-2">
                <div className="text-sm font-medium">{p.count} taksit</div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" step="0.1" min="0" value={p.rate}
                    onChange={(e) => updateRate(idx, e.target.value)}
                    className="h-8"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600"
                    onClick={() => onChange(plans.filter((_, i) => i !== idx))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function PaymentMethodEditor({
  items, onChange,
}: { items: PaymentMethod[]; onChange: (v: PaymentMethod[]) => void }) {
  const [name, setName] = useState("");
  const [isCC, setIsCC] = useState(false);
  const [rate, setRate] = useState("");

  const add = () => {
    const n = name.trim();
    if (!n) return toast.error("Yöntem adı gerekli");
    if (items.some((x) => x.name.toLowerCase() === n.toLowerCase()))
      return toast.error("Bu yöntem zaten var");
    const r = parseFloat(rate);
    onChange([...items, {
      name: n,
      isCreditCard: isCC,
      rate: isNaN(r) || r <= 0 ? undefined : r,
    }]);
    setName(""); setIsCC(false); setRate("");
  };

  const patch = (idx: number, p: Partial<PaymentMethod>) =>
    onChange(items.map((it, i) => (i === idx ? { ...it, ...p } : it)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ödeme Yöntemleri</CardTitle>
        <p className="text-xs text-muted-foreground">
          "Kredi kartı" işaretli yöntemlerde satış formunda taksit/vade alanı görüntülenir.
          Diğer yöntemler için isteğe bağlı sabit komisyon oranı tanımlayabilirsiniz.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end">
          <div>
            <Label className="text-xs">Yöntem Adı</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Örn: Papara" />
          </div>
          <div className="flex items-center gap-2 h-9">
            <Checkbox id="new-cc" checked={isCC} onCheckedChange={(v) => setIsCC(!!v)} />
            <Label htmlFor="new-cc" className="text-xs cursor-pointer">Kredi kartı (vadeli)</Label>
          </div>
          <div>
            <Label className="text-xs">Sabit Oran (%) — opsiyonel</Label>
            <Input type="number" step="0.1" min="0" value={rate} onChange={(e) => setRate(e.target.value)} disabled={isCC} />
          </div>
          <Button onClick={add}><Plus className="h-4 w-4 mr-1" /> Ekle</Button>
        </div>
        <div className="rounded-md border divide-y">
          {items.length === 0 && (
            <div className="text-sm text-muted-foreground p-4 text-center">Henüz ödeme yöntemi yok</div>
          )}
          {items.map((it, i) => (
            <div key={`${it.name}-${i}`} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-center px-3 py-2">
              <Input value={it.name} onChange={(e) => patch(i, { name: e.target.value })} className="h-8" />
              <div className="flex items-center gap-2">
                <Checkbox
                  id={`cc-${i}`}
                  checked={it.isCreditCard}
                  onCheckedChange={(v) => patch(i, { isCreditCard: !!v, rate: v ? undefined : it.rate })}
                />
                <Label htmlFor={`cc-${i}`} className="text-xs cursor-pointer">Kredi kartı (vadeli)</Label>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="number" step="0.1" min="0"
                  value={it.rate ?? ""}
                  disabled={it.isCreditCard}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    patch(i, { rate: isNaN(v) ? undefined : v });
                  }}
                  className="h-8"
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
              <div className="flex justify-end">
                <Button
                  variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-600"
                  onClick={() => onChange(items.filter((_, j) => j !== i))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
