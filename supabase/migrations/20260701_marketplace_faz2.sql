-- ============================================================
-- FAZ 2: Trendyol Sipariş Sync Altyapısı
-- Tarih: 2026-07-01
-- ============================================================

-- Tahmini komisyon takibi (Faz 3 finansal sync'te kullanılacak)
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS settlement_status TEXT DEFAULT 'confirmed'
    CHECK (settlement_status IN ('estimated', 'confirmed'));

ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS estimated_order_no TEXT;

-- Sipariş upsert fonksiyonu
-- Neden RPC: Supabase JS client partial index WHERE koşulunu ON CONFLICT'e geçiremiyor.
-- PostgreSQL partial index inference her zaman çalışmaz; doğrudan SQL zorunlu.
CREATE OR REPLACE FUNCTION public.upsert_marketplace_sale(
  p_user_id       UUID,
  p_external_id   TEXT,
  p_external_order_no TEXT,
  p_platform      TEXT,
  p_product_name  TEXT,
  p_quantity      INTEGER,
  p_total_amount  NUMERIC,
  p_unit_price    NUMERIC,
  p_sale_date     DATE,
  p_status        TEXT,
  p_note          TEXT
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.sales (
    user_id, external_id, external_order_no, platform,
    product_name, quantity, total_amount, unit_price, total_cost,
    sale_date, status, note, currency, exchange_rate
  ) VALUES (
    p_user_id, p_external_id, p_external_order_no, p_platform,
    p_product_name, p_quantity, p_total_amount, p_unit_price, NULL,
    p_sale_date, p_status, p_note, 'TRY', 1.0
  )
  ON CONFLICT (user_id, platform, external_id)
    WHERE external_id IS NOT NULL AND platform IS NOT NULL AND deleted_at IS NULL
  DO UPDATE SET
    status       = EXCLUDED.status,
    total_amount = EXCLUDED.total_amount
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.upsert_marketplace_sale TO service_role;
