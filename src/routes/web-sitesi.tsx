import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { LeadForm } from "@/components/site/LeadForm";
import { ArrowRight, Check } from "lucide-react";

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
    ],
    links: [
      { rel: "canonical", href: "https://hisusolutions.com/web-sitesi" },
    ],
  }),
  component: WebSitePage,
});

const steps = [
  { n: 1, day: "Gün 1", t: "Marka Analizi", d: "Logonuzu, renklerinizi, referans sitelerinizi ve hedef kitlenizi birlikte ele alırız." },
  { n: 2, day: "Gün 2", t: "Strateji & Tasarım", d: "Sitenizin yapısına, sayfalarına ve mesajına karar veririz. İlk taslak gün sonunda elinizde olur." },
  { n: 3, day: "Gün 3", t: "Teslim", d: "Geri bildirimlerinizle son düzenlemeler yapılır. Siteniz domain'inize bağlanır." },
];

function WebSitePage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft),_transparent_60%)]" />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center lg:px-8 lg:py-28">
          <span className="inline-flex rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-accent-foreground">Özel Tasarım Site</span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">3 Günde Web Siteniz Hazır.<br/><span className="text-primary">Siz Sadece Vizyonunuzu Anlatın.</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Şablon değil, marka DNA'nıza özel. Biz tasarlar, biz kurar, anahtarı size teslim ederiz.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#basla" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90">Hemen Başla — ₺9.900 <ArrowRight className="h-4 w-4" /></a>
            <a href="#surec" className="rounded-full border border-border px-7 py-3.5 text-sm font-semibold hover:bg-accent">Nasıl Çalışır?</a>
          </div>
        </div>
      </section>

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
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
        <h2 className="text-center text-4xl font-bold">Size uygun paket</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-8">
            <span className="text-sm font-semibold">Starter</span>
            <p className="mt-3 text-4xl font-bold">₺9.900</p>
            <p className="text-sm text-muted-foreground">Tek seferlik · KDV dahil değil</p>
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
            <ul className="mt-6 space-y-2.5 text-sm">
              {["Kapsamlı marka kılavuzu entegrasyonu","Çok sayfalı site mimarisi","Özel mobil uygulama hissi","İleri düzey SEO + Analytics","WhatsApp Bot / CRM entegrasyonu","Blog veya e-ticaret modülü","3 ay ücretsiz bakım & destek","Sınırsız revizyon"].map(t => (
                <li key={t} className="flex gap-2"><Check className="h-5 w-5 shrink-0 text-primary" /> {t}</li>
              ))}
            </ul>
            <a href="#basla" className="mt-7 block rounded-full bg-foreground py-3 text-center text-sm font-semibold text-background hover:opacity-90">Teklif Al</a>
          </div>
        </div>
      </section>

      <section id="basla" className="mx-auto max-w-3xl px-4 py-20 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
          <h2 className="text-3xl font-bold">Başlamaya Hazır mısınız?</h2>
          <p className="mt-2 text-muted-foreground">Projenizi anlatın, size özel süreci birlikte tasarlayalım.</p>
          <div className="mt-8">
            <LeadForm
              source="websitesi"
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
