import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { DemoQualificationStep } from "./DemoQualificationStep";
import { trackEvent } from "@/lib/analytics";

interface Field {
  name: string;
  label: string;
  type?: "text" | "email" | "tel" | "select" | "textarea";
  options?: string[];
  required?: boolean;
}

const WORK_HOURS = [
  "09:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00",
  "18:00", "19:00", "20:00", "21:00",
];

function toDateInputMin() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function toDateInputMax() {
  const d = new Date();
  d.setDate(d.getDate() + 60);
  return d.toISOString().slice(0, 10);
}

export function BookingForm({
  source,
  fields,
  submitLabel = "Randevu Al",
}: {
  source: string;
  fields: Field[];
  submitLabel?: string;
}) {
  const withQual = source === "pusla-demo";

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [qualification, setQualification] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!selectedDate) return;
    setSelectedTime("");
    setLoadingSlots(true);
    supabase
      .from("bookings")
      .select("booked_time")
      .eq("booked_date", selectedDate)
      .then(({ data }) => {
        setBookedTimes(new Set(data?.map((r) => r.booked_time) ?? []));
        setLoadingSlots(false);
      });
  }, [selectedDate]);

  const goToStep2 = () => {
    if (!selectedDate) { toast.error("Lütfen bir tarih seçin."); return; }
    if (!selectedTime) { toast.error("Lütfen bir saat seçin."); return; }
    trackEvent("booking_step_complete", { step: 1, source });
    setStep(2);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Step 2 → Step 3 (qualification) sadece pusla-demo için
    if (step === 2 && withQual) {
      trackEvent("booking_step_complete", { step: 2, source });
      setStep(3);
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("bookings").insert({
      source,
      booked_date: selectedDate,
      booked_time: selectedTime,
      payload: values,
      ...(withQual && Object.keys(qualification).length > 0 ? { qualification } : {}),
    });

    if (error) {
      if (error.code === "23505") {
        toast.error("Bu saat dolu, lütfen başka bir saat seçin.");
        const { data } = await supabase
          .from("bookings")
          .select("booked_time")
          .eq("booked_date", selectedDate);
        setBookedTimes(new Set(data?.map((r) => r.booked_time) ?? []));
        setSelectedTime("");
        setStep(1);
      } else {
        toast.error("Bir hata oluştu, lütfen tekrar deneyin.");
        console.error("Booking error:", error.message);
      }
      setLoading(false);
      return;
    }

    // Fire-and-forget bildirim
    supabase.functions.invoke("notify-lead", {
      body: {
        record: {
          source,
          payload: values,
          booked_date: selectedDate,
          booked_time: selectedTime,
          created_at: new Date().toISOString(),
        },
      },
    });

    setLoading(false);
    setStep(1);
    setSelectedDate("");
    setSelectedTime("");
    setValues({});
    setQualification({});
    trackEvent("booking_step_complete", { step: withQual ? 3 : 2, source, completed: true });
    toast.success("Randevunuz alındı! 24 saat içinde onay maili gönderilecek.");
  };

  // Adım göstergesi (sadece pusla-demo için)
  const StepIndicator = withQual ? (
    <div className="mb-6 flex items-center gap-2">
      {[1, 2, 3].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div
            className={[
              "flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold",
              step >= s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground",
            ].join(" ")}
          >
            {s}
          </div>
          {s < 3 && <div className={["h-px w-8", step > s ? "bg-primary" : "bg-border"].join(" ")} />}
        </div>
      ))}
      <span className="ml-2 text-xs text-muted-foreground">
        {step === 1 ? "Tarih & Saat" : step === 2 ? "İletişim Bilgileri" : "Kısa Anket"}
      </span>
    </div>
  ) : null;

  return (
    <div className="space-y-6">
      {StepIndicator}

      {/* ADIM 1: Tarih + Saat */}
      {step === 1 && (
        <div className="space-y-6">
          <div className="space-y-1.5">
            <Label htmlFor="booking-date">Tarih Seçin</Label>
            <Input
              id="booking-date"
              type="date"
              min={toDateInputMin()}
              max={toDateInputMax()}
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              required
            />
          </div>

          {selectedDate && (
            <div className="space-y-2">
              <Label>Saat Seçin</Label>
              {loadingSlots ? (
                <p className="text-sm text-muted-foreground">Müsait saatler yükleniyor...</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5">
                  {WORK_HOURS.map((h) => {
                    const booked = bookedTimes.has(h);
                    return (
                      <button
                        key={h}
                        type="button"
                        disabled={booked}
                        onClick={() => setSelectedTime(h)}
                        className={[
                          "rounded-lg border py-2.5 text-sm font-medium transition-colors",
                          booked
                            ? "cursor-not-allowed border-border bg-muted text-muted-foreground opacity-50"
                            : selectedTime === h
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border bg-background hover:border-primary hover:text-primary",
                        ].join(" ")}
                      >
                        {booked ? <s>{h}</s> : h}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <Button
            type="button"
            onClick={goToStep2}
            disabled={!selectedDate || !selectedTime}
            className="w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            Devam Et →
          </Button>
        </div>
      )}

      {/* ADIM 2: İletişim Bilgileri */}
      {step === 2 && (
        <form onSubmit={onSubmit} className="space-y-6">
          <p className="text-sm text-muted-foreground">
            {selectedDate} tarihinde saat {selectedTime} için randevu oluşturuyorsunuz.{" "}
            <button type="button" onClick={() => setStep(1)} className="text-primary underline underline-offset-2">
              Değiştir
            </button>
          </p>

          {fields.map((f) => (
            <div key={f.name} className="space-y-1.5">
              <Label htmlFor={f.name}>{f.label}</Label>
              {f.type === "textarea" ? (
                <Textarea
                  id={f.name}
                  required={f.required}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  rows={4}
                />
              ) : f.type === "select" ? (
                <select
                  id={f.name}
                  required={f.required}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
                >
                  <option value="">Seçiniz</option>
                  {f.options?.map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <Input
                  id={f.name}
                  type={f.type ?? "text"}
                  required={f.required}
                  value={values[f.name] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
                />
              )}
            </div>
          ))}

          <Button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground hover:opacity-90"
          >
            {loading ? "Gönderiliyor..." : withQual ? "Devam Et →" : submitLabel}
          </Button>
        </form>
      )}

      {/* ADIM 3: Qualification (sadece pusla-demo) */}
      {step === 3 && withQual && (
        <form onSubmit={onSubmit} className="space-y-6">
          <DemoQualificationStep
            values={qualification}
            onChange={(id, val) => setQualification((prev) => ({ ...prev, [id]: val }))}
          />

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => setStep(2)}
              className="flex-1 rounded-full py-6 text-base"
            >
              ← Geri
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-[2] rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground hover:opacity-90"
            >
              {loading ? "Gönderiliyor..." : submitLabel}
            </Button>
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Bu soruları geçmek istiyorsanız{" "}
            <button
              type="submit"
              disabled={loading}
              className="text-primary underline underline-offset-2"
            >
              randevuyu doğrudan oluşturun
            </button>
          </p>
        </form>
      )}
    </div>
  );
}
