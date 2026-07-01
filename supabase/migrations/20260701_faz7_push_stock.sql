-- FAZ 7: Push-Stock altyapısı
-- marketplace_sync_logs: stock_push sync_type + audit kolonları
-- products: last_pushed_at cooldown kolonu

-- 1. sync_type CHECK constraint'i güncelle (stock_push ekle)
ALTER TABLE marketplace_sync_logs
  DROP CONSTRAINT IF EXISTS marketplace_sync_logs_sync_type_check;

ALTER TABLE marketplace_sync_logs
  ADD CONSTRAINT marketplace_sync_logs_sync_type_check
  CHECK (sync_type IN ('orders', 'financial', 'stock', 'returns', 'backfill', 'connection_test', 'stock_push'));

-- 2. Push audit kolonları
ALTER TABLE marketplace_sync_logs
  ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products(id),
  ADD COLUMN IF NOT EXISTS batch_request_id TEXT,
  ADD COLUMN IF NOT EXISTS quantity_sent INTEGER;

-- 3. products: cooldown — son push zamanı
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS last_pushed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_products_last_pushed_at
  ON products(user_id, last_pushed_at)
  WHERE last_pushed_at IS NOT NULL AND deleted_at IS NULL;
