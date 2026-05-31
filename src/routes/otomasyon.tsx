import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { BookingForm } from "@/components/site/BookingForm";
import { FaqBlock, type FaqItem } from "@/components/site/FaqBlock";
import { BeforeAfterSection } from "@/components/site/BeforeAfterSection";
import { PersonaSection } from "@/components/site/PersonaSection";
import { ArrowRight, Mail, FileBarChart, Users, Workflow, MessageSquare, ListTodo, Quote, Clock, Repeat } from "lucide-react";

export const Route = createFileRoute("/otomasyon")({
  head: () => ({
    meta: [
      { title: "İş Süreci Otomasyonu — AaaS Çözümleri | Hisu Solutions" },
      { name: "description", content: "Sipariş takibi, müşteri bildirimleri, faturalama ve raporlama süreçlerini otomatikleştirin. KOBİ'ler ve e-ticaret işletmeleri için Türkiye'de anahtar teslim otomasyon sistemleri." },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hisusolutions.com/otomasyon" },
      { property: "og:site_name", content: "Hisu Solutions" },
      { property: "og:title", content: "İş Süreci Otomasyonu — AaaS Çözümleri | Hisu Solutions" },
      { property: "og:description", content: "Tekrarlayan iş süreçlerini otomatikleştirin. Şirketinize özel, ölçeklenebilir otomasyon sistemleri Hisu Solutions tarafından kurulur ve teslim edilir." },
      { property: "og:image", content: "https://hisusolutions.com/og-image.png" },
    ],
    links: [
      { rel: "canonical", href: "https://hisusolutions.com/otomasyon" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "Otomasyon sistemleri nasıl çalışır?", "acceptedAnswer": { "@type": "Answer", "text": "Hisu Solutions sürecinizi analiz eder, şirketinize özel bir otomasyon mimarisi tasarlar ve sistemi kurup teslim eder. Keşif görüşmesi → özel sistem tasarımı → kurulum ve teslim şeklinde ilerler." } },
            { "@type": "Question", "name": "Otomasyon kurulumu ne kadar sürer?", "acceptedAnswer": { "@type": "Answer", "text": "Projenin kapsamına göre değişir. Basit e-posta ve bildirim otomasyonları 3-5 iş gününde teslim edilir. Karmaşık CRM ve entegrasyon projeleri 2-4 haftaya uzayabilir." } },
            { "@type": "Question", "name": "Hangi iş süreçleri otomatikleştirilebilir?", "acceptedAnswer": { "@type": "Answer", "text": "Sipariş takibi, müşteri bildirimleri, faturalama, raporlama, CRM süreçleri, WhatsApp mesajlaşması, stok güncellemeleri ve ekip içi görev atamaları otomatikleştirilebilir." } },
            { "@type": "Question", "name": "Otomasyon hizmetinin fiyatı nedir?", "acceptedAnswer": { "@type": "Answer", "text": "Şirketinize özel tasarlandığı için fiyatlandırma keşif görüşmesinde belirlenir. Ücretsiz keşif görüşmesi talep edebilirsiniz." } },
          ]
        }),
      },
    ],
  }),
  component: OtomasyonPage,
});

const faqs: FaqItem[] = [
  { q: "Otomasyon sistemleri nasıl çalışır?", a: "Hisu Solutions sürecinizi analiz eder, şirketinize özel bir otomasyon mimarisi tasarlar ve sistemi kurup teslim eder. Keşif görüşmesi → özel sistem tasarımı → kurulum ve teslim şeklinde ilerler." },
  { q: "Sistemin kurulumu ne kadar sürer?", a: "Ortalama 5 iş günü. Mevcut yazılımlarınıza bağlanıyoruz. Karmaşık entegrasyonlar 2-4 haftaya uzayabilir — keşif görüşmesinde netleşir." },
  { q: "Otomasyon bozulursa ne olur?", a: "İzleme sistemimiz var. Hata olursa 24 saat içinde müdahale ediyoruz. Siz fark etmeden çözülmüş olur." },
  { q: "Ekibim teknik değil, öğrenebilir mi?", a: "Otomasyon arka planda çalışır — ekibiniz fark etmez bile. Gerektiğinde 30 dakikalık teslim eğitimi veriyoruz." },
  { q: "Otomasyon hizmetinin fiyatı nedir?", a: "Şirketinize özel tasarlandığı için fiyatlandırma keşif görüşmesinde belirlenir. Ücretsiz keşif görüşmesi talep edebilirsiniz." },
];

const steps = [
  { n: 1, t: "Keşif Görüşmesi", d: "Mevcut iş süreçlerinizi, zaman kaynaklarınızı ve önceliklerinizi birlikte analiz ederiz." },
  { n: 2, t: "Özel Sistem Tasarımı", d: "Şirketinize özel otomasyon mimarisi tasarlanır. Hangi araçlar, hangi entegrasyonlar — hepsi sürecinize göre." },
  { n: 3, t: "Kurulum & Teslim", d: "Sistemi kurar, test eder ve ekibinize teslim ederiz. Siz sadece çalışan sistemi devralırsınız." },
];

const solutions = [
  { i: Mail, t: "Müşterilerinizle Otomatik İletişim", d: "Sipariş onayı, kargo bilgisi, özel teklifler — doğru zamanda, otomatik." },
  { i: FileBarChart, t: "Raporlar Sizi Bekler", d: "Günlük, haftalık, aylık raporlar hazırlanır ve gönderilir. Elle hazırlamaya gerek kalmaz." },
  { i: Users, t: "Müşteri Takibi Sistematik Hale Gelir", d: "Lead takibi, teklif süreci ve müşteri iletişimi düzenli çalışır, hiçbir fırsat kaçmaz." },
  { i: Workflow, t: "Farklı Programlarınız Artık Konuşuyor", d: "Veri taşıma bitti, sistemler birbirini besliyor. Manuel kopyala-yapıştır sona erer." },
  { i: MessageSquare, t: "WhatsApp'tan Otomatik Bilgilendirme", d: "7/24 yanıt, müşteri memnuniyeti artar. Cevap vermeden müşteri bilgilendirilmiş olur." },
  { i: ListTodo, t: "Ekip İçi İş Akışı Otomatik Tetiklenir", d: "Onaylar, görev atamaları, hatırlatmalar — koordinasyonu siz değil, sistem sağlar." },
];

const scenarios = [
  {
    title: "Sipariş Akışı",
    desc: "Müşteri sipariş verir → otomatik onay WhatsApp → stoktan düşülür → kargo firmasına bildirim → müşteriye takip kodu.",
    time: "Tahmini Kazanılan Zaman: Haftalık 6–8 Saat",
  },
  {
    title: "Randevu Hatırlatma",
    desc: "Randevu oluşturulur → 1 gün önce SMS/WhatsApp → katılım oranı artar, iptal azalır.",
    time: "Tahmini Kazanılan Zaman: Haftalık 3–5 Saat",
  },
  {
    title: "Haftalık Rapor",
    desc: "Her Pazartesi sabahı geçen haftanın satış/gider özeti e-postanıza gelir. Elle hazırlamaya gerek yok.",
    time: "Tahmini Kazanılan Zaman: Haftalık 2–4 Saat",
  },
];

function OtomasyonPage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft),_transparent_60%)]" />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center lg:px-8 lg:py-28">
          <span className="inline-flex rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-accent-foreground">AaaS — Automation as a Service</span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">Sıkıcı İşleri Bize Bırakın, Siz Sadece Büyüyün</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Tekrarlayan görevlerinizi otomatikleştirerek haftada onlarca saat kazanın.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#anlat" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90">Görüşme Zamanı Seç <ArrowRight className="h-4 w-4" /></a>
            <a href="#cozumler" className="rounded-full border border-border px-7 py-3.5 text-sm font-semibold hover:bg-accent">Ne Yapıyoruz?</a>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Ücretsiz keşif görüşmesi · Görüşmede fiyat belirlenir · Yükümlülük yok</p>
        </div>
      </section>

      {/* Before/After */}
      <BeforeAfterSection
        title="Tanıdık Geliyor mu?"
        beforeTitle="Şu an ne yaşıyorsunuz?"
        afterTitle="Bizimle 30 gün sonra:"
        items={[
          { before: "Siparişleri tek tek takip etmek için günde 2 saat harcıyorsunuz", after: "Sipariş akışı otomatik: onay → stok → kargo → müşteri bildirimi" },
          { before: "Müşterilere hatırlatmaları manuel gönderiyorsunuz, bazen unutuyorsunuz", after: "Randevu hatırlatmaları zamanında otomatik, katılım artıyor" },
          { before: "Rapor hazırlamak haftalık 2-4 saat alıyor", after: "Her Pazartesi sabahı rapor e-postanızda, siz uyurken hazırlandı" },
          { before: "Farklı programlar arasında veri kopyalıyorsunuz", after: "Sistemler birbiriyle konuşuyor, copy-paste bitti" },
        ]}
      />

      {/* Persona */}
      <PersonaSection
        forItems={[
          { icon: Clock, title: "Günde 1 saatten fazla tekrarlayan aynı işleri yapan", desc: "Bu zaman otomasyon ile geri kazanılabilir" },
          { icon: Repeat, title: "Birden fazla platform / yazılım arasında veri taşıyan", desc: "Copy-paste bitti, sistemler birbirini besliyor" },
          { icon: Users, title: "Büyümek için zamana ihtiyacı olan ama zamanı olmayan KOBİ", desc: "Zamanınızı satışa, ürüne, büyümeye ayırın" },
        ]}
        notForItems={[
          "Tek seferlik bir işlem için (otomasyon sürekli çalışan süreçler içindir)",
          "Sıfırdan yazılım geliştirme arıyor",
        ]}
      />

      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
          <h2 className="text-center text-4xl font-bold">Şirketinize Özel, Baştan Sona Biz Kurarız</h2>
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
        <h2 className="text-center text-4xl font-bold">Çözüm Alanlarımız</h2>
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

      {/* Örnek Otomasyon Senaryoları */}
      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
          <h2 className="text-center text-4xl font-bold">Hangi İşleri Otomatikleştirebilirsiniz?</h2>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {scenarios.map(s => (
              <div key={s.title} className="rounded-2xl border border-border bg-background p-7">
                <h3 className="text-xl font-bold">{s.title}</h3>
                <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
                <div className="mt-5 inline-flex rounded-full bg-primary-soft px-3 py-1.5 text-xs font-semibold text-primary">⏱ {s.time}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Vaka Çalışması */}
      <section className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Vaka Çalışması</span>
          <h2 className="mt-3 text-4xl font-bold">Haftada 10 Saat Kazandı: Bir E-Ticaret İşletmesi</h2>
        </div>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {[
            { label: "Problem", content: "Günde 2 saat sipariş takibi, stok güncelleme, müşteri bildirimleri. Tatile çıkamıyor, hasta olunca iş duruyor." },
            { label: "Çözüm", content: "Sipariş akış otomasyonu + WhatsApp entegrasyonu kuruldu. 5 günde teslim, sıfır teknik bilgi gerekti." },
            { label: "Sonuç", content: '"Günlük 2 saat → 15 dakika." İşletme sahibi o zamanı yeni ürün araştırmasına ve pazarlamaya ayırdı.' },
          ].map(c => (
            <div key={c.label} className="rounded-2xl border border-border bg-card p-7">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">{c.label}</span>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{c.content}</p>
            </div>
          ))}
        </div>
        <p className="mt-6 text-center text-xs text-muted-foreground">*Senaryo, benzer e-ticaret işletmelerinin yaygın deneyimlerine dayanmaktadır.</p>
      </section>

      {/* Testimonials */}
      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Kullanıcı Deneyimleri</span>
            <h2 className="mt-3 text-4xl font-bold">İşletmeler Ne Diyor?</h2>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {[
              { quote: "Günlük 2 saat sipariş takibi vardı. Şimdi 15 dakika.", sector: "E-Ticaret", city: "İstanbul", metric: "2 saat → 15 dk" },
              { quote: "Hasta olduğumda iş durmuyordu artık. Sistem kendisi çalışıyor.", sector: "Perakende", city: "İzmir", metric: "7/24 kesintisiz" },
            ].map(r => (
              <div key={r.quote} className="flex flex-col rounded-2xl border border-border bg-background p-7">
                <Quote className="h-7 w-7 text-primary/40" />
                <p className="mt-4 flex-1 text-base font-medium italic leading-relaxed">"{r.quote}"</p>
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
          <p className="mt-4 text-center text-xs text-muted-foreground">*Tipik müşteri deneyimi. Bireysel sonuçlar farklılık gösterebilir.</p>
        </div>
      </section>

      <section id="anlat" className="mx-auto max-w-3xl px-4 py-20 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
          <h2 className="text-3xl font-bold">İhtiyacınızı Anlatın</h2>
          <p className="mt-2 text-muted-foreground">Hangi süreci otomatikleştirmek istediğinizi kısaca yazın. Görüşmeden önce size özel düşünelim.</p>
          <div className="mt-8">
            <BookingForm
              source="otomasyon"
              submitLabel="Görüşme Zamanı Seç"
              fields={[
                { name: "name", label: "Ad Soyad", required: true },
                { name: "company", label: "Firma Adı" },
                { name: "email", label: "E-posta", type: "email", required: true },
                { name: "phone", label: "Telefon", type: "tel" },
                { name: "process", label: "Şu an en çok zaman harcadığınız iş süreci nedir?", type: "textarea" },
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
          <h2 className="text-3xl font-bold md:text-4xl">Zamanınız İşinizi Büyütmeye Yeter. Gerisini Bize Bırakın.</h2>
        </div>
      </section>
    </SiteLayout>
  );
}
