import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BookingForm } from "@/components/site/BookingForm";
import { FaqBlock, type FaqItem } from "@/components/site/FaqBlock";
import { ArrowRight, LayoutDashboard, Users, Workflow, Smartphone, LineChart, KeyRound } from "lucide-react";

export const Route = createFileRoute("/uctan-uca-yazilim")({
  head: () => ({
    meta: [
      { title: "Uçtan Uca Yazılım — İhtiyacınıza Özel Sistem | Hisu Solutions" },
      { name: "description", content: "Stoktan satışa, müşteriden rapora — işletmenizin tüm süreçleri tek panelde. KOBİ'ler için sektöre özel, anahtar teslim özel yazılım çözümü. Hisu Solutions tarafından 2-3 haftada kurulur ve teslim edilir." },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hisusolutions.com/uctan-uca-yazilim" },
      { property: "og:site_name", content: "Hisu Solutions" },
      { property: "og:title", content: "Uçtan Uca Yazılım — İhtiyacınıza Özel Sistem | Hisu Solutions" },
      { property: "og:description", content: "İşletmenizin tüm süreçleri tek panelde. Sektörünüze özel kurulan, 2-3 haftada teslim edilen anahtar teslim yazılım çözümü." },
      { property: "og:image", content: "https://hisusolutions.com/og-image.png" },
    ],
    links: [
      { rel: "canonical", href: "https://hisusolutions.com/uctan-uca-yazilim" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "Uçtan uca yazılım nedir?", "acceptedAnswer": { "@type": "Answer", "text": "Uçtan uca yazılım; bir işletmenin tüm iş akışını — stok takibi, sipariş yönetimi, müşteri portalı, raporlama, ekip iletişimi — tek bir özel panelde toplayan, sıfırdan sektöre özel geliştirilen yazılım çözümüdür. Hazır SaaS ürünü değil, sadece o işletme için kurulan sistemdir." } },
            { "@type": "Question", "name": "Hisu Solutions uçtan uca yazılım hizmetini nasıl sunar?", "acceptedAnswer": { "@type": "Answer", "text": "Hisu Solutions üç aşamada teslim eder: (1) Keşif ve iş haritası — işletmenin tüm süreci A'dan Z'ye çizilir. (2) Özel tasarım ve kurulum — sektöre özel admin panel, kullanıcı rolleri, formlar ve otomasyon kurulur. (3) Eğitim ve teslim — ekip canlı eğitimle sistemi devralar, 30 gün ücretsiz revizyon hakkı tanınır." } },
            { "@type": "Question", "name": "Uçtan uca yazılım ile hazır SaaS arasındaki fark nedir?", "acceptedAnswer": { "@type": "Answer", "text": "Hazır SaaS tüm işletmelere aynı ürünü sunar ve aylık abonelik gerektirir. Uçtan uca yazılım yalnızca o işletme için tasarlanır; stok takibinden müşteri portalına, raporlamadan otomasyon tetikleyicilerine kadar her modül işletmenin kendi terminolojisi ve iş akışına göre kurulur. Anahtar müşteriye teslim edilir, aylık abonelik yoktur." } },
            { "@type": "Question", "name": "Sistem ne kadar sürede teslim edilir?", "acceptedAnswer": { "@type": "Answer", "text": "Net belirlenmiş kapsam için 2-3 hafta içinde teslim edilir. Keşif görüşmesinde birinci faz kapsamı çizilir; bu faz 14-18 iş gününde tamamlanır. Ek modüller ikinci fazda eklenir." } },
            { "@type": "Question", "name": "Hangi sektörler için uçtan uca yazılım kurulabilir?", "acceptedAnswer": { "@type": "Answer", "text": "Üretim ve imalat (mobilya, tekstil, metal), çok şubeli hizmet işletmeleri (restoran zinciri, teknik servis, kuru temizleme), B2B distribütörler, klinikler ve eğitim merkezleri başlıca sektörlerdir. Her sektöre ait örnek: teknik serviste QR kodlu cihaz takibi + müşteri portalı; mobilya imalatında sipariş-üretim-kargo akışı; restoran zincirinde şube bazlı stok ve ciro paneli." } },
            { "@type": "Question", "name": "Sistem kurulduktan sonra kod ve veriler kime ait olur?", "acceptedAnswer": { "@type": "Answer", "text": "Yazılım ve tüm veriler müşteriye aittir. Sistem müşterinin kendi sunucusunda (veya seçilen hosting'de) çalışır; kaynak kodu müşteriye teslim edilir. Hisu Solutions'tan bağımsız çalışır, aylık lisans veya kilit yoktur." } },
          ]
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Service",
          "name": "Uçtan Uca Yazılım — İhtiyacınıza Özel Sistem",
          "alternateName": ["Özel Yazılım", "Anahtar Teslim Yazılım", "KOBİ Yazılım Çözümü"],
          "description": "KOBİ'ler için sektöre özel, uçtan uca, anahtar teslim özel yazılım çözümü. Stok, sipariş, müşteri portalı, raporlama ve otomasyon tek panelde toplanır. 2-3 haftada teslim.",
          "provider": {
            "@type": "Organization",
            "name": "Hisu Solutions",
            "url": "https://hisusolutions.com",
            "foundingDate": "2024",
            "founder": { "@type": "Person", "name": "Melih Hata" },
            "contactPoint": { "@type": "ContactPoint", "telephone": "+90-553-900-34-59", "contactType": "sales", "availableLanguage": "Turkish" }
          },
          "areaServed": { "@type": "Country", "name": "Türkiye" },
          "serviceType": "Custom Software Development",
          "hasOfferCatalog": {
            "@type": "OfferCatalog",
            "name": "Uçtan Uca Yazılım Modülleri",
            "itemListElement": [
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Keşif ve İş Haritası" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Özel Admin Panel Kurulumu" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Müşteri Portalı" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Otomasyon Entegrasyonu" } },
              { "@type": "Offer", "itemOffered": { "@type": "Service", "name": "Ekip Eğitimi ve Teslim" } }
            ]
          }
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Ana Sayfa", "item": "https://hisusolutions.com" },
            { "@type": "ListItem", "position": 2, "name": "Uçtan Uca Yazılım", "item": "https://hisusolutions.com/uctan-uca-yazilim" }
          ]
        }),
      },
    ],
  }),
  component: UctanUcaYazilimPage,
});

const faqs: FaqItem[] = [
  { q: "Uçtan uca yazılım nedir?", a: "Bir işletmenin tüm iş akışını — stok, sipariş, müşteri, raporlama, ekip iletişimi — tek özel panelde toplayan, sıfırdan sektöre özel geliştirilen yazılım. Hazır SaaS değil, sadece sizin işletmeniz için." },
  { q: "Hazır yazılım almak daha ucuz değil mi?", a: "Hazır yazılım lisans olarak başta ucuz görünür, ama aylık ödersiniz ve işinizin en fazla %60'ına uyar. Uçtan uca yazılımda bir kere ödersiniz, %100 size uyar, kod tamamen sizin. Uzun vadede çok daha ekonomiktir." },
  { q: "Sistem ne kadar sürede teslim edilir?", a: "Net belirlenmiş kapsam için 2-3 hafta. Keşif görüşmesinde 1. faz kapsamı belirlenir; bu faz 14-18 günde tamamlanır. Ek modüller 2. fazda eklenir." },
  { q: "Ekibim teknik değil, kullanabilir mi?", a: "Sistem sıfır teknik bilgi gerektirecek şekilde tasarlanır. Teslimde 2 saatlik canlı eğitim veriyoruz. Sonraki 30 gün her küçük soruda yanınızdayız." },
  { q: "Kod ve veriler kime ait olur?", a: "Her şey size ait. Sistem kendi sunucunuzda çalışır, kaynak kodu size teslim edilir. Hisu Solutions'tan bağımsız çalışır — aylık abonelik veya kilit yoktur." },
  { q: "Sonradan özellik ekletmek istesem?", a: "İlk 30 gün ücretsiz. Sonrası için aylık küçük geliştirme paketi veya saatlik destek ile çalışabilirsiniz. Başka bir geliştirici de çalışabilir — kod sizin." },
];

const pains = [
  "Stok Excel'de, müşteri WhatsApp'ta, fatura muhasebede — hangisi güncel kimse bilmiyor.",
  "Ekibin her biri farklı yerde tutuyor, ay sonu raporunda tartışma çıkıyor.",
  "Hazır yazılımların yarısı işinize uymuyor, yarısı için fazladan ödüyorsunuz.",
  "Yazılım firması teklif veriyor ama 6 aydan önce teslim yok, fiyat 3'e katlanıyor.",
  "Müşteri 'siparişim ne durumda?' diye arıyor, cevap vermek için 3 kişi konuşmak gerekiyor.",
];

const steps = [
  { n: 1, t: "Keşif & İş Haritası", d: "İşinizi başından sonuna birlikte çiziyoruz: hangi adımda kim ne yapıyor, hangi veri nereye gidiyor, hangi rapor ne için lazım. Görüşme sonunda işinizin tam akış haritası çıkar." },
  { n: 2, t: "Özel Tasarım & Kurulum", d: "Akış haritasına göre size özel admin panel, kullanıcı rolleri, formlar, raporlar ve otomasyonlar kurulur. Sektörünüzün diline göre tasarlanır." },
  { n: 3, t: "Eğitim & Teslim", d: "Sistemi ekibinize canlı kullandırarak teslim ediyoruz. 30 gün boyunca her küçük talep ücretsiz. Anahtar sizde, biz arka plandayız." },
];

const solutions = [
  { i: LayoutDashboard, t: "Tek Komuta Paneli", d: "Sipariş, stok, müşteri, üretim, rapor — hepsi tek ekrandan. Excel ve WhatsApp grupları emekli olur." },
  { i: Users, t: "Rol Bazlı Erişim", d: "Muhasebeci sadece finansı, ekip sadece kendi görevini, siz her şeyi görürsünüz. Veri kaosu biter." },
  { i: Workflow, t: "İçinde Otomasyon", d: "Sipariş gelir → stoktan düşer → müşteriye WhatsApp gider → muhasebeye yazılır. Tek tıkla, tetik sizin elinizde." },
  { i: Smartphone, t: "Müşteri Portalı (İsteğe Bağlı)", d: "Müşteriniz kendi siparişini, ödemesini, durumunu kendisi görebilir. 'Siparişim ne oldu?' aramaları yarıya iner." },
  { i: LineChart, t: "Anlık Raporlar", d: "Bugün ne sattınız, hangi müşteriden ne alacaksınız, stokta ne bitiyor — hepsi gerçek zamanlı." },
  { i: KeyRound, t: "Anahtar Tamamen Sizde", d: "Sistem sizin, kod sizin, veriler sizin. Hisu Solutions'tan bağımsız çalışır — aylık abonelik yok." },
];

const cases = [
  {
    sector: "Teknik Servis",
    problem: "Tamire gelen cihazları kağıda yazıyorduk, müşteri arayınca durumu bulamıyorduk.",
    solution: "QR kodlu cihaz takibi + müşteri SMS portalı + servis ekibi mobil paneli. 12 günde teslim.",
    result: "\"Cihazım ne durumda\" aramaları yarıya indi. Ortalama servis süresi 3 günden 1.5 güne düştü.",
  },
  {
    sector: "Mobilya İmalatçısı",
    problem: "Sipariş, üretim, kumaş stoğu, kargo — hepsi farklı defterde. Müşteri için 3 kişi aranıyordu.",
    solution: "Sipariş → Üretim aşaması → Stok düşümü → Kargo bildirimi akışı. Müşteri portalında canlı durum. 14 gün.",
    result: "Üretim planlaması günlüğe geçti. Geç teslim oranı %40'tan %8'e indi.",
  },
  {
    sector: "Restoran Zinciri",
    problem: "3 şube, 3 ayrı kasa, 3 ayrı stok. Ay sonu hangisi kâr ediyor karışıyordu.",
    solution: "Şube bazlı stok + günlük ciro paneli + reçete bazlı maliyet + sahip paneli. 16 gün.",
    result: "Her sabah 9'da dün gece hangi şubeden ne kazanıldığı e-postada. Karar süresi günlüğe indi.",
  },
];

function UctanUcaYazilimPage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft),_transparent_60%)]" />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center lg:px-8 lg:py-28">
          <span className="inline-flex rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-accent-foreground">Talep Ne İse Arz Da O · Proje Bazlı · Anahtar Teslim</span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">Anlat.<br /><span className="text-primary">Biz Kuralım.</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Talep ne ise arz da o. İşletmenizin ihtiyacını anlatın — biz sıfırdan kurar, eğitir ve teslim ederiz.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#anlat" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90">Ücretsiz Keşif Görüşmesi Al <ArrowRight className="h-4 w-4" /></a>
            <a href="#cozumler" className="rounded-full border border-border px-7 py-3.5 text-sm font-semibold hover:bg-accent">Neler Yapıyoruz?</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
        <h2 className="text-center text-3xl font-bold md:text-4xl">4 Farklı Programda 4 Farklı Hesap mı Tutuyorsunuz?</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {pains.slice(0, 4).map(p => (
            <div key={p} className="rounded-xl border border-border bg-card px-5 py-4 text-sm font-medium">{p}</div>
          ))}
          <div className="rounded-xl border border-border bg-card px-5 py-4 text-sm font-medium sm:col-span-2">{pains[4]}</div>
        </div>
        <div className="mt-8 rounded-2xl border border-primary/20 bg-primary-soft px-7 py-5 text-center">
          <p className="text-sm text-muted-foreground">Bu maddelerden 2'sine <span className="font-semibold text-foreground">"evet"</span> diyorsanız, işiniz aslında çalışmıyor — siz işi çalıştırıyorsunuz. Sistemi biz kuralım, siz işinize geri dönün.</p>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
          <h2 className="text-center text-4xl font-bold">Talep Ne İse, Arz Da O</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {steps.map(s => (
              <div key={s.n} className="relative rounded-2xl border border-border bg-background p-7">
                <h3 className="text-2xl font-bold">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
                <span className="absolute right-6 top-6 grid h-9 w-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">{s.n}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="cozumler" className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
        <h2 className="text-center text-4xl font-bold">Bir Sistemde Ne Olur?</h2>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {solutions.map(s => (
            <div key={s.t} className="rounded-2xl border border-border bg-card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><s.i className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-bold">{s.t}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
          <h2 className="text-center text-4xl font-bold">3 Sektör, 3 Farklı Sistem — Hepsi Tek Mantıkla</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {cases.map(c => (
              <div key={c.sector} className="rounded-2xl border border-border bg-background p-7">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">{c.sector}</span>
                <div className="mt-4 space-y-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Problem</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{c.problem}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Çözüm</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{c.solution}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sonuç</p>
                    <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{c.result}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="anlat" className="mx-auto max-w-3xl px-4 py-20 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
          <h2 className="text-3xl font-bold">İşinizi Anlatın, Haritasını Birlikte Çıkaralım</h2>
          <p className="mt-2 text-muted-foreground">Ücretsiz 45 dakikalık keşif görüşmesi. Görüşme sonunda işinizin akış haritası ve somut bir yol haritası elinizde olacak.</p>
          <div className="mt-8">
            <BookingForm
              source="uctan-uca-yazilim"
              submitLabel="Keşif Görüşmesi Al"
              fields={[
                { name: "name", label: "Ad Soyad", required: true },
                { name: "company", label: "Firma Adı", required: true },
                { name: "sector", label: "Sektörünüz", type: "select", required: true, options: ["Üretim/İmalat", "Teknik Servis", "Çok Şubeli Hizmet", "E-ticaret", "Lojistik", "Klinik/Eğitim", "Diğer"] },
                { name: "team_size", label: "Kaç kişilik ekip?", type: "select", options: ["1-3", "4-10", "11-25", "25+"] },
                { name: "email", label: "E-posta", type: "email", required: true },
                { name: "phone", label: "Telefon", type: "tel", required: true },
                { name: "pain", label: "Tek panele taşımak istediğiniz en büyük 1 süreç nedir?", type: "textarea", required: true },
              ]}
            />
            <p className="mt-4 text-center text-sm">
              <a href="https://wa.me/905539003459" className="text-primary hover:underline">Direkt WhatsApp'tan yazın</a>
            </p>
          </div>
        </div>
      </section>

      <FaqBlock items={faqs} />

      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="rounded-3xl bg-primary p-12 text-center text-primary-foreground md:p-16">
          <h2 className="text-3xl font-bold md:text-4xl">Yazılım Almıyorsunuz — Şirketinizin Çalışma Şeklini Satın Alıyorsunuz.</h2>
          <a href="#anlat" className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 text-sm font-semibold text-foreground transition hover:opacity-90">Ücretsiz Keşif Görüşmesi Al <ArrowRight className="h-4 w-4" /></a>
        </div>
      </section>
    </SiteLayout>
  );
}
