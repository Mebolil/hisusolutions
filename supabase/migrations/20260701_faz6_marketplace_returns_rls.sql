-- FAZ 6 FIX: marketplace_returns RLS — FOR ALL → SELECT only
-- Frontend'den INSERT/UPDATE/DELETE yapılamamalı; yalnızca sync EF (service role) yazabilir.
-- Service role RLS'yi bypass ettiği için sync kesintisiz devam eder.

DROP POLICY IF EXISTS "marketplace_returns_user_policy" ON marketplace_returns;

CREATE POLICY "marketplace_returns_select"
  ON marketplace_returns FOR SELECT
  USING (user_id = auth.uid());
