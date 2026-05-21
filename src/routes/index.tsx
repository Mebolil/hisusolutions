import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { SiteLayout } from "@/components/site/SiteLayout";
import { FaqBlock, type FaqItem } from "@/components/site/FaqBlock";
import { ArrowRight, BarChart3, Monitor, Workflow, Sparkles, Mail, Share2, Bot, FileBarChart, Shield, CheckCircle2, Instagram, Lightbulb, Wrench, TrendingUp, Quote } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hisu Solutions — İşinizi Büyütün, Sistemi Biz Kurarız" },
      { name: "description", content: "Türkiye'nin AaaS platformu. BütçeCRM ile finansal kontrolü ele alın, otomasyon sistemleriyle zamandan kazanın, özel tasarım web sitenizle öne çıkın. Anahtar teslim." },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hisusolutions.com/" },
      { property: "og:site_name", content: "Hisu Solutions" },
      { property: "og:title", content: "Hisu Solutions — İşinizi Büyütün, Sistemi Biz Kurarız" },
      { property: "og:description", content: "Türkiye'nin AaaS platformu. BütçeCRM, otomasyon sistemleri ve özel tasarım web siteleri — işinize özel kurulur, teslim edilir." },
    ],
    links: [
      { rel: "canonical", href: "https://hisusolutions.com/" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "Hisu Solutions nedir?", "acceptedAnswer": { "@type": "Answer", "text": "Hisu Solutions, Türkiye'deki KOBİ'lere ve e-ticaret işletmelerine otomasyon sistemleri, BütçeCRM yazılımı ve özel tasarım web siteleri sunan bir AaaS (Automation as a Service) platformudur." } },
            { "@type": "Question", "name": "AaaS nedir, SaaS'tan farkı nedir?", "acceptedAnswer": { "@type": "Answer", "text": "AaaS — Automation as a Service — çözümlerin size özel kurulup teslim edildiği bir modeldir. SaaS'tan farkı, hazır şablon yerine işinize özel sistem tasarlanması ve kurulmasıdır. Siz sistemi öğrenmek zorunda değilsiniz." } },
            { "@type": "Question", "name": "Hisu Solutions hangi hizmetleri sunuyor?", "acceptedAnswer": { "@type": "Answer", "text": "Üç ana hizmet: BütçeCRM (KOBİ bütçe yönetim yazılımı, aylık ₺890), otomasyon sistemleri (iş süreçlerinin otomatikleştirilmesi, teklif bazlı) ve özel tasarım web siteleri (3 iş gününde teslim, ₺9.900'dan başlayan)." } },
            { "@type": "Question", "name": "Hisu Solutions ile nasıl iletişime geçebilirim?", "acceptedAnswer": { "@type": "Answer", "text": "hello@hisu.solutions adresinden e-posta, +90 553 900 34 59 numarasından WhatsApp veya telefon ile ulaşabilirsiniz. İletişim formumuzu da kullanabilirsiniz. 24 saat içinde dönüş yapıyoruz." } },
            { "@type": "Question", "name": "Hisu Solutions'u kim kurdu?", "acceptedAnswer": { "@type": "Answer", "text": "Hisu Solutions'u Melih Ata kurdu. Melih, 19 yaşında Türkiye'deki KOBİ'lere düşük maliyetle yüksek değerli dijital çözümler sunmak amacıyla Hisu Solutions'u hayata geçirdi." } },
            { "@type": "Question", "name": "Hisu Solutions neden kuruldu?", "acceptedAnswer": { "@type": "Answer", "text": "KOBİ'lerin pahalı kurumsal yazılımlara gerek duymadan kurumsal kalitede dijital altyapıya kavuşması için kuruldu. Düşük maliyet, yüksek değer felsefesiyle BütçeCRM ve otomasyon sistemleri geliştirildi." } },
          ]
        }),
      },
    ],
  }),
  component: HomePage,
});

const faqs: FaqItem[] = [
  { q: "Hisu Solutions nedir?", a: "Hisu Solutions, Türkiye'deki KOBİ'lere ve e-ticaret işletmelerine otomasyon sistemleri, BütçeCRM yazılımı ve özel tasarım web siteleri sunan bir AaaS (Automation as a Service) platformudur." },
  { q: "AaaS nedir, SaaS'tan farkı nedir?", a: "AaaS — Automation as a Service — çözümlerin size özel kurulup teslim edildiği bir modeldir. SaaS'tan farkı, hazır şablon yerine işinize özel sistem tasarlanması ve kurulmasıdır. Siz sistemi öğrenmek zorunda değilsiniz." },
  { q: "Hisu Solutions hangi hizmetleri sunuyor?", a: "Üç ana hizmet: BütçeCRM (KOBİ bütçe yönetim yazılımı, aylık ₺890), otomasyon sistemleri (iş süreçlerinin otomatikleştirilmesi, teklif bazlı) ve özel tasarım web siteleri (3 iş gününde teslim, ₺9.900'dan başlayan)." },
  { q: "Hisu Solutions ile nasıl iletişime geçebilirim?", a: "hello@hisu.solutions adresinden e-posta, +90 553 900 34 59 numarasından WhatsApp veya telefon ile ulaşabilirsiniz. İletişim formumuzu da kullanabilirsiniz. 24 saat içinde dönüş yapıyoruz." },
  { q: "Hisu Solutions'u kim kurdu?", a: "Hisu Solutions'u Melih Ata kurdu. Melih, 19 yaşında Türkiye'deki KOBİ'lere düşük maliyetle yüksek değerli dijital çözümler sunmak amacıyla Hisu Solutions'u hayata geçirdi." },
  { q: "Hisu Solutions neden kuruldu?", a: "KOBİ'lerin pahalı kurumsal yazılımlara gerek duymadan kurumsal kalitede dijital altyapıya kavuşması için kuruldu. Düşük maliyet, yüksek değer felsefesiyle BütçeCRM ve otomasyon sistemleri geliştirildi." },
];

const products = [
  { to: "/butceleme", icon: BarChart3, title: "BütçeCRM", desc: "E-ticaret ve KOBİ'ler için gelir, gider, stok ve reklam ROI'sini tek ekranda görün." },
  { to: "/web-sitesi", icon: Monitor, title: "Özel Tasarım Site", desc: "3 iş gününde marka DNA'nıza özel, modern ve dönüşüm odaklı web siteniz hazır." },
  { to: "/otomasyon", icon: Workflow, title: "Otomasyon Sistemleri", desc: "Tekrarlayan işleri sistemlere devredin. Zamanınızı sadece büyümeye ayırın." },
];

const categories = [
  { icon: Mail, title: "E-posta Otomasyonu", count: "12 hizmet", desc: "Toplu mail, autoresponder, drip kampanyalar" },
  { icon: Share2, title: "Sosyal Medya", count: "8 hizmet", desc: "İçerik planlama, otomatik paylaşım" },
  { icon: Workflow, title: "İş Akışı", count: "15 hizmet", desc: "CRM, fatura, stok yönetimi otomasyonları" },
  { icon: Bot, title: "Chatbot & AI", count: "6 hizmet", desc: "Müşteri destek botları, AI asistanlar" },
  { icon: FileBarChart, title: "Raporlama", count: "9 hizmet", desc: "Otomatik rapor oluşturma ve gönderim" },
  { icon: Shield, title: "Güvenlik", count: "7 hizmet", desc: "Yedekleme, izleme, uyarı otomasyonları" },
];

function HomePage() {
  const titles = useMemo(() => ["büyüyün", "kazanın", "planlayın", "yönetin", "satın"], []);
  const [titleNumber, setTitleNumber] = useState(0);

  useEffect(() => {
    const id = setTimeout(() => {
      setTitleNumber((prev) => (prev === titles.length - 1 ? 0 : prev + 1));
    }, 2000);
    return () => clearTimeout(id);
  }, [titleNumber, titles]);

  return (
    <SiteLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft),_transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 text-center lg:px-8 lg:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-sm font-medium text-accent-foreground">
            <Sparkles className="h-4 w-4" /> Türkiye'nin AaaS Platformu
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-bold tracking-tight md:text-7xl">
            KOBİ Otomasyon ve Yazılım Çözümleri | Hisu Solutions
          </h1>
          <h2 className="mx-auto mt-4 max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Sistemi Biz Kurarız.{" "}
            <br />
            <span className="text-muted-foreground font-normal">Siz sadece </span>
            <AnimatePresence mode="wait">
              <motion.span
                key={titleNumber}
                className="inline-block font-bold text-primary"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ type: "spring", stiffness: 60, damping: 14 }}
              >
                {titles[titleNumber]}
              </motion.span>
            </AnimatePresence>
          </h2>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground">
            SaaS değil, AaaS. Her çözümü işinize özel kuruyor, teslim ediyor ve yanınızda kalıyoruz.
            Teknoloji altyapınızı siz değil, biz taşırız.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <Link to="/iletisim" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90">
              Ücretsiz Görüşme Al <ArrowRight className="h-4 w-4" />
            </Link>
            <a href="#hizmetler" className="rounded-full border border-border bg-background px-7 py-3.5 text-sm font-semibold transition hover:bg-accent">
              Ürünleri İncele
            </a>
          </div>

          {/* Product cards */}
          <div id="hizmetler" className="mt-20 grid gap-5 md:grid-cols-3">
            {products.map((p) => (
              <Link key={p.to} to={p.to} className="group relative rounded-2xl border border-border bg-card p-7 text-left transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
                <div className="flex items-start justify-between">
                  <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"><p.icon className="h-6 w-6" /></span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-xs font-medium text-accent-foreground">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary" /> Aktif
                  </span>
                </div>
                <h3 className="mt-6 text-xl font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  İncele <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Kurucu */}
      <section className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-4 py-24 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Kurucu</span>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">Hisu Solutions'u Neden Kurdum?</h2>
          </div>

          {/* Kurucu kartı */}
          <div className="mt-12 flex justify-center">
            <div className="flex items-center gap-6 rounded-3xl border border-border bg-card px-8 py-6">
              <div className="grid h-20 w-20 shrink-0 place-items-center rounded-full bg-primary-soft text-4xl font-bold text-primary">M</div>
              <div>
                <p className="text-xl font-bold">Melih Ata</p>
                <p className="text-sm text-muted-foreground">Kurucu &amp; BütçeCRM Yapımcısı</p>
                <span className="mt-1.5 inline-block rounded-full bg-primary-soft px-3 py-0.5 text-xs font-semibold text-primary">19 yaşında</span>
              </div>
              <a
                href="https://www.instagram.com/melihaataa/"
                target="_blank"
                rel="noopener noreferrer"
                className="ml-4 grid h-10 w-10 place-items-center rounded-xl border border-border bg-background transition hover:border-primary/40 hover:text-primary"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* 3 kart */}
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: Lightbulb, t: "Pahalı yazılımlara gerek yok", d: "KOBİ'ler kurumsal kaliteyi yüksek bütçe olmadan hak ediyor." },
              { icon: Wrench, t: "No-code ile gerçek ürün", d: "BütçeCRM'i ve otomasyon sistemlerini doğru araçları seçerek inşa ettim." },
              { icon: TrendingUp, t: "Düşük maliyet, yüksek değer", d: "Bu Hisu'nun çekirdeği — her çözümde bu felsefeyle hareket ediyoruz." },
            ].map(c => (
              <div key={c.t} className="rounded-2xl border border-border bg-card p-7">
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"><c.icon className="h-6 w-6" /></span>
                <h3 className="mt-5 text-lg font-bold">{c.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
              </div>
            ))}
          </div>

          {/* Quote */}
          <div className="mt-10 rounded-2xl border border-primary/20 bg-primary-soft px-8 py-6">
            <Quote className="h-8 w-8 text-primary/40" />
            <p className="mt-3 text-lg font-medium leading-relaxed">
              KOBİ'lerin sisteme ihtiyacı var, karmaşıklığa değil.<br />
              Ben bunu mümkün kılmak için buradayım.
            </p>
            <p className="mt-3 text-sm font-semibold text-primary">— Melih Ata</p>
          </div>
        </div>
      </section>

      {/* Felsefe */}
      <section className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Felsefemiz</span>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">SaaS değil, AaaS</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Binlerce kullanıcıya aynı kalıbı sunan SaaS modelini değil, <strong className="text-foreground">Automation as a Service</strong> yaklaşımını benimsiyoruz.
            </p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { t: "Kişiye Özel", d: "Her otomasyon sizin iş sürecinize göre kurgulanır, hazır şablon değil." },
              { t: "Elden Teslim", d: "Kurulum, test ve optimizasyon dahil — siz sadece sonuçları görürsünüz." },
              { t: "Özenli Destek", d: "Sınırlı müşteri portföyü ile her projeye hak ettiği ilgiyi gösteriyoruz." },
            ].map((f) => (
              <div key={f.t} className="rounded-2xl border border-border bg-background p-7">
                <CheckCircle2 className="h-7 w-7 text-primary" />
                <h3 className="mt-4 text-xl font-bold">{f.t}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-bold md:text-5xl">Otomasyon Kategorileri</h2>
          <p className="mt-3 text-muted-foreground">İhtiyacınıza uygun kategoriyi seçin, size özel çözümü bulalım.</p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((c) => (
            <div key={c.title} className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40">
              <div className="flex items-center justify-between">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><c.icon className="h-5 w-5" /></span>
                <span className="text-xs font-medium text-muted-foreground">{c.count}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold">{c.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{c.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
          <div className="text-center">
            <h2 className="text-4xl font-bold md:text-5xl">Nasıl Çalışır?</h2>
            <p className="mt-3 text-muted-foreground">3 basit adımda otomasyonunuzu kurun.</p>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              { n: "01", t: "Hizmet Seçin", d: "Kategoriler arasından ihtiyacınıza uygun otomasyon hizmetini bulun ve seçin." },
              { n: "02", t: "Bilgilerinizi Girin", d: "Sadece gerekli bilgileri girin — API anahtarı, hesap bilgileri veya tercihler." },
              { n: "03", t: "Otomasyonunuz Hazır", d: "Otomasyon hesabınıza tanımlanır ve anında çalışmaya başlar." },
            ].map((s) => (
              <div key={s.n} className="relative rounded-2xl border border-border bg-background p-7">
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">Adım {s.n}</span>
                <h3 className="mt-3 text-2xl font-bold">{s.t}</h3>
                <p className="mt-2 text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <FaqBlock items={faqs} />

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
        <div className="overflow-hidden rounded-3xl bg-primary p-12 text-center text-primary-foreground md:p-16">
          <h2 className="text-4xl font-bold md:text-5xl">Birlikte büyüyelim.</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-90">Projenizi anlatın, size özel çözümü birlikte tasarlayalım.</p>
          <Link to="/iletisim" className="mt-8 inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 text-sm font-semibold text-foreground transition hover:opacity-90">
            Ücretsiz Görüşme Al <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </SiteLayout>
  );
}
