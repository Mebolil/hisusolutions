import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BookingForm } from "@/components/site/BookingForm";
import { FaqBlock, type FaqItem } from "@/components/site/FaqBlock";
import { BeforeAfterSection } from "@/components/site/BeforeAfterSection";
import { PersonaSection } from "@/components/site/PersonaSection";
import { ArrowRight, Check, Globe, Smartphone, Monitor } from "lucide-react";

export const Route = createFileRoute("/web-sitesi")({
  head: () => ({
    meta: [
      { title: "Kurumsal Web Sitesi Tasarımı — 3 Günde Teslim | Hisu Solutions" },
      { name: "description", content: "Şablon değil, marka DNA'nıza özel kurumsal web sitesi. 3 iş gününde modern, hızlı ve dönüşüm odaklı web siteniz hazır. Türkiye'de KOBİ'lere özel web tasarım hizmeti." },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hisusolutions.com/web-sitesi" },
      { property: "og:site_name", content: "Hisu Solutions" },
      { property: "og:title", content: "Kurumsal Web Sitesi Tasarımı — 3 Günde Teslim | Hisu Solutions" },
      { property: "og:description", content: "Şablon değil, marka DNA'nıza özel. 3 iş gününde modern ve dönüşüm odaklı web siteniz hazır. Starter ₺9.900'dan başlayan fiyatlarla." },
      { property: "og:image", content: "https://hisusolutions.com/og-image.png" },
    ],
    links: [
      { rel: "canonical", href: "https://hisusolutions.com/web-sitesi" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "Web sitesi gerçekten 3 günde teslim ediliyor mu?", "acceptedAnswer": { "@type": "Answer", "text": "Evet. Gün 1: marka analizi, Gün 2: tasarım ve strateji, Gün 3: teslim ve domain bağlantısı. Starter paket için 3 iş günü garantidir." } },
            { "@type": "Question", "name": "Web sitesi fiyatı ne kadar?", "acceptedAnswer": { "@type": "Answer", "text": "Starter paket ₺9.900 + KDV tek seferlik ödeme. Çok sayfalı, kurumsal siteler için Nihai Paket teklif bazlıdır. Her iki pakette de 3 ay bakım mevcuttur." } },
            { "@type": "Question", "name": "Hazır şablon mu kullanılıyor?", "acceptedAnswer": { "@type": "Answer", "text": "Hayır. Her site marka DNA'nıza özel tasarlanır. Logo, renk, hedef kitle ve referans siteleriniz analiz edilerek özgün bir tasarım üretilir." } },
            { "@type": "Question", "name": "Teslimden sonra destek var mı?", "acceptedAnswer": { "@type": "Answer", "text": "Starter pakette 1 revizyon hakkı bulunur. Nihai pakette 3 ay ücretsiz bakım ve sınırsız revizyon dahildir." } },
          ]
        }),
      },
    ],
  }),
  component: WebSitePage,
});

const faqs: FaqItem[] = [
  { q: "Web sitesi gerçekten 3 günde teslim ediliyor mu?", a: "Evet. Gün 1: marka analizi, Gün 2: tasarım ve strateji, Gün 3: teslim ve domain bağlantısı. Starter paket için 3 iş günü garantidir." },
  { q: "Hazır şablon kullanılıyor mu, ayırt edilemez olur muyum?", a: "Hayır. Her site marka DNA'nıza özel tasarlanır. Logo, renk, hedef kitle ve referans siteleriniz analiz edilerek özgün bir tasarım üretilir. Şablon değil, kimlik." },
  { q: "3 günde kaliteli olur mu?", a: "Hız kaliteden ödün vermez. Test edilmiş, kanıtlanmış modüller + markanıza özel dokunuş ile hız ve kalite bir arada olur." },
  { q: "Web sitesi fiyatı ne kadar?", a: "Starter paket ₺9.900 + KDV tek seferlik ödeme. Çok sayfalı, kurumsal siteler için Nihai Paket teklif bazlıdır. Her iki pakette de 3 ay bakım mevcuttur." },
  { q: "İleride güncelleme yapabilir miyim?", a: "Evet. Teslimde admin paneli eğitimi veriyoruz — içerikleri kendiniz güncelleyebilirsiniz. Teknik değişiklikler için de yanınızdayız." },
  { q: "Teslimden sonra destek var mı?", a: "Starter pakette 1 revizyon hakkı bulunur. Nihai pakette 3 ay ücretsiz bakım ve sınırsız revizyon dahildir." },
];

const steps = [
  { n: 1, day: "Gün 1", t: "Sizi Tanıyoruz", d: "Markanızın ruhunu, renklerini, hedef kitlenizi anlıyoruz. Siz sadece bize anlatın." },
  { n: 2, day: "Gün 2", t: "Sizin İçin Tasarlıyoruz", d: "Taslak hazırlanır, onayınız alınır, revizyon yapılır. Gün sonunda siteniz şekillenir." },
  { n: 3, day: "Gün 3", t: "Teslim Ediyoruz", d: "Domain + hosting kurulumu dahil, siteniz yayında. Siz sadece anahtarı alırsınız." },
];

function WebSitePage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft),_transparent_60%)]" />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center lg:px-8 lg:py-28">
          <span className="inline-flex rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-accent-foreground">Özel Tasarım Site</span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">3 Günde Hazır, Müşteri Çeken Web Sitenizle Dijitalde Fark Yaratın</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Markanıza özel tasarım. Siz vizyonunuzu anlatın, gerisini biz hallederiz.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#basla" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90">Hemen Başla — ₺9.900 <ArrowRight className="h-4 w-4" /></a>
            <a href="#surec" className="rounded-full border border-border px-7 py-3.5 text-sm font-semibold hover:bg-accent">Nasıl Çalışır?</a>
          </div>
        </div>
      </section>

      {/* Güven Unsurları Bar */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-5xl px-4 py-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-sm font-medium">
            {[
              { icon: "⚡", text: "3 İş Günü Teslim" },
              { icon: "📱", text: "Mobil Öncelikli" },
              { icon: "🔒", text: "SEO Kurulumu Dahil" },
              { icon: "🤝", text: "Sonradan Revizyon Hakkı" },
            ].map(item => (
              <div key={item.text} className="flex items-center gap-2 text-muted-foreground">
                <span>{item.icon}</span>
                <span>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Before/After */}
      <BeforeAfterSection
        title="Web Siteniz Müşteri Çekiyor mu?"
        beforeTitle="Şu an ne yaşıyorsunuz?"
        afterTitle="Bizimle 3 gün sonra:"
        items={[
          { before: "Eski site mobilde açılmıyor, müşteriler ilk bakışta kaçıyor", after: "Mobil öncelikli, hızlı açılan, modern site" },
          { before: "Google'da bulunmak zor, rakipler hep üstte", after: "Temel SEO kurulu, Google'a hazır yapı" },
          { before: "Müşteriler 'sizi nasıl bulabilirim?' diye soruyor", after: "WhatsApp butonu + form ile direkt müşteri gelir" },
          { before: "Site yaptırmak 2-3 ay sürer ve yüksek bütçe ister", after: "3 iş gününde teslim, ₺9.900'dan başlayan" },
        ]}
      />

      {/* Persona */}
      <PersonaSection
        forItems={[
          { icon: Globe, title: "Web'de hiç görünürlüğü olmayan yerel hizmet işletmeleri", desc: "Telefon rehberinde kalmak yetmez, Google'da olmak şart" },
          { icon: Monitor, title: "Eski / mobil uyumsuz sitesi olan KOBİ'ler", desc: "Müşteri ilk bakışta kaçıyorsa, site çalışmıyordur" },
          { icon: Smartphone, title: "Hızla dijitale açılmak isteyen yeni girişimler", desc: "3 günde yayında, hemen müşteri almaya başlayın" },
        ]}
        notForItems={[
          "E-ticaret / büyük ürün kataloğu arıyor (bu Starter için değil, Nihai Paket görüşerek belirlenir)",
          "Kendi kodlamasını yapmak istiyor",
        ]}
      />

      <section id="surec" className="border-y border-border/60 bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
          <h2 className="text-center text-4xl font-bold">3 Günde Nasıl Olur?</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map(s => (
              <div key={s.n} className="relative rounded-2xl border border-border bg-background p-7">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">{s.day}</span>
                <h3 className="mt-3 text-2xl font-bold">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
                <span className="absolute right-6 top-6 grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{s.n}</span>
              </div>
            ))}
          </div>
          <div className="mt-8 rounded-2xl border border-primary/20 bg-primary-soft px-7 py-5 text-center">
            <p className="text-sm text-muted-foreground"><span className="font-semibold text-foreground">Hızlı ama titiz sürecimizin sırrı:</span> Hazır, test edilmiş modüller + Markanıza özel dokunuş. Hız kaliteden ödün vermez.</p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
        <h2 className="text-center text-4xl font-bold">Size uygun paket</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <span className="text-sm font-semibold">Starter</span>
            <p className="mt-3 text-4xl font-bold">₺9.900</p>
            <p className="text-sm text-muted-foreground">Tek seferlik · KDV dahil değil</p>
            <p className="mt-2 text-sm text-muted-foreground">Hızlıca dijitale açılmak isteyen işletmeler için. Tek sayfalık, mobil uyumlu, WhatsApp entegreli.</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {["Marka analizine özel tasarım","Tek sayfa (one-pager) mimari","Mobil uyumlu","WhatsApp & iletişim butonu","Temel SEO","3 iş günü teslim","1 revizyon hakkı"].map(t => (
                <li key={t} className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-primary" /> {t}</li>
              ))}
            </ul>
            <a href="#basla" className="mt-7 block rounded-full bg-primary py-3 text-center text-sm font-semibold text-primary-foreground hover:opacity-90">Hemen Başla</a>
          </div>
          <div className="relative rounded-2xl border-2 border-primary bg-primary-soft p-8">
            <span className="absolute right-6 top-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">Nihai Paket</span>
            <span className="text-sm font-semibold text-primary">Kurumsal</span>
            <p className="mt-3 text-4xl font-bold">Teklif Al</p>
            <p className="text-sm text-muted-foreground">İhtiyacınıza özel fiyatlandırılır</p>
            <p className="mt-2 text-sm text-muted-foreground">Büyümeyi hedefleyen, blog/e-ticaret/CRM entegrasyonu isteyen markalar için. Tam kapsamlı dijital varlık.</p>
            <ul className="mt-6 space-y-2.5 text-sm">
              {["Kapsamlı marka kılavuzu entegrasyonu","Çok sayfalı site mimarisi","Özel mobil uygulama hissi","İleri düzey SEO + Analytics","WhatsApp Bot / CRM entegrasyonu","Blog veya e-ticaret modülü","3 ay ücretsiz bakım & destek","Sınırsız revizyon"].map(t => (
                <li key={t} className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-primary" /> {t}</li>
              ))}
            </ul>
            <a href="#basla" className="mt-7 block rounded-full bg-foreground py-3 text-center text-sm font-semibold text-background hover:opacity-90">Teklif Al</a>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-5 text-sm text-muted-foreground">
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Domain + hosting kurulumu dahil</span>
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> 3 ay bakım garantisi</span>
          <span className="flex items-center gap-1.5"><Check className="h-4 w-4 text-primary" /> Beğenmezsen geri öderiz</span>
        </div>
      </section>

      {/* Vaka Çalışması */}
      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Vaka Çalışması</span>
            <h2 className="mt-3 text-4xl font-bold">3 Günde Online: Bir Muhasebe Bürosu Hikayesi</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { label: "Problem", content: "Eski site vardı, mobilde açılmıyordu. Yeni müşteriler Google'da bulup giriyordu ama sitede kalacak bilgi yoktu. Form veya iletişim yok." },
              { label: "Çözüm", content: "Starter paket seçildi. 3 günde teslim: hizmetler, iletişim ve referanslar sayfası. Mobil uyumlu, WhatsApp butonu entegre." },
              { label: "Sonuç", content: "İlk ay 7 yeni müşteri formu web sitesinden geldi. Müşteriler artık direkt arayıp \"sizi internette buldum\" diyor." },
            ].map(c => (
              <div key={c.label} className="rounded-2xl border border-border bg-background p-7">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{c.label}</span>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{c.content}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">*Benzer hizmet sektörü işletmelerinin tipik deneyimi.</p>
        </div>
      </section>

      {/* Testimonials */}
      <section className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Müşteri Deneyimleri</span>
          <h2 className="mt-3 text-4xl font-bold">İşletmeler Ne Diyor?</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {[
            { quote: "İlk hafta 3 form geldi. Daha önce web sitemiz yoktu.", sector: "Muhasebe Bürosu", city: "Ankara", metric: "İlk haftada 3 form" },
            { quote: "3 günde hazır dediler, gerçekten 3 günde teslim aldık.", sector: "Hizmet Sektörü", city: "İzmir", metric: "3 günde teslim" },
          ].map(r => (
            <div key={r.quote} className="flex flex-col rounded-2xl border border-border bg-card p-7">
              <span className="text-3xl font-serif text-primary/30">"</span>
              <p className="mt-2 flex-1 text-base font-medium italic leading-relaxed">{r.quote}</p>
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">{r.sector}</span>
                  <span className="text-xs text-muted-foreground">{r.city}</span>
                </div>
                <span className="rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground">{r.metric}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-6 rounded-2xl border border-border bg-card p-7">
          <span className="text-3xl font-serif text-primary/30">"</span>
          <p className="mt-2 italic leading-relaxed text-muted-foreground">
            "Web siteniz müşteri çekmiyorsa, var olmakla yok olmak arasında fark kalmıyor."
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-sm font-bold text-primary">M</span>
            <div>
              <p className="text-sm font-semibold">Melih Hata</p>
              <p className="text-xs text-muted-foreground">Kurucu · Hisu Solutions</p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-center text-xs text-muted-foreground">*Tipik müşteri deneyimi. Bireysel sonuçlar farklılık gösterebilir.</p>
      </section>

      <FaqBlock items={faqs} />

      <section id="basla" className="mx-auto max-w-3xl px-4 py-20 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
          <h2 className="text-3xl font-bold">Başlamaya Hazır mısınız?</h2>
          <p className="mt-2 text-muted-foreground">Projenizi anlatın, size özel süreci birlikte tasarlayalım.</p>
          <div className="mt-8">
            <BookingForm
              source="websitesi"
              submitLabel="Proje Görüşmesi Ayarla"
              fields={[
                { name: "name", label: "Ad Soyad", required: true },
                { name: "email", label: "E-posta", type: "email", required: true },
                { name: "phone", label: "Telefon", type: "tel" },
                { name: "package", label: "Hangi paketi düşünüyorsunuz?", type: "select", options: ["Starter ₺9.900", "Nihai Paket — Teklif Al", "Karar vermedim"] },
                { name: "message", label: "Projenizi kısaca anlatın", type: "textarea" },
              ]}
            />
            <p className="mt-4 text-center text-sm">
              <a href="https://wa.me/905539003459" className="text-primary hover:underline">Direkt WhatsApp'tan yazın</a>
            </p>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
