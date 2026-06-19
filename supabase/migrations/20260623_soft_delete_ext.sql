-- BütçeCRM Soft Delete Genişletme — 2026-06-23
-- customers, suppliers, campaigns tablolarına deleted_at eklendi

ALTER TABLE customers  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE campaigns  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- suppliers tablosu varsa ekle
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
    ALTER TABLE suppliers ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;
    CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(user_id) WHERE deleted_at IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_customers_active  ON customers(user_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_campaigns_active  ON campaigns(user_id, start_date DESC) WHERE deleted_at IS NULL;

-- reminders tablosu bu kapsamda DEĞİL — hard delete kasıtlı.
