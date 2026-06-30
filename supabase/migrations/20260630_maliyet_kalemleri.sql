-- Maliyet Kalemleri: normalized per-sale and per-return cost item storage
-- Sprint 2: DB-backed cost items, note field used as fallback for legacy sales

CREATE TYPE cost_item_type AS ENUM (
  'urun_maliyeti',
  'kargo',
  'komisyon',
  'ambalaj',
  'diger'
);

CREATE TYPE return_cost_type AS ENUM (
  'kargo_iade',
  'komisyon_iade',
  'ambalaj_iade',
  'diger'
);

CREATE TABLE sale_cost_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id),
  sale_id    uuid NOT NULL REFERENCES sales(id),
  label      text NOT NULL,
  cost_type  cost_item_type NOT NULL DEFAULT 'diger',
  amount     numeric NOT NULL CHECK (amount >= 0),
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE return_cost_items (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id),
  return_id  uuid NOT NULL REFERENCES returns(id),
  label      text NOT NULL,
  cost_type  return_cost_type NOT NULL DEFAULT 'diger',
  amount     numeric NOT NULL CHECK (amount >= 0),
  deleted_at timestamptz DEFAULT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_sale_cost_items_user_sale    ON sale_cost_items (user_id, sale_id);
CREATE INDEX idx_sale_cost_items_user_type    ON sale_cost_items (user_id, cost_type) WHERE deleted_at IS NULL;
CREATE INDEX idx_return_cost_items_user_return ON return_cost_items (user_id, return_id);
CREATE INDEX idx_return_cost_items_user_type   ON return_cost_items (user_id, cost_type) WHERE deleted_at IS NULL;

ALTER TABLE sale_cost_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sale cost items" ON sale_cost_items
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

ALTER TABLE return_cost_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own return cost items" ON return_cost_items
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
