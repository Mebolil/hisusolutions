import { createFileRoute } from "@tanstack/react-router";
import { SiteLayout } from "@/components/site/SiteLayout";
import { LeadForm } from "@/components/site/LeadForm";
import { ArrowRight, Mail, FileBarChart, Users, Workflow, MessageSquare, ListTodo } from "lucide-react";

export const Route = createFileRoute("/otomasyon")({
  head: () => ({
    meta: [
      { title: "Otomasyon Sistemleri — AaaS | Hisu Solutions" },
      { name: "description", content: "Tekrarlayan işleri otomasyona devredin. Şirketinize özel, anahtar teslim sistemler." },
    ],
  }),
  component: OtomasyonPage,
});

const pains = [
  "Siparişleri manuel takip etmek",
  "Müşterilere tek tek hatırlatma göndermek",
  "Raporları elle hazırlamak",
  "Fatura ve muhasebe girişlerini tekrarlamak",
  "Farklı platformlar arasında veri taşımak",
  "Ekip içi iletişimi koordine etmek",
];

const steps = [
  { n: 1, t: "Keşif Görüşmesi", d: "Mevcut iş süreçlerinizi, zaman kaynaklarınızı ve önceliklerinizi birlikte analiz ederiz." },
  { n: 2, t: "Özel Sistem Tasarımı", d: "Şirketinize özel otomasyon mimarisi tasarlanır. Hangi araçlar, hangi entegrasyonlar — hepsi sürecinize göre." },
  { n: 3, t: "Kurulum & Teslim", d: "Sistemi kurar, test eder ve ekibinize teslim ederiz. Siz sadece çalışan sistemi devralırsınız." },
];

const solutions = [
  { i: Mail, t: "E-posta & Bildirim Otomasyonu", d: "Müşteri takibi, sipariş bildirimleri, hatırlatmalar otomatik çalışır." },
  { i: FileBarChart, t: "Raporlama & Analiz", d: "Günlük, haftalık, aylık raporlar siz istemeden hazırlanır ve iletilir." },
  { i: Users, t: "CRM & Müşteri Yönetimi", d: "Lead takibi, teklif süreci ve müşteri iletişimi sistematik hale gelir." },
  { i: Workflow, t: "Entegrasyon & Veri Akışı", d: "Farklı platformlarınız birbiriyle konuşur. Manuel veri taşıma biter." },
  { i: MessageSquare, t: "WhatsApp & Mesajlaşma", d: "Müşteri sorularına anında yanıt, sipariş güncellemeleri otomatik iletilir." },
  { i: ListTodo, t: "İş Akışı & Görev Yönetimi", d: "Ekip içi süreçler, onaylar ve görev atamaları otomatik tetiklenir." },
];

function OtomasyonPage() {
  return (
    <SiteLayout>
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--primary-soft),_transparent_60%)]" />
        <div className="mx-auto max-w-5xl px-4 py-20 text-center lg:px-8 lg:py-28">
          <span className="inline-flex rounded-full bg-primary-soft px-4 py-1.5 text-sm font-semibold text-accent-foreground">AaaS — Automation as a Service</span>
          <h1 className="mt-6 text-5xl font-bold tracking-tight md:text-6xl">Sistemi Biz Kurarız.<br/><span className="text-primary">Siz Sadece Büyüyün.</span></h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Tekrarlayan işleri, manuel süreçleri ve zaman kayıplarını otomasyona devrediyoruz. Şirketinize özel tasarlanmış, anahtar teslim sistemler.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#anlat" className="inline-flex items-center gap-2 rounded-full bg-primary px-7 py-3.5 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 hover:opacity-90">İhtiyacımı Anlat <ArrowRight className="h-4 w-4" /></a>
            <a href="#cozumler" className="rounded-full border border-border px-7 py-3.5 text-sm font-semibold hover:bg-accent">Ne Yapıyoruz?</a>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-16 lg:px-8">
        <h2 className="text-center text-3xl font-bold md:text-4xl">Her Gün Aynı İşleri mi Yapıyorsunuz?</h2>
        <div className="mt-10 grid gap-3 sm:grid-cols-2">
          {pains.map(p => (
            <div key={p} className="rounded-xl border border-border bg-card px-5 py-4 text-sm">{p}</div>
          ))}
        </div>
        <p className="mt-8 text-center text-muted-foreground">Bunların hepsi otomatikleştirilebilir. Ve sizin zamanınız çok daha değerli.</p>
      </section>

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

      <section id="anlat" className="mx-auto max-w-3xl px-4 py-20 lg:px-8">
        <div className="rounded-3xl border border-border bg-card p-8 md:p-12">
          <h2 className="text-3xl font-bold">İhtiyacınızı Anlatın</h2>
          <p className="mt-2 text-muted-foreground">Hangi süreci otomatikleştirmek istediğinizi kısaca yazın. Görüşmeden önce size özel düşünelim.</p>
          <div className="mt-8">
            <LeadForm
              source="otomasyon"
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

      <section className="mx-auto max-w-7xl px-4 py-20 lg:px-8">
        <div className="rounded-3xl bg-primary p-12 text-center text-primary-foreground md:p-16">
          <h2 className="text-3xl font-bold md:text-4xl">Zamanınız İşinizi Büyütmeye Yeter. Gerisini Bize Bırakın.</h2>
        </div>
      </section>
    </SiteLayout>
  );
}
