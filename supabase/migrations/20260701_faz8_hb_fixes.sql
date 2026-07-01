-- marketplace_returns: platform ve status kolonları ekle (HB iade sync için gerekli)
ALTER TABLE marketplace_returns
  ADD COLUMN IF NOT EXISTS platform TEXT,
  ADD COLUMN IF NOT EXISTS status TEXT;

-- products: platform dahil unique constraint (TY ve HB aynı SKU birbirini ezmemeli)
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_marketplace_id_user_unique;
ALTER TABLE products
  ADD CONSTRAINT products_marketplace_id_user_platform_unique
  UNIQUE (user_id, marketplace_product_id, platform);

-- hepsiburada-sync-stock upsert onConflict güncellenmeli (bkz Fix 9)
