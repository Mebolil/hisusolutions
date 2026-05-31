import { CheckCircle2, X, type LucideIcon } from "lucide-react";

interface PersonaItem {
  icon: LucideIcon;
  title: string;
  desc: string;
}

interface PersonaSectionProps {
  forTitle?: string;
  notForTitle?: string;
  forItems: PersonaItem[];
  notForItems: string[];
}

export function PersonaSection({
  forTitle = "Bu ürün tam sizin için ise...",
  notForTitle = "Uygun olmayabilir eğer...",
  forItems,
  notForItems,
}: PersonaSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="text-2xl font-bold">{forTitle}</h2>
          <div className="mt-6 space-y-4">
            {forItems.map((item, i) => (
              <div key={i} className="flex gap-4 rounded-2xl border border-primary/20 bg-primary-soft p-5">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
                  <item.icon className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-primary" />
                    <p className="font-semibold">{item.title}</p>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="text-2xl font-bold">{notForTitle}</h2>
          <div className="mt-6 rounded-2xl border border-border bg-card p-6">
            <ul className="space-y-3">
              {notForItems.map((item, i) => (
                <li key={i} className="flex gap-3 text-sm text-muted-foreground">
                  <X className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="mt-5 rounded-xl border border-border bg-background p-4">
              <p className="text-xs text-muted-foreground">Dürüstlük politikamız: Uygun olmayan işletmelere satış yapmıyoruz. Sizin zamanınıza da değer veriyoruz.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
