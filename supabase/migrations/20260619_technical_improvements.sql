-- BütçeCRM Teknik İyileştirmeler — 2026-06-19
-- Plan Doğrulama Ajanı onaylı

-- ============================================
-- 1. COMPOSITE INDEXES (CONCURRENTLY = zero lock)
-- ============================================
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_user_sale_date
  ON sales(user_id, sale_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_sales_user_created
  ON sales(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_expenses_user_created
  ON expenses(user_id, expense_date DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_purchases_user_created
  ON purchases(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_customers_user_id
  ON customers(user_id);

-- ============================================
-- 2. NOTES KOLONLARI (eksik olanlar)
-- ============================================
ALTER TABLE products ADD COLUMN IF NOT EXISTS note TEXT;

-- ============================================
-- 3. SALES STATUS KOLONU
-- ============================================
ALTER TABLE sales ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'aktif';
-- Değerler: 'aktif' | 'iptal' | 'iade_edildi'

-- ============================================
-- 4. DB CONSTRAINTS (veri doğrulandı: quantity >= 0)
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_products_quantity_non_negative'
  ) THEN
    ALTER TABLE products ADD CONSTRAINT chk_products_quantity_non_negative CHECK (quantity >= 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_sales_quantity_positive'
  ) THEN
    ALTER TABLE sales ADD CONSTRAINT chk_sales_quantity_positive CHECK (quantity > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_purchases_quantity_positive'
  ) THEN
    ALTER TABLE purchases ADD CONSTRAINT chk_purchases_quantity_positive CHECK (quantity > 0);
  END IF;
END $$;

-- ============================================
-- 5. DÖVİZ KOLONLARI (altyapı — UI ileride)
-- ============================================
ALTER TABLE sales
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TRY',
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1.0;

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TRY',
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1.0;

ALTER TABLE purchases
  ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'TRY',
  ADD COLUMN IF NOT EXISTS exchange_rate NUMERIC DEFAULT 1.0;
