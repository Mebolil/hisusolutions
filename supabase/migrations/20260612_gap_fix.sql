-- Gap Fix Migration — 2026-06-12
-- Çalıştırma: Supabase Dashboard > SQL Editor

-- 1. leads.email — filtreleme ve segmentasyon için ayrı kolon
ALTER TABLE leads ADD COLUMN IF NOT EXISTS email VARCHAR(255);
UPDATE leads SET email = (payload->>'email')
WHERE payload->>'email' IS NOT NULL;

-- 2. leads.lead_magnet — PDF lead'leri işaretlemek için flag
ALTER TABLE leads ADD COLUMN IF NOT EXISTS lead_magnet BOOLEAN DEFAULT FALSE;
UPDATE leads SET lead_magnet = TRUE WHERE source = 'lead-magnet';

-- 3. bookings.qualification — demo qualification verisi için JSONB
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS qualification JSONB DEFAULT NULL;

-- 4. page_views — behavioral tracking için tablo
CREATE TABLE IF NOT EXISTS page_views (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  session_id VARCHAR(255),
  page_path VARCHAR(1024),
  referrer VARCHAR(1024),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pv_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views(created_at DESC);

-- RLS: page_views anonim insert'e açık, okuma sadece service role
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "anon_insert_page_views"
  ON page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
