import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { SiteLayout } from "@/components/site/SiteLayout";
import { FaqBlock, type FaqItem } from "@/components/site/FaqBlock";
import { ArrowRight, BarChart3, Sparkles, CheckCircle2, Lightbulb, Wrench, TrendingUp, Quote, LayoutDashboard, Megaphone, Package, Clock } from "lucide-react";
import { FloatingPaths } from "@/components/ui/background-paths";
import { ElegantShape } from "@/components/ui/shape-landing-hero";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hisu Solutions — E-Ticaret KOBİ'leri İçin Pusla ve Özel Yazılım" },
      { name: "description", content: "Trendyol ve Hepsiburada satıcıları için reklam ROAS takibi, stok ve gelir yönetimi. Pusla ile Meta/Google/TikTok hangi satışı getiriyor görün. Uçtan uca özel yazılım çözümleri." },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hisusolutions.com/" },
      { property: "og:site_name", content: "Hisu Solutions" },
      { property: "og:title", content: "Hisu Solutions — E-Ticaret KOBİ'leri İçin Pusla ve Özel Yazılım" },
      { property: "og:description", content: "Trendyol ve Hepsiburada satıcıları için reklam ROAS takibi ve finansal yönetim. Pusla + Uçtan Uca Yazılım." },
      { property: "og:image", content: "https://hisusolutions.com/og-image.png" },
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
            { "@type": "Question", "name": "Hisu Solutions nedir?", "acceptedAnswer": { "@type": "Answer", "text": "Hisu Solutions, Türkiye'deki KOBİ'lere ve e-ticaret işletmelerine otomasyon sistemleri, Pusla yazılımı ve özel tasarım web siteleri sunan bir AaaS (Automation as a Service) platformudur." } },
            { "@type": "Question", "name": "AaaS nedir?", "acceptedAnswer": { "@type": "Answer", "text": "Sizin için özel kurulan, teslim edilen ve çalışır duruma getirilen bir sistem modeli. Hazır şablon değil — işinize özel kurulum. Siz sistemi öğrenmek zorunda değilsiniz, biz çalıştırırız." } },
            { "@type": "Question", "name": "Neden sadece yazılım satmıyorsunuz?", "acceptedAnswer": { "@type": "Answer", "text": "Çünkü biz sadece araç değil, sonuç satıyoruz. Sistemi kurup teslim etmek yetmez — çalışır ve size değer üretir halde olması gerekir. Bu yüzden kurulumdan sonra da yanınızdayız." } },
            { "@type": "Question", "name": "Hisu Solutions hangi hizmetleri sunuyor?", "acceptedAnswer": { "@type": "Answer", "text": "İki ana hizmet: Pusla (e-ticaret KOBİ'leri için reklam ROAS takibi ve finansal yönetim yazılımı, aylık ₺629) ve Uçtan Uca Yazılım (işletmenin tüm süreçlerini tek panelde toplayan, sektöre özel kurulan anahtar teslim yazılım çözümü, proje bazlı fiyatlandırma)." } },
            { "@type": "Question", "name": "Hisu Solutions ile nasıl iletişime geçebilirim?", "acceptedAnswer": { "@type": "Answer", "text": "info@hisusolutions.com adresinden e-posta, +90 553 900 34 59 numarasından WhatsApp veya telefon ile ulaşabilirsiniz. İletişim formumuzu da kullanabilirsiniz. 24 saat içinde dönüş yapıyoruz." } },
            { "@type": "Question", "name": "Hisu Solutions'u kim kurdu?", "acceptedAnswer": { "@type": "Answer", "text": "Hisu Solutions'u Melih Hata kurdu. Melih, 19 yaşında Türkiye'deki KOBİ'lere doğru araçlarla yüksek değerli dijital çözümler sunmak amacıyla Hisu Solutions'u hayata geçirdi." } },
            { "@type": "Question", "name": "Hisu Solutions neden kuruldu?", "acceptedAnswer": { "@type": "Answer", "text": "KOBİ'lerin gereksiz karmaşıklık olmadan kurumsal kalitede dijital altyapıya kavuşması için kuruldu. Doğru araç, maksimum değer felsefesiyle Pusla ve otomasyon sistemleri geliştirildi." } },
          ]
        }),
      },
    ],
  }),
  component: HomePage,
});

const faqs: FaqItem[] = [
  { q: "Hisu Solutions nedir?", a: "Hisu Solutions, Türkiye'deki KOBİ'lere ve e-ticaret işletmelerine otomasyon sistemleri, Pusla yazılımı ve özel tasarım web siteleri sunan bir dijital çözüm platformudur." },
  { q: "AaaS nedir?", a: "Sizin için özel kurulan, teslim edilen ve çalışır duruma getirilen bir sistem modeli. Hazır şablon değil — işinize özel kurulum. Siz sistemi öğrenmek zorunda değilsiniz, biz çalıştırırız." },
  { q: "Neden sadece yazılım satmıyorsunuz?", a: "Çünkü biz sadece araç değil, sonuç satıyoruz. Sistemi kurup teslim etmek yetmez — çalışır ve size değer üretir halde olması gerekir. Bu yüzden kurulumdan sonra da yanınızdayız." },
  { q: "Hisu Solutions hangi hizmetleri sunuyor?", a: "İki ana hizmet: Pusla (e-ticaret KOBİ'leri için reklam ROAS takibi ve finansal yönetim yazılımı, aylık ₺629) ve Uçtan Uca Yazılım (işletmenin tüm süreçlerini tek panelde toplayan, sektöre özel kurulan anahtar teslim yazılım çözümü, proje bazlı fiyatlandırma)." },
  { q: "Hisu Solutions ile nasıl iletişime geçebilirim?", a: "info@hisusolutions.com adresinden e-posta, +90 553 900 34 59 numarasından WhatsApp veya telefon ile ulaşabilirsiniz. İletişim formumuzu da kullanabilirsiniz. 24 saat içinde dönüş yapıyoruz." },
  { q: "Hisu Solutions'u kim kurdu?", a: "Hisu Solutions'u Melih Hata kurdu. Melih, 19 yaşında Türkiye'deki KOBİ'lere doğru araçlarla yüksek değerli dijital çözümler sunmak amacıyla Hisu Solutions'u hayata geçirdi." },
  { q: "Hisu Solutions neden kuruldu?", a: "KOBİ'lerin gereksiz karmaşıklık olmadan kurumsal kalitede dijital altyapıya kavuşması için kuruldu. Doğru araç, maksimum değer felsefesiyle Pusla ve otomasyon sistemleri geliştirildi." },
];

const products = [
  {
    to: "/pusla",
    icon: BarChart3,
    title: "Pusla",
    badge: "Beta ₺499/ay",
    desc: "Trendyol, Hepsiburada ve kendi sitenizde sattığınız geliri; Meta, Google ve TikTok reklamlarınızın ROAS'ını; stok ve giderleri tek ekranda görün.",
    bullets: ["Reklam ROAS takibi (Türkiye'de rakiplerde yok)", "Kritik stok uyarısı", "Ay sonu raporu 5 dakika"],
    cta: "15 Gün Ücretsiz Dene",
    featured: true,
  },
  {
    to: "/uctan-uca-yazilim",
    icon: LayoutDashboard,
    title: "Uçtan Uca Yazılım",
    badge: "Proje Bazlı",
    desc: "Anlat, biz kuralım. İşletmenizin tam ihtiyacına göre tasarlanan, 2-3 haftada teslim edilen özel yazılım.",
    bullets: ["Talep ne ise arz da o", "Kod ve veriler size ait", "Aylık abonelik yok"],
    cta: "Ücretsiz Keşif Görüşmesi",
    featured: false,
  },
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
        <div className="absolute inset-0 -z-10">
          <FloatingPaths position={1} />
          <FloatingPaths position={-1} />
        </div>
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <ElegantShape
            delay={0.3}
            width={580}
            height={130}
            rotate={12}
            gradient="from-primary/[0.10]"
            className="left-[-8%] top-[18%]"
          />
          <ElegantShape
            delay={0.5}
            width={460}
            height={110}
            rotate={-14}
            gradient="from-emerald-400/[0.08]"
            className="right-[-4%] top-[68%]"
          />
          <ElegantShape
            delay={0.4}
            width={280}
            height={72}
            rotate={-8}
            gradient="from-teal-400/[0.10]"
            className="left-[8%] bottom-[8%]"
          />
          <ElegantShape
            delay={0.6}
            width={190}
            height={54}
            rotate={20}
            gradient="from-violet-500/[0.07]"
            className="right-[18%] top-[12%]"
          />
          <ElegantShape
            delay={0.7}
            width={140}
            height={38}
            rotate={-25}
            gradient="from-primary/[0.08]"
            className="left-[24%] top-[6%]"
          />
        </div>
        <div className="mx-auto max-w-7xl px-4 pb-20 pt-20 text-center lg:px-8 lg:pt-28">
          <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-4 py-1.5 text-sm font-medium text-accent-foreground">
            <Sparkles className="h-4 w-4" /> Türkiye'nin AaaS Platformu
          </span>
          <h1 className="mx-auto mt-6 max-w-4xl text-5xl font-bold tracking-tight md:text-6xl">
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
          </h1>
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
          <div id="hizmetler" className="mt-20 grid gap-5 grid-cols-1 sm:grid-cols-2 max-w-4xl mx-auto">
            {products.map((p) => (
              <Link key={p.to} to={p.to} className={`group relative rounded-2xl border p-7 text-left transition hover:-translate-y-1 hover:shadow-xl ${p.featured ? "border-primary/40 bg-primary-soft" : "border-border bg-card hover:border-primary/40"}`}>
                <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">{p.badge}</span>
                <span className="grid h-12 w-12 place-items-center rounded-xl bg-background text-primary"><p.icon className="h-6 w-6" /></span>
                <h3 className="mt-5 text-xl font-bold">{p.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{p.desc}</p>
                <ul className="mt-4 space-y-1.5">
                  {p.bullets.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
                <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {p.cta} <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Pusla Spotlight */}
      <section className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-6xl px-4 py-20 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Ana Ürün</span>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">
              Trendyol'dan mı Satıyorsunuz?<br />
              <span className="text-primary">Meta'ya Reklam mı Veriyorsunuz?</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Hangisi gerçekten para kazandırıyor? Pusla, reklam ROAS takibini finansal yönetime entegre eden Türkiye'deki tek yazılım. Paraşüt, Uyumsoft ve Logo İşbaşı'nda bu özellik yok.
            </p>
          </div>
          {/* Video */}
          <div className="mt-12 relative">
            <div className="relative overflow-hidden rounded-2xl border border-primary/20 shadow-2xl shadow-primary/10 ring-1 ring-primary/10">
              <div className="absolute inset-0 -z-10 bg-gradient-to-br from-primary/5 to-transparent" />
              <video
                src="/videos/pusla-16x9.mp4"
                autoPlay
                muted
                loop
                playsInline
                className="w-full rounded-2xl"
                aria-label="Pusla ürün videosu — reklam ROAS takibi, stok ve finansal yönetim"
              />
              <div className="absolute inset-x-0 bottom-0 h-20 rounded-b-2xl bg-gradient-to-t from-card/80 to-transparent" />
            </div>
            <div className="absolute -inset-px -z-10 rounded-2xl bg-gradient-to-br from-primary/20 via-transparent to-emerald-400/10 blur-xl" />
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <div className="rounded-2xl border-2 border-primary/30 bg-primary-soft p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-background text-primary"><Megaphone className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-bold">Reklam ROAS Takibi</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Meta, Google, TikTok kampanyalarınızın hangisinin satış getirdiğini görün. Rakip yazılımlarda bu modül yok.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><Package className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-bold">Stok + Sipariş</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Kritik stok uyarısı, FIFO maliyet, otomatik düşüm. Sipariş iptali tarihe karışır.</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><Clock className="h-5 w-5" /></span>
              <h3 className="mt-4 text-lg font-bold">Ay Sonu 5 Dakikada</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">Ay sonu raporu 4 saatten 5 dakikaya iner. Excel'e gerek kalmaz, raporunuz hazır bekler.</p>
            </div>
          </div>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link to="/pusla" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:opacity-90">
              15 Gün Ücretsiz Dene <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/pusla" className="rounded-full border border-border bg-background px-7 py-3.5 text-sm font-semibold transition hover:bg-accent">
              Detayları Gör
            </Link>
          </div>
          <p className="mt-4 text-center text-xs text-muted-foreground">Kredi kartı gerekmez · Kurulum 5 dakika · İstediğin zaman iptal</p>
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
              <img src="/images/melih-hata.png" alt="Melih Hata" className="h-20 w-20 shrink-0 rounded-full object-cover object-top" />
              <div>
                <p className="text-xl font-bold">Melih Hata</p>
                <p className="text-sm text-muted-foreground">Kurucu &amp; Pusla Yapımcısı</p>
                <span className="mt-1.5 inline-block rounded-full bg-primary-soft px-3 py-0.5 text-xs font-semibold text-primary">19 yaşında</span>
              </div>
              <div className="ml-4 flex gap-2">
                <a
                  href="https://www.instagram.com/melihaataa/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background transition hover:border-primary/40 hover:text-primary"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
                <a
                  href="https://www.linkedin.com/in/melih-hata"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-background transition hover:border-primary/40 hover:text-primary"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* 3 kart */}
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {[
              { icon: Lightbulb, t: "Karmaşıklığa gerek yok", d: "KOBİ'ler kurumsal kaliteyi gereksiz karmaşıklık olmadan hak ediyor." },
              { icon: Wrench, t: "Önce kendimiz kullandık", d: "Pusla ve otomasyon sistemlerini bizzat geliştirip işletiyoruz — müşteriye sunmadan önce sahadayız." },
              { icon: TrendingUp, t: "Doğru sistem, ölçeklenebilir sonuç", d: "Bu Hisu'nun çekirdeği — her çözümde bu felsefeyle hareket ediyoruz." },
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
              KOBİ'ler kurumsal kaliteyi hak ediyor.<br />
              Biz bunu gereksiz karmaşıklık olmadan mümkün kılıyoruz.
            </p>
            <p className="mt-3 text-sm font-semibold text-primary">— Melih Hata</p>
          </div>
        </div>
      </section>

      {/* Felsefe */}
      <section className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Felsefemiz</span>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">Neden Biz?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Büyük yazılım şirketleri herkese aynı ürünü satar. Biz Türkiye'deki e-ticaret KOBİ'lerini dinleyerek geliştiriyoruz.
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

      {/* Beta Framing */}
      <section className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Şu An Neredeyiz?</span>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">Beta Sürecinde, Dürüstçe</h2>
          </div>
          <div className="mt-10 rounded-2xl border border-primary/20 bg-primary-soft p-8 text-center">
            <p className="text-lg font-medium leading-relaxed">Onlarca doğrulanmış müşteri yorumumuz yok — ve bunu söylemekten çekinmiyoruz.</p>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">Pusla beta sürecinde. İlk kullanıcılar ürünü şekillendiriyor. 15 gün ücretsiz deneyin — beğenmezseniz ödemezsiniz. Risk tamamen bizde.</p>
            <Link to="/pusla" className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
              Pusla'i Ücretsiz Dene <ArrowRight className="h-4 w-4" />
            </Link>
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
