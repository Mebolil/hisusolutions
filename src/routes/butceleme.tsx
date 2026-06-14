import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BookingForm } from "@/components/site/BookingForm";
import { FaqBlock, type FaqItem } from "@/components/site/FaqBlock";
import { RoiCalculator } from "@/components/site/RoiCalculator";
import { PersonaSection } from "@/components/site/PersonaSection";
import { ArrowRight, Check, X, BarChart3, Package, Megaphone, Receipt, FileText, BellRing, Users, Clock, TrendingUp, Shield, ShoppingCart, Quote } from "lucide-react";

export const Route = createFileRoute("/butceleme")({
  head: () => ({
    meta: [
      { title: "BütçeCRM — KOBİ Bütçe Yönetim Yazılımı | Hisu Solutions" },
      { name: "description", content: "Satış, stok, gider ve reklam ROI'sini tek ekranda yönetin. E-ticaret işletmeleri ve KOBİ'ler için Türkiye'nin en pratik bütçe yönetim yazılımı. Aylık ₺719." },
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
            { "@type": "Question", "name": "BütçeCRM ne kadar?", "acceptedAnswer": { "@type": "Answer", "text": "Aylık ₺719 + KDV veya yıllık ₺7.190 + KDV (2 ay bedava, yılda ₺1.438 tasarruf). 15 gün ücretsiz deneyebilirsiniz, kart gerekmez." } },
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
          "offers": {
            "@type": "Offer",
            "price": "719",
            "priceCurrency": "TRY",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": "719",
              "priceCurrency": "TRY",
              "unitCode": "MON"
            }
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
  { q: "BütçeCRM ne kadar?", a: "Aylık ₺719 + KDV veya yıllık ₺7.190 + KDV (2 ay bedava, yılda ₺1.438 tasarruf). 15 gün ücretsiz trial ile kart gerekmeden başlayabilirsiniz." },
  { q: "Excel'den geçmek zor olacak mı?", a: "Hayır. Ekibiniz 15 dakikada alışır. Verilerinizi Excel'den import edebilirsiniz. İlk kurulumda biz size rehberlik ediyoruz." },
  { q: "Verilerim güvende mi?", a: "Evet. Supabase altyapısı üzerinde çalışır, SSL şifreleme ile korunur. Verileriniz Türkiye'deki sunucularda tutulur." },
  { q: "İptal edersem verilerimi kaybeder miyim?", a: "Hayır. İptal öncesinde verilerinizi Excel/PDF olarak export edebilirsiniz. Verileriniz size ait, her zaman erişebilirsiniz." },
  { q: "Teknik bilgi gerekiyor mu?", a: "Sıfır teknik bilgi. Açıp kullanıyorsunuz. İçinde rehber videolar ve adım adım kurulum sihirbazı var. Takıldığınızda destek hattımız açık." },
  { q: "Kimler BütçeCRM kullanabilir?", a: "E-ticaret işletmeleri, perakende, hizmet sektörü ve bütçe takibi yapmak isteyen her KOBİ kullanabilir. Özellikle aylık cirosu 50.000 TL üzeri işletmeler için kritik değer üretir." },
];

function ButcelemePage() {
  const [demoSource, setDemoSource] = useState("butcecrm-demo");

  function scrollToDemo(source: string) {
    setDemoSource(source);
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
            <a href="#demo" className="rounded-full border border-border px-7 py-3.5 text-sm font-semibold hover:bg-accent">Demo Ayarla</a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Kredi kartı gerekmez · Kurulum 5 dakika · İstediğin zaman iptal</p>
        </div>
      </section>

      {/* Güven Sayaçları */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-5 lg:px-8">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-3 text-sm">
            {[
              { Icon: Shield, text: "Beta sürecindeyiz · İlk kullanıcılar şekillendiriyor" },
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
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {/* Kurucu Beta */}
          <div className="relative rounded-2xl border-2 border-amber-400 bg-amber-50 p-8">
            <span className="absolute right-6 top-6 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-800">Sadece 10 Slot</span>
            <span className="text-sm font-semibold text-amber-700">Kurucu Beta</span>
            <p className="mt-3 text-4xl font-bold text-foreground">₺519 <span className="text-base font-medium text-muted-foreground">/ ay + KDV</span></p>
            <p className="mt-1 text-sm text-amber-700 line-through">₺719/ay</p>
            <p className="mt-2 text-sm text-amber-700 font-medium">31 Temmuz'a kadar · Ömür boyu bu fiyat kilitlenir</p>
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
                "Kurucu fiyatı her zaman korunur",
              ].map(f => (
                <li key={f} className="flex gap-2.5 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Aylık Plan */}
          <div className="rounded-2xl border border-border bg-card p-8">
            <span className="text-sm font-semibold text-muted-foreground">Aylık Plan</span>
            <p className="mt-3 text-4xl font-bold">₺719 <span className="text-base font-medium text-muted-foreground">/ ay + KDV</span></p>
            <Link to="/auth" search={{ mode: "signup" }} className="mt-6 block rounded-full border border-border py-3 text-center text-sm font-semibold hover:bg-accent">15 Gün Ücretsiz Başla</Link>
            <Link to="/odeme" search={{ plan: "aylik" }} className="mt-2 block rounded-full border border-primary py-2.5 text-center text-sm font-semibold text-primary hover:bg-primary-soft transition-colors">Hemen Satın Al</Link>
            <p className="mt-4 text-sm text-muted-foreground">Kart gerekmez · Anında erişim · 15 gün boyunca tüm özellikler açık</p>
          </div>

          {/* Yıllık Plan */}
          <div className="relative rounded-2xl border-2 border-primary bg-primary-soft p-8">
            <span className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">En Popüler</span>
            <span className="text-sm font-semibold text-primary">Yıllık Plan</span>
            <p className="mt-3 text-4xl font-bold">₺7.190 <span className="text-base font-medium text-muted-foreground">/ yıl + KDV</span></p>
            <p className="mt-1 text-sm text-primary">2 ay bedava · Yılda ₺1.438 tasarruf</p>
            <Link to="/auth" search={{ mode: "signup" }} className="mt-6 block rounded-full bg-primary py-3 text-center text-sm font-semibold text-primary-foreground hover:opacity-90">15 Gün Ücretsiz Başla</Link>
            <Link to="/odeme" search={{ plan: "yillik" }} className="mt-2 block rounded-full border border-primary py-2.5 text-center text-sm font-semibold text-primary hover:bg-primary/10 transition-colors">Hemen Satın Al</Link>
            <p className="mt-4 text-sm text-muted-foreground">Kart gerekmez · Anında erişim · 15 gün boyunca tüm özellikler açık</p>
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
          <a href="#demo" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90">Canlı Demo Ayarla <ArrowRight className="h-4 w-4" /></a>
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
              <Quote className="mb-3 h-6 w-6 text-primary/40" />
              <p className="italic leading-relaxed text-muted-foreground">"{t.quote}"</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t.sector} · {t.city}</span>
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">
                  {t.metric}
                </span>
              </div>
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
