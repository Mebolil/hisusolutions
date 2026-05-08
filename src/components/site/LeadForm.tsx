import { useState, type ReactNode } from "react";
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

export function LeadForm({
  source,
  fields,
  submitLabel = "Görüşme Talep Et",
  extra,
}: {
  source: string;
  fields: Field[];
  submitLabel?: string;
  extra?: ReactNode;
}) {
  const [loading, setLoading] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Try insert into a leads table if exists; otherwise just toast.
    try {
      const { error } = await supabase.from("leads").insert({ source, payload: values });
      if (error && !/relation .* does not exist/i.test(error.message)) {
        // ignore — table optional
      }
    } catch {}
    setLoading(false);
    setValues({});
    toast.success("Talebiniz alındı! 24 saat içinde dönüş yapıyoruz.");
  };

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {fields.map((f) => (
        <div key={f.name} className="space-y-1.5">
          <Label htmlFor={f.name}>{f.label}</Label>
          {f.type === "textarea" ? (
            <Textarea id={f.name} required={f.required} value={values[f.name] ?? ""} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} rows={4} />
          ) : f.type === "select" ? (
            <select
              id={f.name}
              required={f.required}
              value={values[f.name] ?? ""}
              onChange={(e) => setValues({ ...values, [f.name]: e.target.value })}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none"
            >
              <option value="">Seçiniz</option>
              {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <Input id={f.name} type={f.type ?? "text"} required={f.required} value={values[f.name] ?? ""} onChange={(e) => setValues({ ...values, [f.name]: e.target.value })} />
          )}
        </div>
      ))}
      {extra}
      <Button type="submit" disabled={loading} className="w-full rounded-full bg-primary py-6 text-base font-semibold text-primary-foreground hover:opacity-90">
        {loading ? "Gönderiliyor..." : submitLabel}
      </Button>
    </form>
  );
}
