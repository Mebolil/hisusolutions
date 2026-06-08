import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

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
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set());
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
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

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(e.target.value);
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      toast.error("Lütfen bir tarih seçin.");
      return;
    }
    if (!selectedTime) {
      toast.error("Lütfen bir saat seçin.");
      return;
    }
    setLoading(true);
    const { error } = await supabase.from("bookings").insert({
      source,
      booked_date: selectedDate,
      booked_time: selectedTime,
      payload: values,
    });
    if (error) {
      if (error.code === "23505") {
        toast.error("Bu saat dolu, lütfen başka bir saat seçin.");
        // Refresh slots
        const { data } = await supabase
          .from("bookings")
          .select("booked_time")
          .eq("booked_date", selectedDate);
        setBookedTimes(new Set(data?.map((r) => r.booked_time) ?? []));
        setSelectedTime("");
      } else {
        toast.error("Bir hata oluştu, lütfen tekrar deneyin.");
        console.error("Booking error:", error.message);
      }
      setLoading(false);
      return;
    }
    // Webhook'tan bağımsız bildirim — fire-and-forget
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
    setSelectedDate("");
    setSelectedTime("");
    setValues({});
    toast.success("Randevunuz alındı! 24 saat içinde onay maili gönderilecek.");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Tarih Seçimi */}
      <div className="space-y-1.5">
        <Label htmlFor="booking-date">Tarih Seçin</Label>
        <Input
          id="booking-date"
          type="date"
          min={toDateInputMin()}
          max={toDateInputMax()}
          onChange={handleDateChange}
          required
        />
      </div>

      {/* Saat Seçimi */}
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

      {/* Form Alanları */}
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
        {loading ? "Gönderiliyor..." : submitLabel}
      </Button>
    </form>
  );
}
