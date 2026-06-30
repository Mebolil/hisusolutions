import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart, Layers, Store, Briefcase,
  LineChart, Wallet, Megaphone, Package,
  ChevronLeft, ChevronRight, Check,
} from "lucide-react";
import {
  saveOnboarding,
  type OnboardingProfile,
  type OnboardingSector,
  type OnboardingRevenue,
  type OnboardingFocus,
} from "@/lib/pusla-onboarding";

interface OnboardingFlowProps {
  open: boolean;
  onComplete: (profile: OnboardingProfile) => void;
}

const SECTORS: { value: OnboardingSector; title: string; desc: string; icon: React.ReactNode }[] = [
  { value: "eticaret", title: "E-Ticaret", desc: "Trendyol, Amazon, Hepsiburada ağırlıklı", icon: <ShoppingCart className="h-6 w-6" /> },
  { value: "karma", title: "Karma", desc: "Kendi site + marketplace", icon: <Layers className="h-6 w-6" /> },
  { value: "perakende", title: "Perakende / Fiziksel Mağaza", desc: "Mağaza tabanlı satış", icon: <Store className="h-6 w-6" /> },
  { value: "hizmet", title: "Hizmet Sektörü", desc: "Hizmet bazlı işletme", icon: <Briefcase className="h-6 w-6" /> },
];

const REVENUES: { value: OnboardingRevenue; title: string }[] = [
  { value: "<50k", title: "₺0–50.000" },
  { value: "50k-250k", title: "₺50.000–250.000" },
  { value: "250k-1m", title: "₺250.000–1.000.000" },
  { value: ">1m", title: "₺1.000.000+" },
];

const FOCUSES: { value: OnboardingFocus; title: string; icon: React.ReactNode }[] = [
  { value: "satislar", title: "Satışlarımı takip etmek", icon: <LineChart className="h-6 w-6" /> },
  { value: "giderler", title: "Giderlerimi kontrol etmek", icon: <Wallet className="h-6 w-6" /> },
  { value: "reklam", title: "Reklam performansımı ölçmek", icon: <Megaphone className="h-6 w-6" /> },
  { value: "stok", title: "Stok yönetimi", icon: <Package className="h-6 w-6" /> },
];

export function OnboardingFlow({ open, onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [sector, setSector] = useState<OnboardingSector | null>(null);
  const [revenue, setRevenue] = useState<OnboardingRevenue | null>(null);
  const [focus, setFocus] = useState<OnboardingFocus | null>(null);

  const canAdvance =
    step === 1 ? sector !== null : step === 2 ? true : focus !== null;

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
  };
  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };
  const handleFinish = () => {
    if (!sector || !focus) return;
    const profile = saveOnboarding({
      sector,
      revenueRange: revenue ?? "<50k",
      focus,
    });
    onComplete(profile);
  };

  return (
    <Dialog open={open}>
      <DialogContent
        className="max-w-xl"
        showClose={false}
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <p className="text-xs font-medium text-primary">Adım {step} / 3</p>
          <DialogTitle>
            {step === 1
              ? "İşletmenizin sektörü nedir?"
              : step === 2
                ? "Aylık ciro aralığınız?"
                : "En büyük takip sorununuz nedir?"}
          </DialogTitle>
          <DialogDescription>
            {step === 1
              ? "Size en uygun deneyimi sunabilmemiz için işletmenizi tanıyalım."
              : step === 2
                ? "Bu adımı dilerseniz atlayabilirsiniz."
                : "Önceliklerinizi belirleyelim, panelinizi buna göre düzenleyelim."}
          </DialogDescription>
        </DialogHeader>

        {step === 1 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SECTORS.map((s) => {
              const active = sector === s.value;
              return (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSector(s.value)}
                  className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors ${
                    active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="text-primary">{s.icon}</span>
                  <span className="text-sm font-semibold">{s.title}</span>
                  <span className="text-xs text-muted-foreground">{s.desc}</span>
                </button>
              );
            })}
          </div>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REVENUES.map((r) => {
              const active = revenue === r.value;
              return (
                <button
                  key={r.value}
                  type="button"
                  onClick={() => setRevenue(r.value)}
                  className={`rounded-lg border-2 p-4 text-center text-sm font-semibold transition-colors ${
                    active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                  }`}
                >
                  {r.title}
                </button>
              );
            })}
          </div>
        )}

        {step === 3 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {FOCUSES.map((f) => {
              const active = focus === f.value;
              return (
                <button
                  key={f.value}
                  type="button"
                  onClick={() => setFocus(f.value)}
                  className={`flex flex-col items-start gap-2 rounded-lg border-2 p-4 text-left transition-colors ${
                    active ? "border-primary bg-primary/10" : "border-border hover:border-primary/40"
                  }`}
                >
                  <span className="text-primary">{f.icon}</span>
                  <span className="text-sm font-semibold">{f.title}</span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex items-center justify-between pt-2">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={step === 1}
          >
            <ChevronLeft className="h-4 w-4 mr-1" /> Geri
          </Button>
          {step < 3 ? (
            <Button onClick={handleNext} disabled={!canAdvance}>
              İlerle <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={!canAdvance}>
              <Check className="h-4 w-4 mr-1" /> Başla
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
