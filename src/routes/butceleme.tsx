import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BookingForm } from "@/components/site/BookingForm";
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
  { q: "BütçeCRM nedir?", a: "BütçeCRM, e-ticaret işletmeleri ve KOBİ'ler için geliştirilmiş bir finansal yönetim yazılımıdır. Gelir, gider, stok ve reklamlarınızın ne kadar kazandırdığını tek ekranda görmenizi sağlar." },
  { q: "BütçeCRM ne kadar?", a: "Aylık ₺890 + KDV veya yıllık ₺8.900 + KDV (2 ay bedava, yılda ₺1.780 tasarruf). Canlı demo görüşmesiyle başlayabilirsiniz." },
  { q: "BütçeCRM Excel'den farkı nedir?", a: "Excel manuel giriş gerektirir, hata yapar ve anlık veri vermez. BütçeCRM otomatik hesaplar, gerçek zamanlı kâr/zarar gösterir ve reklamlarınızın ne kadar kazandırdığını kampanya bazında saptar." },
  { q: "Reklamlarımın ne kadar kazandırdığını görebiliyor muyum?", a: "Evet. Meta, Google ve TikTok kampanyalarınızı satışlarınıza bağlayarak her kampanyanın gerçek gelirini görebilirsiniz. Hangi reklamın işe yarayıp hangisinin para yaktığını net görürsünüz." },
  { q: "Kimler BütçeCRM kullanabilir?", a: "E-ticaret işletmeleri, perakende, hizmet sektörü ve bütçe takibi yapmak isteyen her KOBİ kullanabilir. Özellikle aylık cirosu 50.000 TL üzeri işletmeler için kritik değer üretir." },
];

function ButcelemePage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft),_transparent_60%)]" />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center lg:px-8 lg:py-28">
          <span className="inline-flex rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-accent-foreground">KOBİ Bütçe Yönetim Yazılımı</span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">Paranız Nereye Gidiyor?<br />Artık Biliyorsunuz.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Gelir, gider, stok ve reklamlarınızın gelirini tek ekranda anlık görün. Excel karmaşasına son.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#demo" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90">Canlı Demo Ayarla <ArrowRight className="h-4 w-4" /></a>
            <a href="#nasil-calisir" className="rounded-full border border-border px-7 py-3.5 text-sm font-semibold hover:bg-accent">Nasıl Çalışır?</a>
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
                "Ay sonunda cebinizde ne kaldığını hâlâ merak mı ediyorsunuz?",
                "Reklamlara para gidiyor ama gerçekten işe yarıyor mu, göremiyorsunuz?",
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
              { i: BarChart3, t: "Alacaklarınızı Unutmayın", d: "Kimin ne kadar borcu var, anlık görün. Müşteri bazlı tahsilat, kısmi ödeme, gecikme uyarısı." },
              { i: Package, t: "Ürünleriniz Bitmeden Haberiniz Olsun", d: "Kritik stok seviyelerinde otomatik uyarı. FIFO maliyet, otomatik düşüm." },
              { i: Megaphone, t: "Reklamlarınız Gerçekten İşe Yarıyor mu?", d: "Meta, Google, TikTok kampanyalarınızın hangi satışları getirdiğini net görün." },
              { i: Receipt, t: "Gider Takibi", d: "Nereye ne harcadığınızı kategoriye göre görün, aylık trendi takip edin." },
              { i: FileText, t: "Otomatik Raporlar", d: "Ay sonu raporu 5 dakikada hazır. Excel ve PDF export dahil." },
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

      {/* Demo Önizleme */}
      <section className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Önizleme</span>
          <h2 className="mt-3 text-4xl font-bold">BütçeCRM Nasıl Görünür?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Tek ekranda tüm finansal tablonuz — gerçek zamanlı, her zaman güncel.</p>
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Günlük Kâr Görünümü</p>
            <div className="mt-4 flex items-end gap-1.5 h-24">
              {[40, 65, 50, 80, 55, 90, 70].map((h, i) => (
                <div key={i} className="flex-1 rounded-t bg-primary/20 relative" style={{ height: `${h}%` }}>
                  <div className="absolute bottom-0 left-0 right-0 rounded-t bg-primary" style={{ height: "40%" }} />
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm font-semibold text-primary">+₺12.480 bu hafta</p>
            <p className="text-xs text-muted-foreground">Geçen haftaya göre +%18</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Reklam Geliri</p>
            <div className="mt-4 space-y-3">
              {[{ label: "Meta Ads", val: 78 }, { label: "Google Ads", val: 55 }, { label: "TikTok Ads", val: 32 }].map(r => (
                <div key={r.label}>
                  <div className="flex justify-between text-xs mb-1"><span>{r.label}</span><span className="font-semibold">%{r.val}</span></div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden"><div className="h-full rounded-full bg-primary" style={{ width: `${r.val}%` }} /></div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Kampanya bazında gerçek gelir</p>
          </div>
          <div className="rounded-2xl border border-border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stok Durumu</p>
            <div className="mt-4 space-y-2.5">
              {[
                { name: "Ürün A", stock: 142, ok: true },
                { name: "Ürün B", stock: 8, ok: false },
                { name: "Ürün C", stock: 67, ok: true },
              ].map(s => (
                <div key={s.name} className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${s.ok ? "bg-muted" : "bg-destructive/10"}`}>
                  <span>{s.name}</span>
                  <span className={`font-semibold ${s.ok ? "text-foreground" : "text-destructive"}`}>{s.stock} adet{!s.ok && " ⚠"}</span>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Kritik stok otomatik uyarı</p>
          </div>
        </div>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href="#demo" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:opacity-90">Canlı Demo Ayarla <ArrowRight className="h-4 w-4" /></a>
          <a href="#demo" className="rounded-full border border-border px-7 py-3.5 text-sm font-semibold hover:bg-accent">2 Dakikalık Tanıtım Videosunu İzle</a>
        </div>
      </section>

      {/* Vaka Çalışması */}
      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Vaka Çalışması</span>
            <h2 className="mt-3 text-4xl font-bold">Gerçek Bir Senaryo: Tekstil E-Ticaret İşletmesi</h2>
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

      <FaqBlock items={faqs} />

      {/* Demo form */}
      <section id="demo" className="mx-auto max-w-3xl px-4 py-20 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
          <h2 className="text-3xl font-bold">Canlı Demo Ayarla</h2>
          <p className="mt-2 text-muted-foreground">30 dakikada BütçeCRM'i birlikte keşfedelim. Kredi kartı gerekmez.</p>
          <div className="mt-8">
            <BookingForm
              source="butcecrm-demo"
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
