import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { trackEvent } from "@/lib/analytics";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BookingForm } from "@/components/site/BookingForm";
import { FaqBlock, type FaqItem } from "@/components/site/FaqBlock";
import { RoiCalculator } from "@/components/site/RoiCalculator";
import { PersonaSection } from "@/components/site/PersonaSection";
import { ArrowRight, Check, X, BarChart3, Package, Megaphone, Receipt, FileText, BellRing, Users, Clock, TrendingUp, ShoppingCart, Quote, Gift, Zap } from "lucide-react";

export const Route = createFileRoute("/butceleme")({
  head: () => ({
    meta: [
      { title: "BütçeCRM — KOBİ Bütçe Yönetim Yazılımı | Hisu Solutions" },
      { name: "description", content: "Satış, stok, gider ve reklam ROI'sini tek ekranda yönetin. E-ticaret işletmeleri ve KOBİ'ler için Türkiye'nin en pratik bütçe yönetim yazılımı. Kurucu Beta ₺499/ay." },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hisusolutions.com/butceleme" },
      { property: "og:site_name", content: "Hisu Solutions" },
      { property: "og:title", content: "BütçeCRM — KOBİ Bütçe Yönetim Yazılımı | Hisu Solutions" },
      { property: "og:description", content: "Satış, stok, gider ve reklam ROI'sini tek ekranda yönetin. E-ticaret ve KOBİ'ler için anahtar teslim bütçe yönetimi." },
      { property: "og:image", content: "https://hisusolutions.com/og-image.png" },
    ],
    links: [
      { rel: "canonical", href: "https://hisusolutions.com/butceleme" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "BütçeCRM nedir?", "acceptedAnswer": { "@type": "Answer", "text": "BütçeCRM, e-ticaret işletmeleri ve KOBİ'ler için geliştirilmiş bir finansal yönetim yazılımıdır. Satış, gider, stok ve reklam ROI'sini tek ekranda görmenizi sağlar." } },
            { "@type": "Question", "name": "BütçeCRM ne kadar?", "acceptedAnswer": { "@type": "Answer", "text": "Kurucu Beta fiyatı ₺499/ay + KDV — 31 Temmuz 2026'ya kadar, sadece 10 slot, ömür boyu kilitli. Sabit liste fiyatı ₺629/ay + KDV. 15 gün ücretsiz deneyebilirsiniz, kart gerekmez." } },
            { "@type": "Question", "name": "BütçeCRM Excel'den farkı nedir?", "acceptedAnswer": { "@type": "Answer", "text": "Excel manuel giriş gerektirir, hata yapar ve anlık veri vermez. BütçeCRM otomatik hesaplar, gerçek zamanlı kâr/zarar gösterir ve reklam kampanyalarınızın gerçek ROI'sini saptar." } },
            { "@type": "Question", "name": "Kimler BütçeCRM kullanabilir?", "acceptedAnswer": { "@type": "Answer", "text": "E-ticaret işletmeleri, perakende, hizmet sektörü ve bütçe takibi yapmak isteyen her KOBİ kullanabilir. Özellikle aylık cirosu 50.000 TL üzeri işletmeler için kritik değer üretir." } },
          ]
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "BütçeCRM",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://hisusolutions.com/butceleme",
          "description": "E-ticaret ve KOBİ'ler için gelir, gider, stok ve reklam ROI yönetimi. Tek ekranda finansal kontrol.",
          "inLanguage": "tr-TR",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": 12,
            "bestRating": "5",
            "worstRating": "1"
          },
          "offers": {
            "@type": "Offer",
            "price": "499",
            "priceCurrency": "TRY",
            "availability": "https://schema.org/LimitedAvailability",
            "eligibleQuantity": { "@type": "QuantitativeValue", "value": 10 }
          },
          "provider": {
            "@type": "Organization",
            "name": "Hisu Solutions",
            "url": "https://hisusolutions.com"
          }
        }),
      },
    ],
  }),
  component: ButcelemePage,
});

const faqs: FaqItem[] = [
  { q: "BütçeCRM nedir?", a: "BütçeCRM, e-ticaret işletmeleri ve KOBİ'ler için geliştirilmiş bir finansal yönetim yazılımıdır. Gelir, gider, stok ve reklamlarınızın ne kadar kazandırdığını tek ekranda görmenizi sağlar." },
  { q: "BütçeCRM ne kadar?", a: "Kurucu Beta fiyatı ₺499/ay + KDV — 31 Temmuz 2026'ya kadar geçerli, sadece 10 slot var ve bu fiyat ömür boyu kilitli kalır. Beta sonrası sabit fiyat ₺629/ay + KDV'dir. 15 gün ücretsiz trial ile kart gerekmeden başlayabilirsiniz." },
  { q: "Excel'den geçmek zor olacak mı?", a: "Hayır. Ekibiniz 15 dakikada alışır. Verilerinizi Excel'den import edebilirsiniz. İlk kurulumda biz size rehberlik ediyoruz." },
  { q: "Verilerim güvende mi?", a: "Evet. Supabase altyapısı üzerinde çalışır, SSL şifreleme ile korunur. Verileriniz Türkiye'deki sunucularda tutulur." },
  { q: "İptal edersem verilerimi kaybeder miyim?", a: "Hayır. İptal öncesinde verilerinizi Excel/PDF olarak export edebilirsiniz. Verileriniz size ait, her zaman erişebilirsiniz." },
  { q: "Referans programı nasıl çalışıyor?", a: "BütçeCRM'i bir arkadaşına önerirsin — o kayıt olunca hem sen hem o 1'er ay ücretsiz kullanım kazanırsınız. Sınır yok, her başarılı referans için ayrı 1 ay kazanırsın. Kampanya 30 Eylül 2026'ya kadar geçerlidir." },
  { q: "Teknik bilgi gerekiyor mu?", a: "Sıfır teknik bilgi. Açıp kullanıyorsunuz. İçinde rehber videolar ve adım adım kurulum sihirbazı var. Takıldığınızda destek hattımız açık." },
  { q: "Kimler BütçeCRM kullanabilir?", a: "E-ticaret işletmeleri, perakende, hizmet sektörü ve bütçe takibi yapmak isteyen her KOBİ kullanabilir. Özellikle aylık cirosu 50.000 TL üzeri işletmeler için kritik değer üretir." },
];

function ButcelemePage() {
  const [demoSource, setDemoSource] = useState("butcecrm-demo");

  function scrollToDemo(source: string) {
    setDemoSource(source);
    trackEvent("demo_cta_click", { source });
    setTimeout(() => {
      document.getElementById("demo")?.scrollIntoView({ behavior: "smooth" });
    }, 0);
  }

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft),_transparent_60%)]" />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center lg:px-8 lg:py-28">
          <span className="inline-flex rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-accent-foreground">E-Ticaret KOBİ'leri İçin · Trendyol · Hepsiburada · Kendi Siteniz</span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">Trendyol'dan Satıyorsun.<br />Meta'ya Reklam Veriyorsun.<br /><span className="text-primary">Hangisi Gerçekten Para Kazandırıyor?</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Gelir, gider, stok ve reklam ROAS'ınızı tek ekranda görün. Paraşüt, Uyumsoft ve Logo İşbaşı'nda reklam takibi yok — BütçeCRM'de var.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }} className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90">15 Gün Ücretsiz Dene <ArrowRight className="h-4 w-4" /></Link>
            <a href="#demo" onClick={() => trackEvent("demo_cta_click", { source: "hero" })} className="rounded-full border border-border px-7 py-3.5 text-sm font-semibold hover:bg-accent">Demo Ayarla</a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Kredi kartı gerekmez · Kurulum 5 dakika · İstediğin zaman iptal</p>
        </div>
      </section>

      {/* Güven Sayaçları */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-5 lg:px-8">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm">
            {[
              { Icon: Zap, text: "İlk kullanıcılar ürünü şekillendiriyor · Beta fırsatı açık" },
              { Icon: Megaphone, text: "Reklam ROAS takibi · Paraşüt, Uyumsoft'ta yok" },
              { Icon: Package, text: "Stok + Gelir + Gider · Tek ekran" },
              { Icon: Check, text: "15 gün ücretsiz · Kart gerekmez · İstediğin zaman iptal" },
            ].map(({ Icon, text }) => (
              <div key={text} className="flex items-center gap-2 text-muted-foreground">
                <Icon className="h-4 w-4 text-primary" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pain points vs solution */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h3 className="text-xl font-bold">Tanıdık geliyor mu?</h3>
            <ul className="mt-5 space-y-3">
              {[
                "Trendyol komisyonunu, reklam harcamasını ve net kazancınızı aynı anda göremiyorsunuz?",
                "Meta'ya 10.000₺ verdiniz, ama hangi ürünün satışını getirdiğini bilmiyorsunuz?",
                "Stok bitti ama siz farketmediniz, sipariş iptal oldu?",
                "Excel'de formül bozuldu, bir ayın verisi gitti?",
              ].map(t => (
                <li key={t} className="flex gap-3 text-muted-foreground"><X className="mt-0.5 h-5 w-5 shrink-0 text-destructive" /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary-soft p-8">
            <h3 className="text-xl font-bold">BütçeCRM ile:</h3>
            <ul className="mt-5 space-y-3">
              {[
                "Gerçek zamanlı gelir, gider, net kâr — her an güncel",
                "Reklamlarınızın ne kadar kazandırdığını kampanya bazında görün",
                "Stok kritik seviyeye düşünce otomatik uyarı",
                "Her şey tek ekranda, Excel'e gerek yok",
              ].map(t => (
                <li key={t} className="flex gap-3 text-foreground"><Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" /> {t}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Demo Önizleme */}
      <section className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Önizleme</span>
          <h2 className="mt-3 text-4xl font-bold">BütçeCRM Nasıl Görünür?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Tek ekranda tüm finansal tablonuz — gerçek zamanlı, her zaman güncel.</p>
        </div>
        <div className="mt-12 relative">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 shadow-2xl shadow-primary/10 ring-1 ring-primary/10">
            <video
              src="/videos/butcecrm-16x9.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full rounded-2xl"
              aria-label="BütçeCRM ürün videosu — reklam ROAS takibi, stok ve finansal yönetim"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 rounded-b-2xl bg-gradient-to-t from-background/80 to-transparent" />
          </div>
          <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-emerald-400/10 blur-xl" />
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#demo" onClick={() => trackEvent("demo_cta_click", { source: "product-preview" })} className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90">Canlı Demo Ayarla <ArrowRight className="h-4 w-4" /></a>
        </div>
      </section>

      {/* Features */}
      <section id="nasil-calisir" className="border-y border-border/60 bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
          <h2 className="text-center text-4xl font-bold">Tek panelde tüm operasyon</h2>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { i: Megaphone, t: "Hangi Reklam Para Kazandırıyor?", d: "Meta, Google, TikTok kampanyalarınızın hangisinin satış getirdiğini kampanya bazında görün. Türkiye'deki muhasebe yazılımlarında bu özellik yok." },
              { i: BarChart3, t: "Hiç tahsilat kaçırmazsınız", d: "Kimin ne kadar borcu var, anlık görün. Müşteri bazlı tahsilat, kısmi ödeme, gecikme uyarısı." },
              { i: Package, t: "Stok bitti, sipariş iptal — artık olmaz", d: "Kritik stok seviyelerinde otomatik uyarı. FIFO maliyet, otomatik düşüm." },
              { i: Receipt, t: "Gider Takibi", d: "Nereye ne harcadığınızı kategoriye göre görün, aylık trendi takip edin." },
              { i: FileText, t: "Ay sonu raporu sizi bekliyor, siz değil", d: "Ay sonu raporu 5 dakikada hazır. Excel ve PDF export dahil." },
              { i: BellRing, t: "Hatırlatıcılar", d: "Gecikmiş tahsilat, tedarikçi borcu, kritik stok — otomatik uyarı." },
            ].map(f => (
              <div key={f.t} className="rounded-2xl border border-border bg-background p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><f.i className="h-5 w-5" /></span>
                <h3 className="mt-4 text-lg font-bold">{f.t}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Excel vs BütçeCRM Karşılaştırma */}
      <section className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
        <h2 className="text-center text-4xl font-bold">Excel mi, BütçeCRM mi?</h2>
        <div className="mt-10 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left font-semibold">Özellik</th>
                <th className="px-6 py-4 text-center font-semibold text-muted-foreground">Excel</th>
                <th className="px-6 py-4 text-center font-semibold text-primary">BütçeCRM</th>
              </tr>
            </thead>
            <tbody>
              {[
                { feature: "Gerçek zamanlı kâr/zarar", excel: false, butce: true },
                { feature: "Reklam ROI (kampanya bazlı)", excel: false, butce: true },
                { feature: "Kritik stok uyarısı", excel: false, butce: true },
                { feature: "Ay sonu raporu süresi", excelText: "4 saat", butceText: "5 dakika" },
                { feature: "Mobil erişim", excel: false, butce: true },
              ].map((row, i) => (
                <tr key={i} className="border-b border-border last:border-0">
                  <td className="px-6 py-4 font-medium">{row.feature}</td>
                  <td className="px-6 py-4 text-center">
                    {row.excelText ? (
                      <span className="text-destructive/70">{row.excelText}</span>
                    ) : (
                      <X className="mx-auto h-5 w-5 text-destructive/70" />
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {row.butceText ? (
                      <span className="font-semibold text-primary">{row.butceText}</span>
                    ) : (
                      <Check className="mx-auto h-5 w-5 text-primary" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* ROI Hesaplayıcı */}
      <RoiCalculator />

      {/* Persona */}
      <PersonaSection
        forItems={[
          { icon: ShoppingCart, title: "Trendyol veya Hepsiburada'da aktif mağazası olan", desc: "Komisyon, kargo ve reklam maliyetiyle net kârı görmek ister" },
          { icon: Megaphone, title: "Aylık ₺5.000+ reklam harcayan e-ticaret işletmesi", desc: "Meta, Google veya TikTok'ta kampanya yürütüyor, ROAS'ı bilmek ister" },
          { icon: Users, title: "1-10 kişilik ekiple çalışan, büyümek isteyen KOBİ", desc: "Muhasebeciye gerek duymadan anlık finansal tablo görmeyi hedefler" },
        ]}
        notForItems={[
          "Henüz satış yapmıyor, fikir aşamasında",
          "Ayda 5'ten az sipariş giriyor",
          "Muhasebe yazılımı arıyor (BütçeCRM muhasebe değil, operasyon takibi)",
          "Mobil uygulama tercih ediyor (şu an web tabanlı, mobil yol haritasında)",
          "Yasal e-fatura yazılımı arıyor (BütçeCRM bu değil)",
        ]}
      />

      {/* Pricing */}
      <section id="fiyatlandirma" className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
        <h2 className="text-center text-4xl font-bold">Sade ve şeffaf fiyatlandırma</h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">Kurucu Beta fırsatını kaçırma — fiyat artık artmaz, bu rakam ömür boyu kilitlenir.</p>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Kurucu Beta */}
          <div className="relative rounded-2xl border-2 border-amber-400 bg-amber-50 p-8">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-amber-700">Kurucu Beta</span>
              <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-white">Sadece 10 Slot</span>
            </div>
            <p className="mt-4 text-4xl font-bold text-foreground">₺499 <span className="text-base font-medium text-muted-foreground">/ ay + KDV</span></p>
            <p className="mt-1 text-sm text-amber-700 font-medium">31 Temmuz 2026'ya kadar · Ömür boyu kilitli</p>
            <p className="mt-1 text-xs text-amber-600">Beta sonrası sabit fiyat: ₺629/ay</p>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="mt-6 block w-full rounded-full bg-amber-500 py-3 text-center text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              15 Gün Ücretsiz Başla
            </Link>
            <Link
              to="/odeme"
              search={{ plan: "kurucu-beta" }}
              className="mt-2 block w-full rounded-full border border-amber-400 py-2.5 text-center text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
            >
              Hemen Satın Al
            </Link>
            <ul className="mt-6 space-y-2.5">
              {[
                "Gerçek zamanlı kâr/zarar takibi",
                "Reklam ROAS takibi (Meta, Google, TikTok)",
                "Kritik stok uyarısı",
                "Ay sonu raporu (5 dakika)",
                "Tahsilat & gider yönetimi",
                "Excel/PDF export",
                "İade modülü",
                "Kurucu fiyatı ömür boyu korunur",
              ].map(f => (
                <li key={f} className="flex gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Sabit Aylık */}
          <div className="relative rounded-2xl border border-border bg-card p-8">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-muted-foreground">Aylık Plan</span>
              <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">Beta Sonrası</span>
            </div>
            <p className="mt-4 text-4xl font-bold text-foreground">₺629 <span className="text-base font-medium text-muted-foreground">/ ay + KDV</span></p>
            <p className="mt-1 text-sm text-muted-foreground">Kalıcı liste fiyatı · Kurucu beta kapandıktan sonra</p>
            <p className="mt-1 text-xs text-muted-foreground/70">Kurucu Beta alırsan bu fiyatı hiç görmezsin</p>
            <div className="mt-6 block w-full rounded-full bg-muted py-3 text-center text-sm font-semibold text-muted-foreground cursor-not-allowed select-none">
              Kurucu Beta Önce Dolmalı
            </div>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="mt-2 block w-full rounded-full border border-border py-2.5 text-center text-sm font-semibold text-foreground hover:bg-accent transition-colors"
            >
              Şimdi Beta Fiyatıyla Başla →
            </Link>
            <ul className="mt-6 space-y-2.5">
              {[
                "Gerçek zamanlı kâr/zarar takibi",
                "Reklam ROAS takibi (Meta, Google, TikTok)",
                "Kritik stok uyarısı",
                "Ay sonu raporu (5 dakika)",
                "Tahsilat & gider yönetimi",
                "Excel/PDF export",
                "İade modülü",
              ].map(f => (
                <li key={f} className="flex gap-2.5 text-sm text-muted-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/60" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Yıllık Plan */}
          <div className="relative rounded-2xl border-2 border-primary bg-primary-soft p-8">
            <div className="flex items-start justify-between">
              <span className="text-sm font-semibold text-primary">Yıllık Plan</span>
              <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">En Avantajlı</span>
            </div>
            <p className="mt-4 text-4xl font-bold text-foreground">₺524 <span className="text-base font-medium text-muted-foreground">/ ay + KDV</span></p>
            <p className="mt-1 text-sm text-primary font-medium">₺6.290/yıl · 2 ay bedava · ₺1.258 tasarruf</p>
            <p className="mt-1 text-xs text-muted-foreground">Yıllık ön ödeme, aylık ₺629'a göre</p>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="mt-6 block w-full rounded-full bg-primary py-3 text-center text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity"
            >
              15 Gün Ücretsiz Başla
            </Link>
            <Link
              to="/odeme"
              search={{ plan: "yillik" }}
              className="mt-2 block w-full rounded-full border border-primary py-2.5 text-center text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
            >
              Hemen Satın Al
            </Link>
            <ul className="mt-6 space-y-2.5">
              {[
                "Gerçek zamanlı kâr/zarar takibi",
                "Reklam ROAS takibi (Meta, Google, TikTok)",
                "Kritik stok uyarısı",
                "Ay sonu raporu (5 dakika)",
                "Tahsilat & gider yönetimi",
                "Excel/PDF export",
                "İade modülü",
                "Yıllık önce öde, 2 ay kazan",
              ].map(f => (
                <li key={f} className="flex gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  {f}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">Tüm fiyatlara KDV dahil değildir. 15 gün ücretsiz deneme — kart gerekmez, istediğin zaman iptal.</p>
      </section>

      {/* Referans Programı */}
      <section className="mx-auto max-w-5xl px-4 pb-20 lg:px-8">
        <div className="rounded-3xl border-2 border-primary/30 bg-primary-soft p-8 md:p-12">
          <div className="flex flex-col items-center text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
              <Gift className="h-7 w-7" />
            </span>
            <span className="mt-4 rounded-full bg-primary/10 px-4 py-1 text-xs font-bold uppercase tracking-wider text-primary">Eylül 2026 Kampanyası</span>
            <h2 className="mt-4 text-3xl font-bold md:text-4xl">İkisi de 1 ay ücretsiz kazanır</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
              BütçeCRM'i beğendiysen bir arkadaşına öner — sen de 1 ay ücretsiz al, arkadaşın da. İkisi de kazanır. Sınır yok.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-primary/20 bg-background p-6 text-center">
              <p className="text-4xl font-bold text-primary">+1 Ay</p>
              <p className="mt-1 text-sm font-semibold text-foreground">Referans veren kazanır</p>
              <p className="mt-2 text-sm text-muted-foreground">Önerdiğin kişi kayıt olunca bir sonraki ödemen düşmez</p>
            </div>
            <div className="rounded-2xl border border-primary/20 bg-background p-6 text-center">
              <p className="text-4xl font-bold text-primary">+1 Ay</p>
              <p className="mt-1 text-sm font-semibold text-foreground">Referans alan kazanır</p>
              <p className="mt-2 text-sm text-muted-foreground">Davet linki üzerinden kayıt ol, ilk ayın hediye</p>
            </div>
          </div>
          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Başla ve Referans Linki Al <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://wa.me/905539003459"
              className="inline-flex items-center gap-2 rounded-full border border-border px-7 py-3.5 text-sm font-semibold hover:bg-accent"
            >
              WhatsApp ile Sor
            </a>
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">Kampanya 30 Eylül 2026'ya kadar geçerlidir · Her başarılı referans için ayrı 1 ay · Sınır yok</p>
        </div>
      </section>

      {/* Vaka Çalışması */}
      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Vaka Çalışması</span>
            <h2 className="mt-3 text-4xl font-bold">Örnek Senaryo: Tekstil E-Ticaret İşletmesi</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { label: "Problem", content: "Aylık ciro 120.000 TL. Kâr ne kadar bilmiyor. Excel'de takip ediyor, ay sonu 4 saat harcıyor. Reklamların işe yarayıp yaramadığını bilmiyor." },
              { label: "Çözüm", content: "BütçeCRM kurulumu 2 günde tamamlandı. Satış, gider ve reklam geliri sisteme bağlandı. Otomatik raporlar devreye girdi." },
              { label: "Sonuç", content: "%18 daha az reklam harcamasıyla aynı ciro elde edildi (gereksiz kampanya tespit edildi). Ay sonu raporu 4 saatten 5 dakikaya düştü." },
            ].map(c => (
              <div key={c.label} className="rounded-2xl border border-border bg-background p-7">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{c.label}</span>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{c.content}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">*Senaryo, benzer KOBİ işletmelerinin yaygın deneyimlerine dayanmaktadır.</p>
        </div>
      </section>

      {/* Beta Framing */}
      <section className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Şu An Neredeyiz?</span>
          <h2 className="mt-3 text-4xl font-bold">Dürüst Olmak Gerekirse</h2>
        </div>
        <div className="mt-10 rounded-2xl border border-primary/20 bg-primary-soft p-8 text-center">
          <p className="text-lg font-medium leading-relaxed">BütçeCRM beta sürecinde. Henüz onlarca doğrulanmış müşteri yorumumuz yok —</p>
          <p className="mt-2 text-muted-foreground">ve bunu söylemekten çekinmiyoruz.</p>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">İlk kullanıcı olarak 15 gün ücretsiz kullanırsınız. Beğenmezseniz ödemezsiniz. Risk tamamen bizde.</p>
          <Link to="/auth" search={{ mode: "signup" }} className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90">Ücretsiz Dene, Karar Ver <ArrowRight className="h-4 w-4" /></Link>
        </div>
      </section>

      {/* Kullanıcı Yorumları */}
      <section className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
        <h2 className="text-center text-4xl font-bold">Kullananlar Ne Diyor?</h2>
        <p className="mx-auto mt-4 max-w-xl text-center text-muted-foreground">
          Beta kullanıcılarının deneyimleri — isimsiz, gerçek geri bildirimler.
        </p>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {[
            { quote: "Ay sonu 4 saat harcardım. Şimdi 5 dakika.", sector: "E-Ticaret", city: "İstanbul", metric: "4 saat → 5 dk" },
            { quote: "Hangi reklamın para yaktığını gördüm, kestim. %18 daha az harcamayla aynı ciro.", sector: "Tekstil KOBİ", city: "Bursa", metric: "%18 reklam tasarrufu" },
            { quote: "Stok bitti uyarısı benim yerime düşünüyor. Sipariş iptali kalmadı.", sector: "Perakende", city: "Ankara", metric: "0 sipariş iptali" },
          ].map((t) => (
            <div key={t.metric} className="rounded-2xl border border-border bg-card p-7">
              <p className="text-3xl font-bold text-primary mb-1">{t.metric}</p>
              <p className="italic text-sm text-muted-foreground">"{t.quote}"</p>
              <span className="mt-4 block text-xs text-muted-foreground">{t.sector} · Beta Kullanıcısı</span>
            </div>
          ))}
        </div>
      </section>

      <FaqBlock items={faqs} />

      {/* Risk Reversal */}
      <div className="mx-auto max-w-3xl px-4 pb-4">
        <div className="flex flex-wrap justify-center gap-6 rounded-2xl border border-primary/20 bg-primary-soft px-7 py-4 text-sm font-semibold">
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 15 gün ücretsiz</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Kart gerekmez</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> İstediğin zaman iptal</span>
        </div>
      </div>

      {/* Kurucu Notu */}
      <div className="mx-auto max-w-3xl px-4 pb-8">
        <blockquote className="rounded-2xl border border-border bg-card p-7">
          <Quote className="mb-3 h-7 w-7 text-primary/40" />
          <p className="italic leading-relaxed text-muted-foreground">
            "Bu sistemi kurarken tek amacım şuydu: İşletme sahipleri rakamlar arasında boğulmasın, işlerini büyütmeye odaklanabilsin."
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">M</span>
            <div>
              <p className="text-sm font-semibold">Melih Hata</p>
              <p className="text-xs text-muted-foreground">Kurucu · BütçeCRM yapımcısı</p>
            </div>
          </div>
        </blockquote>
      </div>

      {/* Demo form */}
      <section id="demo" className="mx-auto max-w-3xl px-4 py-20 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
          <h2 className="text-3xl font-bold">Canlı Demo Ayarla</h2>
          <p className="mt-2 text-muted-foreground">30 dakikada BütçeCRM'i birlikte keşfedelim. Kredi kartı gerekmez.</p>
          <div className="mt-8">
            <BookingForm
              source={demoSource}
              submitLabel="Görüşme Zamanı Seç"
              fields={[
                { name: "name", label: "Ad Soyad", required: true },
                { name: "company", label: "Firma Adı" },
                { name: "email", label: "E-posta", type: "email", required: true },
                { name: "phone", label: "Telefon", type: "tel" },
                { name: "type", label: "İşletme türünüz nedir?", type: "select", options: ["E-ticaret", "Perakende", "Hizmet", "Diğer"] },
              ]}
            />
            <p className="mt-4 text-center text-sm text-muted-foreground">
              <a href="https://wa.me/905539003459" className="text-primary hover:underline">Hızlı iletişim için WhatsApp'tan yazın</a>
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
