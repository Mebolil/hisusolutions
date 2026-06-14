-- Kampanyalara hedef bütçe kolonu ekle
ALTER TABLE campaigns ADD COLUMN IF NOT EXISTS budget NUMERIC DEFAULT NULL;
