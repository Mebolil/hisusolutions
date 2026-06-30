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

// Postgres/Supabase hatalarını kullanıcı dostu Türkçe mesaja çevirir.
export function friendlyDbError(error: unknown, fallback = "Bir hata oluştu"): string {
  const e = error as { code?: string; message?: string; details?: string } | null;
  if (!e) return fallback;
  const msg = e.message || "";
  const code = e.code || "";

  // 23505: unique_violation
  if (code === "23505" || /duplicate key|unique constraint/i.test(msg)) {
    if (/products_name_category/i.test(msg)) return "Bu kategoride aynı isimde başka bir ürün zaten var";
    if (/customers?.*phone|phone.*unique/i.test(msg)) return "Bu telefon numarasıyla kayıtlı bir müşteri zaten var";
    if (/customers?.*email|email.*unique/i.test(msg)) return "Bu e-posta ile kayıtlı bir müşteri zaten var";
    if (/product_categories?.*name|categories?.*name/i.test(msg)) return "Bu isimde bir kategori zaten var";
    return "Bu kayıt zaten mevcut (benzersizlik ihlali)";
  }
  // 23503: foreign_key_violation
  if (code === "23503" || /foreign key/i.test(msg)) {
    return "Bu kayıt başka kayıtlarla ilişkili olduğu için işlem yapılamadı";
  }
  // 23502: not_null_violation
  if (code === "23502" || /not-null|null value in column/i.test(msg)) {
    const m = msg.match(/column "([^"]+)"/);
    return m ? `Zorunlu alan boş bırakılamaz: ${m[1]}` : "Zorunlu bir alan boş bırakılamaz";
  }
  // 23514: check_violation
  if (code === "23514" || /check constraint/i.test(msg)) {
    return "Girilen değer geçerli değil";
  }
  // 22P02: invalid_text_representation
  if (code === "22P02") return "Geçersiz değer formatı";
  // 42501: insufficient_privilege / RLS
  if (code === "42501" || /row-level security|permission denied/i.test(msg)) {
    return "Bu işlem için yetkiniz yok";
  }
  // PGRST116: no rows
  if (code === "PGRST116") return "Kayıt bulunamadı";
  // Schema cache / column not found
  if (/could not find.*column|schema cache/i.test(msg)) return "Veritabanı yapısında beklenmeyen bir sorun oluştu, lütfen tekrar deneyin";
  // Generic postgres errors — don't expose raw English
  if (code.startsWith("42") || code.startsWith("22") || code.startsWith("23")) return fallback;

  return fallback;
}

// Satış notundaki "[Maliyet Kalemleri]" bloğunu parse eder.
export function parseCostItems(note: string | null | undefined): { label: string; amount: number }[] {
  if (!note?.trim()) return [];
  const match = note.match(/\[Maliyet Kalemleri\]([\s\S]*?)(?:\n\n|$)/);
  if (!match) return [];
  return match[1].trim().split('\n')
    .map(line => {
      const idx = line.lastIndexOf(':');
      if (idx === -1) return null;
      const label = line.slice(0, idx).trim();
      const raw = line.slice(idx + 1).replace(/[₺TL\s]/g, '').replace(',', '.');
      const amount = parseFloat(raw) || 0;
      return label && amount > 0 ? { label, amount } : null;
    })
    .filter((i): i is { label: string; amount: number } => i !== null);
}
