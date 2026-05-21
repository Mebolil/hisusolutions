import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { LeadForm } from "@/components/site/LeadForm";
import { FaqBlock, type FaqItem } from "@/components/site/FaqBlock";
import { ArrowRight, Check, X, BarChart3, Package, Megaphone, Receipt, FileText, BellRing } from "lucide-react";

export const Route = createFileRoute("/butceleme")({
  head: () => ({
    meta: [
      { title: "BütçeCRM — KOBİ Bütçe Yönetim Yazılımı | Hisu Solutions" },
      { name: "description", content: "Satış, stok, gider ve reklam ROI'sini tek ekranda yönetin. E-ticaret işletmeleri ve KOBİ'ler için Türkiye'nin en pratik bütçe yönetim yazılımı. Aylık ₺890." },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hisusolutions.com/butceleme" },
      { property: "og:site_name", content: "Hisu Solutions" },
      { property: "og:title", content: "BütçeCRM — KOBİ Bütçe Yönetim Yazılımı | Hisu Solutions" },
      { property: "og:description", content: "Satış, stok, gider ve reklam ROI'sini tek ekranda yönetin. E-ticaret ve KOBİ'ler için anahtar teslim bütçe yönetimi." },
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
            { "@type": "Question", "name": "BütçeCRM ne kadar?", "acceptedAnswer": { "@type": "Answer", "text": "Aylık ₺890 + KDV veya yıllık ₺8.900 + KDV (2 ay bedava, yılda ₺1.780 tasarruf). Demo görüşmesiyle başlayabilirsiniz." } },
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
            "price": "890",
            "priceCurrency": "TRY",
            "priceSpecification": {
              "@type": "UnitPriceSpecification",
              "price": "890",
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
  { q: "BütçeCRM nedir?", a: "BütçeCRM, e-ticaret işletmeleri ve KOBİ'ler için geliştirilmiş bir finansal yönetim yazılımıdır. Satış, gider, stok ve reklam ROI'sini tek ekranda görmenizi sağlar." },
  { q: "BütçeCRM ne kadar?", a: "Aylık ₺890 + KDV veya yıllık ₺8.900 + KDV (2 ay bedava, yılda ₺1.780 tasarruf). Demo görüşmesiyle başlayabilirsiniz." },
  { q: "BütçeCRM Excel'den farkı nedir?", a: "Excel manuel giriş gerektirir, hata yapar ve anlık veri vermez. BütçeCRM otomatik hesaplar, gerçek zamanlı kâr/zarar gösterir ve reklam kampanyalarınızın gerçek ROI'sini saptar." },
  { q: "Kimler BütçeCRM kullanabilir?", a: "E-ticaret işletmeleri, perakende, hizmet sektörü ve bütçe takibi yapmak isteyen her KOBİ kullanabilir. Özellikle aylık cirosu 50.000 TL üzeri işletmeler için kritik değer üretir." },
];

function ButcelemePage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft),_transparent_60%)]" />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center lg:px-8 lg:py-28">
          <span className="inline-flex rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-accent-foreground">Finansal Otomasyon</span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">Paranın Nereye Gittiğini Artık Biliyorsun</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">BütçeCRM, e-ticaret işletmeleri ve KOBİ'ler için satış, stok, gider ve reklam ROI'sini tek ekranda yöneten finansal yönetim yazılımıdır. Excel'e, muhasebecine sormaya son.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#demo" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90">Demo Talep Et <ArrowRight className="h-4 w-4" /></a>
            <a href="#nasil-calisir" className="rounded-full border border-border px-7 py-3.5 text-sm font-semibold hover:bg-accent">Nasıl Çalışır?</a>
          </div>
        </div>
      </section>

      {/* Pain points vs solution */}
      <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <h3 className="text-xl font-bold">Şu an:</h3>
            <ul className="mt-5 space-y-3">
              {["Ay sonu ne kaldığını bilmiyorsun","Reklam harcıyor ama gerçek ROI'yi göremiyorsun","Stok takibi Excel'de, satışlar başka yerde","Kar mı ettim, zarar mı? Cevap yok"].map(t => (
                <li key={t} className="flex gap-3 text-muted-foreground"><X className="mt-0.5 h-5 w-5 shrink-0 text-destructive" /> {t}</li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-primary/30 bg-primary-soft p-8">
            <h3 className="text-xl font-bold">BütçeCRM ile:</h3>
            <ul className="mt-5 space-y-3">
              {["Gerçek zamanlı gelir, gider, net kâr","Reklam kampanyası bazlı gerçek ROI ve ROAS","FIFO stok takibi otomatik","Her şey tek ekranda, her zaman güncel"].map(t => (
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
              { i: BarChart3, t: "Satış & Cari Takibi", d: "Müşteri bazlı tahsilat, kısmi ödeme, gecikme uyarısı." },
              { i: Package, t: "Stok Yönetimi", d: "FIFO maliyet, kritik seviye uyarısı, otomatik düşüm." },
              { i: Megaphone, t: "Reklam ROI", d: "Meta, Google, TikTok kampanyalarını satışa bağla." },
              { i: Receipt, t: "Gider Takibi", d: "Kategori ve kişi bazlı, aylık trend." },
              { i: FileText, t: "Otomatik Raporlar", d: "5 sekmeli rapor, Excel ve PDF export." },
              { i: BellRing, t: "Hatırlatıcılar", d: "Gecikmiş tahsilat, tedarikçi borcu, kritik stok otomatik uyarısı." },
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

      {/* Pricing */}
      <section className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
        <h2 className="text-center text-4xl font-bold">Sade ve şeffaf fiyatlandırma</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <span className="text-sm font-semibold text-muted-foreground">Aylık Plan</span>
            <p className="mt-3 text-4xl font-bold">₺890 <span className="text-base font-medium text-muted-foreground">/ ay + KDV</span></p>
            <a href="#demo" className="mt-6 block rounded-full border border-border py-3 text-center text-sm font-semibold hover:bg-accent">Demo Talep Et</a>
            <p className="mt-4 text-sm text-muted-foreground">Demo görüşmesinde ürünü birlikte inceleriz, soruların yanıtlanır.</p>
          </div>
          <div className="relative rounded-2xl border-2 border-primary bg-primary-soft p-8">
            <span className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">En Popüler</span>
            <span className="text-sm font-semibold text-primary">Yıllık Plan</span>
            <p className="mt-3 text-4xl font-bold">₺8.900 <span className="text-base font-medium text-muted-foreground">/ yıl + KDV</span></p>
            <p className="mt-1 text-sm text-primary">2 ay bedava · Yılda ₺1.780 tasarruf</p>
            <a href="#demo" className="mt-6 block rounded-full bg-primary py-3 text-center text-sm font-semibold text-primary-foreground hover:opacity-90">Demo Talep Et</a>
            <p className="mt-4 text-sm text-muted-foreground">Demo görüşmesinde ürünü birlikte inceleriz.</p>
          </div>
        </div>
      </section>

      <FaqBlock items={faqs} />

      {/* Demo form */}
      <section id="demo" className="mx-auto max-w-3xl px-4 py-20 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
          <h2 className="text-3xl font-bold">Demo Talep Et</h2>
          <p className="mt-2 text-muted-foreground">30 dakikada BütçeCRM'i birlikte keşfedelim.</p>
          <div className="mt-8">
            <LeadForm
              source="butcecrm-demo"
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
