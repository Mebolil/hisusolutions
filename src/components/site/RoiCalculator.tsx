import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

export function RoiCalculator() {
  const [hours, setHours] = useState(10);
  const [rate, setRate] = useState(300);
  const [interacted, setInteracted] = useState(false);

  function onInteract() {
    if (!interacted) {
      trackEvent("roi_calculator_interact");
      setInteracted(true);
    }
  }

  const annualSavings = hours * 12 * rate * 0.8;
  const butceCRMCost = 8900;
  const paybackMonths = butceCRMCost / (annualSavings / 12);

  const formatTL = (n: number) =>
    "₺" + Math.round(n).toLocaleString("tr-TR");

  return (
    <section className="border-y border-border/60 bg-card">
      <div className="mx-auto max-w-5xl px-4 py-20 lg:px-8">
        <div className="text-center">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">Hesaplayıcı</span>
          <h2 className="mt-3 text-4xl font-bold">Pusla Sizin İçin Ne Kadar Değerli?</h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">Kendi verilerinizle hesaplayın — slider'ları hareket ettirin.</p>
        </div>
        <div className="mt-12 rounded-3xl border border-border bg-background p-8 md:p-10">
          <div className="grid gap-10 md:grid-cols-2">
            <div className="space-y-8">
              <div>
                <div className="mb-3 flex justify-between">
                  <label className="text-sm font-semibold">Ayda kaç saat raporlamaya / takibe harcıyorsunuz?</label>
                  <span className="text-sm font-bold text-primary">{hours} saat</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={40}
                  value={hours}
                  onChange={e => { onInteract(); setHours(Number(e.target.value)); }}
                  className="w-full accent-primary"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>1 saat</span>
                  <span>40 saat</span>
                </div>
              </div>
              <div>
                <div className="mb-3 flex justify-between">
                  <label className="text-sm font-semibold">Saatlik maliyetiniz (işçilik / fırsat maliyeti)</label>
                  <span className="text-sm font-bold text-primary">₺{rate}</span>
                </div>
                <input
                  type="range"
                  min={100}
                  max={2000}
                  step={50}
                  value={rate}
                  onChange={e => { onInteract(); setRate(Number(e.target.value)); }}
                  className="w-full accent-primary"
                />
                <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                  <span>₺100</span>
                  <span>₺2.000</span>
                </div>
              </div>
            </div>
            <div className="flex flex-col justify-center rounded-2xl border border-primary/30 bg-primary-soft p-7 text-center">
              <p className="text-sm text-muted-foreground">Pusla ile yılda</p>
              <p className="mt-2 text-5xl font-bold text-primary">{formatTL(annualSavings)}</p>
              <p className="mt-1 text-sm text-muted-foreground">değerinde zaman kazanırsınız*</p>
              <div className="mt-6 h-px bg-border" />
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pusla yıllık maliyeti</span>
                  <span className="font-semibold">{formatTL(butceCRMCost)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Yatırım geri dönüşü</span>
                  <span className="font-bold text-primary">
                    {paybackMonths < 1 ? "< 1 ay" : `${Math.ceil(paybackMonths)} ayda`}
                  </span>
                </div>
              </div>
              <a
                href="#demo"
                className="mt-6 rounded-full bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                15 Gün Ücretsiz Dene
              </a>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            *%80 zaman tasarrufu varsayımıyla hesaplanmıştır. Gerçek sonuçlar değişiklik gösterebilir.
          </p>
        </div>
      </div>
    </section>
  );
}
