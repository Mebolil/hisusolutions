import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Settings as SettingsIcon, RotateCcw, Store, CheckCircle2, XCircle, Loader2, RefreshCw, Link, Unlink, Lock } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import {
  useSettings, DEFAULT_SETTINGS,
  type AppSettings, type InstallmentPlan, type PaymentMethod,
} from "@/lib/pusla-settings";

export const Route = createFileRoute("/app/pusla/ayarlar")({
  component: AyarlarPage,
});

function AyarlarPage() {
  const [settings, setSettings] = useSettings();
  const [weeklyPulse, setWeeklyPulse] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const { data } = await supabase
        .from("profiles")
        .select("weekly_pulse_enabled")
        .eq("user_id", session.user.id)
        .maybeSingle();
      setWeeklyPulse((data as any)?.weekly_pulse_enabled ?? true);
    })();
  }, []);

  const toggleWeeklyPulse = async (val: boolean) => {
    setWeeklyPulse(val);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { setWeeklyPulse(!val); return; }
    const { error } = await supabase
      .from("profiles")
      .update({ weekly_pulse_enabled: val })
      .eq("user_id", session.user.id);
    if (error) {
      setWeeklyPulse(!val);
      toast.error("Ayar kaydedilemedi, lütfen tekrar deneyin");
      return;
    }
    toast.success(val ? "Haftalık nabız raporu açıldı" : "Haftalık nabız raporu kapatıldı");
  };

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

      <Tabs defaultValue="costItems">
        <TabsList className="flex flex-wrap h-auto">
          <TabsTrigger value="costItems">Maliyet Kalemleri</TabsTrigger>
          <TabsTrigger value="expenseCategories">Gider Kategorileri</TabsTrigger>
          <TabsTrigger value="platforms">Platformlar</TabsTrigger>
          <TabsTrigger value="installments">Vade / Taksit Oranları</TabsTrigger>
          <TabsTrigger value="payments">Ödeme Yöntemleri</TabsTrigger>
          <TabsTrigger value="carriers">Kargo Firmaları</TabsTrigger>
          <TabsTrigger value="orderStatuses">Sipariş Durumları</TabsTrigger>
          <TabsTrigger value="notifications">Bildirimler</TabsTrigger>
          <TabsTrigger value="marketplaces">Pazar Yerleri</TabsTrigger>
          <TabsTrigger value="account">Hesap</TabsTrigger>
        </TabsList>

        <TabsContent value="costItems">
          <StringListEditor
            title="Maliyet Kalemleri"
            description="Yeni satış formundaki maliyet kalemleri listesi. Buraya eklediğiniz kalemler otomatik olarak satış formunda görünür."
            items={settings.costItems}
            onChange={(v) => update("costItems", v)}
            placeholder="Örn: Ambalaj"
          />
        </TabsContent>

        <TabsContent value="expenseCategories">
          <StringListEditor
            title="Gider Kategorileri"
            description="Yeni gider formundaki kategori listesi. Buraya eklediğiniz kategoriler otomatik olarak gider formunda görünür."
            items={settings.expenseCategories}
            onChange={(v) => update("expenseCategories", v)}
            placeholder="Örn: Depo Kirası"
          />
        </TabsContent>

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

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Bildirim Tercihleri</CardTitle>
              <p className="text-xs text-muted-foreground">
                E-posta bildirim ayarlarını buradan yönetin.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div>
                  <p className="text-sm font-medium">Haftalık Nabız Raporu</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Her Pazartesi sabahı geçen haftanın özeti e-posta ile gelir.
                  </p>
                </div>
                <Switch
                  checked={weeklyPulse ?? true}
                  onCheckedChange={toggleWeeklyPulse}
                  disabled={weeklyPulse === null}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="marketplaces">
          <MarketplacesTab />
        </TabsContent>

        <TabsContent value="account">
          <PasswordChangeCard />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PasswordChangeCard() {
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { toast.error("Şifreler eşleşmiyor."); return; }
    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success("Şifreniz güncellendi.");
      setPassword("");
      setConfirm("");
    }
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Güvenliğinizi Güncelleyin</CardTitle>
        <p className="text-xs text-muted-foreground">
          Yeni şifreniz hemen geçerli olur. Oturumunuz açık kalmaya devam eder.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4 max-w-sm">
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Yeni Şifre</Label>
            <Input
              id="new-password"
              type="password"
              placeholder="En az 6 karakter"
              minLength={6}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Şifre Tekrar</Label>
            <Input
              id="confirm-password"
              type="password"
              placeholder="Şifrenizi tekrar girin"
              minLength={6}
              required
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
            />
          </div>
          <Button
            type="submit"
            disabled={loading || password.length < 6 || password !== confirm || !confirm}
          >
            {loading ? "Kaydediliyor..." : "Şifremi Güncelle"}
          </Button>
        </form>
      </CardContent>
    </Card>
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

// ──────────────────────────────────────────────────────────────────────────────
// Pazar Yerleri Sekmesi
// ──────────────────────────────────────────────────────────────────────────────

type MarketplaceConnection = {
  id: string;
  platform: "trendyol" | "hepsiburada";
  store_name: string;
  sync_status: "idle" | "running" | "error" | "disabled" | "backfilling";
  sync_error_message: string | null;
  sync_error_count: number;
  is_active: boolean;
  initial_backfill_done: boolean;
  backfill_last_fetched_date: string | null;
  last_order_sync_at: string | null;
  last_financial_sync_at: string | null;
  last_stock_sync_at: string | null;
  last_returns_sync_at: string | null;
  created_at: string;
  extension_api_token: string;
};

const SUPABASE_EF_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/marketplace-connect`;

function formatTRDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("tr-TR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

async function callMarketplaceEF(
  token: string,
  method: "GET" | "POST",
  action: string,
  body?: object,
) {
  const res = await fetch(`${SUPABASE_EF_URL}?action=${action}`, {
    method,
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`);
  return json;
}

function SyncStatusBadge({ status }: { status: MarketplaceConnection["sync_status"] }) {
  const map: Record<string, { label: string; className: string }> = {
    idle: { label: "Aktif", className: "bg-green-100 text-green-700 border-green-200" },
    running: { label: "Sync yapılıyor", className: "bg-blue-100 text-blue-700 border-blue-200" },
    backfilling: { label: "Veri aktarılıyor", className: "bg-purple-100 text-purple-700 border-purple-200" },
    error: { label: "Hata", className: "bg-red-100 text-red-700 border-red-200" },
    disabled: { label: "Devre dışı", className: "bg-gray-100 text-gray-600 border-gray-200" },
  };
  const s = map[status] ?? map.idle;
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${s.className}`}>
      {s.label}
    </span>
  );
}

function ConnectionCard({
  conn,
  onDelete,
  onRefreshToken,
  onRetrySync,
}: {
  conn: MarketplaceConnection;
  onDelete: (id: string) => Promise<void>;
  onRefreshToken: (id: string) => void;
  onRetrySync: (id: string) => Promise<void>;
}) {
  const [showToken, setShowToken] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [retrying, setRetrying] = useState(false);

  function formatRelativeSync(isoDate: string | null): string {
    if (!isoDate) return "";
    const diffMs = Date.now() - new Date(isoDate).getTime();
    const diffMin = Math.round(diffMs / 60000);
    const rtf = new Intl.RelativeTimeFormat("tr", { numeric: "auto" });
    if (diffMin < 60) return rtf.format(-diffMin, "minutes");
    if (diffMin < 1440) return rtf.format(-Math.round(diffMin / 60), "hours");
    return rtf.format(-Math.round(diffMin / 1440), "days");
  }

  const lastSyncInfo = (() => {
    if (!conn.last_order_sync_at) return { text: "Henüz sync yapılmadı", color: "text-muted-foreground" };
    const diffMs = Date.now() - new Date(conn.last_order_sync_at).getTime();
    const diffMin = Math.round(diffMs / 60000);
    const color = diffMin > 120 ? "text-red-600" : diffMin > 35 ? "text-amber-600" : "text-muted-foreground";
    return { text: `Son sipariş sync: ${formatRelativeSync(conn.last_order_sync_at)}`, color };
  })();

  const platformLabel = conn.platform === "hepsiburada" ? "Hepsiburada" : "Trendyol";

  const errorDisplay = (() => {
    if (!conn.sync_error_message) return null;
    // Kullanıcı dostu hata mesajı (teknik detay gizle)
    if (conn.sync_error_count && conn.sync_error_count >= 3) {
      return `${platformLabel}'a birkaç kez arka arkaya ulaşılamadı. Bağlantı bilgilerinizi kontrol edin.`;
    }
    return `${platformLabel}'a şu an ulaşılamıyor. Otomatik olarak tekrar denenecek.`;
  })();

  return (
    <div className="rounded-lg border p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Store className="h-5 w-5 text-muted-foreground flex-shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="font-medium text-sm truncate">{conn.store_name}</p>
              {conn.platform === "trendyol" && (
                <span className="text-xs px-1.5 py-0.5 rounded border bg-orange-50 text-orange-700 border-orange-200 font-medium flex-shrink-0">TY</span>
              )}
              {conn.platform === "hepsiburada" && (
                <span className="text-xs px-1.5 py-0.5 rounded border bg-red-50 text-red-700 border-red-200 font-medium flex-shrink-0">HB</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground capitalize">{conn.platform}</p>
          </div>
        </div>
        <SyncStatusBadge status={conn.sync_status} />
      </div>

      <div className="text-xs space-y-1">
        {conn.sync_status === "backfilling" ? (
          <div className="space-y-1">
            <p className="text-purple-600 flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin flex-shrink-0" />
              {conn.backfill_last_fetched_date
                ? `${formatTRDate(conn.backfill_last_fetched_date)} tarihine kadar aktarıldı, devam ediyor...`
                : "Son 30 günün siparişleri aktarılıyor..."}
            </p>
            <p className="text-purple-500 font-medium pl-4 text-xs">Sayfa kapatıldığında da devam eder.</p>
          </div>
        ) : !conn.initial_backfill_done ? (
          <p className="text-purple-600 flex items-center gap-1">
            <Loader2 className="h-3 w-3 animate-spin" />
            Geçmiş aktarımı başlatılıyor...
          </p>
        ) : (
          <>
            <p className={lastSyncInfo.color}>{lastSyncInfo.text}</p>
            {conn.last_financial_sync_at && (
              <p className="text-muted-foreground">
                Son komisyon sync: {formatRelativeSync(conn.last_financial_sync_at)}
              </p>
            )}
            {conn.last_stock_sync_at && (
              <p className="text-muted-foreground">
                Son stok sync: {formatRelativeSync(conn.last_stock_sync_at)}
              </p>
            )}
            {conn.last_returns_sync_at && (
              <p className="text-muted-foreground">
                Son iade sync: {formatRelativeSync(conn.last_returns_sync_at)}
              </p>
            )}
          </>
        )}
        {errorDisplay && (
          <p className="text-red-600 flex items-center gap-1">
            <XCircle className="h-3 w-3 flex-shrink-0" /> {errorDisplay}
          </p>
        )}
      </div>

      <Separator />

      <div className="space-y-1.5">
        <p className="text-xs text-muted-foreground font-medium">Chrome Extension Token</p>
        <div className="flex items-center gap-2">
          <Input
            type={showToken ? "text" : "password"}
            value={conn.extension_api_token}
            readOnly
            className="text-xs h-8 font-mono"
            onFocus={() => setShowToken(true)}
            onBlur={() => setShowToken(false)}
          />
          <Button
            variant="outline"
            size="sm"
            className="h-8 flex-shrink-0"
            onClick={() => onRefreshToken(conn.id)}
            title="Token'ı yenile"
          >
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">Chrome eklentisini bu hesaba bağlamak için kullanılır — kopyalayıp eklentiye yapıştırın. Tıklayarak görüntüleyin.</p>
      </div>

      <div className="flex items-center justify-between">
        {conn.sync_status === "error" && (
          <Button
            variant="outline"
            size="sm"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
            disabled={retrying}
            onClick={async () => {
              setRetrying(true);
              try {
                await onRetrySync(conn.id);
              } finally {
                setRetrying(false);
              }
            }}
          >
            {retrying
              ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
              : <RefreshCw className="h-4 w-4 mr-1" />}
            Yeniden Dene
          </Button>
        )}
        <div className="ml-auto">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
            disabled={deleting}
            onClick={async () => {
              if (!confirm(`"${conn.store_name}" bağlantısı kaldırılsın mı?`)) return;
              setDeleting(true);
              try {
                await onDelete(conn.id);
              } finally {
                setDeleting(false);
              }
            }}
          >
            {deleting
              ? <Loader2 className="h-4 w-4 animate-spin mr-1" />
              : <Unlink className="h-4 w-4 mr-1" />}
            Bağlantıyı Kaldır
          </Button>
        </div>
      </div>
    </div>
  );
}

function AddTrendyolForm({ onSuccess }: { onSuccess: () => void }) {
  const [supplierId, setSupplierId] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [apiSecret, setApiSecret] = useState("");
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !apiKey || !apiSecret) {
      toast.error("Tüm zorunlu alanları doldurun");
      return;
    }

    setLoading(true);
    setStatus("testing");
    setErrorMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      await callMarketplaceEF(session.access_token, "POST", "connect", {
        platform: "trendyol",
        trendyol_supplier_id: supplierId.trim(),
        api_key: apiKey.trim(),
        api_secret: apiSecret.trim(),
        store_name: storeName.trim() || "Trendyol Mağazam",
      });

      setStatus("success");
      toast.success("Trendyol bağlantısı başarıyla kuruldu!");
      setTimeout(() => {
        onSuccess();
        setSupplierId(""); setApiKey(""); setApiSecret(""); setStoreName("");
        setStatus("idle");
      }, 1500);
    } catch (err) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Bağlantı kurulamadı";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="ty-supplier-id">Supplier ID <span className="text-red-500">*</span></Label>
          <Input
            id="ty-supplier-id"
            placeholder="Örn: 123456"
            value={supplierId}
            onChange={(e) => setSupplierId(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ty-store-name">Mağaza Adı (opsiyonel)</Label>
          <Input
            id="ty-store-name"
            placeholder="Örn: Ana Mağaza"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ty-api-key">API Anahtarı <span className="text-red-500">*</span></Label>
          <Input
            id="ty-api-key"
            type="password"
            placeholder="Trendyol API Key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ty-api-secret">API Şifresi <span className="text-red-500">*</span></Label>
          <Input
            id="ty-api-secret"
            type="password"
            placeholder="Trendyol API Secret"
            value={apiSecret}
            onChange={(e) => setApiSecret(e.target.value)}
            required
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        API bilgilerini <strong>Trendyol Satıcı Paneli → Entegrasyon Bilgileri</strong> bölümünden alabilirsiniz.
        Anahtarlar şifreli olarak saklanır — mağazanıza yalnızca okuma yetkisiyle erişilir, hiçbir şey yazılmaz.
      </p>

      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {status === "success" && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          Bağlantı başarılı! Sipariş verileriniz yakında aktarılmaya başlayacak.
        </div>
      )}

      <Button type="submit" disabled={loading || status === "success"}>
        {loading
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Test ediliyor...</>
          : <><Link className="h-4 w-4 mr-2" /> Trendyol'u Bağla</>}
      </Button>
    </form>
  );
}

function AddHepsiburadaForm({ onSuccess }: { onSuccess: () => void }) {
  const [merchantId, setMerchantId] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [storeName, setStoreName] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"idle" | "testing" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchantId || !username || !password) {
      toast.error("Tüm zorunlu alanları doldurun");
      return;
    }

    setLoading(true);
    setStatus("testing");
    setErrorMsg("");

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Oturum bulunamadı");

      await callMarketplaceEF(session.access_token, "POST", "connect", {
        platform: "hepsiburada",
        hb_merchant_id: merchantId.trim(),
        hb_username: username.trim(),
        hb_password: password,
        store_name: storeName.trim() || "HB Mağazam",
      });

      setStatus("success");
      toast.success("Hepsiburada bağlantısı başarıyla kuruldu!");
      setTimeout(() => {
        onSuccess();
        setMerchantId(""); setUsername(""); setPassword(""); setStoreName("");
        setStatus("idle");
      }, 1500);
    } catch (err) {
      setStatus("error");
      const msg = err instanceof Error ? err.message : "Bağlantı kurulamadı";
      setErrorMsg(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/50 border rounded-md px-3 py-2">
        <Lock className="h-3.5 w-3.5 mt-0.5 shrink-0 text-muted-foreground" />
        <span>Bilgileriniz şifreli saklanır ve yalnızca HB API çağrılarında kullanılır. Dilediğiniz zaman silebilirsiniz.</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="hb-merchant-id">Merchant ID <span className="text-red-500">*</span></Label>
          <Input
            id="hb-merchant-id"
            placeholder="Örn: 123456789"
            value={merchantId}
            onChange={(e) => setMerchantId(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hb-store-name">Mağaza Adı (opsiyonel)</Label>
          <Input
            id="hb-store-name"
            placeholder="Örn: HB Ana Mağaza"
            value={storeName}
            onChange={(e) => setStoreName(e.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hb-username">Kullanıcı Adı <span className="text-red-500">*</span></Label>
          <Input
            id="hb-username"
            placeholder="HB satıcı kullanıcı adı"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="hb-password">Şifre <span className="text-red-500">*</span></Label>
          <Input
            id="hb-password"
            type="password"
            placeholder="HB satıcı şifresi"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Bilgilere <strong>Hepsiburada Satıcı Portalı → Entegrasyon → API Anahtarı</strong> sayfasından ulaşabilirsiniz.
      </p>

      {status === "testing" && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 border rounded-md p-3">
          <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
          HB sunucularına bağlanılıyor...
        </div>
      )}

      {status === "error" && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          {errorMsg}
        </div>
      )}

      {status === "success" && (
        <div className="flex items-center gap-2 text-sm text-green-700 bg-green-50 border border-green-200 rounded-md p-3">
          <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
          Bağlantı başarılı! Stok ve sipariş verileriniz aktarılmaya başlayacak.
        </div>
      )}

      <Button type="submit" disabled={loading || status === "success"}>
        {loading
          ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Test ediliyor...</>
          : <><Link className="h-4 w-4 mr-2" /> Hepsiburada'yı Bağla</>}
      </Button>
    </form>
  );
}

function MarketplacesTab() {
  const [connections, setConnections] = useState<MarketplaceConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState<false | "trendyol" | "hepsiburada">(false);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const { connections: data } = await callMarketplaceEF(session.access_token, "GET", "list");
      setConnections(data ?? []);
    } catch {
      toast.error("Bağlantılar yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchConnections(); }, []);

  // Backfill/running durumunda 5 saniyede bir yenile; tamamlanınca toast göster
  useEffect(() => {
    const hasActiveSync = connections.some(
      (c) => c.sync_status === "backfilling" || c.sync_status === "running",
    );
    if (!hasActiveSync) return;

    const interval = setInterval(async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      try {
        const { connections: fresh } = await callMarketplaceEF(session.access_token, "GET", "list");
        const freshList: MarketplaceConnection[] = fresh ?? [];
        setConnections(freshList);

        // Backfill yeni tamamlandıysa kullanıcıya bildir
        for (const prev of connections) {
          const curr = freshList.find((c) => c.id === prev.id);
          if (!curr) continue;
          if (
            (prev.sync_status === "backfilling" || !prev.initial_backfill_done) &&
            curr.initial_backfill_done &&
            curr.sync_status === "idle"
          ) {
            const datePart = curr.backfill_last_fetched_date
              ? `${formatTRDate(curr.backfill_last_fetched_date)} tarihine kadar `
              : "";
            toast.success(`${curr.store_name} — ${datePart}sipariş geçmişi aktarıldı`, {
              duration: 8000,
            });
          }
        }
      } catch {
        // polling hatası sessizce geçer
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [connections]);

  const handleDelete = async (connId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      await callMarketplaceEF(session.access_token, "POST", "delete", { connection_id: connId });
      toast.success("Bağlantı kaldırıldı");
      setConnections((prev) => prev.filter((c) => c.id !== connId));
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Silinemedi");
    }
  };

  const handleRefreshToken = async (connId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      const { token } = await callMarketplaceEF(
        session.access_token, "POST", "refresh-token", { connection_id: connId },
      );
      setConnections((prev) =>
        prev.map((c) => c.id === connId ? { ...c, extension_api_token: token } : c),
      );
      toast.success("Extension token yenilendi");
    } catch {
      toast.error("Token yenilenemedi");
    }
  };

  const handleRetrySync = async (connId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) return;
      await callMarketplaceEF(session.access_token, "POST", "retry-sync", { connection_id: connId });
      toast.success("Sync yeniden başlatıldı");
      setTimeout(() => fetchConnections(), 2000);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Yeniden denenemedi");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Store className="h-5 w-5" /> Pazar Yeri Bağlantıları
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Bağlı pazar yerleri siparişlerinizi ve iadelerinizi otomatik olarak senkronize eder.
              </p>
            </div>
            {!showAddForm && (
              <div className="flex items-center gap-2">
                <Button onClick={() => setShowAddForm("trendyol")} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> Trendyol
                </Button>
                <Button onClick={() => setShowAddForm("hepsiburada")} size="sm" variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> Hepsiburada
                </Button>
              </div>
            )}
          </div>
        </CardHeader>

        {showAddForm && (
          <CardContent className="border-t pt-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-sm">
                {showAddForm === "hepsiburada" ? "Hepsiburada Bağla" : "Trendyol Bağla"}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddForm(false)}>İptal</Button>
            </div>
            {showAddForm === "hepsiburada"
              ? <AddHepsiburadaForm onSuccess={() => { setShowAddForm(false); fetchConnections(); }} />
              : <AddTrendyolForm onSuccess={() => { setShowAddForm(false); fetchConnections(); }} />}
          </CardContent>
        )}

        <CardContent className={showAddForm ? "border-t pt-4" : ""}>
          {loading ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" /> Yükleniyor...
            </div>
          ) : connections.length === 0 && !showAddForm ? (
            <div className="text-center py-10 space-y-3">
              <Store className="h-10 w-10 text-muted-foreground mx-auto" />
              <div>
                <p className="text-sm font-medium">Henüz pazar yeri bağlantısı yok</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Trendyol veya Hepsiburada'yı bağlayarak verilerinizi otomatik aktarın.
                </p>
              </div>
              <div className="flex items-center justify-center gap-2">
                <Button onClick={() => setShowAddForm("trendyol")} variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> Trendyol
                </Button>
                <Button onClick={() => setShowAddForm("hepsiburada")} variant="outline">
                  <Plus className="h-4 w-4 mr-1" /> Hepsiburada
                </Button>
              </div>
            </div>
          ) : connections.length > 0 ? (
            <div className="space-y-3">
              {connections.map((conn) => (
                <ConnectionCard
                  key={conn.id}
                  conn={conn}
                  onDelete={handleDelete}
                  onRefreshToken={handleRefreshToken}
                  onRetrySync={handleRetrySync}
                />
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

    </div>
  );
}
