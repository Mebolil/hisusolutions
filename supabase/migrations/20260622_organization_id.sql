-- Pusla Organization ID Altyapısı — 2026-06-22
-- Plan Uyum Ajanı onaylı ✅
-- NOT: Manuel Supabase SQL Editor'den çalıştırılacak.
-- Mevcut RLS politikaları DEĞİŞTİRİLMİYOR. Sütunlar NULL kalıyor.

ALTER TABLE sales      ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL;
ALTER TABLE expenses   ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL;
ALTER TABLE purchases  ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL;
ALTER TABLE returns    ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL;
ALTER TABLE products   ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL;
ALTER TABLE customers  ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL;
ALTER TABLE campaigns  ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
    ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS organization_id UUID DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_suppliers_org_id ON suppliers(organization_id) WHERE organization_id IS NOT NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_sales_org_id      ON sales(organization_id)     WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_expenses_org_id   ON expenses(organization_id)  WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_purchases_org_id  ON purchases(organization_id) WHERE organization_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_customers_org_id  ON customers(organization_id) WHERE organization_id IS NOT NULL;

-- Mevcut user_id = auth.uid() RLS politikaları aynen devam eder.
