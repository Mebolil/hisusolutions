import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { FaqBlock, type FaqItem } from "@/components/site/FaqBlock";

export const Route = createFileRoute("/hakkimizda")({
  head: () => ({
    meta: [
      { title: "Hakkımızda — Hisu Solutions | AaaS Platform" },
      { name: "description", content: "Hisu Solutions, Türkiye'deki KOBİ'lere otomasyon, bütçe yönetimi ve web tasarım hizmetleri sunan bir AaaS platformudur. Düşük maliyetle yüksek değer üretiyoruz." },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hisusolutions.com/hakkimizda" },
      { property: "og:site_name", content: "Hisu Solutions" },
      { property: "og:title", content: "Hakkımızda — Hisu Solutions | AaaS Platform" },
      { property: "og:description", content: "Hisu Solutions, Türkiye'deki KOBİ'lere otomasyon, bütçe yönetimi ve web tasarım hizmetleri sunan bir AaaS platformudur." },
    ],
    links: [
      { rel: "canonical", href: "https://hisusolutions.com/hakkimizda" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "Hisu Solutions kimdir?", "acceptedAnswer": { "@type": "Answer", "text": "Hisu Solutions, Türkiye'deki küçük ve orta ölçekli işletmelere otomasyon, bütçe yönetimi ve web tasarım hizmetleri sunan bir AaaS platformudur. Düşük maliyetle yüksek değer üretme felsefesiyle çalışır." } },
            { "@type": "Question", "name": "Hisu ne anlama geliyor?", "acceptedAnswer": { "@type": "Answer", "text": "Hisu; Hacking, Innovation, Solutions ve Ultimate kelimelerinin baş harflerinden oluşur. Her harf bir çalışma prensibini temsil eder: yenilikçi yöntemler, özgün çözümler ve en yüksek değer." } },
            { "@type": "Question", "name": "Hisu Solutions ile çalışmak nasıl başlar?", "acceptedAnswer": { "@type": "Answer", "text": "Ücretsiz keşif görüşmesi ile başlar. İhtiyacınızı anlatırsınız, size özel çözümü birlikte tasarlarız ve süreci başlatırız. info@hisusolutions.com veya WhatsApp (+90 553 900 34 59) üzerinden ulaşabilirsiniz." } },
          ]
        }),
      },
    ],
  }),
  component: AboutPage,
});

const faqs: FaqItem[] = [
  { q: "Hisu Solutions kimdir?", a: "Hisu Solutions, Türkiye'deki küçük ve orta ölçekli işletmelere otomasyon, bütçe yönetimi ve web tasarım hizmetleri sunan bir AaaS platformudur. Düşük maliyetle yüksek değer üretme felsefesiyle çalışır." },
  { q: "Hisu ne anlama geliyor?", a: "Hisu; Hacking, Innovation, Solutions ve Ultimate kelimelerinin baş harflerinden oluşur. Her harf bir çalışma prensibini temsil eder: yenilikçi yöntemler, özgün çözümler ve en yüksek değer." },
  { q: "Hisu Solutions ile çalışmak nasıl başlar?", a: "Ücretsiz keşif görüşmesi ile başlar. İhtiyacınızı anlatırsınız, size özel çözümü birlikte tasarlarız ve süreci başlatırız. info@hisusolutions.com veya WhatsApp (+90 553 900 34 59) üzerinden ulaşabilirsiniz." },
];

const letters = [
  { l: "H", t: "Hacking", d: "Düşük maliyetli, yenilikçi yöntemlerle hızlı büyüme sağlama. Kısıtları değil, fırsatları görme." },
  { l: "I", t: "Innovation", d: "Mevcut sorunlara yeni ve değerli çözümler getirme. Alışılageldik yoldan gitmeme." },
  { l: "S", t: "Solutions", d: "Her iş kolunda somut, uygulanabilir çözümler. Teori değil, sonuç." },
  { l: "U", t: "Ultimate", d: "En üst seviye değeri en erişilebilir maliyetle sunma. Müşterimiz kazanırsa biz kazanırız." },
];

function AboutPage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft),_transparent_60%)]" />
        <div className="mx-auto max-w-4xl px-4 py-20 text-center lg:px-8 lg:py-28">
          <span className="inline-flex rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-accent-foreground">Biz Kimiz?</span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">Hisu Solutions Kimdir | İstanbul Teknoloji Girişimi</h1>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">Daha Az Kaynakla <span className="text-primary">Daha Fazla Değer</span> Üretiyoruz</h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Hisu Solutions, Türkiye'deki KOBİ'lere otomasyon, bütçe yönetimi ve kurumsal web tasarım hizmetleri sunan bir AaaS platformudur. Büyük bütçeler gerektirmeden işletmelerin teknolojiyle büyümesini sağlamak için kuruldu.</p>
        </div>
      </section>

      <section className="border-y border-border/60 bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold">Hisu Ne Demek?</h2>
            <p className="mt-2 text-muted-foreground">Bir isim değil, bir felsefe.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {letters.map(x => (
              <div key={x.l} className="rounded-2xl border border-border bg-background p-7">
                <span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-2xl font-bold text-primary-foreground">{x.l}</span>
                <h3 className="mt-5 text-xl font-bold">{x.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{x.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-20 lg:px-8">
        <h2 className="text-4xl font-bold">Neden Hisu?</h2>
        <p className="mt-5 text-lg text-muted-foreground">Çoğu teknoloji şirketi size yazılım satar ve sizi kendi halinize bırakır. Biz farklı çalışıyoruz.</p>
        <p className="mt-4 text-lg text-muted-foreground">AaaS — Automation as a Service anlayışıyla her çözümü işinize özel tasarlıyor, kuruyoruz ve yanınızda kalıyoruz. Sistemi siz öğrenmek zorunda değilsiniz. Biz kuruyoruz, siz kullanıyorsunuz.</p>
        <p className="mt-4 text-lg font-semibold">Düşük maliyet. Yüksek değer. Yenilikçi çözüm.</p>
      </section>

      <section className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
          <h2 className="text-center text-4xl font-bold">Bugüne Kadar</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            {[
              { n: "3", t: "Aktif Ürün & Hizmet" },
              { n: "%100", t: "Anahtar Teslim Süreç" },
              { n: "AaaS", t: "SaaS Değil, Şirketinize Özel" },
            ].map(s => (
              <div key={s.t} className="rounded-2xl border border-border bg-background p-8 text-center">
                <p className="text-5xl font-bold text-primary">{s.n}</p>
                <p className="mt-3 text-sm font-medium text-muted-foreground">{s.t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqBlock items={faqs} />

      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="rounded-3xl bg-primary p-12 text-center text-primary-foreground md:p-16">
          <h2 className="text-4xl font-bold">Birlikte Büyüyelim</h2>
          <p className="mt-3 opacity-90">Ürünlerimizi inceleyin ya da doğrudan görüşme talep edin.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/" className="rounded-full bg-background px-7 py-3.5 text-sm font-semibold text-foreground hover:opacity-90">Ürünleri İncele</Link>
            <Link to="/iletisim" className="rounded-full border border-primary-foreground/40 px-7 py-3.5 text-sm font-semibold hover:bg-white/10">Görüşme Al</Link>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
