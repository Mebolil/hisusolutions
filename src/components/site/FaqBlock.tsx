import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export interface FaqItem {
  q: string;
  a: string;
}

interface FaqBlockProps {
  items: FaqItem[];
  title?: string;
}

export function FaqBlock({ items, title = "Sık Sorulan Sorular" }: FaqBlockProps) {
  return (
    <section className="mx-auto max-w-3xl px-4 py-20 lg:px-8">
      <h2 className="text-3xl font-bold">{title}</h2>
      <p className="mt-2 text-muted-foreground">
        Merak ettiklerinize hızlı cevaplar.
      </p>
      <Accordion type="single" collapsible className="mt-8 divide-y divide-border rounded-2xl border border-border bg-card px-6">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`} className="border-0 [&:not(:last-child)]:border-b [&:not(:last-child)]:border-border">
            <AccordionTrigger className="text-base font-semibold hover:no-underline">
              {item.q}
            </AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">
              {item.a}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
