# BütçeCRM → Pusla Nihai Geçiş Planı

## Bağlam

BütçeCRM'in adı Pusla olarak değiştirilecek. Uygulama içinde "Pusla", dış pazarlamada "Hisu Pusla" kullanılacak. Hiçbir yerde, hiçbir şekilde "BütçeCRM" izi bırakılmayacak.

**Kapsam (gerçek codebase taraması):**
- 15 route dosyası → yeniden adlandırılacak + içerik güncellenecek
- 7 component dosyası (klasör dahil) → yeniden adlandırılacak
- 3 lib dosyası → yeniden adlandırılacak
- 2 blog MDX dosyası → yeniden adlandırılacak + 301 redirect
- 5 site component → içerik güncellenecek
- 3 supabase edge function → içerik güncellenecek
- 1 video asset → yeniden adlandırılacak
- vercel.json → 301 redirect eklenecek
- sitemap.xml → URL'ler güncellenecek
- CLAUDE.md → güncellenecek
- localStorage → otomatik migrate edilecek
- Supabase DB → plan değerleri "pusla"ya taşınacak

---

## FAZ 1 — Dosya Adı Değişiklikleri (git mv)

Her dosya `git mv` ile taşınacak — böylece git geçmişi korunur.

### 1A: Route Dosyaları (15 dosya)
```
src/routes/butceleme.tsx                  → src/routes/pusla.tsx
src/routes/app.butcecrm.tsx               → src/routes/app.pusla.tsx
src/routes/app.butcecrm.index.tsx         → src/routes/app.pusla.index.tsx
src/routes/app.butcecrm.satislar.tsx      → src/routes/app.pusla.satislar.tsx
src/routes/app.butcecrm.alislar.tsx       → src/routes/app.pusla.alislar.tsx
src/routes/app.butcecrm.giderler.tsx      → src/routes/app.pusla.giderler.tsx
src/routes/app.butcecrm.stok.tsx          → src/routes/app.pusla.stok.tsx
src/routes/app.butcecrm.cariler.tsx       → src/routes/app.pusla.cariler.tsx
src/routes/app.butcecrm.raporlar.tsx      → src/routes/app.pusla.raporlar.tsx
src/routes/app.butcecrm.hatirlaticilar.tsx → src/routes/app.pusla.hatirlaticilar.tsx
src/routes/app.butcecrm.ayarlar.tsx       → src/routes/app.pusla.ayarlar.tsx
src/routes/app.butcecrm.iadeler.tsx       → src/routes/app.pusla.iadeler.tsx
src/routes/app.butcecrm.reklam.tsx        → src/routes/app.pusla.reklam.tsx
src/routes/app.butcecrm.reklam.index.tsx  → src/routes/app.pusla.reklam.index.tsx
src/routes/app.butcecrm.reklam.$id.tsx    → src/routes/app.pusla.reklam.$id.tsx
```

### 1B: Component Klasörü (7 dosya + klasör)
```
src/components/butcecrm/ → src/components/pusla/
(İçindeki dosya isimleri değişmez — AppLayout.tsx, CsvImportWizard.tsx, vb.)
```

### 1C: Lib Dosyaları (3 dosya)
```
src/lib/butcecrm-helpers.ts    → src/lib/pusla-helpers.ts
src/lib/butcecrm-onboarding.ts → src/lib/pusla-onboarding.ts
src/lib/butcecrm-settings.ts   → src/lib/pusla-settings.ts
```

### 1D: Blog İçeriği (2 dosya)
```
content/blog/butcecrm-ilk-30-gun-kurulum-rehberi.mdx    → content/blog/pusla-ilk-30-gun-kurulum-rehberi.mdx
content/blog/butcecrm-nedir-eticaret-reklam-muhasebe.mdx → content/blog/pusla-nedir-eticaret-reklam-muhasebe.mdx
```

### 1E: Video Asset
```
public/videos/butcecrm-16x9.mp4 → public/videos/pusla-16x9.mp4
```

---

## FAZ 2 — Kaynak Kod İçerik Güncellemeleri

Faz 1'den sonra tüm dosya içlerindeki referanslar güncellenir.

### 2A: TanStack Route Path Stringleri
Her rename edilen route dosyasında:
- `createFileRoute("/butceleme")` → `createFileRoute("/pusla")`
- `createFileRoute("/app/butcecrm")` → `createFileRoute("/app/pusla")`
- `createFileRoute("/app/butcecrm/satislar")` → `createFileRoute("/app/pusla/satislar")`
- (tüm alt route'lar aynı pattern ile)

### 2B: Import Path Güncellemeleri
Tüm dosyalarda:
- `@/components/butcecrm/` → `@/components/pusla/`
- `@/lib/butcecrm-helpers` → `@/lib/pusla-helpers`
- `@/lib/butcecrm-onboarding` → `@/lib/pusla-onboarding`
- `@/lib/butcecrm-settings` → `@/lib/pusla-settings`

### 2C: Component Export İsimleri
`src/components/pusla/AppLayout.tsx`:
- `export function ButceCrmLayout` → `export function PuslaLayout`
- Tüm nav path'ler: `/app/butcecrm/*` → `/app/pusla/*`
- Başlık metni: "BütçeCRM" → "Pusla" (3 yerde: sidebar başlık, mobil başlık, mini sidebar)
- `/butceleme` linki → `/pusla`

`src/routes/app.pusla.tsx`:
- `import { ButceCrmLayout }` → `import { PuslaLayout }`
- Component kullanımı: `<ButceCrmLayout>` → `<PuslaLayout>`

### 2D: UI Metni "BütçeCRM" → "Pusla"
Aşağıdaki dosyalarda tüm görünür BütçeCRM → Pusla:

**Routes:**
- `src/routes/pusla.tsx` — tüm başlık/meta/schema/FAQ metinleri
- `src/routes/app.pusla.tsx` — meta title/description
- `src/routes/index.tsx` — spotlight başlık, FAQ, schema, SEO meta, buton metinleri, video src
- `src/routes/blog.index.tsx` — sayfa başlığı, meta, görünür metinler
- `src/routes/blog.$slug.tsx` — CTA metni + link
- `src/routes/panel.tsx` — kart başlığı, metinler
- `src/routes/odeme.tsx` — meta title
- `src/routes/hakkimizda.tsx` — istatistik metni

**Site Components:**
- `src/components/site/Header.tsx` — nav label "BütçeCRM" → "Pusla", to="/butceleme" → to="/pusla"
- `src/components/site/Footer.tsx` — metin + link
- `src/components/site/BookingForm.tsx` — source identifier (Faz 3C'de ele alınıyor)
- `src/components/site/RoiCalculator.tsx` — metin
- `src/components/site/DemoQualificationStep.tsx` — metin

**Lib:**
- `src/lib/blog.ts` — `ürün: "BütçeCRM"` → `ürün: "Pusla"`

**Blog MDX dosyaları (tümü):**
- `pusla-ilk-30-gun-kurulum-rehberi.mdx` (rename + tüm metin)
- `pusla-nedir-eticaret-reklam-muhasebe.mdx` (rename + tüm metin)
- `roas-net-kar-marji-fark-eticaret.mdx` — `[BütçeCRM](/butceleme)` → `[Pusla](/pusla)`
- `trendyol-reklam-net-kar-komisyon-kargo-hesaplama.mdx` — başlık + metin + link
- `eticaret-reklam-butcesi-sizinti-noktalari.mdx` — metin + link
- `basabas-analizi-nedir-eticaret.mdx` — link
- `reklam-takip-yazilimi-secim-rehberi-turkiye.mdx` — başlık + metin

---

## FAZ 3 — Özel Durumlar

### 3A: LocalStorage Otomatik Migrasyon
`src/lib/pusla-onboarding.ts` içine (export'ların üstüne, modül yüklenince çalışan):
```ts
// One-time migration: butcecrm → pusla localStorage keys
const OLD_ONBOARDING_KEY = "butcecrm:onboarding:v1";
const KEY = "pusla:onboarding:v1";
if (typeof window !== "undefined") {
  const old = localStorage.getItem(OLD_ONBOARDING_KEY);
  if (old && !localStorage.getItem(KEY)) {
    localStorage.setItem(KEY, old);
    localStorage.removeItem(OLD_ONBOARDING_KEY);
  }
}
```

`src/lib/pusla-settings.ts` içine de aynı pattern:
```ts
const OLD_SETTINGS_KEY = "butcecrm:settings:v1";
const KEY = "pusla:settings:v1";
// aynı migration bloğu
```

### 3B: ALLOWED_PLANS Geçici Backward Compat + DB Migration
`src/routes/app.pusla.tsx` ve `src/routes/panel.tsx`:
- ALLOWED_PLANS'a "pusla" ekle ama eski değerleri **geçici olarak koru** — DB migration çalıştırılana kadar mevcut kullanıcılar kilitlenmesin
- DB migration sonrası eski değerler (butcecrm, butceleme) bu listeden temizlenecek

**Yeni Supabase Migration:** `supabase/migrations/20260630_rename_to_pusla.sql`
```sql
-- Pusla isim değişikliği: kullanıcı plan değerlerini güncelle
-- Çalıştırmadan önce tablo adını doğrula
UPDATE profiles SET plan = 'pusla' WHERE plan IN ('butcecrm', 'butceleme');
```
> ⚠️ Migration çalıştırmadan önce `cd /tmp && supabase db query --linked "\d profiles"` ile tablo yapısını doğrula.

### 3C: Source Identifier Stringleri (notify-lead)
Frontend'de:
- `src/components/site/BookingForm.tsx`: `"butcecrm-demo"` → `"pusla-demo"`, `source === "butcecrm-demo"` → `source === "pusla-demo"`
- `src/routes/odeme.tsx`: `source: "butcecrm-odeme"` → `source: "pusla-odeme"`

Edge function'da (`supabase/functions/notify-lead/index.ts`):
```ts
"pusla-demo": "Pusla Demo Talebi",
"pusla-beta-demo": "Pusla Kurucu Beta Demo",
"pusla-signup": "Pusla Yeni Kayıt",
"pusla-odeme": "Pusla Ödeme Bildirimi",
```

`supabase/functions/weekly-pulse/index.ts`: BütçeCRM metinleri → Pusla, subject güncellenir
`supabase/functions/notify-trial-expired/index.ts`: BütçeCRM metinleri → Pusla

**Email Gönderen Adı (Sender Name):**
Şu an 3 edge function'da `from: FROM_EMAIL` → `"bildirim@hisusolutions.com"` (display name yok).
Resend API display name destekler — `FROM_EMAIL` sabiti 3 dosyada güncellenir:
```ts
// ESKİ
const FROM_EMAIL = "bildirim@hisusolutions.com";

// YENİ
const FROM_EMAIL = "Hisu Pusla <bildirim@hisusolutions.com>";
```
Dosyalar: `weekly-pulse/index.ts`, `notify-lead/index.ts`, `notify-trial-expired/index.ts`

### 3D: 301 Redirect'ler (vercel.json)
`vercel.json`'a `"redirects"` key'i eklenir (mevcut `rewrites`'ın üstüne):
```json
"redirects": [
  { "source": "/butceleme", "destination": "/pusla", "permanent": true },
  { "source": "/app/butcecrm/:path*", "destination": "/app/pusla/:path*", "permanent": true },
  { "source": "/blog/butcecrm-ilk-30-gun-kurulum-rehberi", "destination": "/blog/pusla-ilk-30-gun-kurulum-rehberi", "permanent": true },
  { "source": "/blog/butcecrm-nedir-eticaret-reklam-muhasebe", "destination": "/blog/pusla-nedir-eticaret-reklam-muhasebe", "permanent": true }
]
```

### 3E: Sitemap
`public/sitemap.xml`:
- `hisusolutions.com/butceleme` → `hisusolutions.com/pusla`
- `/blog/butcecrm-ilk-30-gun-kurulum-rehberi` → `/blog/pusla-ilk-30-gun-kurulum-rehberi`
- `/blog/butcecrm-nedir-eticaret-reklam-muhasebe` → `/blog/pusla-nedir-eticaret-reklam-muhasebe`

### 3F: Video Asset Referansı
`src/routes/index.tsx`:
- `src="/videos/butcecrm-16x9.mp4"` → `src="/videos/pusla-16x9.mp4"`
- `aria-label="BütçeCRM ürün videosu..."` → `aria-label="Pusla ürün videosu..."`

---

## FAZ 4 — CLAUDE.md Güncellemesi

`CLAUDE.md`'deki tüm referanslar:
- "BütçeCRM" → "Pusla" (tüm açıklama metinleri)
- Route tablosu: `butcecrm` segment'leri → `pusla`
- URL örnekleri: `/app/butcecrm/` → `/app/pusla/`
- `lib/butcecrm-*.ts` referansları → `lib/pusla-*.ts`
- `/butceleme` → `/pusla`

---

## FAZ 5 — routeTree.gen.ts (Otomatik)

Bu dosya elle düzenlenmez. Faz 1+2 tamamlandıktan sonra:
```bash
npm run dev
```
Vite yeniden adlandırılmış route dosyalarını algılayıp `routeTree.gen.ts`'yi otomatik günceller.

---

## FAZ 6 — Konsey Denetimi (Doğrulama)

### 6A: Build Testi
```bash
npm run build
```

### 6B: Tam Tarama — Sıfır Tolerans
```bash
grep -r "BütçeCRM\|butcecrm\|butceleme\|ButceCRM\|BUTCECRM" \
  ./src ./content ./public ./supabase \
  --include="*.tsx" --include="*.ts" --include="*.mdx" --include="*.xml" --include="*.sql"
```
Çıktı boş olmalı. Varsa düzeltilir.

### 6C: 301 Redirect Testleri (canlıda)
- `hisusolutions.com/butceleme` → `hisusolutions.com/pusla` (301)
- `hisusolutions.com/app/butcecrm/satislar` → `hisusolutions.com/app/pusla/satislar` (301)
- `hisusolutions.com/blog/butcecrm-ilk-30-gun-kurulum-rehberi` → yeni URL (301)

### 6D: Uygulama Testleri
- `/pusla` sayfası açılıyor, "Pusla" metni görünüyor
- `/app/pusla` — dashboard yükleniyor, sidebar'da "Pusla" yazıyor
- LocalStorage migration: `localStorage.getItem("butcecrm:settings:v1")` → `null`
- Video asset: `/videos/pusla-16x9.mp4` sayfada yükleniyor, 404 yok
- Email gönderen adı: test e-postasında "Hisu Pusla" görünüyor (Resend dashboard'dan doğrulanır)

### 6E: Supabase Edge Function Deploy
```bash
supabase functions deploy weekly-pulse
supabase functions deploy notify-lead
supabase functions deploy notify-trial-expired
```

---

## Uygulama Sırası

```
FAZ 1 → FAZ 2 → FAZ 3 → FAZ 4 → npm run dev → FAZ 6A (build) → Melih onayı → git push → FAZ 6B-D
```

> Not: Edge function deploy (`supabase functions deploy`) ayrı bir komuttur, `git push` değildir — ayrıca onay alınacak.

---

## Değişmeyen Şeyler

- Supabase tablo isimleri (`campaigns`, `sales`, `customers` vb.) — `butce_crm_` prefixi hiç yoktu, dokunulmaz
- `supabase/migrations/` içindeki eski migration dosyaları — sadece yorum satırlarında eski isim var, bu dosyalar değiştirilmez (çalıştırılmış migration'lara dokunulmaz)
