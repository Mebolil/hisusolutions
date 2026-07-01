-- FAZ 5: Trendyol İade/İptal Sync altyapısı

-- M1: marketplace_returns tablosu
CREATE TABLE IF NOT EXISTS marketplace_returns (
  id                       uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id                  uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  marketplace_connection_id uuid REFERENCES marketplace_connections(id) ON DELETE SET NULL,
  claim_id                 text NOT NULL,
  order_id                 text,
  claim_type               text,          -- "RETURN" | "CANCEL"
  return_date              date,
  total_price              numeric,
  items                    jsonb,
  synced_at                timestamptz DEFAULT now(),
  deleted_at               timestamptz,
  created_at               timestamptz DEFAULT now()
);

-- M2: Duplicate prevention (claim_id + user_id)
CREATE UNIQUE INDEX IF NOT EXISTS marketplace_returns_claim_user_idx
ON marketplace_returns(user_id, claim_id)
WHERE deleted_at IS NULL;

-- M3: Performans indexi
CREATE INDEX IF NOT EXISTS marketplace_returns_user_date_idx
ON marketplace_returns(user_id, return_date DESC)
WHERE deleted_at IS NULL;

-- M4: RLS
ALTER TABLE marketplace_returns ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "marketplace_returns_user_policy"
    ON marketplace_returns FOR ALL
    USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- M5: last_returns_sync_at kolonu marketplace_connections'a
ALTER TABLE marketplace_connections
  ADD COLUMN IF NOT EXISTS last_returns_sync_at timestamptz;
