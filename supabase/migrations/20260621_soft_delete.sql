-- Pusla Soft Delete Altyapısı — 2026-06-21
-- Plan Uyum Ajanı onaylı ✅
-- NOT: Bu dosya Supabase Dashboard > SQL Editor'den manuel çalıştırılacak.

ALTER TABLE sales     ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE expenses  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE purchases ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE returns   ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE products  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_sales_active_user
  ON sales(user_id, sale_date DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_active_user
  ON expenses(user_id, expense_date DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_purchases_active_user
  ON purchases(user_id, created_at DESC) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_returns_active_user
  ON returns(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_active_user
  ON products(user_id) WHERE deleted_at IS NULL;

-- RLS POLİTİKALARI DEĞİŞTİRİLMİYOR.
-- deleted_at filtresi frontend SELECT'lerde uygulanır.
