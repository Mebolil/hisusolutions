-- FAZ 5 FIX: Partial index → Full UNIQUE CONSTRAINT
-- Partial index onConflict ile çalışmaz (PostgreSQL kısıtı)

DROP INDEX IF EXISTS marketplace_returns_claim_user_idx;

ALTER TABLE marketplace_returns
  ADD CONSTRAINT marketplace_returns_claim_user_uniq UNIQUE (user_id, claim_id);
