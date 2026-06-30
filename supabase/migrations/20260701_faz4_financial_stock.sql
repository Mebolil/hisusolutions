-- FAZ 4: Finansal Sync + Stok Sync altyapısı

-- M1: Finansal sync duplicate prevention (partial unique index)
CREATE UNIQUE INDEX IF NOT EXISTS expenses_settlement_unique_idx
ON expenses(user_id, external_settlement_id)
WHERE external_settlement_id IS NOT NULL AND deleted_at IS NULL;

-- M2: expense_categories seed — Trendyol kategorileri
INSERT INTO expense_categories (name, icon, color, sort_order)
SELECT name, icon, color, sort_order FROM (VALUES
  ('Trendyol Komisyon', '🏪', '#FF6B00', 100),
  ('Trendyol Kargo', '📦', '#FF6B00', 101),
  ('Trendyol İndirim', '🏷️', '#FF6B00', 102),
  ('Trendyol Diğer', '📋', '#FF6B00', 103)
) AS t(name, icon, color, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM expense_categories WHERE expense_categories.name = t.name
);

-- M3: products tablosuna platform kolonu
ALTER TABLE products ADD COLUMN IF NOT EXISTS platform TEXT;

-- M4: Stok sync unique constraint (named — JS client onConflict için gerekli)
DO $$ BEGIN
  ALTER TABLE products
    ADD CONSTRAINT products_marketplace_id_user_unique
    UNIQUE (user_id, marketplace_product_id);
EXCEPTION WHEN others THEN NULL;
END $$;

-- M5: Performans indexleri
CREATE INDEX IF NOT EXISTS expenses_date_user_idx
ON expenses(user_id, expense_date);

CREATE INDEX IF NOT EXISTS products_platform_user_idx
ON products(user_id, platform)
WHERE platform IS NOT NULL;
