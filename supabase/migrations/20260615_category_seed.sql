-- Unique constraint ekle (önce mevcut yoksa)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'expense_categories' AND indexname = 'expense_categories_name_global_unique'
  ) THEN
    CREATE UNIQUE INDEX expense_categories_name_global_unique ON expense_categories (name) WHERE user_id IS NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes WHERE tablename = 'product_categories' AND indexname = 'product_categories_name_global_unique'
  ) THEN
    CREATE UNIQUE INDEX product_categories_name_global_unique ON product_categories (name) WHERE user_id IS NULL;
  END IF;
END $$;

-- Varsayılan gider kategorileri (global — user_id NULL)
INSERT INTO expense_categories (id, name, icon, color, sort_order, user_id) VALUES
  (gen_random_uuid(), 'Kira',       '🏠', '#6366f1', 1,  NULL),
  (gen_random_uuid(), 'Elektrik',   '⚡', '#f59e0b', 2,  NULL),
  (gen_random_uuid(), 'Su',         '💧', '#3b82f6', 3,  NULL),
  (gen_random_uuid(), 'İnternet',   '🌐', '#8b5cf6', 4,  NULL),
  (gen_random_uuid(), 'Personel',   '👥', '#10b981', 5,  NULL),
  (gen_random_uuid(), 'Muhasebe',   '📊', '#f97316', 6,  NULL),
  (gen_random_uuid(), 'Reklam',     '📣', '#ef4444', 7,  NULL),
  (gen_random_uuid(), 'Vergi',      '🏛️', '#64748b', 8,  NULL),
  (gen_random_uuid(), 'Kargo',      '📦', '#0ea5e9', 9,  NULL),
  (gen_random_uuid(), 'Diğer',      '📌', '#94a3b8', 10, NULL)
ON CONFLICT DO NOTHING;

-- Varsayılan ürün kategorileri (global — user_id NULL)
INSERT INTO product_categories (id, name, sort_order, user_id) VALUES
  (gen_random_uuid(), 'Genel',       1, NULL),
  (gen_random_uuid(), 'Elektronik',  2, NULL),
  (gen_random_uuid(), 'Giyim',       3, NULL),
  (gen_random_uuid(), 'Aksesuar',    4, NULL),
  (gen_random_uuid(), 'Kozmetik',    5, NULL),
  (gen_random_uuid(), 'Gıda',        6, NULL)
ON CONFLICT DO NOTHING;
