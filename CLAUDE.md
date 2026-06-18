# CLAUDE.md — Hisu Solutions / BütçeCRM

## BütçeCRM KONUMLANMA YASASI — DEĞİŞTİRİLEMEZ TEMEL

> **BütçeCRM sadece bir gelir-gider takip uygulaması değildir.**

BütçeCRM, e-ticaret işletmesinin mali verilerini platforma, ürüne, reklama, maliyet kalemlerine, harcamalara, iadelere ve iptal sebeplerine göre analiz eden; bu verilerden işletmeye özel netlik çıkaran bir **karar destek sistemidir**.

**Sorumluluk çerçevesi:** Analiz BütçeCRM'den, karar işletme sahibinden. Sorumluluk tamamen kullanıcıya aittir.

### İki Paket

**Başlangıç Paketi** — Excel alternatifi, eksiksiz takip:
- Çok kanallı gelir-gider takip (Trendyol, kendi site, marketplace)
- Reklam harcaması analizi (Meta, Google Ads)
- Maliyet kalemi takibi (COGS — ürün maliyeti, kargo, komisyon)
- İade modülü (22 Haziran 2026'da ekleniyor)
- E-fatura entegrasyonu (şirketleşme sonrası)
- Pazaryeri entegrasyonları (şirketleşme sonrası)

**Ultimate Paket** — Karar destek sistemi (Roadmap):
- Başlangıç paketinin tümü
- Platform/ürün/kampanya bazında karar desteği
- İptal sebebi analizi, LLM entegrasyonu
- Her 3 günde yeni modül — canlı, büyüyen ekosistem

### Pazarlama Yasaları
- Site copy'sinde "gelir-gider takip" ve "muhasebe" daraltıcı etiketleri kullanılmaz
- "Düşük maliyet/ucuz" yasak — yerine "yüksek değer", "yatırım karşılığı"
- Özellik değil netlik: "X özelliği var" değil "X konusunda artık net cevabın olur"

---

Bu dosya, Claude'un bu repoda çalışırken uyması gereken kuralları ve bilmesi gereken teknik gerçekleri içerir.
Kodlama yaparken **önce bu dosyayı oku**, sonra değişikliğe başla.

---

## ANAYASA KURALI — DEPLOY ONAY ZORUNLULUĞU

> **Melih'in açık "deploy et" veya "push et" onayı olmadan hiçbir koşulda `git push` yapılmaz.**
>
> - Geliştirme akışı: **lokal → test → Melih onayı → push**
> - "Lokal çalıştır", "lokal'de test et", "önce dene" = push YOK
> - "Canlıya al", "deploy et", "push et" = push VAR
> - Bu kural geçerlidir: tamamlanmış özellik olsa bile, tüm ajanlar onay verse bile,
>   build hatasız geçse bile — Melih onaylamadan push edilmez.
> - İhlali halinde: commit revert edilir, özür dilenir, kural tekrar okunur.

---

## ANAYASA KURALI — VERİ DOKUNULMAZLIĞI

> **Uygulama geliştirirken mevcut kullanıcı verilerine asla müdahale edilmez.**
> Yeni özellik, refactor, migration veya herhangi bir değişiklik yapılırken:
> - Var olan kayıtlar **silinmez**, **güncellenmez**, **taşınmaz**
> - Test için sahte veri eklenmez (prod DB'sine)
> - Migration'lar sadece `ALTER TABLE ADD COLUMN`, `CREATE TABLE`, `CREATE INDEX` içerebilir — `UPDATE`, `DELETE`, `DROP` içeremez
> - Bu kural Melih'in açık yazılı onayı olmadan hiçbir koşulda ihlal edilemez

---

## PROAKTİF DÜŞÜNME ZORUNLULUĞU — KRİTİK

**Bir değişiklik yazmadan önce şu 5 soruyu sor:**

1. **Tablo kolonu gerçekten var mı?** `select()` içindeki her alanı önce DB şemasıyla karşılaştır. Olmayan kolon = sessiz hata = boş sayfa.
2. **Bu değişiklik başka hangi route'u kırar?** Ortak veri çeken sayfaları düşün.
3. **Kullanıcı bu sayfada sonra ne yapmak isteyecek?** Eksik özellik varsa (ör. satışlara kampanya bağlama) bunu söyle.
4. **Multi-tenancy**: Her sorguda `user_id` filtresi var mı?
5. **Build kırılıyor mu?** `npm run build` ile doğrulamadan push etme.

**Gerçekleştikten sonra analiz etme — gerçekleşmeden önce tahmin et.**

---

## Genel Kurallar

- "Deploy et" = `git push origin main`. Vercel otomatik devreye girer, onay bekleme.
- Push öncesi **lokal build doğrula**: `npm run build` — hata varsa push etme.
- `lucide-react`'ta `Instagram` ikonu yoktur; kullanma.
- TanStack Router `head()` tag'leri için `__root.tsx`'e `<HeadContent />` şart — eksikse canonical/OG/robots hiç yazılmaz.
- Dış iletişimde "düşük maliyet" ifadesi yasak; yerine "yüksek değer" çerçevesi kullan.

---

## BütçeCRM — Teknik Mimari

### Stack
- **Frontend**: React + TypeScript + TanStack Router (file-based routing)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **UI**: shadcn/ui + Tailwind CSS
- **Grafikler**: Recharts
- **Tarih**: date-fns (`tr` locale)
- **Bildirimler**: sonner (toast)

### Güvenlik — KRİTİK
**Her Supabase sorgusuna `.eq("user_id", uid)` ekle.** Bu multi-tenant uygulamada RLS ikinci savunma katmanıdır; JS katmanında da user_id filtresi zorunludur. Unutursan başka kullanıcıların verisini dönersin.

```ts
// YANLIŞ — user_id filtresi yok
supabase.from("sales").select("*").eq("id", id)

// DOĞRU
supabase.from("sales").select("*").eq("id", id).eq("user_id", uid)
```

---

## Veritabanı Şeması

### `campaigns`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| name | text | |
| platform | text | null olabilir |
| status | text | "aktif" \| "pasif" |
| spend | numeric | Reklam harcaması |
| budget | numeric | null = bütçe yok (migration: 20260615) |
| start_date | date | |
| end_date | date | null = devam ediyor |

### `sales`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| campaign_id | uuid | null = kampanyasız satış, FK → campaigns |
| customer_id | uuid | FK → customers |
| sale_date | date | |
| total_amount | numeric | |
| total_cost | numeric | null olabilir |
| unit_price | numeric | null olabilir |
| product_name | text | null olabilir |
| quantity | int | null olabilir |
| category | text | null olabilir |
| platform | text | null olabilir |
| note | text | null olabilir |
| payment_status | text | null olabilir |
| paid_amount | numeric | null olabilir |
| due_date | date | null olabilir |
| status | text | DEFAULT 'aktif' — 'aktif' \| 'iptal' \| 'iade_edildi' (eklendi 2026-06-19) |
| currency | text | DEFAULT 'TRY' (eklendi 2026-06-19) |
| exchange_rate | numeric | DEFAULT 1.0 (eklendi 2026-06-19) |
| created_at | timestamptz | |

> ⚠️ `sales` tablosunda `customer_name` kolonu **YOKTUR**. Müşteri adı için join kullan:
> `select("..., customers(name)")` → `s.customers?.name`

### `customers`
| Kolon | Tip |
|-------|-----|
| id | uuid |
| user_id | uuid |
| name | text |

### `expense_categories` / `product_categories`
- `name` unique constraint var → `ON CONFLICT (name) DO NOTHING` ile seed yapılır.
- Varsayılan kategoriler: 20260615_category_seed.sql (Supabase SQL Editor'de çalıştırılacak — pending)

### `returns`
| Kolon | Tip | Notlar |
|-------|-----|--------|
| id | uuid | PK |
| user_id | uuid | FK → auth.users |
| sale_id | uuid | FK → sales |
| product_id | uuid | nullable FK → products |
| return_date | date | DEFAULT CURRENT_DATE |
| product_name | text | |
| quantity | int | |
| return_amount | numeric | |
| refund_method | text | "nakit" \| "cari" \| "banka" |
| reason_category | return_reason_category ENUM | musteri_vazgecti · urun_hasarli · yanlis_urun · beden_renk · gec_teslimat · diger |
| reason_detail | text | opsiyonel serbest not |
| restock | boolean | DEFAULT true; hasarlı seçilince false |
| cost_reversed | numeric | parseCostItems(sale.note) ile hesaplanır |
| status | text | "active" \| "cancelled" — soft delete |
| note | text | opsiyonel |
| created_at | timestamptz | |

> ⚠️ Atomik işlem için `supabase.rpc("process_return", {...})` kullan — INSERT + stok UPDATE tek transaction'da.
> `cancelReturn`: Supabase `.update({ quantity: (q) => q-n })` callback çalışmaz. Önce mevcut quantity oku, sonra `Math.max(0, current - qty)` ile set et.

### `leads`, `bookings`, `page_views`
- Hisusolutions.com sitesi için; BütçeCRM routelarında kullanılmaz.

---

## TanStack Router — Route Mimarisi

```
/app/butcecrm/
├── index.tsx          → Dashboard
├── satislar.tsx       → Satışlar
├── iadeler.tsx        → İadeler (returns modülü — 2026-06-19)
├── alislar.tsx        → Alışlar
├── giderler.tsx       → Giderler
├── stok.tsx           → Stok
├── cariler.tsx        → Müşteriler
├── raporlar.tsx       → Raporlar
├── hatirlaticilar.tsx → Hatırlatıcılar
├── ayarlar.tsx        → Ayarlar
└── reklam/
    ├── reklam.tsx         → SADECE <Outlet /> — içerik yok!
    ├── reklam.index.tsx   → /reklam genel bakış
    └── reklam.$id.tsx     → /reklam/:id kampanya detayı
```

### Kritik Kural: Child Route Pattern
Parent route (`reklam.tsx`) sadece `<Outlet />` render etmeli, içerik `.index.tsx`'e gitmeli:

```tsx
// reklam.tsx — DOĞRU
export const Route = createFileRoute("/app/butcecrm/reklam")({
  component: () => <Outlet />,
});
```

Parent'ta içerik varsa child route (`$id`) açılmaz!

---

## Reklam Sayfası — İş Mantığı

### `/reklam` (index) — Genel Bakış
- Platform karşılaştırma BarChart (tüm kampanyalar)
- **Kampanya gelir trendi** — sadece `campaign_id IS NOT NULL` olan satışlar
  - Sorgu: `.not("campaign_id", "is", null).limit(2000)`
  - JS filtresi: `if (!s.campaign_id) return false`
- Kampanya tablosu — satıra tıklayınca `reklam/$id`'ye navigate
- Action butonlarında `e.stopPropagation()` zorunlu (row click tetiklenmesin)

### `/reklam/:id` — Kampanya Detayı
- Kampanya bilgisi + o kampanyaya bağlı satışlar (`.eq("campaign_id", id)`)
- Hesaplanan metrikler: spend, revenue, profit, ROAS, budget%
- Grafikler: 6 aylık LineChart, 30 günlük BarChart
- Top 5 ürün progress bar
- Satış tablosunda müşteri: `s.customers?.name || "-"` (join ile)

---

## Sık Yapılan Hatalar ve Nasıl Önlenir

### 1. `customer_name` kolonu yok
Sales tablosunda `customer_name` diye bir kolon yoktur. Sorgu yazarken asla `select("..., customer_name")` kullanma. Doğrusu:
```ts
// YANLIŞ
select("id, sale_date, customer_name")

// DOĞRU
select("id, sale_date, customers(name)")
// Type: customers: { name: string } | null
// Display: s.customers?.name || "-"
```

### 2. Sorgu hatası veri silmez, boş döner
Supabase sorgusu bir kolon seçmeye çalışırsa ve o kolon yoksa query **error döner**, data `null` gelir. Bu sessiz bir hata gibi görünür — sayfa boş açılır, toast çıkmaz. Her yeni select sorgusuna önce gerçek tablo kolonlarını doğrula.

### 3. Yeni route oluşturulunca TypeScript hataları
TanStack Router'da yeni `.tsx` route dosyası oluşturulduktan sonra `npm run dev` çalıştırılmalı — Vite route tree'yi yeniden üretir, TS hataları otomatik kapanır.

### 4. Status toggle `confirm()` kullanmaz
Kampanya durum değişikliği için browser `confirm()` kullanma. Uygulama kendi `AlertDialog` bileşenini kullanır.

### 5. Stok delta — alış düzenlenince
Alış kaydı düzenlenirken quantity değişmişse stok delta güncellemesi zorunlu:
```
stok += (yeniMiktar - eskiMiktar)
```
Alış silinince de stok geri alınmalı: `stok -= silinenMiktar`

---

## Supabase Erişimi

```bash
# Supabase CLI ile sorgu (proje /tmp'den linked)
cd /tmp && supabase db query --linked "SELECT * FROM campaigns LIMIT 5"
```

Tablo yapısını doğrulamak için:
```bash
cd /tmp && supabase db query --linked "\d campaigns"
```

---

## Satış ↔ Kampanya Bağlantısı — Nasıl Çalışır

Satışlar kampanyaya `campaign_id` kolon ile bağlanır. Bu bağlantı **manuel** — kullanıcı satış eklerken kampanya seçer. Sistem otomatik bağlamaz.

- `campaign_id = null` → genel satış, reklam sayfasında gösterilmez
- `campaign_id = X` → X kampanyasına ait, kampanya detayında ve gelir trendinde görünür

Dolayısıyla "Mayıs Satış Artırma Kampanyası" için gelir görünmüyorsa:
1. O kampanya ID'si ile `campaign_id` eşleşen satış yok demektir
2. Satışlar eklenirken kampanya seçilmemiş olabilir
3. Çözüm: Satışlar sayfasından ilgili satışları edit et → kampanya seç

---

## Bekleyen Görevler (Bu Repoda)

| Görev | Durum | Not |
|-------|-------|-----|
| `20260615_category_seed.sql` | ❌ Pending | Supabase SQL Editor'de çalıştırılacak |
| Raporlar: DB-level filtreleme | ❌ Pending | Şu an JS'de filter ediliyor |

---

## Migrations Çalıştırma Kuralı

`supabase/migrations/` klasöründeki `.sql` dosyaları **otomatik çalışmaz**. Her migration:
1. Supabase Dashboard > SQL Editor'e kopyalanır
2. Manuel çalıştırılır
3. "success" mesajı Melih tarafından onaylandıktan sonra tamamlanmış sayılır
