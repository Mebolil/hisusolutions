-- ============================================================
-- MARKETPLACE ENTEGRASYON — Temel Altyapı
-- Tarih: 2026-06-30
-- Faz: 1 / 9
-- ============================================================

-- 1. Kullanıcı marketplace bağlantıları
CREATE TABLE IF NOT EXISTS public.marketplace_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  organization_id UUID DEFAULT NULL,

  platform TEXT NOT NULL CHECK (platform IN ('trendyol', 'hepsiburada')),
  store_name TEXT,

  -- Trendyol credentials (Vault secret ID referansları — plaintext saklanmaz)
  trendyol_supplier_id TEXT,
  trendyol_api_key_secret_id TEXT,
  trendyol_api_secret_secret_id TEXT,

  -- Hepsiburada credentials (Vault secret ID referansları)
  hb_merchant_id TEXT,
  hb_username TEXT,
  hb_password_secret_id TEXT,

  -- Chrome Extension auth token (kullanıcıya gösterilen, unique)
  extension_api_token UUID DEFAULT gen_random_uuid() NOT NULL,

  -- Sync state
  last_order_sync_at TIMESTAMPTZ,
  last_financial_sync_at TIMESTAMPTZ,
  last_stock_sync_at TIMESTAMPTZ,
  last_return_sync_at TIMESTAMPTZ,

  -- Backfill tracking
  initial_backfill_done BOOLEAN DEFAULT false,
  backfill_started_at TIMESTAMPTZ,
  backfill_completed_at TIMESTAMPTZ,
  backfill_last_fetched_date DATE,

  -- Durum
  sync_status TEXT DEFAULT 'idle' CHECK (
    sync_status IN ('idle', 'running', 'error', 'disabled', 'backfilling')
  ),
  sync_error_message TEXT,
  sync_error_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,

  -- Meta
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  deleted_at TIMESTAMPTZ DEFAULT NULL,

  -- Platform'a göre zorunlu alan kontrolleri
  CONSTRAINT trendyol_fields_required CHECK (
    platform != 'trendyol' OR
    (trendyol_supplier_id IS NOT NULL AND trendyol_api_key_secret_id IS NOT NULL)
  ),
  CONSTRAINT hepsiburada_fields_required CHECK (
    platform != 'hepsiburada' OR
    (hb_merchant_id IS NOT NULL AND hb_username IS NOT NULL)
  )
);

-- Partial unique index'ler (NULL değerler nedeniyle tablo-level UNIQUE kullanılamaz)
CREATE UNIQUE INDEX IF NOT EXISTS uq_marketplace_trendyol
  ON marketplace_connections(user_id, trendyol_supplier_id)
  WHERE platform = 'trendyol' AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_marketplace_hepsiburada
  ON marketplace_connections(user_id, hb_merchant_id)
  WHERE platform = 'hepsiburada' AND deleted_at IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_marketplace_extension_token
  ON marketplace_connections(extension_api_token)
  WHERE deleted_at IS NULL;

-- 2. Sync log tablosu
CREATE TABLE IF NOT EXISTS public.marketplace_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  connection_id UUID REFERENCES marketplace_connections(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) NOT NULL,

  sync_type TEXT NOT NULL CHECK (sync_type IN (
    'orders', 'financial', 'stock', 'returns', 'backfill', 'connection_test'
  )),

  started_at TIMESTAMPTZ DEFAULT now(),
  finished_at TIMESTAMPTZ,
  duration_ms INTEGER,

  status TEXT CHECK (status IN ('running', 'success', 'error', 'partial')),

  records_fetched INTEGER DEFAULT 0,
  records_inserted INTEGER DEFAULT 0,
  records_updated INTEGER DEFAULT 0,
  records_skipped INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,

  sync_from TIMESTAMPTZ,
  sync_to TIMESTAMPTZ,

  error_message TEXT,
  error_code TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Mevcut tablolara kolon eklemeleri
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS external_id TEXT,
  ADD COLUMN IF NOT EXISTS external_order_no TEXT;

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS marketplace_connection_id UUID REFERENCES marketplace_connections(id),
  ADD COLUMN IF NOT EXISTS is_auto_synced BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS external_settlement_id TEXT;

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sku TEXT,
  ADD COLUMN IF NOT EXISTS marketplace_product_id TEXT;

-- 4. İndeksler
CREATE INDEX IF NOT EXISTS idx_marketplace_connections_user_id
  ON marketplace_connections(user_id) WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_connections_platform
  ON marketplace_connections(user_id, platform) WHERE is_active = true AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_marketplace_sync_logs_connection
  ON marketplace_sync_logs(connection_id, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_marketplace_sync_logs_user
  ON marketplace_sync_logs(user_id, started_at DESC);

-- Sales external_id duplicate önleme (partial index — partial index ON CONFLICT WHERE gerektirir)
CREATE UNIQUE INDEX IF NOT EXISTS idx_sales_external_id_platform
  ON sales(user_id, platform, external_id)
  WHERE external_id IS NOT NULL AND platform IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_products_sku
  ON products(user_id, sku) WHERE sku IS NOT NULL AND deleted_at IS NULL;

-- Expense settlement ID duplicate önleme
CREATE UNIQUE INDEX IF NOT EXISTS idx_expenses_external_settlement
  ON expenses(user_id, external_settlement_id)
  WHERE external_settlement_id IS NOT NULL AND deleted_at IS NULL;

-- 5. RLS Politikaları
ALTER TABLE marketplace_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_sync_logs ENABLE ROW LEVEL SECURITY;

-- marketplace_connections
CREATE POLICY "marketplace_connections_select"
  ON marketplace_connections FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "marketplace_connections_insert"
  ON marketplace_connections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "marketplace_connections_update"
  ON marketplace_connections FOR UPDATE
  USING (auth.uid() = user_id AND deleted_at IS NULL);

-- marketplace_sync_logs
CREATE POLICY "marketplace_sync_logs_select"
  ON marketplace_sync_logs FOR SELECT
  USING (auth.uid() = user_id);

-- 6. updated_at otomatik güncelleme trigger'ı
CREATE OR REPLACE FUNCTION update_marketplace_connection_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER marketplace_connections_updated_at
  BEFORE UPDATE ON marketplace_connections
  FOR EACH ROW EXECUTE FUNCTION update_marketplace_connection_updated_at();

-- 7. Vault wrapper'ları — Edge Function'lardan Vault erişimi için zorunlu
-- (vault şeması PostgREST tarafından expose edilmez, bu wrapper'lar üzerinden erişilir)

-- Vault'tan şifreli değer okuma
CREATE OR REPLACE FUNCTION public.get_decrypted_secret(secret_name text)
RETURNS text
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = secret_name
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_decrypted_secret TO service_role;

-- Vault'a yeni secret oluşturma, secret UUID'sini döner
CREATE OR REPLACE FUNCTION public.vault_create_secret(
  p_secret text,
  p_name text,
  p_description text DEFAULT NULL
)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
AS $$
  INSERT INTO vault.secrets (secret, name, description)
  VALUES (p_secret, p_name, p_description)
  RETURNING id;
$$;

GRANT EXECUTE ON FUNCTION public.vault_create_secret TO service_role;

-- Vault'tan secret silme
CREATE OR REPLACE FUNCTION public.vault_delete_secret(p_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM vault.secrets WHERE id = p_id;
$$;

GRANT EXECUTE ON FUNCTION public.vault_delete_secret TO service_role;

-- 8. Sync log temizleme cron (90 günden eski logları sil)
-- Bu cron Supabase Dashboard SQL Editor'de ayrıca çalıştırılır:
-- SELECT cron.schedule('cleanup-sync-logs', '0 2 * * *',
--   'DELETE FROM marketplace_sync_logs WHERE created_at < now() - interval ''90 days''');
