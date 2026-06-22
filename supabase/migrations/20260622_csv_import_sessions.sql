-- CSV Import Sessions altyapısı
-- Amaç: Toplu içe aktarma işlemlerini oturum bazlı takip etmek ve geri alabilmek.
-- Her import bir import_session oluşturur. İçe aktarılan kayıtlar session ID ile işaretlenir.
-- Geri alma: import_session_id = X olan tüm kayıtları silmek = tek komutla rollback.

-- =============================================================================
-- 1. import_sessions tablosu
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.import_sessions (
  id              uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  module          text NOT NULL CHECK (module IN ('sales', 'expenses', 'customers', 'products')),
  source          text NOT NULL DEFAULT 'custom',
  -- source örnekleri: 'trendyol', 'hepsiburada', 'amazon', 'banka', 'custom'
  row_count       integer NOT NULL DEFAULT 0,
  status          text NOT NULL DEFAULT 'committed' CHECK (status IN ('committed', 'rolled_back')),
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- RLS: Kullanıcı sadece kendi oturumlarını görebilir
ALTER TABLE public.import_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "import_sessions_user_select"
  ON public.import_sessions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "import_sessions_user_insert"
  ON public.import_sessions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "import_sessions_user_update"
  ON public.import_sessions FOR UPDATE
  USING (user_id = auth.uid());

-- Index: kullanıcı bazlı liste için
CREATE INDEX IF NOT EXISTS idx_import_sessions_user_id ON public.import_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_import_sessions_module ON public.import_sessions(user_id, module);

-- =============================================================================
-- 2. import_session_id kolonu — tüm ilgili tablolara ekleniyor
-- =============================================================================

-- sales
ALTER TABLE public.sales
  ADD COLUMN IF NOT EXISTS import_session_id uuid REFERENCES public.import_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sales_import_session ON public.sales(import_session_id)
  WHERE import_session_id IS NOT NULL;

-- expenses
ALTER TABLE public.expenses
  ADD COLUMN IF NOT EXISTS import_session_id uuid REFERENCES public.import_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_import_session ON public.expenses(import_session_id)
  WHERE import_session_id IS NOT NULL;

-- customers
ALTER TABLE public.customers
  ADD COLUMN IF NOT EXISTS import_session_id uuid REFERENCES public.import_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_customers_import_session ON public.customers(import_session_id)
  WHERE import_session_id IS NOT NULL;

-- products
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS import_session_id uuid REFERENCES public.import_sessions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_products_import_session ON public.products(import_session_id)
  WHERE import_session_id IS NOT NULL;

-- =============================================================================
-- 3. rollback_import fonksiyonu — tek çağrıyla tüm kayıtları soft-delete eder
-- =============================================================================

CREATE OR REPLACE FUNCTION public.rollback_import(p_session_id uuid, p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_module    text;
  v_count     integer := 0;
  v_sales     integer := 0;
  v_expenses  integer := 0;
  v_customers integer := 0;
  v_products  integer := 0;
BEGIN
  -- Oturum doğrulama
  SELECT module INTO v_module
  FROM import_sessions
  WHERE id = p_session_id AND user_id = p_user_id AND status = 'committed';

  IF v_module IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Oturum bulunamadı veya zaten geri alındı');
  END IF;

  -- Soft delete: deleted_at = now() ile işaretle
  IF v_module = 'sales' THEN
    UPDATE sales
    SET deleted_at = now()
    WHERE import_session_id = p_session_id AND user_id = p_user_id AND deleted_at IS NULL;
    GET DIAGNOSTICS v_sales = ROW_COUNT;
    v_count := v_sales;
  ELSIF v_module = 'expenses' THEN
    UPDATE expenses
    SET deleted_at = now()
    WHERE import_session_id = p_session_id AND user_id = p_user_id AND deleted_at IS NULL;
    GET DIAGNOSTICS v_expenses = ROW_COUNT;
    v_count := v_expenses;
  ELSIF v_module = 'customers' THEN
    UPDATE customers
    SET deleted_at = now()
    WHERE import_session_id = p_session_id AND user_id = p_user_id AND deleted_at IS NULL;
    GET DIAGNOSTICS v_customers = ROW_COUNT;
    v_count := v_customers;
  ELSIF v_module = 'products' THEN
    UPDATE products
    SET deleted_at = now()
    WHERE import_session_id = p_session_id AND user_id = p_user_id AND deleted_at IS NULL;
    GET DIAGNOSTICS v_products = ROW_COUNT;
    v_count := v_products;
  END IF;

  -- Oturumu geri alındı olarak işaretle
  UPDATE import_sessions
  SET status = 'rolled_back'
  WHERE id = p_session_id AND user_id = p_user_id;

  RETURN jsonb_build_object(
    'success', true,
    'rolled_back', v_count,
    'module', v_module
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rollback_import FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rollback_import TO authenticated;
