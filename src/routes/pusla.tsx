import { createFileRoute, Link } from "@tanstack/react-router";
import { useBetaSlots } from "@/lib/useBetaSlots";
import { SiteLayout } from "@/components/site/SiteLayout";
import { FaqBlock, type FaqItem } from "@/components/site/FaqBlock";
import { RoiCalculator } from "@/components/site/RoiCalculator";
import { PersonaSection } from "@/components/site/PersonaSection";
import { ArrowRight, Check, X, BarChart3, Package, Megaphone, Receipt, FileText, BellRing, Users, Clock, TrendingUp, ShoppingCart, Quote, Gift, Zap } from "lucide-react";

export const Route = createFileRoute("/pusla")({
  head: () => ({
    meta: [
      { title: "Pusla — E-Ticaret Finansal Karar Destek Sistemi | Hisu Solutions" },
      { name: "description", content: "Satış, stok, gider ve reklam ROI'sini tek ekranda yönetin. E-ticaret işletmeleri ve KOBİ'ler için Türkiye'nin en pratik bütçe yönetim yazılımı. Kurucu Beta ₺499/ay." },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hisusolutions.com/pusla" },
      { property: "og:site_name", content: "Hisu Solutions" },
      { property: "og:title", content: "Pusla — E-Ticaret Finansal Karar Destek Sistemi | Hisu Solutions" },
      { property: "og:description", content: "Satış, stok, gider ve reklam ROI'sini tek ekranda yönetin. E-ticaret ve KOBİ'ler için anahtar teslim bütçe yönetimi." },
      { property: "og:image", content: "https://hisusolutions.com/og-image.png" },
    ],
    links: [
      { rel: "canonical", href: "https://hisusolutions.com/pusla" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "Pusla nedir?", "acceptedAnswer": { "@type": "Answer", "text": "Pusla, e-ticaret işletmeleri ve KOBİ'ler için geliştirilmiş bir finansal yönetim yazılımıdır. Satış, gider, stok ve reklam ROI'sini tek ekranda görmenizi sağlar." } },
            { "@type": "Question", "name": "Pusla ne kadar?", "acceptedAnswer": { "@type": "Answer", "text": "Kurucu Beta fiyatı ₺499/ay + KDV — 31 Temmuz 2026'ya kadar, sadece 10 slot, ömür boyu kilitli. Sabit liste fiyatı ₺629/ay + KDV. 30 gün ücretsiz deneyebilirsiniz, kart gerekmez." } },
            { "@type": "Question", "name": "Pusla Excel'den farkı nedir?", "acceptedAnswer": { "@type": "Answer", "text": "Excel manuel giriş gerektirir, hata yapar ve anlık veri vermez. Pusla otomatik hesaplar, gerçek zamanlı kâr/zarar gösterir ve reklam kampanyalarınızın gerçek ROI'sini saptar." } },
            { "@type": "Question", "name": "Kimler Pusla kullanabilir?", "acceptedAnswer": { "@type": "Answer", "text": "E-ticaret işletmeleri, perakende, hizmet sektörü ve bütçe takibi yapmak isteyen her KOBİ kullanabilir. Özellikle aylık cirosu 50.000 TL üzeri işletmeler için kritik değer üretir." } },
          ]
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "SoftwareApplication",
          "name": "Pusla",
          "applicationCategory": "BusinessApplication",
          "operatingSystem": "Web",
          "url": "https://hisusolutions.com/pusla",
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
  { q: "Pusla nedir?", a: "Pusla, e-ticaret işletmeleri ve KOBİ'ler için geliştirilmiş bir finansal yönetim yazılımıdır. Gelir, gider, stok ve reklamlarınızın ne kadar kazandırdığını tek ekranda görmenizi sağlar." },
  { q: "Pusla ne kadar?", a: "Kurucu Beta fiyatı ₺499/ay + KDV — 31 Temmuz 2026'ya kadar geçerli, sadece 10 slot var ve bu fiyat ömür boyu kilitli kalır. Beta sonrası sabit fiyat ₺629/ay + KDV'dir. 30 gün ücretsiz trial ile kart gerekmeden başlayabilirsiniz." },
  { q: "Excel'den geçmek zor olacak mı?", a: "Hayır. Ekibiniz 15 dakikada alışır. Verilerinizi Excel'den import edebilirsiniz. İlk kurulumda biz size rehberlik ediyoruz." },
  { q: "Verilerim güvende mi?", a: "Evet. Supabase altyapısı üzerinde çalışır, SSL şifreleme ile korunur. Verileriniz Türkiye'deki sunucularda tutulur." },
  { q: "İptal edersem verilerimi kaybeder miyim?", a: "Hayır. İptal öncesinde verilerinizi Excel/PDF olarak export edebilirsiniz. Verileriniz size ait, her zaman erişebilirsiniz." },
  { q: "Referans programı nasıl çalışıyor?", a: "Pusla'i bir arkadaşına önerirsin — o kayıt olunca hem sen hem o 1'er ay ücretsiz kullanım kazanırsınız. Sınır yok, her başarılı referans için ayrı 1 ay kazanırsın. Kampanya 30 Eylül 2026'ya kadar geçerlidir." },
  { q: "Teknik bilgi gerekiyor mu?", a: "Sıfır teknik bilgi. Açıp kullanıyorsunuz. İçinde rehber videolar ve adım adım kurulum sihirbazı var. Takıldığınızda destek hattımız açık." },
  { q: "Kimler Pusla kullanabilir?", a: "E-ticaret işletmeleri, perakende, hizmet sektörü ve bütçe takibi yapmak isteyen her KOBİ kullanabilir. Özellikle aylık cirosu 50.000 TL üzeri işletmeler için kritik değer üretir." },
];

function ButcelemePage() {
  const { data: slots } = useBetaSlots();
  const remaining = slots ? slots.total_slots - slots.used_slots : null;

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft),_transparent_60%)]" />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center lg:px-8 lg:py-28">
          <span className="inline-flex rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-accent-foreground">E-Ticaret KOBİ'leri İçin · Trendyol · Hepsiburada · Kendi Siteniz</span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">Trendyol'dan Satıyorsun.<br />Meta'ya Reklam Veriyorsun.<br /><span className="text-primary">Hangisi Gerçekten Para Kazandırıyor?</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Gelir, gider, stok ve reklam ROAS'ınızı tek ekranda görün. Paraşüt, Uyumsoft ve Logo İşbaşı'nda reklam takibi yok — Pusla'de var.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup" }} className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90">30 Gün Ücretsiz Dene <ArrowRight className="h-4 w-4" /></Link>
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
              { Icon: Check, text: "30 gün ücretsiz · Kart gerekmez · İstediğin zaman iptal" },
              { Icon: Gift, text: "Referans kampanyası: İkiniz de 1 ay ücretsiz · Eylül'e kadar" },
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
            <h3 className="text-xl font-bold">Pusla ile:</h3>
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
          <h2 className="mt-3 text-4xl font-bold">Pusla Nasıl Görünür?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Tek ekranda tüm finansal tablonuz — gerçek zamanlı, her zaman güncel.</p>
        </div>
        <div className="mt-12 relative">
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 shadow-2xl shadow-primary/10 ring-1 ring-primary/10">
            <video
              src="/videos/pusla-16x9.mp4"
              autoPlay
              muted
              loop
              playsInline
              className="w-full rounded-2xl"
              aria-label="Pusla ürün videosu — reklam ROAS takibi, stok ve finansal yönetim"
            />
            <div className="absolute inset-x-0 bottom-0 h-24 rounded-b-2xl bg-gradient-to-t from-background/80 to-transparent" />
          </div>
          <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-emerald-400/10 blur-xl" />
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

      {/* Excel vs Pusla Karşılaştırma */}
      <section className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
        <h2 className="text-center text-4xl font-bold">Excel mi, Pusla mi?</h2>
        <div className="mt-10 overflow-hidden rounded-2xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-6 py-4 text-left font-semibold">Özellik</th>
                <th className="px-6 py-4 text-center font-semibold text-muted-foreground">Excel</th>
                <th className="px-6 py-4 text-center font-semibold text-primary">Pusla</th>
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
          "Muhasebe yazılımı arıyor (Pusla muhasebe değil, operasyon takibi)",
          "Mobil uygulama tercih ediyor (şu an web tabanlı, mobil yol haritasında)",
          "Yasal e-fatura yazılımı arıyor (Pusla bu değil)",
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
              <span className="rounded-full bg-amber-400 px-3 py-1 text-xs font-bold text-white">
                {remaining !== null ? `${remaining} Slot Kaldı` : "Sadece 10 Slot"}
              </span>
            </div>
            <p className="mt-4 text-4xl font-bold text-foreground">₺499 <span className="text-base font-medium text-muted-foreground">/ ay + KDV</span></p>
            <p className="mt-1 text-sm text-amber-700 font-medium">31 Temmuz 2026'ya kadar · Ömür boyu kilitli</p>
            <p className="mt-1 text-xs text-amber-600">Beta sonrası sabit fiyat: ₺629/ay</p>
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="mt-6 block w-full rounded-full bg-amber-500 py-3 text-center text-sm font-semibold text-white hover:bg-amber-600 transition-colors"
            >
              30 Gün Ücretsiz Başla
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
              30 Gün Ücretsiz Başla
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
        <p className="mt-6 text-center text-xs text-muted-foreground">Tüm fiyatlara KDV dahil değildir. 30 gün ücretsiz deneme — kart gerekmez, istediğin zaman iptal.</p>
      </section>

      {/* Referans Programı */}
      <section className="relative overflow-hidden bg-primary text-primary-foreground">
        <div className="absolute inset-0 -z-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 50%, white 0%, transparent 50%), radial-gradient(circle at 80% 20%, white 0%, transparent 40%)" }} />
        <div className="relative mx-auto max-w-6xl px-4 py-20 lg:px-8">
          <div className="text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-5 py-2 text-sm font-bold">
              <Gift className="h-4 w-4" /> Eylül 2026 Kampanyası · 30 Eylül'e kadar
            </span>
            <h2 className="mt-6 text-4xl font-bold md:text-5xl lg:text-6xl">İkisi de 1 ay<br />ücretsiz kazanır</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-primary-foreground/80">
              Pusla'i beğendiysen bir arkadaşına öner — sen de 1 ay ücretsiz al, arkadaşın da. İkisi de kazanır. Sınır yok.
            </p>
          </div>

          <div className="mt-14 grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl bg-white/10 p-8 text-center backdrop-blur-sm">
              <p className="text-5xl font-bold">1</p>
              <p className="mt-3 text-lg font-semibold">Arkadaşını öner</p>
              <p className="mt-2 text-sm text-primary-foreground/70">Profilinden referans linkini kopyala ve paylaş</p>
            </div>
            <div className="rounded-2xl bg-white/10 p-8 text-center backdrop-blur-sm">
              <p className="text-5xl font-bold">2</p>
              <p className="mt-3 text-lg font-semibold">O kayıt olsun</p>
              <p className="mt-2 text-sm text-primary-foreground/70">Arkadaşın linki kullanarak Pusla'e üye olur</p>
            </div>
            <div className="rounded-2xl bg-white/15 p-8 text-center ring-2 ring-white/30 backdrop-blur-sm">
              <p className="text-5xl font-bold">+1 Ay</p>
              <p className="mt-3 text-lg font-semibold">İkiniz de kazanır</p>
              <p className="mt-2 text-sm text-primary-foreground/70">Hem sen hem arkadaşın bir ay ücretsiz kullanım kazanır</p>
            </div>
          </div>

          <div className="mt-12 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              to="/auth"
              search={{ mode: "signup" }}
              className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-sm font-bold text-primary shadow-lg hover:bg-white/90 transition-colors"
            >
              Başla ve Referans Linki Al <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="https://wa.me/905539003459"
              className="inline-flex items-center gap-2 rounded-full border border-white/40 px-8 py-4 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              WhatsApp ile Sor
            </a>
          </div>
          <p className="mt-6 text-center text-xs text-primary-foreground/50">Kampanya 30 Eylül 2026'ya kadar geçerlidir · Her başarılı referans için ayrı 1 ay · Sınır yok</p>
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
              { label: "Çözüm", content: "Pusla kurulumu 2 günde tamamlandı. Satış, gider ve reklam geliri sisteme bağlandı. Otomatik raporlar devreye girdi." },
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
          <p className="text-lg font-medium leading-relaxed">Pusla beta sürecinde. Henüz onlarca doğrulanmış müşteri yorumumuz yok —</p>
          <p className="mt-2 text-muted-foreground">ve bunu söylemekten çekinmiyoruz.</p>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">İlk kullanıcı olarak 30 gün ücretsiz kullanırsınız. Beğenmezseniz ödemezsiniz. Risk tamamen bizde.</p>
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
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> 30 gün ücretsiz</span>
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
              <p className="text-xs text-muted-foreground">Kurucu · Pusla yapımcısı</p>
            </div>
          </div>
        </blockquote>
      </div>

    </SiteLayout>
  );
}
