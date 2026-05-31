import { Check, X } from "lucide-react";

interface BeforeAfterItem {
  before: string;
  after: string;
}

interface BeforeAfterSectionProps {
  title?: string;
  subtitle?: string;
  beforeTitle?: string;
  afterTitle?: string;
  items: BeforeAfterItem[];
}

export function BeforeAfterSection({
  title,
  subtitle,
  beforeTitle = "Şu an ne yaşıyorsunuz?",
  afterTitle = "Bizimle 30 gün sonra:",
  items,
}: BeforeAfterSectionProps) {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 lg:px-8">
      {title && (
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-bold">{title}</h2>
          {subtitle && <p className="mt-3 text-muted-foreground">{subtitle}</p>}
        </div>
      )}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-8">
          <h3 className="text-xl font-bold text-destructive">{beforeTitle}</h3>
          <ul className="mt-5 space-y-3">
            {items.map((item, i) => (
              <li key={i} className="flex gap-3 text-muted-foreground">
                <X className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                {item.before}
              </li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-primary/30 bg-primary-soft p-8">
          <h3 className="text-xl font-bold text-primary">{afterTitle}</h3>
          <ul className="mt-5 space-y-3">
            {items.map((item, i) => (
              <li key={i} className="flex gap-3 text-foreground">
                <Check className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                {item.after}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
