-- process_return fonksiyonuna p_return_date parametresi ekle
-- Mevcut 20260618_returns.sql baz alındı; tek fark return_date'in parametreyle doldurulması
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
  p_note           text,
  p_return_date    date DEFAULT CURRENT_DATE
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
    restock, cost_reversed, note, return_date
  ) VALUES (
    p_user_id, p_sale_id, p_product_id, p_product_name, p_quantity,
    p_return_amount, p_refund_method, p_reason_category::return_reason_category,
    p_reason_detail, p_restock, p_cost_reversed, p_note, p_return_date
  ) RETURNING id INTO v_return_id;

  IF p_restock AND p_product_id IS NOT NULL THEN
    UPDATE products SET quantity = quantity + p_quantity
    WHERE id = p_product_id AND user_id = p_user_id;
  END IF;

  RETURN v_return_id;
END;
$$;
