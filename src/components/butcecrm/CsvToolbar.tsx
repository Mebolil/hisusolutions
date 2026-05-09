import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Download, Upload, FileText, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { supabase } from "@/lib/supabase";

export type CsvField = {
  /** DB column name */
  key: string;
  /** Header label in CSV (Turkish) */
  label: string;
  required?: boolean;
  type?: "string" | "number" | "date";
};

export type CsvToolbarProps = {
  /** Slug used in export filename, e.g. "satislar" */
  slug: string;
  /** Supabase table to insert into */
  table: string;
  /** Field definitions for both template & import */
  fields: CsvField[];
  /** Sample row values for the template (in same order as fields) */
  sampleRow: (string | number)[];
  /** Rows currently visible on the page (will be exported) */
  exportRows: Record<string, unknown>[];
  /** Optional transform applied to each parsed row before insert */
  transformRow?: (row: Record<string, string>) => Record<string, unknown> | string;
  /** Called after successful import to refresh data */
  onImported?: () => void;
};

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  const s = String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function rowsToCsv(headers: string[], keys: string[], rows: Record<string, unknown>[]): string {
  const lines = [headers.map(csvEscape).join(",")];
  for (const r of rows) {
    lines.push(keys.map((k) => csvEscape(r[k])).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** Minimal RFC4180-ish parser supporting quoted fields with commas/newlines. */
export function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [];
  let field = "";
  let i = 0;
  let inQuotes = false;
  // strip BOM
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);
  while (i < text.length) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') { field += '"'; i += 2; continue; }
        inQuotes = false; i++; continue;
      }
      field += c; i++;
    } else {
      if (c === '"') { inQuotes = true; i++; continue; }
      if (c === ",") { cur.push(field); field = ""; i++; continue; }
      if (c === "\r") { i++; continue; }
      if (c === "\n") { cur.push(field); rows.push(cur); cur = []; field = ""; i++; continue; }
      field += c; i++;
    }
  }
  if (field.length > 0 || cur.length > 0) { cur.push(field); rows.push(cur); }
  return rows.filter((r) => r.some((v) => v.trim() !== ""));
}

export function CsvToolbar({
  slug, table, fields, sampleRow, exportRows, transformRow, onImported,
}: CsvToolbarProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const xlsxRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState(false);
  const [errorReport, setErrorReport] = useState<string[] | null>(null);

  const headers = fields.map((f) => f.label);
  const keys = fields.map((f) => f.key);

  function handleExport() {
    if (exportRows.length === 0) {
      toast.error("Dışa aktarılacak veri yok");
      return;
    }
    const csv = rowsToCsv(headers, keys, exportRows);
    const today = new Date().toISOString().slice(0, 10);
    downloadCsv(`${slug}-${today}.csv`, csv);
    toast.success("CSV indirildi");
  }

  function handleExportXlsx() {
    if (exportRows.length === 0) {
      toast.error("Dışa aktarılacak veri yok");
      return;
    }
    const data = exportRows.map((r) => {
      const o: Record<string, unknown> = {};
      fields.forEach((f) => { o[f.label] = r[f.key] ?? ""; });
      return o;
    });
    const ws = XLSX.utils.json_to_sheet(data, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, slug.slice(0, 31));
    const today = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `${slug}-${today}.xlsx`);
    toast.success("Excel indirildi");
  }

  function handleTemplate() {
    const csv = rowsToCsv(headers, keys, [Object.fromEntries(keys.map((k, i) => [k, sampleRow[i]]))]);
    downloadCsv(`${slug}-sablon.csv`, csv);
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    setErrorReport(null);
    try {
      let rows: string[][];
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
      if (rows.length < 2) {
        toast.error("Dosya boş veya sadece başlık içeriyor");
        return;
      }
      const headerRow = rows[0].map((h) => h.trim());
      // Build a map: field.key -> column index in CSV (match by label OR key)
      const colIdx: Record<string, number> = {};
      for (const f of fields) {
        const idx = headerRow.findIndex(
          (h) => h.toLocaleLowerCase("tr") === f.label.toLocaleLowerCase("tr")
              || h.toLocaleLowerCase("tr") === f.key.toLocaleLowerCase("tr"),
        );
        colIdx[f.key] = idx;
      }
      const missingRequired = fields.filter((f) => f.required && colIdx[f.key] === -1);
      if (missingRequired.length > 0) {
        toast.error(`Eksik kolon: ${missingRequired.map((f) => f.label).join(", ")}`);
        return;
      }

      const errors: string[] = [];
      const payloads: Record<string, unknown>[] = [];
      for (let r = 1; r < rows.length; r++) {
        const raw: Record<string, string> = {};
        for (const f of fields) {
          const idx = colIdx[f.key];
          raw[f.key] = idx >= 0 ? (rows[r][idx] ?? "").trim() : "";
        }
        const lineNo = r + 1;
        // Required check
        const missing = fields.filter((f) => f.required && !raw[f.key]);
        if (missing.length > 0) {
          errors.push(`Satır ${lineNo}: zorunlu alan(lar) boş — ${missing.map((m) => m.label).join(", ")}`);
          continue;
        }
        // Type coercion
        const obj: Record<string, unknown> = {};
        let rowError: string | null = null;
        for (const f of fields) {
          const v = raw[f.key];
          if (v === "" || v === undefined) {
            if (!f.required) { obj[f.key] = null; continue; }
          }
          if (f.type === "number") {
            const n = Number(v.replace(",", "."));
            if (Number.isNaN(n)) { rowError = `Satır ${lineNo}: "${f.label}" sayı olmalı (değer: "${v}")`; break; }
            obj[f.key] = n;
          } else if (f.type === "date") {
            // Accept YYYY-MM-DD or DD.MM.YYYY or DD/MM/YYYY
            let d = v;
            const m = v.match(/^(\d{2})[./-](\d{2})[./-](\d{4})$/);
            if (m) d = `${m[3]}-${m[2]}-${m[1]}`;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) {
              rowError = `Satır ${lineNo}: "${f.label}" geçerli tarih değil (YYYY-MM-DD). Değer: "${v}"`; break;
            }
            obj[f.key] = d;
          } else {
            obj[f.key] = v;
          }
        }
        if (rowError) { errors.push(rowError); continue; }

        if (transformRow) {
          const out = transformRow(raw);
          if (typeof out === "string") { errors.push(`Satır ${lineNo}: ${out}`); continue; }
          payloads.push(out);
        } else {
          payloads.push(obj);
        }
      }

      if (errors.length > 0 && payloads.length === 0) {
        setErrorReport(errors);
        toast.error("İçe aktarma başarısız — lütfen hataları inceleyin");
        return;
      }

      if (payloads.length === 0) {
        toast.error("İçe aktarılacak geçerli satır bulunamadı");
        return;
      }

      const { error } = await supabase.from(table).insert(payloads);
      if (error) {
        setErrorReport([`Veritabanı hatası: ${error.message}`, ...errors]);
        toast.error("Kayıt sırasında hata oluştu");
        return;
      }

      if (errors.length > 0) {
        setErrorReport([
          `${payloads.length} satır eklendi, ${errors.length} satır atlandı:`,
          ...errors,
        ]);
        toast.success(`${payloads.length} kayıt eklendi (${errors.length} satır atlandı)`);
      } else {
        toast.success(`${payloads.length} kayıt başarıyla eklendi`);
      }
      onImported?.();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error("Dosya okunamadı: " + msg);
    } finally {
      setImporting(false);
    }
  }

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleTemplate} className="gap-2">
          <FileText className="h-4 w-4" /> Şablon İndir
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={importing}
          className="gap-2"
        >
          <Upload className="h-4 w-4" /> {importing ? "Yükleniyor..." : "CSV İçe Aktar"}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => xlsxRef.current?.click()}
          disabled={importing}
          className="gap-2"
        >
          <FileSpreadsheet className="h-4 w-4" /> {importing ? "Yükleniyor..." : "Excel İçe Aktar"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" /> CSV Dışa Aktar
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={handleExportXlsx} className="gap-2">
          <FileSpreadsheet className="h-4 w-4" /> Excel Dışa Aktar
        </Button>
        <input
          ref={fileRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={handleImport}
        />
        <input
          ref={xlsxRef}
          type="file"
          accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          className="hidden"
          onChange={handleImport}
        />
      </div>

      <Dialog open={!!errorReport} onOpenChange={(v) => !v && setErrorReport(null)}>
        <DialogContent className="max-w-xl">
          <DialogHeader><DialogTitle>İçe Aktarma Raporu</DialogTitle></DialogHeader>
          <div className="max-h-[60vh] overflow-y-auto space-y-1 text-sm">
            {errorReport?.map((err, i) => (
              <p key={i} className="text-red-600 border-b border-red-100 pb-1">{err}</p>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setErrorReport(null)}>Kapat</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
