-- Permission Fixes — 2026-06-28
-- 3 kritik izin hatası:
--   1. handle_purchase_inserted trigger stock_lots'a user_id geçirmiyordu
--   2. expense_categories RLS shared kategorileri engelliyordu
--   3. product_categories RLS shared kategorileri engelliyordu

-- ─────────────────────────────────────────────────────────────
-- 1. handle_purchase_inserted: stock_lots INSERT'e user_id ekle
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_purchase_inserted()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY INVOKER AS $$
DECLARE pid uuid;
BEGIN
  IF NEW.product_name IS NULL OR NEW.product_name = '' THEN RETURN NEW; END IF;

  INSERT INTO public.products (name, category, quantity, user_id)
  VALUES (NEW.product_name, COALESCE(NEW.category, ''), NEW.quantity, NEW.user_id)
  ON CONFLICT (name, user_id) DO UPDATE
    SET quantity = public.products.quantity + EXCLUDED.quantity, updated_at = now()
  RETURNING id INTO pid;

  INSERT INTO public.stock_lots (product_id, purchase_id, lot_date, quantity, remaining_quantity, unit_price, user_id)
  VALUES (pid, NEW.id, NEW.purchase_date, NEW.quantity, NEW.quantity, NEW.unit_price, NEW.user_id);

  RETURN NEW;
END;
$$;

-- ─────────────────────────────────────────────────────────────
-- 2. expense_categories: shared (user_id NULL) + kişisel okuma
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_own_expense_categories" ON public.expense_categories;

CREATE POLICY "expense_categories_select"
  ON public.expense_categories FOR SELECT
  USING (user_id IS NULL OR (SELECT auth.uid()) = user_id);

CREATE POLICY "expense_categories_insert"
  ON public.expense_categories FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "expense_categories_update"
  ON public.expense_categories FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "expense_categories_delete"
  ON public.expense_categories FOR DELETE
  USING ((SELECT auth.uid()) = user_id);

-- ─────────────────────────────────────────────────────────────
-- 3. product_categories: aynı pattern
-- ─────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "users_own_product_categories" ON public.product_categories;

CREATE POLICY "product_categories_select"
  ON public.product_categories FOR SELECT
  USING (user_id IS NULL OR (SELECT auth.uid()) = user_id);

CREATE POLICY "product_categories_insert"
  ON public.product_categories FOR INSERT
  WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "product_categories_update"
  ON public.product_categories FOR UPDATE
  USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "product_categories_delete"
  ON public.product_categories FOR DELETE
  USING ((SELECT auth.uid()) = user_id);
