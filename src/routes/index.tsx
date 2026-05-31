import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { motion, AnimatePresence } from "framer-motion";
import { SiteLayout } from "@/components/site/SiteLayout";
import { FaqBlock, type FaqItem } from "@/components/site/FaqBlock";
import { ArrowRight, BarChart3, Monitor, Workflow, Sparkles, Mail, Share2, Bot, FileBarChart, Shield, CheckCircle2, Lightbulb, Wrench, TrendingUp, Quote, LayoutDashboard } from "lucide-react";
import { FloatingPaths } from "@/components/ui/background-paths";

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
            { "@type": "Question", "name": "Hisu Solutions nedir?", "acceptedAnswer": { "@type": "Answer", "text": "Hisu Solutions, Türkiye'deki KOBİ'lere ve e-ticaret işletmelerine otomasyon sistemleri, BütçeCRM yazılımı ve özel tasarım web siteleri sunan bir AaaS (Automation as a Service) platformudur." } },
            { "@type": "Question", "name": "AaaS nedir?", "acceptedAnswer": { "@type": "Answer", "text": "Sizin için özel kurulan, teslim edilen ve çalışır duruma getirilen bir sistem modeli. Hazır şablon değil — işinize özel kurulum. Siz sistemi öğrenmek zorunda değilsiniz, biz çalıştırırız." } },
            { "@type": "Question", "name": "Neden sadece yazılım satmıyorsunuz?", "acceptedAnswer": { "@type": "Answer", "text": "Çünkü biz sadece araç değil, sonuç satıyoruz. Sistemi kurup teslim etmek yetmez — çalışır ve size değer üretir halde olması gerekir. Bu yüzden kurulumdan sonra da yanınızdayız." } },
            { "@type": "Question", "name": "Hisu Solutions hangi hizmetleri sunuyor?", "acceptedAnswer": { "@type": "Answer", "text": "Dört ana hizmet: BütçeCRM (KOBİ bütçe yönetim yazılımı, aylık ₺890), otomasyon sistemleri (iş süreçlerinin otomatikleştirilmesi, teklif bazlı), özel tasarım web siteleri (3 iş gününde teslim, ₺9.900'dan başlayan) ve Uçtan Uca Yazılım (işletmenin tüm süreçlerini tek panelde toplayan, sektöre özel kurulan anahtar teslim yazılım çözümü)." } },
            { "@type": "Question", "name": "Hisu Solutions ile nasıl iletişime geçebilirim?", "acceptedAnswer": { "@type": "Answer", "text": "info@hisusolutions.com adresinden e-posta, +90 553 900 34 59 numarasından WhatsApp veya telefon ile ulaşabilirsiniz. İletişim formumuzu da kullanabilirsiniz. 24 saat içinde dönüş yapıyoruz." } },
            { "@type": "Question", "name": "Hisu Solutions'u kim kurdu?", "acceptedAnswer": { "@type": "Answer", "text": "Hisu Solutions'u Melih Hata kurdu. Melih, 19 yaşında Türkiye'deki KOBİ'lere doğru araçlarla yüksek değerli dijital çözümler sunmak amacıyla Hisu Solutions'u hayata geçirdi." } },
            { "@type": "Question", "name": "Hisu Solutions neden kuruldu?", "acceptedAnswer": { "@type": "Answer", "text": "KOBİ'lerin gereksiz karmaşıklık olmadan kurumsal kalitede dijital altyapıya kavuşması için kuruldu. Doğru araç, maksimum değer felsefesiyle BütçeCRM ve otomasyon sistemleri geliştirildi." } },
          ]
        }),
      },
    ],
  }),
  component: HomePage,
});

const faqs: FaqItem[] = [
  { q: "Hisu Solutions nedir?", a: "Hisu Solutions, Türkiye'deki KOBİ'lere ve e-ticaret işletmelerine otomasyon sistemleri, BütçeCRM yazılımı ve özel tasarım web siteleri sunan bir dijital çözüm platformudur." },
  { q: "AaaS nedir?", a: "Sizin için özel kurulan, teslim edilen ve çalışır duruma getirilen bir sistem modeli. Hazır şablon değil — işinize özel kurulum. Siz sistemi öğrenmek zorunda değilsiniz, biz çalıştırırız." },
  { q: "Neden sadece yazılım satmıyorsunuz?", a: "Çünkü biz sadece araç değil, sonuç satıyoruz. Sistemi kurup teslim etmek yetmez — çalışır ve size değer üretir halde olması gerekir. Bu yüzden kurulumdan sonra da yanınızdayız." },
  { q: "Hisu Solutions hangi hizmetleri sunuyor?", a: "Dört ana hizmet: BütçeCRM (KOBİ bütçe yönetim yazılımı, aylık ₺890), otomasyon sistemleri (iş süreçlerinin otomatikleştirilmesi, teklif bazlı), özel tasarım web siteleri (3 iş gününde teslim, ₺9.900'dan başlayan) ve Uçtan Uca Yazılım (işletmenin tüm süreçlerini tek panelde toplayan, sektöre özel kurulan anahtar teslim yazılım çözümü)." },
  { q: "Hisu Solutions ile nasıl iletişime geçebilirim?", a: "info@hisusolutions.com adresinden e-posta, +90 553 900 34 59 numarasından WhatsApp veya telefon ile ulaşabilirsiniz. İletişim formumuzu da kullanabilirsiniz. 24 saat içinde dönüş yapıyoruz." },
  { q: "Hisu Solutions'u kim kurdu?", a: "Hisu Solutions'u Melih Hata kurdu. Melih, 19 yaşında Türkiye'deki KOBİ'lere doğru araçlarla yüksek değerli dijital çözümler sunmak amacıyla Hisu Solutions'u hayata geçirdi." },
  { q: "Hisu Solutions neden kuruldu?", a: "KOBİ'lerin gereksiz karmaşıklık olmadan kurumsal kalitede dijital altyapıya kavuşması için kuruldu. Doğru araç, maksimum değer felsefesiyle BütçeCRM ve otomasyon sistemleri geliştirildi." },
];

const products = [
  { to: "/butceleme", icon: BarChart3, title: "BütçeCRM", desc: "Paranız nereye gidiyor? Gelir, gider, stok ve reklamlarınızın gelirini tek ekranda anlık görün." },
  { to: "/web-sitesi", icon: Monitor, title: "Özel Tasarım Site", desc: "3 günde hazır, müşteri çeken web sitenizle dijitalde yerinizi alın." },
  { to: "/otomasyon", icon: Workflow, title: "Otomasyon Sistemleri", desc: "Sıkıcı, tekrarlayan işleri otomatikleştirin — siz sadece büyüyün." },
  { to: "/uctan-uca-yazilim", icon: LayoutDashboard, title: "Uçtan Uca Yazılım", desc: "Tüm iş akışınız tek panelde. Sektörünüze özel kurulur, anahtarı size teslim edilir.", badge: "Yeni" },
];

const categories = [
  { icon: Mail, title: "E-posta Otomasyonu", count: "12 hizmet", desc: "Müşteriniz sipariş verdiğinde otomatik bilgi gitsin, siz uyurken bile iletişim kesilmesin." },
  { icon: Share2, title: "Sosyal Medya", count: "8 hizmet", desc: "İçerik takvimi kurun, paylaşımlar otomatik gitsin — her gün aktif görünün, her gün uğraşmadan." },
  { icon: Workflow, title: "İş Akışı", count: "15 hizmet", desc: "Stok, fatura, CRM — birbirini takip etsin, siz sadece karar verin." },
  { icon: Bot, title: "Chatbot & AI", count: "6 hizmet", desc: "Müşteri soruları 7/24 yanıtlansın, siz yokken bile satış ve destek eksiksiz sürsün." },
  { icon: FileBarChart, title: "Raporlama", count: "9 hizmet", desc: "Her Pazartesi sabahı geçen haftanın özeti e-postanıza gelsin, el ile hazırlamaya son." },
  { icon: Shield, title: "Güvenlik", count: "7 hizmet", desc: "Verileriniz yedeklensin, sistemleriniz izlensin — sorun olmadan önce haberiniz olsun." },
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
          <div id="hizmetler" className="mt-20 grid gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <Link key={p.to} to={p.to} className="group relative rounded-2xl border border-border bg-card p-7 text-left transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl">
                {"badge" in p && p.badge && (
                  <span className="absolute right-3 top-3 rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-primary-foreground">{p.badge}</span>
                )}
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
                <p className="text-xl font-bold">Melih Hata</p>
                <p className="text-sm text-muted-foreground">Kurucu &amp; BütçeCRM Yapımcısı</p>
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
              { icon: Wrench, t: "No-code ile gerçek ürün", d: "BütçeCRM'i ve otomasyon sistemlerini doğru araçları seçerek inşa ettim." },
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

      {/* Referanslar */}
      <section className="border-t border-border/60 bg-card">
        <div className="mx-auto max-w-7xl px-4 py-24 lg:px-8">
          <div className="text-center">
            <span className="text-sm font-semibold uppercase tracking-wider text-primary">Referanslar</span>
            <h2 className="mt-3 text-4xl font-bold md:text-5xl">Kimler Kullanıyor?</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Farklı sektörlerden işletmeler Hisu Solutions ile dijital altyapılarını kurdu.</p>
          </div>
          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              { quote: "Ay sonu kâr hesabı artık 5 dakika sürüyor.", sector: "E-ticaret İşletmesi", city: "İstanbul", metric: "4 saat → 5 dk" },
              { quote: "3 günde web sitemiz hazırdı, ilk hafta 3 form geldi.", sector: "Muhasebe Bürosu", city: "Ankara", metric: "İlk haftada 3 form" },
              { quote: "Sipariş takibi için harcadığım 2 saati artık işime ayırıyorum.", sector: "Lojistik Firması", city: "İzmir", metric: "2 saat/gün kazanıldı" },
            ].map((r) => (
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
