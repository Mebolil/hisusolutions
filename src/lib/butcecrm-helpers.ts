import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";

export function formatDate(date: string) {
  if (!date) return "-";
  try {
    return format(parseISO(date), "dd MMM yyyy", { locale: tr });
  } catch {
    return date;
  }
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 0,
  }).format(Number.isFinite(amount) ? amount : 0);
}
