import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { LeadForm } from "@/components/site/LeadForm";
import { Mail, Phone, MessageCircle } from "lucide-react";

export const Route = createFileRoute("/iletisim")({
  head: () => ({
    meta: [
      { title: "İletişim — Ücretsiz Görüşme Al | Hisu Solutions" },
      { name: "description", content: "Projenizi anlatın, size en uygun çözümü birlikte tasarlayalım. 24 saat içinde dönüş." },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft),_transparent_60%)]" />
        <div className="mx-auto max-w-3xl px-4 py-20 text-center lg:px-8 lg:py-24">
          <span className="inline-flex rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-accent-foreground">İletişim</span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl"><span className="text-primary">Ücretsiz</span> Görüşme Al</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Projenizi anlatın, size en uygun çözümü birlikte tasarlayalım. 24 saat içinde dönüş yapıyoruz.</p>
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
                  { name: "topic", label: "Hangi konuda görüşelim?", type: "select", options: ["BütçeCRM","Web Sitesi","Otomasyon","Diğer / Karar vermedim"] },
                  { name: "message", label: "Mesajınız", type: "textarea" },
                ]}
              />
            </div>
          </div>
          <div className="space-y-4 lg:col-span-2">
            <a href="https://wa.me/905539003459" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><MessageCircle className="h-5 w-5" /></span>
              <div><p className="font-semibold">WhatsApp</p><p className="text-sm text-muted-foreground">Anında yanıt</p></div>
            </a>
            <a href="mailto:hello@hisu.solutions" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><Mail className="h-5 w-5" /></span>
              <div><p className="font-semibold">E-posta</p><p className="text-sm text-muted-foreground">hello@hisu.solutions</p></div>
            </a>
            <a href="tel:+905539003459" className="flex items-center gap-4 rounded-2xl border border-border bg-card p-5 transition hover:border-primary/40">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-primary-soft text-primary"><Phone className="h-5 w-5" /></span>
              <div><p className="font-semibold">Telefon</p><p className="text-sm text-muted-foreground">+90 553 900 34 59</p></div>
            </a>
          </div>
        </div>
      </section>
    </SiteLayout>
  );
}
