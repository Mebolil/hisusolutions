import { Label } from "@/components/ui/label";

interface QualAnswer {
  id: string;
  question: string;
  options: string[];
}

const QUESTIONS: QualAnswer[] = [
  {
    id: "tracking_method",
    question: "Şu an finansal takibinizi nasıl yapıyorsunuz?",
    options: ["Excel / Google Sheets", "Muhasebe yazılımı", "Kağıt / defter", "Yapmıyorum"],
  },
  {
    id: "monthly_revenue",
    question: "İşletmenizin aylık yaklaşık cirosu nedir?",
    options: ["0 – 50.000 ₺", "50.000 – 200.000 ₺", "200.000 – 1.000.000 ₺", "1.000.000 ₺ üzeri"],
  },
  {
    id: "team_size",
    question: "Kaç çalışanınız var?",
    options: ["1 – 5", "6 – 20", "21 – 50", "50+"],
  },
  {
    id: "timeline",
    question: "BütçeCRM'i ne zaman kullanmayı düşünüyorsunuz?",
    options: ["Hemen başlamak istiyorum", "1 – 3 ay içinde", "3 – 6 ay içinde", "Sadece bakıyorum"],
  },
  {
    id: "main_pain",
    question: "Sizi en çok etkileyen sorun nedir?",
    options: ["Reklam geri dönüşünü ölçemiyorum", "Nakit akışını takip edemiyorum", "Stok maliyetleri karanlık", "Raporlama çok zaman alıyor"],
  },
];

interface Props {
  values: Record<string, string>;
  onChange: (id: string, value: string) => void;
}

export function DemoQualificationStep({ values, onChange }: Props) {
  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
        <p className="text-sm text-muted-foreground">
          Son adım — 5 kısa soru. Bu bilgiler demo öncesinde işletmenize özel hazırlanmamızı sağlar.
        </p>
      </div>

      {QUESTIONS.map((q) => (
        <div key={q.id} className="space-y-2">
          <Label className="text-sm font-medium leading-snug">{q.question}</Label>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {q.options.map((opt) => {
              const selected = values[q.id] === opt;
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onChange(q.id, opt)}
                  className={[
                    "rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background hover:border-primary hover:text-primary",
                  ].join(" ")}
                >
                  {opt}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
