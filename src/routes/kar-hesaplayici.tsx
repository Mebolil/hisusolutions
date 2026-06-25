import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { FaqBlock, type FaqItem } from "@/components/site/FaqBlock";
import { trackEvent } from "@/lib/analytics";
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
  "Trendyol Kâr ve Komisyon Hesaplayıcı 2026 — Ücretsiz";
const PAGE_DESCRIPTION =
  "Trendyol'da kaça satarsan ne kadar kazanırsın? Hedef kârını gir, komisyon, kargo ve platform ücretleri dahil minimum satış fiyatını öğren. Önce kâr, sonra fiyat.";
const PAGE_URL = "https://hisusolutions.com/kar-hesaplayici";

const faqs: FaqItem[] = [
  {
    q: "Trendyol komisyon oranları 2026'da ne kadar?",
    a: "Trendyol komisyon oranları kategoriye göre değişmektedir. Giyim & Moda %21.36, Ayakkabı %23.39, Elektronik büyük (telefon/laptop/TV) %7.50, Ev & Yaşam %19.00 gibi oranlar uygulanmaktadır. Bu araçta 10 ana kategori için güncel oranlar tanımlıdır.",
  },
  {
    q: "Trendyol platform hizmet bedeli nedir?",
    a: "Trendyol, her sipariş için komisyona ek olarak platform hizmet bedeli alır. Varsayılan değer 10.19 TL olup bu araçta düzenlenebilirdir.",
  },
  {
    q: "Trendyol'da iade maliyeti nasıl hesaplanır?",
    a: "İade maliyeti = çift yönlü kargo + yeniden paketleme. Bu araçtaki iade oranı seçeneğiyle beklenen iade etkisini efektif kâra yansıtabilirsiniz.",
  },
  {
    q: "Trendyol'da minimum satış fiyatı nasıl belirlenir?",
    a: "Minimum satış fiyatı = (hedef kâr + ürün maliyeti + platform hizmet bedeli + kargo + paketleme) ÷ (1 − komisyon oranı). Bu formüle göre hesaplama yapan Türkiye'deki nadir ücretsiz araçlardan biridir.",
  },
  {
    q: "BütçeCRM ile Trendyol kârı nasıl takip edilir?",
    a: "BütçeCRM, Trendyol mağazanızdaki tüm satışları, reklam harcamalarını ve giderleri otomatik takip ederek gerçek zamanlı kâr/zarar gösterir. Manuel hesaplama yapmadan anlık finansal tablonuza ulaşırsınız.",
  },
];

const CATEGORIES = [
  { label: "Giyim & Moda", rate: 0.2136 },
  { label: "Ayakkabı", rate: 0.2339 },
  { label: "Çanta & Aksesuar", rate: 0.2136 },
  { label: "Elektronik (büyük: telefon/laptop/TV)", rate: 0.075 },
  { label: "Elektronik (küçük/akıllı)", rate: 0.155 },
  { label: "Ev & Yaşam", rate: 0.19 },
  { label: "Bebek & Oyuncak", rate: 0.165 },
  { label: "Gıda & Pet", rate: 0.1525 },
  { label: "Kişisel Bakım & Kozmetik", rate: 0.17 },
  { label: "Diğer", rate: 0.18 },
] as const;

export const Route = createFileRoute("/kar-hesaplayici")({
  head: () => ({
    meta: [
      { title: PAGE_TITLE },
      { name: "description", content: PAGE_DESCRIPTION },
      { name: "robots", content: "index, follow" },
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
          name: "Trendyol Kâr Hesaplayıcı",
          url: PAGE_URL,
          description:
            "Trendyol satıcıları için ücretsiz kâr ve minimum satış fiyatı hesaplama aracı.",
          applicationCategory: "FinanceApplication",
          operatingSystem: "Web",
          inLanguage: "tr-TR",
          isAccessibleForFree: true,
          provider: {
            "@type": "Organization",
            name: "Hisu Solutions",
            url: "https://hisusolutions.com",
          },
        }),
      },
    ],
  }),
  component: KarHesaplayiciPage,
});

function KarHesaplayiciPage() {
  const [targetProfit, setTargetProfit] = useState<string>("");
  const [productCost, setProductCost] = useState<string>("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [commissionRate, setCommissionRate] = useState<string>("");
  const [platformFee, setPlatformFee] = useState<string>("10.19");

  const [shipping, setShipping] = useState<string>("65");
  const [packaging, setPackaging] = useState<string>("0");
  const [returnRate, setReturnRate] = useState<string>("0");

  const [hasTracked, setHasTracked] = useState(false);
  const resultRef = useRef<HTMLDivElement>(null);

  const isReady =
    targetProfit !== "" &&
    productCost !== "" &&
    commissionRate !== "" &&
    parseFloat(commissionRate) > 0 &&
    parseFloat(commissionRate) < 100;

  const tp = parseFloat(targetProfit) || 0;
  const pc = parseFloat(productCost) || 0;
  const pf = parseFloat(platformFee) || 0;
  const sh = parseFloat(shipping) || 0;
  const pkg = parseFloat(packaging) || 0;
  const cr = (parseFloat(commissionRate) || 0) / 100;
  const rr = (parseFloat(returnRate) || 0) / 100;

  const sellingPrice = (tp + pc + pf + sh + pkg) / (1 - cr);
  const commissionAmount = sellingPrice * cr;

  const returnCost = sh * 2 + pkg;
  const effectiveProfit = tp * (1 - rr) - returnCost * rr;

  const totalDeductions = commissionAmount + pf + sh + pkg;

  useEffect(() => {
    if (isReady && !hasTracked) {
      const price = sellingPrice;
      const range = price < 200 ? "0-200" : price < 500 ? "200-500" : "500+";
      trackEvent("kar_hesaplayici_hesapla");
      trackEvent("hesap_sonucu_aralik", { aralik: range });
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
            Hedef Kârından{" "}
            <span className="text-primary">Minimum Satış Fiyatını</span>{" "}
            Hesapla
          </h1>
          <p className="mt-4 text-lg italic text-muted-foreground">
            "Önce kâr, sonra fiyat"
          </p>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Hedef kârını gir, komisyon, kargo ve platform ücretleri dahil minimum
            satış fiyatını saniyeler içinde öğren.
          </p>
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
                  placeholder="Örn: 100"
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
                    trackEvent("kategori_secildi", { kategori: val });
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
                  placeholder="Ör: 21.36"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(e.target.value)}
                />
                <small className="mt-1 block text-xs text-muted-foreground">
                  {selectedCategory
                    ? `${selectedCategory} için %${commissionRate} uygulandı. Farklıysa düzenleyebilirsiniz.`
                    : "Önce kategori seçin — komisyon oranı otomatik dolar. Biliyorsanız direk girebilirsiniz."}
                </small>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium">
                  Platform Hizmet Bedeli (TL)
                </label>
                <Input
                  type="number"
                  inputMode="decimal"
                  min="0"
                  value={platformFee}
                  onChange={(e) => setPlatformFee(e.target.value)}
                />
              </div>
            </div>

            {/* Ek maliyetler accordion */}
            <Accordion type="single" collapsible className="mt-4">
              <AccordionItem value="extra" className="border-b-0">
                <AccordionTrigger className="text-sm font-medium hover:no-underline">
                  Ek Maliyetler{" "}
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
                      />
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
                        Beklenen İade Oranı
                      </label>
                      <Select
                        value={returnRate}
                        onValueChange={(v) => {
                          setReturnRate(v);
                          if (v !== "0")
                            trackEvent("iade_orani_girildi", { oran: v });
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

                  {/* Trendyol Komisyonu */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-red-500">×</span>
                      <span className="text-red-600">Trendyol Komisyonu</span>
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

                  {/* Platform Hizmet Bedeli */}
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-2 text-sm">
                      <span className="text-red-500">×</span>
                      <span className="text-red-600">Platform Hizmet Bedeli</span>
                    </span>
                    <div className="text-right">
                      <span className="font-semibold text-red-600">
                        {pf.toFixed(2)} TL
                      </span>
                    </div>
                  </div>

                  {/* Kargo */}
                  {sh > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">−</span>
                        <span className="text-muted-foreground">Kargo</span>
                      </span>
                      <div className="text-right">
                        <span className="font-medium text-muted-foreground">
                          {sh.toFixed(2)} TL
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Paketleme */}
                  {pkg > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">−</span>
                        <span className="text-muted-foreground">Paketleme</span>
                      </span>
                      <div className="text-right">
                        <span className="font-medium text-muted-foreground">
                          {pkg.toFixed(2)} TL
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Toplam Kesintiler */}
                  <div className="mt-3 border-t border-border pt-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-red-600">
                        Toplam Kesintiler
                      </span>
                      <span className="font-bold text-red-600">
                        {totalDeductions.toFixed(2)} TL (
                        {((totalDeductions / sellingPrice) * 100).toFixed(1)}%)
                      </span>
                    </div>
                  </div>
                </div>

                {/* İade uyarısı */}
                {parseFloat(returnRate) > 0 && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
                    <p className="text-sm text-amber-800">
                      <span className="font-semibold">
                        İade dahil efektif kâr:
                      </span>{" "}
                      {effectiveProfit.toFixed(2)} TL (%{returnRate} iade
                      senaryosunda)
                    </p>
                  </div>
                )}

                {/* Bağlamsal CTA */}
                <div className="mt-6 rounded-xl border border-primary/20 bg-background p-4">
                  <p className="mb-3 text-sm text-muted-foreground">
                    Her ürün için bu hesabı elle mi yapıyorsunuz?
                    <span className="font-semibold text-foreground">
                      {" "}
                      BütçeCRM tüm Trendyol mağazanızı otomatik takip eder.
                    </span>
                  </p>
                  <Link
                    to="/butceleme"
                    onClick={() => trackEvent("hesaplayici_cta_tiklandi", { fiyat: Math.round(sellingPrice) })}
                    className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    15 Gün Ücretsiz Dene →
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
            Nasıl Çalışır?
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              {
                n: "1",
                t: "Kâr Hedefini Gir",
                d: "Ürün başına kazanmak istediğin net kârı ve ürün maliyetini yaz.",
              },
              {
                n: "2",
                t: "Kategori Seç",
                d: "Trendyol kategorini seç — komisyon oranı otomatik gelir, istersen düzenlersin.",
              },
              {
                n: "3",
                t: "Fiyatı Öğren",
                d: "Anında minimum satış fiyatını ve tüm kesintilerin dökümünü gör.",
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

      {/* FAQ */}
      <FaqBlock items={faqs} title="Trendyol Komisyon ve Kâr Hakkında Sorular" />

      {/* CTA Banner */}
      <section className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
        <div className="rounded-3xl bg-primary p-10 text-center text-primary-foreground md:p-12">
          <h2 className="text-3xl font-bold md:text-4xl">
            Kârınızı Otomatik Takip Edin
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-primary-foreground/80">
            BütçeCRM ile Trendyol mağazanızın tüm finansal tablosunu tek ekranda
            görün.
          </p>
          <Link
            to="/butceleme"
            onClick={() => trackEvent("hesaplayici_cta_tiklandi", { fiyat: isReady ? Math.round(sellingPrice) : null })}
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-bold text-primary shadow-lg transition-colors hover:bg-white/90"
          >
            BütçeCRM'i 15 Gün Ücretsiz Dene →
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
