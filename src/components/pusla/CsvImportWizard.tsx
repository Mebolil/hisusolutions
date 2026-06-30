import { useRef, useState } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Upload, ChevronLeft, ChevronRight, Check, RotateCcw, AlertTriangle, Info } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { parseCsv } from "./CsvToolbar";
import type { CsvField } from "./CsvToolbar";

// =============================================================================
// Platform şablonları — LLM çağrısı yok, statik mapping
// =============================================================================

export type PlatformTemplate = {
  id: string;
  label: string;
  /** CSV başlığı → CsvField.key mapping */
  columnMap: Record<string, string>;
};

const PLATFORM_TEMPLATES: PlatformTemplate[] = [
  {
    id: "trendyol",
    label: "Trendyol Siparişleri",
    columnMap: {
      "Sipariş No": "note",
      "Ürün Adı": "product_name",
      "Adet": "quantity",
      "Birim Fiyat": "unit_price",
      "Toplam Fiyat": "total_amount",
      "Kargo Tutarı": "total_cost",
      "Sipariş Tarihi": "sale_date",
      "Müşteri Adı": "_customer_name",
      "Ödeme Durumu": "payment_status",
    },
  },
  {
    id: "hepsiburada",
    label: "HepsiBurada Siparişleri",
    columnMap: {
      "Sipariş Numarası": "note",
      "Ürün": "product_name",
      "Miktar": "quantity",
      "Fiyat": "unit_price",
      "Toplam": "total_amount",
      "Tarih": "sale_date",
      "Müşteri": "_customer_name",
    },
  },
  {
    id: "amazon",
    label: "Amazon Siparişleri",
    columnMap: {
      "order-id": "note",
      "product-name": "product_name",
      "quantity-purchased": "quantity",
      "item-price": "total_amount",
      "purchase-date": "sale_date",
      "buyer-name": "_customer_name",
    },
  },
  {
    id: "banka",
    label: "Banka Ekstresi",
    columnMap: {
      "Tarih": "expense_date",
      "Açıklama": "note",
      "Tutar": "amount",
      "İşlem Tipi": "category",
    },
  },
];

// =============================================================================
// LLM feature flag — kolayca kapatılabilir
// =============================================================================
const LLM_MAPPING_ENABLED = true;

// =============================================================================
// Tipler
// =============================================================================

type Step = "upload" | "map" | "preview" | "commit";

type MappingState = {
  /** field.key → source CSV kolon indeksi (-1 = unmapped) */
  fieldToColIdx: Record<string, number>;
  csvHeaders: string[];
  rows: string[][];
};

type PreviewRow = {
  rowNum: number;
  data: Record<string, unknown>;
  errors: string[];
};

// =============================================================================
// Yardımcı fonksiyonlar
// =============================================================================

function norm(s: string) {
  return s
    .toLocaleLowerCase("tr")
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function autoDetectMapping(
  csvHeaders: string[],
  fields: CsvField[]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const f of fields) {
    const normLabel = norm(f.label);
    const normKey = norm(f.key);
    const normAliases = (f.aliases ?? []).map(norm);
    const candidates = [normLabel, normKey, ...normAliases];

    let idx = csvHeaders.findIndex((h) => candidates.includes(norm(h)));
    if (idx === -1) {
      idx = csvHeaders.findIndex((h) => {
        const hn = norm(h);
        return candidates.some((a) => hn.includes(a) || a.includes(hn));
      });
    }
    result[f.key] = idx;
  }
  return result;
}

function applyPlatformTemplate(
  template: PlatformTemplate,
  csvHeaders: string[],
  fields: CsvField[]
): Record<string, number> {
  const result: Record<string, number> = {};
  for (const f of fields) {
    result[f.key] = -1;
  }
  for (const [csvCol, fieldKey] of Object.entries(template.columnMap)) {
    const colIdx = csvHeaders.findIndex((h) => norm(h) === norm(csvCol));
    if (colIdx >= 0) {
      result[fieldKey] = colIdx;
    }
  }
  return result;
}

function coerceValue(f: CsvField, v: string, today: string): unknown {
  if (v === "" || v === undefined) {
    if (f.type === "date") return today;
    if (f.type === "number") return 0;
    return "";
  }
  if (f.type === "number") {
    const n = Number(v.replace(/\s/g, "").replace(",", "."));
    return Number.isNaN(n) ? 0 : n;
  }
  if (f.type === "date") {
    const m = v.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
    if (m) return `${m[3]}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
    const m2 = v.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
    if (m2) return `${m2[1]}-${m2[2].padStart(2, "0")}-${m2[3].padStart(2, "0")}`;
    const serial = Number(v);
    if (!Number.isNaN(serial) && serial > 1000) {
      const d = new Date(Math.round((serial - 25569) * 86400 * 1000));
      if (!isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    }
    return today;
  }
  return v;
}

async function suggestMappingWithLLM(
  csvHeaders: string[],
  fields: CsvField[]
): Promise<Record<string, number> | null> {
  if (!LLM_MAPPING_ENABLED) return null;
  try {
    const resp = await supabase.functions.invoke("csv-map-suggest", {
      body: {
        csvHeaders,
        fields: fields.map((f) => ({ key: f.key, label: f.label, aliases: f.aliases ?? [] })),
      },
    });
    if (resp.error || !resp.data?.mapping) return null;
    const mapping: Record<string, number> = {};
    for (const f of fields) {
      const suggestedHeader: string | undefined = resp.data.mapping[f.key];
      if (!suggestedHeader) { mapping[f.key] = -1; continue; }
      const idx = csvHeaders.findIndex((h) => norm(h) === norm(suggestedHeader));
      mapping[f.key] = idx;
    }
    return mapping;
  } catch {
    return null;
  }
}

// =============================================================================
// Bileşen
// =============================================================================

export type CsvImportWizardProps = {
  open: boolean;
  onClose: () => void;
  /** Modül kimliği: 'sales' | 'expenses' | 'customers' | 'products' */
  module: "sales" | "expenses" | "customers" | "products";
  /** Supabase tablo adı */
  table: string;
  fields: CsvField[];
  transformRow?: (raw: Record<string, string>, uid: string) => Record<string, unknown> | string;
  onImported?: (sessionId: string, count: number) => void;
  /** Gösterilecek platform şablonları (boşsa hepsi gösterilir) */
  platformTemplates?: string[];
};

export function CsvImportWizard({
  open,
  onClose,
  module,
  table,
  fields,
  transformRow,
  onImported,
  platformTemplates,
}: CsvImportWizardProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState<Step>("upload");
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<MappingState | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("custom");
  const [llmLoading, setLlmLoading] = useState(false);
  const [llmUsed, setLlmUsed] = useState(false);
  const [previewRows, setPreviewRows] = useState<PreviewRow[]>([]);
  const [allPayloads, setAllPayloads] = useState<Record<string, unknown>[]>([]);
  const [committing, setCommitting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastSessionId, setLastSessionId] = useState<string | null>(null);
  const [rollingBack, setRollingBack] = useState(false);
  const [rolledBackCount, setRolledBackCount] = useState<number | null>(null);

  const visibleTemplates = platformTemplates
    ? PLATFORM_TEMPLATES.filter((t) => platformTemplates.includes(t.id))
    : PLATFORM_TEMPLATES;

  function reset() {
    setStep("upload");
    setFileName("");
    setMapping(null);
    setSelectedPlatform("custom");
    setLlmLoading(false);
    setLlmUsed(false);
    setPreviewRows([]);
    setAllPayloads([]);
    setCommitting(false);
    setProgress(0);
    setLastSessionId(null);
    setRollingBack(false);
    setRolledBackCount(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setFileName(file.name);

    let rows: string[][];
    try {
      const isXlsx = /\.xlsx$/i.test(file.name);
      if (isXlsx) {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const aoa = XLSX.utils.sheet_to_json<unknown[]>(ws, { header: 1, raw: false, defval: "" });
        rows = aoa.map((r) => (r as unknown[]).map((c) => String(c ?? "")));
        rows = rows.filter((r) => r.some((v) => v.trim() !== ""));
      } else {
        const text = await file.text();
        rows = parseCsv(text);
      }
    } catch (err) {
      toast.error("Dosya okunamadı: " + (err instanceof Error ? err.message : String(err)));
      return;
    }

    if (rows.length < 2) {
      toast.error("Dosya boş veya sadece başlık içeriyor");
      return;
    }

    const csvHeaders = rows[0].map((h) => h.trim());
    const autoMapping = autoDetectMapping(csvHeaders, fields);
    setMapping({ fieldToColIdx: autoMapping, csvHeaders, rows });
    setSelectedPlatform("custom");
    setLlmUsed(false);
    setStep("map");
  }

  function handlePlatformChange(platformId: string) {
    if (!mapping) return;
    setSelectedPlatform(platformId);
    setLlmUsed(false);
    if (platformId === "custom") {
      const autoMapping = autoDetectMapping(mapping.csvHeaders, fields);
      setMapping({ ...mapping, fieldToColIdx: autoMapping });
    } else {
      const template = PLATFORM_TEMPLATES.find((t) => t.id === platformId);
      if (!template) return;
      const tMapping = applyPlatformTemplate(template, mapping.csvHeaders, fields);
      setMapping({ ...mapping, fieldToColIdx: tMapping });
    }
  }

  async function handleLlmSuggest() {
    if (!mapping) return;
    setLlmLoading(true);
    try {
      const suggested = await suggestMappingWithLLM(mapping.csvHeaders, fields);
      if (suggested) {
        setMapping({ ...mapping, fieldToColIdx: suggested });
        setLlmUsed(true);
        toast.success("AI sütun önerisi uygulandı");
      } else {
        toast.error("AI önerisi alınamadı");
      }
    } finally {
      setLlmLoading(false);
    }
  }

  function handleColumnChange(fieldKey: string, value: string) {
    if (!mapping) return;
    const colIdx = value === "__none__" ? -1 : parseInt(value, 10);
    setMapping({
      ...mapping,
      fieldToColIdx: { ...mapping.fieldToColIdx, [fieldKey]: colIdx },
    });
  }

  async function handleGoToPreview() {
    if (!mapping) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { toast.error("Oturum bulunamadı"); return; }

    const today = new Date().toISOString().slice(0, 10);
    const { rows, fieldToColIdx } = mapping;
    const previews: PreviewRow[] = [];
    const payloads: Record<string, unknown>[] = [];

    for (let r = 1; r < rows.length; r++) {
      const raw: Record<string, string> = {};
      // fields'daki key'lere ek olarak platform şablonundan gelen _prefix key'leri de yakala
      const allMappedKeys = new Set([...fields.map((f) => f.key), ...Object.keys(fieldToColIdx)]);
      for (const key of allMappedKeys) {
        const idx = fieldToColIdx[key];
        raw[key] = idx >= 0 ? (rows[r][idx] ?? "").trim() : "";
      }

      const rowErrors: string[] = [];
      const required = fields.filter((f) => f.required);
      for (const f of required) {
        if (!raw[f.key]) rowErrors.push(`"${f.label}" boş`);
      }

      let payload: Record<string, unknown>;
      if (transformRow) {
        const out = transformRow(raw, session.user.id);
        if (typeof out === "string") {
          rowErrors.push(out);
          payload = {};
        } else {
          payload = { user_id: session.user.id, ...out };
        }
      } else {
        const obj: Record<string, unknown> = {};
        for (const f of fields) {
          obj[f.key] = coerceValue(f, raw[f.key], today);
        }
        payload = { user_id: session.user.id, ...obj };
      }

      previews.push({ rowNum: r + 1, data: payload, errors: rowErrors });
      if (rowErrors.length === 0) payloads.push(payload);
    }

    setPreviewRows(previews);
    setAllPayloads(payloads);
    setStep("preview");
  }

  async function handleCommit() {
    if (allPayloads.length === 0) { toast.error("Aktarılacak geçerli satır yok"); return; }
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) { toast.error("Oturum bulunamadı"); return; }

    setCommitting(true);
    setProgress(0);
    setStep("commit"); // progress bar'ı göster — başarı beklenmeden adıma geç

    // 1. Import session oluştur
    const { data: sessionRow, error: sessErr } = await supabase
      .from("import_sessions")
      .insert({
        user_id: session.user.id,
        module,
        source: selectedPlatform,
        row_count: allPayloads.length,
        status: "committed",
      })
      .select("id")
      .single();

    if (sessErr || !sessionRow) {
      toast.error("Import oturumu oluşturulamadı: " + sessErr?.message);
      setCommitting(false);
      return;
    }

    const sessionId = sessionRow.id;
    const payloadsWithSession = allPayloads.map((p) => ({
      ...p,
      import_session_id: sessionId,
    }));

    // 2. Chunk bazlı insert
    let inserted = 0;
    const CHUNK = 100;
    for (let i = 0; i < payloadsWithSession.length; i += CHUNK) {
      const chunk = payloadsWithSession.slice(i, i + CHUNK);
      const { error } = await supabase.from(table).insert(chunk);
      if (error) {
        // Gerçekte kaç satır girdiğini session'a yaz — rollback doğru çalışsın
        if (inserted > 0) {
          await supabase
            .from("import_sessions")
            .update({ row_count: inserted })
            .eq("id", sessionId);
        }
        toast.error(`Kayıt hatası (${inserted}/${allPayloads.length} eklendi): ${error.message}`);
        setLastSessionId(inserted > 0 ? sessionId : null);
        setCommitting(false);
        return;
      }
      inserted += chunk.length;
      setProgress(Math.round((inserted / payloadsWithSession.length) * 100));
    }

    setLastSessionId(sessionId);
    setCommitting(false);
    onImported?.(sessionId, inserted);
    toast.success(`${inserted} kayıt başarıyla eklendi`);
  }

  async function handleRollback() {
    if (!lastSessionId) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return;
    setRollingBack(true);
    try {
      const { data, error } = await supabase.rpc("rollback_import", {
        p_session_id: lastSessionId,
        p_user_id: session.user.id,
      });
      if (error || !data?.success) {
        toast.error("Geri alma başarısız: " + (error?.message ?? data?.error ?? "bilinmeyen hata"));
        return;
      }
      toast.success(`${data.rolled_back} kayıt geri alındı`);
      setLastSessionId(null);
      setRolledBackCount(data.rolled_back as number);
    } finally {
      setRollingBack(false);
    }
  }

  // =============================================================================
  // Render helpers
  // =============================================================================

  const unmappedRequired = mapping
    ? fields.filter((f) => f.required && mapping.fieldToColIdx[f.key] === -1)
    : [];
  const totalErrors = previewRows.filter((r) => r.errors.length > 0).length;

  const STEP_LABELS: Record<Step, string> = {
    upload: "Dosya Yükle",
    map: "Sütun Eşle",
    preview: "Önizle",
    commit: "Tamamlandı",
  };
  const STEP_ORDER: Step[] = ["upload", "map", "preview", "commit"];
  const stepIndex = STEP_ORDER.indexOf(step);

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !committing) handleClose(); }}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            CSV / Excel İçe Aktarma
            <div className="flex gap-1 ml-auto">
              {STEP_ORDER.map((s, i) => (
                <div key={s} className="flex items-center gap-1">
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      i < stepIndex
                        ? "bg-green-100 text-green-700"
                        : i === stepIndex
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {i + 1}. {STEP_LABELS[s]}
                  </span>
                  {i < STEP_ORDER.length - 1 && (
                    <ChevronRight className="h-3 w-3 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto min-h-0 pr-1">
          {/* ——— ADIM 1: Yükleme ——— */}
          {step === "upload" && (
            <div className="flex flex-col items-center justify-center gap-6 py-12">
              <div
                className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary hover:bg-muted/30 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                <p className="text-base font-medium">CSV veya Excel dosyası seç</p>
                <p className="text-sm text-muted-foreground mt-1">.csv · .xlsx — maks. 10 MB</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {visibleTemplates.map((t) => (
                  <Badge key={t.id} variant="outline" className="text-xs">
                    {t.label} şablonu desteklenir
                  </Badge>
                ))}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          )}

          {/* ——— ADIM 2: Sütun Eşleme ——— */}
          {step === "map" && mapping && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium">Platform Şablonu:</span>
                <Select value={selectedPlatform} onValueChange={handlePlatformChange}>
                  <SelectTrigger className="w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="custom">Manuel Eşleme</SelectItem>
                    {visibleTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {LLM_MAPPING_ENABLED && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLlmSuggest}
                    disabled={llmLoading}
                    className="gap-2"
                  >
                    {llmLoading ? "AI Analiz ediyor..." : "✨ AI Öner"}
                  </Button>
                )}
                {llmUsed && (
                  <Badge variant="secondary" className="text-xs">AI önerisi uygulandı</Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground">
                <strong>{fileName}</strong> · {mapping.csvHeaders.length} sütun · {mapping.rows.length - 1} satır
              </p>

              {unmappedRequired.length > 0 && (
                <Alert variant="destructive">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Zorunlu sütunlar eşlenmedi: {unmappedRequired.map((f) => f.label).join(", ")}
                  </AlertDescription>
                </Alert>
              )}

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pusla Alanı</TableHead>
                    <TableHead>CSV Sütunu</TableHead>
                    <TableHead>Örnek Değer</TableHead>
                    <TableHead className="w-16">Zorunlu</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {fields.map((f) => {
                    const colIdx = mapping.fieldToColIdx[f.key];
                    const sample =
                      colIdx >= 0 ? (mapping.rows[1]?.[colIdx] ?? "") : "";
                    return (
                      <TableRow key={f.key}>
                        <TableCell className="font-medium text-sm">{f.label}</TableCell>
                        <TableCell>
                          <Select
                            value={colIdx >= 0 ? String(colIdx) : "__none__"}
                            onValueChange={(v) => handleColumnChange(f.key, v)}
                          >
                            <SelectTrigger className="w-48">
                              <SelectValue placeholder="— seçiniz —" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="__none__">— eşleme yok —</SelectItem>
                              {mapping.csvHeaders.map((h, i) => (
                                <SelectItem key={i} value={String(i)}>
                                  {h}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[160px] truncate">
                          {sample || "—"}
                        </TableCell>
                        <TableCell>
                          {f.required && (
                            <Badge variant={colIdx >= 0 ? "default" : "destructive"} className="text-xs">
                              {colIdx >= 0 ? "✓" : "!"}
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* ——— ADIM 3: Önizleme ——— */}
          {step === "preview" && (
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Badge variant="default">{allPayloads.length} satır aktarılacak</Badge>
                {totalErrors > 0 && (
                  <Badge variant="destructive">{totalErrors} satırda hata — atlanacak</Badge>
                )}
                {totalErrors === 0 && (
                  <Badge variant="secondary" className="text-green-700 bg-green-50">
                    <Check className="h-3 w-3 mr-1" /> Tüm satırlar geçerli
                  </Badge>
                )}
              </div>

              {totalErrors > 0 && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    Hatalı satırlar aktarılmaz; geçerli {allPayloads.length} satır aktarılır.
                  </AlertDescription>
                </Alert>
              )}

              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      {fields.slice(0, 5).map((f) => (
                        <TableHead key={f.key} className="text-xs">{f.label}</TableHead>
                      ))}
                      <TableHead className="w-24">Durum</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {previewRows.slice(0, 50).map((row) => (
                      <TableRow
                        key={row.rowNum}
                        className={row.errors.length > 0 ? "bg-red-50" : undefined}
                      >
                        <TableCell className="text-xs text-muted-foreground">{row.rowNum}</TableCell>
                        {fields.slice(0, 5).map((f) => (
                          <TableCell key={f.key} className="text-xs max-w-[120px] truncate">
                            {String(row.data[f.key] ?? "—")}
                          </TableCell>
                        ))}
                        <TableCell>
                          {row.errors.length > 0 ? (
                            <Badge variant="destructive" className="text-xs" title={row.errors.join("; ")}>
                              Hata
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-xs text-green-700">
                              OK
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {previewRows.length > 50 && (
                  <p className="text-xs text-muted-foreground p-2 border-t">
                    İlk 50 satır gösteriliyor · toplam {previewRows.length}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ——— ADIM 4: Tamamlandı ——— */}
          {step === "commit" && (
            <div className="flex flex-col items-center gap-6 py-10 text-center">
              {committing ? (
                <>
                  <p className="text-base font-medium">Aktarılıyor...</p>
                  <Progress value={progress} className="w-64" />
                  <p className="text-sm text-muted-foreground">%{progress}</p>
                </>
              ) : rolledBackCount !== null ? (
                <>
                  <div className="h-14 w-14 rounded-full bg-orange-100 flex items-center justify-center">
                    <RotateCcw className="h-7 w-7 text-orange-600" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{rolledBackCount} kayıt geri alındı</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Veriler silinmedi — arşivlendi. İstersen tekrar içe aktarabilirsin.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                    <Check className="h-7 w-7 text-green-600" />
                  </div>
                  <div>
                    <p className="text-base font-semibold">{allPayloads.length} kayıt aktarıldı</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      İstersen son 60 dakika içinde geri alabilirsin.
                    </p>
                  </div>
                  {lastSessionId && (
                    <Button
                      type="button"
                      variant="outline"
                      className="gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      onClick={handleRollback}
                      disabled={rollingBack}
                    >
                      <RotateCcw className="h-4 w-4" />
                      {rollingBack ? "Geri alınıyor..." : "Bu aktarmayı geri al"}
                    </Button>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-3 mt-2">
          {step !== "upload" && step !== "commit" && (
            <Button
              type="button"
              variant="ghost"
              onClick={() => setStep(STEP_ORDER[stepIndex - 1])}
              disabled={committing}
              className="gap-1 mr-auto"
            >
              <ChevronLeft className="h-4 w-4" /> Geri
            </Button>
          )}
          <Button type="button" variant="outline" onClick={handleClose} disabled={committing}>
            {step === "commit" ? "Kapat" : "İptal"}
          </Button>
          {step === "map" && (
            <Button
              type="button"
              onClick={handleGoToPreview}
              disabled={unmappedRequired.length > 0}
            >
              Önizle <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
          {step === "preview" && (
            <Button
              type="button"
              onClick={handleCommit}
              disabled={allPayloads.length === 0 || committing}
            >
              {allPayloads.length} Kaydı Aktar <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
