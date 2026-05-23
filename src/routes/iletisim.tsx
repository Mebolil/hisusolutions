import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { LeadForm } from "@/components/site/LeadForm";
import { FaqBlock, type FaqItem } from "@/components/site/FaqBlock";
import { Mail, Phone, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/iletisim")({
  head: () => ({
    meta: [
      { title: "İletişim — Ücretsiz Keşif Görüşmesi | Hisu Solutions" },
      { name: "description", content: "Projenizi anlatın, size en uygun çözümü birlikte tasarlayalım. 24 saat içinde geri dönüş. Otomasyon, BütçeCRM ve web tasarım hizmetleri için ücretsiz görüşme alın." },
      { name: "robots", content: "index, follow" },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://hisusolutions.com/iletisim" },
      { property: "og:site_name", content: "Hisu Solutions" },
      { property: "og:title", content: "İletişim — Ücretsiz Keşif Görüşmesi | Hisu Solutions" },
      { property: "og:description", content: "Projenizi anlatın, size en uygun çözümü birlikte tasarlayalım. 24 saat içinde geri dönüş garantisi." },
    ],
    links: [
      { rel: "canonical", href: "https://hisusolutions.com/iletisim" },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            { "@type": "Question", "name": "Hisu Solutions ile nasıl iletişime geçebilirim?", "acceptedAnswer": { "@type": "Answer", "text": "info@hisusolutions.com adresine e-posta gönderebilir, +90 553 900 34 59 numarasını WhatsApp veya telefon olarak kullanabilir ya da bu sayfadaki iletişim formunu doldurabilirsiniz." } },
            { "@type": "Question", "name": "Keşif görüşmesi ne kadar sürer?", "acceptedAnswer": { "@type": "Answer", "text": "İlk keşif görüşmesi genellikle 30 dakika sürer. Bu görüşmede ihtiyaçlarınız, beklentileriniz ve size uygun çözüm seçenekleri değerlendirilir." } },
            { "@type": "Question", "name": "Görüşme ücretli mi?", "acceptedAnswer": { "@type": "Answer", "text": "Hayır. İlk keşif görüşmesi tamamen ücretsizdir. Formu doldurun ya da WhatsApp'tan yazın, 24 saat içinde dönüş yaparız." } },
          ]
        }),
      },
    ],
  }),
  component: ContactPage,
});

const faqs: FaqItem[] = [
  { q: "Hisu Solutions ile nasıl iletişime geçebilirim?", a: "info@hisusolutions.com adresine e-posta gönderebilir, +90 553 900 34 59 numarasını WhatsApp veya telefon olarak kullanabilir ya da bu sayfadaki iletişim formunu doldurabilirsiniz." },
  { q: "Keşif görüşmesi ne kadar sürer?", a: "İlk keşif görüşmesi genellikle 30 dakika sürer. Bu görüşmede ihtiyaçlarınız, beklentileriniz ve size uygun çözüm seçenekleri değerlendirilir." },
  { q: "Görüşme ücretli mi?", a: "Hayır. İlk keşif görüşmesi tamamen ücretsizdir. Formu doldurun ya da WhatsApp'tan yazın, 24 saat içinde dönüş yaparız." },
];

function ContactPage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft),_transparent_60%)]" />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center lg:px-8 lg:py-24">
          <span className="inline-flex rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-accent-foreground">İletişim</span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">Hisu Solutions İletişim | Demo ve Teklif Al</h1>
          <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">İşinizi Büyütmek İçin <span className="text-primary">İlk Adımı Atın</span></h2>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Ücretsiz keşif görüşmesi ayarlayın. İhtiyacınızı anlatın, size özel çözümü birlikte tasarlayalım. 24 saat içinde geri dönüyoruz.</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 pb-20 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="rounded-3xl border border-border bg-card p-8 md:p-10">
              <LeadForm
                source="iletisim"
                fields={[
                  { name: "name", label: "Ad Soyad", required: true },
                  { name: "company", label: "Firma Adı" },
                  { name: "email", label: "E-posta", type: "email", required: true },
                  { name: "phone", label: "Telefon", type: "tel" },
                  { name: "topic", label: "Hangi konuda görüşelim?", type: "select", options: ["BütçeCRM","Web Sitesi","Otomasyon","Genel Danışmanlık","Fiyat Bilgisi","Diğer / Karar vermedim"] },
                  { name: "message", label: "Mesajınız", type: "textarea" },
                ]}
                submitLabel="Ücretsiz Görüşme Talep Et"
              />
              <p className="mt-3 text-center text-sm text-muted-foreground">Kredi kartı gerekmez · Sadece 15 dakika</p>
            </div>
          </div>
          <div className="space-y-4 lg:col-span-2">
            <a href="https://wa.me/905539003459" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><MessageCircle className="h-5 w-5" /></span>
              <div><p className="font-semibold">Hızlı Yanıt — WhatsApp</p><p className="text-sm text-muted-foreground">Genellikle 1 saat içinde dönüş</p></div>
            </a>
            <a href="mailto:info@hisusolutions.com" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><Mail className="h-5 w-5" /></span>
              <div><p className="font-semibold">Detaylı Sorular için E-posta</p><p className="text-sm text-muted-foreground">info@hisusolutions.com</p></div>
            </a>
            <a href="tel:+905539003459" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><Phone className="h-5 w-5" /></span>
              <div><p className="font-semibold">Hemen Konuşalım</p><p className="text-sm text-muted-foreground">+90 553 900 34 59</p></div>
            </a>
          </div>
        </div>
      </section>

      <FaqBlock items={faqs} />
    </SiteLayout>
  );
}
