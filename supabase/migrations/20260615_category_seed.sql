-- Varsayılan gider kategorileri
INSERT INTO expense_categories (name) VALUES
  ('Kira'),
  ('Elektrik'),
  ('Su'),
  ('İnternet'),
  ('Personel'),
  ('Muhasebe'),
  ('Reklam'),
  ('Vergi'),
  ('Kargo'),
  ('Diğer')
ON CONFLICT (name) DO NOTHING;

-- Varsayılan ürün kategorileri
INSERT INTO product_categories (name) VALUES
  ('Genel'),
  ('Elektronik'),
  ('Giyim'),
  ('Aksesuar'),
  ('Kozmetik'),
  ('Gıda')
ON CONFLICT (name) DO NOTHING;
