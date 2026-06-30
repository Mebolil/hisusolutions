-- ============================================================
-- MARKETPLACE — Gider Kategorisi Seed
-- Tarih: 2026-06-30
-- ============================================================
-- expense_categories'teki partial unique index: (name) WHERE user_id IS NULL
-- ON CONFLICT koşulu bu index ile birebir eşleşmeli

INSERT INTO expense_categories (name, user_id) VALUES
  ('Trendyol Komisyon', NULL),
  ('Trendyol Kargo', NULL),
  ('Hepsiburada Komisyon', NULL),
  ('Hepsiburada Kargo', NULL),
  ('Platform Reklam', NULL)
ON CONFLICT (name) WHERE user_id IS NULL DO NOTHING;
