import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { trackEvent } from "@/lib/analytics";

type FaqItem = { q: string; a: string };
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";

const PAGE_TITLE =
  "Hepsiburada Kâr ve Komisyon Hesaplayıcı 2026 — Stopaj Dahil | Hisu Solutions";
const PAGE_DESCRIPTION =
  "Hepsiburada'da kaça satarsan ne kadar kazanırsın? Komisyon, %1 stopaj ve kargo dahil minimum satış fiyatını saniyeler içinde öğren. Ücretsiz. Önce kâr, sonra fiyat.";
const PAGE_URL = "https://hisusolutions.com/hepsiburada-kar-hesaplayici";

const STOPAJ_ORANI = 0.01;

const faqs: FaqItem[] = [
  {
    q: "Hepsiburada komisyon oranları 2026'da ne kadar?",
    a: "Kategoriye göre %4,50 ile %22,50 arasında değişir. Elektronik (büyük) en düşük oran olan %4,50 ile en avantajlı kategoridir. Giyim %21, Ayakkabı %22,50, Mobilya & Dekorasyon %22 oranıyla en yüksek komisyon grubundadır. Komisyon, KDV dahil satış fiyatı üzerinden hesaplanır.",
  },
  {
    q: "Hepsiburada'da e-ticaret stopajı nedir ve ne kadar kesilir?",
    a: "1 Ocak 2025'ten itibaren tüm Türkiye pazaryeri satıcılarından satış bedeli üzerinden %1 stopaj kesilmektedir. Hepsiburada bu kesintiye dahildir. Çoğu hesap aracı bu kalemi göstermez; gerçek net kâr hesabı için stopajın ayrı bir maliyet kalemi olarak hesaba katılması gerekir.",
  },
  {
    q: "Hepsiburada platform hizmet bedeli 2026'da var mı?",
    a: "Hayır. Hepsiburada, platform hizmet bedeli uygulamasına 5 Temmuz 2025 itibarıyla son verdi. Bu tarihten itibaren satıcılardan ayrıca hizmet bedeli tahsil edilmemektedir.",
  },
  {
    q: "Hepsiburada'da minimum satış fiyatı nasıl hesaplanır?",
    a: "Formül: Satış Fiyatı = (Hedef Kâr + Ürün Maliyeti + Kargo + Paketleme) ÷ (1 − Komisyon Oranı − %1 Stopaj). Örneğin 100 TL kâr hedefi, 300 TL maliyet, Giyim kategorisi (%21 komisyon), 65 TL kargo ile minimum satış fiyatı yaklaşık 596 TL olur.",
  },
  {
    q: "BütçeCRM ile Hepsiburada kârı nasıl takip edilir?",
    a: "BütçeCRM, her satışa komisyon, kargo ve iade maliyetlerini otomatik olarak atayarak gerçek net kârı hesaplar. Manuel Excel takibi yerine anlık kâr tablosu sunar; ürün, platform ve kampanya bazlı kârlılık analizine olanak tanır.",
  },
  {
    q: "Hepsiburada'da zarar etmeden minimum satış fiyatı nasıl belirlenir?",
    a: "Zarar etmeden satış yapabilmek için satış fiyatının; ürün maliyeti, kargo, Hepsiburada komisyonu (%4,5–%22,5) ve %1 e-ticaret stopajını karşılaması gerekir. Formül: Satış Fiyatı = (Hedef Kâr + Maliyet + Kargo) ÷ (1 − Komisyon − 0,01). Hedef kâr sıfır girilirse bu araç tam break-even fiyatı verir. Giyim kategorisinde 300 TL maliyetli bir ürün için minimum satış fiyatı yaklaşık 490 TL'dir (70 TL kargo, %21 komisyon, %1 stopaj dahil).",
  },
];

const CATEGORIES = [
  { label: "Elektronik (büyük: telefon/laptop/TV)", rate: 0.045 },
  { label: "Kitap, Film, Müzik & Kırtasiye", rate: 0.07 },
  { label: "Elektronik (küçük/akıllı & aksesuar)", rate: 0.12 },
  { label: "Bebek & Oyuncak", rate: 0.14 },
  { label: "Spor & Outdoor", rate: 0.15 },
  { label: "Kişisel Bakım & Kozmetik", rate: 0.18 },
  { label: "Ev & Yaşam", rate: 0.2 },
  { label: "Çanta & Aksesuar", rate: 0.2 },
  { label: "Giyim & Moda", rate: 0.21 },
  { label: "Mobilya & Dekorasyon", rate: 0.22 },
  { label: "Ayakkabı", rate: 0.225 },
  { label: "Diğer", rate: 0.18 },
] as const;

export const Route = createFileRoute("/hepsiburada-kar-hesaplayici")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { name: "robots", content: "index, follow" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: PAGE_TITLE },
      { name: "twitter:description", content: PAGE_DESCRIPTION },
      { name: "twitter:image", content: "https://hisusolutions.com/og-image.png" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: PAGE_URL },
      { property: "og:title", content: PAGE_TITLE },
      { property: "og:description", content: PAGE_DESCRIPTION },
      { property: "og:image", content: "https://hisusolutions.com/og-image.png" },
    ],
    links: [{ rel: "canonical", href: PAGE_URL }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Hepsiburada Kâr Hesaplayıcı",
          url: PAGE_URL,
          description:
            "Hepsiburada satıcıları için ücretsiz kâr ve minimum satış fiyatı hesaplama aracı. Stopaj dahil.",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          inLanguage: "tr-TR",
          isAccessibleForFree: true,
          offers: { "@type": "Offer", price: "0", priceCurrency: "TRY" },
          featureList:
            "Komisyon hesaplama, E-ticaret stopajı, Kargo maliyeti, İade senaryosu, Net kâr tahmini",
          datePublished: "2026-06-28",
          dateModified: "2026-06-28",
          provider: {
            "@type": "Organization",
            name: "Hisu Solutions",
            url: "https://hisusolutions.com",
          },
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          itemListElement: [
            {
              "@type": "ListItem",
              position: 1,
              name: "Ana Sayfa",
              item: "https://hisusolutions.com",
            },
            {
              "@type": "ListItem",
              position: 2,
              name: "Kâr Hesaplayıcılar",
              item: "https://hisusolutions.com/kar-hesaplayici",
            },
            {
              "@type": "ListItem",
              position: 3,
              name: "Hepsiburada Kâr Hesaplayıcı",
              item: "https://hisusolutions.com/hepsiburada-kar-hesaplayici",
            },
          ],
        }),
      },
    ],
  }),
  component: HepsiburadaKarHesaplayiciPage,
});

function HepsiburadaKarHesaplayiciPage() {
  const [targetProfit, setTargetProfit] = useState<string>("");
  const [productCost, setProductCost] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [commissionRate, setCommissionRate] = useState<string>("");

  const [shipping, setShipping] = useState<string>("70");
  const [packaging, setPackaging] = useState<string>("0");
  const [returnRate, setReturnRate] = useState<string>("0");

  const [hasTracked, setHasTracked] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const tp = parseFloat(targetProfit) || 0;
  const pc = parseFloat(productCost) || 0;
  const sh = parseFloat(shipping) || 0;
  const pkg = parseFloat(packaging) || 0;
  const cr = (parseFloat(commissionRate) || 0) / 100;
  const rr = (parseFloat(returnRate) || 0) / 100;

  const denominator = 1 - cr - STOPAJ_ORANI;
  const sellingPrice = denominator > 0 ? (tp + pc + sh + pkg) / denominator : 0;

  const commissionAmount = sellingPrice * cr;
  const stopajAmount = sellingPrice * STOPAJ_ORANI;
  const returnCost = sh * 2 + pkg;
  const effectiveProfit = tp * (1 - rr) - returnCost * rr;
  const totalDeductions = commissionAmount + stopajAmount + sh + pkg;
  const profitMargin = sellingPrice > 0 ? (tp / sellingPrice) * 100 : 0;

  const isReady =
    targetProfit !== "" &&
    productCost !== "" &&
    commissionRate !== "" &&
    parseFloat(commissionRate) > 0 &&
    parseFloat(commissionRate) < 100 &&
    denominator > 0;

  useEffect(() => {
    if (isReady && !hasTracked) {
      const price = sellingPrice;
      const range = price < 200 ? "0-200" : price < 500 ? "200-500" : "500+";
      trackEvent("hepsiburada_kar_hesaplayici_hesapla");
      trackEvent("hesap_sonucu_aralik", { aralik: range });
      trackEvent("hb_stopaj_gosterildi");
      setHasTracked(true);
    }
  }, [isReady, sellingPrice, hasTracked]);

  useEffect(() => {
    setHasTracked(false);
  }, [targetProfit, productCost, commissionRate]);

  useEffect(() => {
    if (isReady) {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [isReady]);

  const lossTracked = useRef(false);
  useEffect(() => {
    if (rr > 0 && effectiveProfit < 0 && !lossTracked.current) {
      trackEvent("hb_iade_ile_zarar");
      lossTracked.current = true;
    }
    if (!(rr > 0 && effectiveProfit < 0)) {
      lossTracked.current = false;
    }
  }, [rr, effectiveProfit]);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft),_transparent_60%)]" />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center lg:px-8 lg:py-24">
          <span className="inline-flex rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-accent-foreground">
            Ücretsiz Araç · E-Ticaret Satıcıları İçin
          </span>
          <h1 className="mt-6 text-4xl font-bold tracking-tight md:text-5xl">
            Hepsiburada'da{" "}
            <span className="text-primary">Ne Kadar Kazanırsın?</span>
          </h1>
          <p className="mt-4 text-lg italic text-muted-foreground">
            "Önce kâr, sonra fiyat"
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Hedef kârını gir — komisyon, %1 e-ticaret stopajı ve kargo dahil
            {" "}<strong>Hepsiburada'da kaça satman gerektiğini</strong> ve zarar
            etmeden minimum satış fiyatını saniyeler içinde öğren.
          </p>
          <p className="mt-3 text-xs text-muted-foreground">
            Son güncelleme: Haziran 2026 · Kaynak: Hepsiburada Satıcı Sözleşmesi
            komisyon tablosu
          </p>
          <div className="mx-auto mt-6 max-w-2xl rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-left">
            <p className="text-sm text-amber-900">
              <strong>
                Çoğu hesaplayıcı Hepsiburada komisyonunu hesaplar; %1 e-ticaret
                stopajını göstermez.
              </strong>{" "}
              1 Ocak 2025'ten itibaren zorunlu olan bu kesinti, gerçek net kârı
              doğrudan etkiler. Bu araç stopajı ayrı bir kalem olarak formüle dahil
              eder.
            </p>
          </div>
        </div>
      </section>

      {/* Hesaplayıcı Widget */}
      <section className="mx-auto max-w-3xl px-4 pb-16 lg:px-8">
        <Card className="mx-auto max-w-2xl">
          <CardContent className="p-6 lg:p-8">
            {/* Zorunlu alanlar */}
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Hedef Kâr (TL)
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="Örn: 100 (ne kadar kazanmak istiyorsun?)"
                  value={targetProfit}
                  onChange={(e) => setTargetProfit(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Ürün Maliyeti (TL)
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="Örn: 250 (tedarik + üretim)"
                  value={productCost}
                  onChange={(e) => setProductCost(e.target.value)}
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Kategori
                </label>
                <Select
                  value={selectedCategory}
                  onValueChange={(val) => {
                    setSelectedCategory(val);
                    const cat = CATEGORIES.find((c) => c.label === val);
                    if (cat) setCommissionRate((cat.rate * 100).toFixed(2));
                    trackEvent("hb_kategori_secildi", { kategori: val });
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Kategori seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c.label} value={c.label}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Komisyon Oranı (%)
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  placeholder="Ör: 21.00"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
                <small className="mt-1 block text-xs text-muted-foreground">
                  {selectedCategory
                    ? `${selectedCategory} için %${commissionRate} uygulandı. Farklıysa düzenleyebilirsiniz.`
                    : "Önce kategori seçin — komisyon oranı otomatik dolar. Biliyorsanız direk girebilirsiniz."}
                </small>
              </div>
            </div>

            {/* Ek maliyetler accordion */}
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="extra" className="border-b-0">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  Ek Maliyetleri Özelleştir{" "}
                  <span className="ml-1 text-xs text-muted-foreground font-normal">
                    Kargo {shipping} TL · Paket {packaging} TL · İade %{returnRate}
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        Kargo (TL)
                      </label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={shipping}
                        onChange={(e) => setShipping(e.target.value)}
                        onBlur={() => {
                          if (shipping !== "70") {
                            trackEvent("hb_kargo_degistirildi", {
                              tutar: parseFloat(shipping),
                            });
                          }
                        }}
                      />
                      <small className="mt-1 block text-xs text-muted-foreground">
                        Emin değilseniz 70 TL bırakın. Hepsiburada kargo 50–90 TL
                        arasında değişir (küçük ~55, orta ~70, büyük ~85 TL).
                      </small>
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        Paketleme (TL)
                      </label>
                      <Input
                        type="number"
                        inputMode="decimal"
                        min="0"
                        value={packaging}
                        onChange={(e) => setPackaging(e.target.value)}
                      />
                    </div>
                    <div>
                      <label className="mb-1.5 block text-sm font-medium">
                        İade Oranı — kâr marjınızı etkiler (varsayılan: %0)
                      </label>
                      <Select
                        value={returnRate}
                        onValueChange={(v) => {
                          setReturnRate(v);
                          if (v !== "0")
                            trackEvent("hb_iade_orani_girildi", { oran: v });
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="0">%0 (İade yok)</SelectItem>
                          <SelectItem value="5">%5</SelectItem>
                          <SelectItem value="10">%10</SelectItem>
                          <SelectItem value="15">%15</SelectItem>
                          <SelectItem value="20">%20</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* Sonuç kartı */}
            {isReady && (
              <div ref={resultRef} className="mt-6 rounded-xl border-2 border-primary/30 bg-primary-soft p-6">
                <div className="mb-4 text-center">
                  <p className="text-sm font-medium text-muted-foreground">
                    Minimum Satış Fiyatı
                  </p>
                  <p className="mt-1 text-5xl font-bold text-foreground">
                    {sellingPrice.toFixed(0)} TL
                  </p>
                  <p className="mt-1 text-sm font-medium text-primary">
                    "Önce kâr, sonra fiyat"
                  </p>
                </div>

                <Separator className="my-4" />

                <p className="mb-3 rounded-lg bg-muted/50 px-3 py-1.5 text-xs text-muted-foreground">
                  Platform hizmet bedeli 5 Temmuz 2025'ten itibaren kaldırıldı — hesaba dahil edilmedi.
                </p>

                <div className="space-y-2">
                  {/* Hedef Kâr */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-emerald-500">✓</span>
                      <span>Hedef Kâr</span>
                    </span>
                    <div className="text-right">
                      <span className="font-semibold text-emerald-600">
                        {tp.toFixed(2)} TL
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({((tp / sellingPrice) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Ürün Maliyeti */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-muted-foreground">−</span>
                      <span className="text-muted-foreground">Ürün Maliyeti</span>
                    </span>
                    <div className="text-right">
                      <span className="font-medium text-muted-foreground">
                        {pc.toFixed(2)} TL
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        ({((pc / sellingPrice) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>

                  {/* Hepsiburada Komisyonu */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-red-500">×</span>
                      <span className="text-red-600">Hepsiburada Komisyonu</span>
                    </span>
                    <div className="text-right">
                      <span className="font-semibold text-red-600">
                        {commissionAmount.toFixed(2)} TL
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        (%{(cr * 100).toFixed(2)})
                      </span>
                    </div>
                  </div>

                  {/* %1 E-Ticaret Stopajı */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-amber-500">×</span>
                      <span className="text-amber-700">%1 E-Ticaret Stopajı</span>
                      <span className="text-xs text-muted-foreground">(çoğu araçta gösterilmez)</span>
                    </span>
                    <div className="text-right">
                      <span className="font-semibold text-amber-700">
                        {stopajAmount.toFixed(2)} TL
                      </span>
                      <span className="ml-2 text-xs text-muted-foreground">(%1)</span>
                    </div>
                  </div>
                  <p className="ml-6 text-xs text-muted-foreground">
                    Gelir vergisi avansıdır, HB'nin kesintisi değil.
                  </p>

                  {/* Kargo */}
                  {sh > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-red-500">×</span>
                        <span className="text-red-600">Kargo</span>
                      </span>
                      <div className="text-right">
                        <span className="font-semibold text-red-600">
                          {sh.toFixed(2)} TL
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Paketleme */}
                  {pkg > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-red-500">×</span>
                        <span className="text-red-600">Paketleme</span>
                      </span>
                      <div className="text-right">
                        <span className="font-semibold text-red-600">
                          {pkg.toFixed(2)} TL
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Toplam Kesintiler */}
                  <div className="mt-3 rounded-lg border border-red-100 bg-red-50 px-3 py-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-red-600">Toplam Kesintiler</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-600">
                          {totalDeductions.toFixed(2)} TL
                        </span>
                        <span className="rounded px-1.5 py-0.5 text-sm font-semibold bg-red-100 text-red-700">
                          %{((totalDeductions / sellingPrice) * 100).toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zarar uyarısı */}
                {parseFloat(returnRate) > 0 && effectiveProfit < 0 && (
                  <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3">
                    <p className="text-sm font-semibold text-red-700">
                      Bu iade oranıyla zarar ediyorsunuz.
                    </p>
                    <p className="mt-0.5 text-xs text-red-600">
                      İade dahil efektif kâr: {effectiveProfit.toFixed(2)} TL
                    </p>
                  </div>
                )}

                {/* Düşük kâr marjı */}
                {!(parseFloat(returnRate) > 0 && effectiveProfit < 0) && profitMargin < 12 && profitMargin > 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">
                        Kâr marjınız %{profitMargin.toFixed(1)}
                      </span>{" "}
                      — beklenmedik gider bu kârı sıfırlayabilir.
                    </p>
                  </div>
                )}

                {/* İade bilgisi — zarar yok ama iade seçili */}
                {parseFloat(returnRate) > 0 && effectiveProfit >= 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">İade dahil efektif kâr:</span>{" "}
                      {effectiveProfit.toFixed(2)} TL (%{returnRate} iade senaryosunda)
                    </p>
                  </div>
                )}

                {/* Bağlamsal CTA */}
                <div className="mt-6 rounded-xl border border-primary/20 bg-background p-4">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Her ürün için bu hesabı elle mi yapıyorsunuz?{" "}
                    <span className="font-semibold text-foreground">
                      BütçeCRM tüm Hepsiburada mağazanızı otomatik takip eder.
                    </span>
                  </p>
                  <Link
                    to="/butceleme"
                    onClick={() => trackEvent("hb_cta_tiklandi", { fiyat: Math.round(sellingPrice) })}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Bu kârı tüm ürünlerin için otomatik takip et →
                  </Link>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Nasıl Çalışır */}
      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
          <h2 className="text-center text-3xl font-bold md:text-4xl">
            Hepsiburada Kâr Hesaplama Nasıl Çalışır?
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                n: "1",
                t: "Hepsiburada'da Kaça Satmak İstediğini Gir",
                d: "Ürün başına kazanmak istediğin net kârı ve tedarik maliyetini yaz. Sıfır kâr girersen zarar etmeden satış fiyatını (break-even) bulursun.",
              },
              {
                n: "2",
                t: "Giyim, Elektronik veya Kategorini Seç",
                d: "Hepsiburada kategorini seç — komisyon oranı otomatik gelir. Giyim %21, Elektronik %4,5–%12, Ayakkabı %22,5. İstersen manuel olarak da düzenleyebilirsin.",
              },
              {
                n: "3",
                t: "Zarar Etmeden Minimum Satış Fiyatını Öğren",
                d: "Komisyon, %1 e-ticaret stopajı ve kargo dahil tüm kesintilerin dökümünü ve minimum satış fiyatını anında gör. Ücretsiz ve sınırsız.",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-border bg-background p-7"
              >
                <div className="text-2xl font-bold text-primary">{s.n}</div>
                <h3 className="mt-3 text-lg font-bold">{s.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Komisyon Oranları Tablosu */}
      <section className="mx-auto max-w-5xl px-4 pb-16 lg:px-8">
        <h2 className="mb-2 text-3xl font-bold md:text-4xl">
          Hepsiburada Komisyon Oranları 2026 — Kategori Tablosu
        </h2>
        <p className="mb-8 text-muted-foreground">
          Aşağıdaki oranlar Hepsiburada Satıcı Sözleşmesi EK.4 listesine
          dayanmaktadır (Temmuz 2025 güncel). Platform hizmet bedeli 5 Temmuz
          2025'ten itibaren kaldırılmıştır; tabloya dahil edilmemiştir.
        </p>
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-semibold">Kategori</th>
                <th className="px-4 py-3 text-right font-semibold">
                  Komisyon Oranı
                </th>
                <th className="px-4 py-3 text-right font-semibold">
                  Stopaj Dahil Toplam Kesinti
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { label: "Elektronik — Büyük (telefon, laptop, TV)", rate: "4,50%" },
                { label: "Kitap, Film, Müzik & Kırtasiye", rate: "7,00%" },
                { label: "Elektronik — Küçük / Akıllı & Aksesuar", rate: "12,00%" },
                { label: "Bebek & Oyuncak", rate: "14,00%" },
                { label: "Spor & Outdoor", rate: "15,00%" },
                { label: "Kişisel Bakım & Kozmetik", rate: "18,00%" },
                { label: "Ev & Yaşam", rate: "20,00%" },
                { label: "Çanta & Aksesuar", rate: "20,00%" },
                { label: "Giyim & Moda", rate: "21,00%" },
                { label: "Mobilya & Dekorasyon", rate: "22,00%" },
                { label: "Ayakkabı", rate: "22,50%" },
                { label: "Diğer", rate: "18,00%" },
              ].map((row, i) => {
                const commissionNum =
                  parseFloat(row.rate.replace(",", ".")) / 100;
                const totalDeductionPct = ((commissionNum + 0.01) * 100)
                  .toFixed(2)
                  .replace(".", ",");
                return (
                  <tr
                    key={row.label}
                    className={i % 2 === 0 ? "bg-background" : "bg-muted/30"}
                  >
                    <td className="px-4 py-3">{row.label}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {row.rate}
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-red-600">
                      %{totalDeductionPct}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          * Stopaj oranı (%1) tüm kategoriler için sabittir. "Toplam Kesinti"
          sütunu yalnızca komisyon + stopaj toplamını gösterir; kargo ve
          paketleme dahil değildir.
        </p>
      </section>

      {/* FAQ — GEO/AEO için prose paragrafları ile */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold md:text-4xl">
            Hepsiburada Komisyon ve Kâr Hakkında Sorular
          </h2>
          <div className="space-y-8">
            {faqs.map((faq) => (
              <div
                key={faq.q}
                className="rounded-2xl border border-border bg-card p-6"
              >
                <h3 className="text-lg font-bold">{faq.q}</h3>
                <p className="mt-3 leading-relaxed text-muted-foreground">
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
        <div className="rounded-3xl bg-primary p-10 text-center text-primary-foreground md:p-12">
          <h2 className="text-3xl font-bold md:text-4xl">
            Kârınızı Otomatik Takip Edin
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            BütçeCRM ile Hepsiburada mağazanızın tüm finansal tablosunu tek ekranda
            görün.
          </p>
          <Link
            to="/butceleme"
            onClick={() => trackEvent("hb_cta_tiklandi", { fiyat: isReady ? Math.round(sellingPrice) : null })}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-primary shadow-lg transition-colors hover:bg-white/90"
          >
            BütçeCRM'i 15 Gün Ücretsiz Dene →
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
