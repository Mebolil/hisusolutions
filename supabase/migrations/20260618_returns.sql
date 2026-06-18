-- İade nedeni kategorisi ENUM (idempotent)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'return_reason_category') THEN
    CREATE TYPE return_reason_category AS ENUM (
      'musteri_vazgecti',
      'urun_hasarli',
      'yanlis_urun',
      'beden_renk',
      'gec_teslimat',
      'diger'
    );
  END IF;
END $$;

-- İadeler tablosu
CREATE TABLE returns (
  id              uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid    NOT NULL REFERENCES auth.users(id),
  sale_id         uuid    NOT NULL REFERENCES sales(id),
  product_id      uuid    REFERENCES products(id),
  return_date     date    NOT NULL DEFAULT CURRENT_DATE,
  product_name    text    NOT NULL,
  quantity        int     NOT NULL DEFAULT 1,
  return_amount   numeric NOT NULL DEFAULT 0,
  refund_method   text    NOT NULL DEFAULT 'nakit',
  reason_category return_reason_category NOT NULL,
  reason_detail   text,
  restock         boolean NOT NULL DEFAULT true,
  cost_reversed   numeric DEFAULT 0,
  status          text    NOT NULL DEFAULT 'active',
  note            text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX idx_returns_user ON returns(user_id);
CREATE INDEX idx_returns_sale ON returns(sale_id);

ALTER TABLE returns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "returns_owner" ON returns
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Atomik iade işlemi RPC
CREATE OR REPLACE FUNCTION process_return(
  p_user_id        uuid,
  p_sale_id        uuid,
  p_product_id     uuid,
  p_product_name   text,
  p_quantity       int,
  p_return_amount  numeric,
  p_refund_method  text,
  p_reason_category text,
  p_reason_detail  text,
  p_restock        boolean,
  p_cost_reversed  numeric,
  p_note           text
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_original_qty   int;
  v_returned_qty   int;
  v_return_id      uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM sales WHERE id = p_sale_id AND user_id = p_user_id) THEN
    RAISE EXCEPTION 'Satış bulunamadı';
  END IF;

  SELECT quantity INTO v_original_qty FROM sales WHERE id = p_sale_id;

  SELECT COALESCE(SUM(quantity), 0) INTO v_returned_qty
  FROM returns
  WHERE sale_id = p_sale_id AND status = 'active';

  IF v_returned_qty + p_quantity > v_original_qty THEN
    RAISE EXCEPTION 'İade miktarı orijinal satış miktarını (%) aşıyor', v_original_qty;
  END IF;

  INSERT INTO returns (
    user_id, sale_id, product_id, product_name, quantity,
    return_amount, refund_method, reason_category, reason_detail,
    restock, cost_reversed, note
  ) VALUES (
    p_user_id, p_sale_id, p_product_id, p_product_name, p_quantity,
    p_return_amount, p_refund_method, p_reason_category::return_reason_category,
    p_reason_detail, p_restock, p_cost_reversed, p_note
  ) RETURNING id INTO v_return_id;

  IF p_restock AND p_product_id IS NOT NULL THEN
    UPDATE products SET quantity = quantity + p_quantity
    WHERE id = p_product_id AND user_id = p_user_id;
  END IF;

  RETURN v_return_id;
END;
$$;
