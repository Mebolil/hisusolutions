-- Tekrar eden giderleri + hatırlatıcıları tüm kullanıcılar için otomatik oluşturan sistem
-- Her gün 09:00'da çalışır. O gün "doğum günü" olan recurring giderin bir sonraki periyodunu oluşturur.
-- Supabase Dashboard > SQL Editor'de sıfırdan çalıştırılacaksa buradan başla.

-- 1. pg_cron aktif et
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. reminders.auto_key unique constraint (mükerrer önleme)
ALTER TABLE reminders ADD CONSTRAINT IF NOT EXISTS reminders_auto_key_unique UNIQUE (auto_key);

-- 3. Ana fonksiyon
CREATE OR REPLACE FUNCTION create_recurring_expenses_and_reminders(p_interval text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  rec RECORD;
  new_expense_id uuid;
  next_date date;
  remind_on_val date;
BEGIN
  -- Bugün hangi recurring giderler var? (orijinal kaydın "doğum günü" mü kontrol et)
  FOR rec IN
    SELECT DISTINCT ON (user_id, category, amount)
      id, user_id, category, amount, note, recurrence_interval, expense_date
    FROM expenses
    WHERE is_recurring = true
      AND recurrence_interval = p_interval
      AND CASE p_interval
        WHEN 'Günlük'   THEN true
        WHEN 'Haftalık' THEN EXTRACT(DOW FROM expense_date) = EXTRACT(DOW FROM CURRENT_DATE)
        WHEN 'Aylık'    THEN EXTRACT(DAY FROM expense_date) = EXTRACT(DAY FROM CURRENT_DATE)
        WHEN 'Senelik'  THEN EXTRACT(MONTH FROM expense_date) = EXTRACT(MONTH FROM CURRENT_DATE)
                         AND EXTRACT(DAY FROM expense_date) = EXTRACT(DAY FROM CURRENT_DATE)
        ELSE false
      END
    ORDER BY user_id, category, amount, expense_date DESC
  LOOP
    -- Bir sonraki periyot tarihi
    next_date := CASE p_interval
      WHEN 'Günlük'   THEN CURRENT_DATE + interval '1 day'
      WHEN 'Haftalık' THEN CURRENT_DATE + interval '1 week'
      WHEN 'Aylık'    THEN CURRENT_DATE + interval '1 month'
      WHEN 'Senelik'  THEN CURRENT_DATE + interval '1 year'
    END;

    -- O tarihte zaten kayıt varsa geç
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM expenses e2
      WHERE e2.user_id = rec.user_id
        AND e2.category = rec.category
        AND e2.amount = rec.amount
        AND e2.is_recurring = true
        AND e2.expense_date = next_date
    );

    -- Yeni gider: bekliyor statüsünde
    INSERT INTO expenses (
      user_id, expense_date, category, amount,
      paid_amount, payment_status, note,
      is_recurring, recurrence_interval
    ) VALUES (
      rec.user_id, next_date, rec.category, rec.amount,
      0, 'bekliyor', rec.note,
      true, rec.recurrence_interval
    )
    RETURNING id INTO new_expense_id;

    -- Hatırlatıcı: 3 gün önce
    remind_on_val := next_date - interval '3 days';

    INSERT INTO reminders (
      user_id, expense_id, type, title, message,
      remind_on, due_date, status, source, auto_key,
      is_recurring, recurrence_interval
    ) VALUES (
      rec.user_id,
      new_expense_id,
      'expense',
      rec.category || ' ödemesi yaklaşıyor',
      rec.category || ' için ' || to_char(rec.amount, 'FM999G999G990') || ' ₺ ödeme ' || to_char(next_date, 'DD.MM.YYYY') || ' tarihinde yapılacak.',
      remind_on_val,
      next_date,
      'pending',
      'auto',
      'recurring-' || p_interval || '-' || rec.user_id::text || '-' || rec.category || '-' || next_date::text,
      true,
      rec.recurrence_interval
    )
    ON CONFLICT (auto_key) DO NOTHING;

  END LOOP;
END;
$func$;

-- 4. Cron job'ları — her gece 09:00, tüm aralıkları kontrol et
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname LIKE 'recurring-expenses%';

SELECT cron.schedule('recurring-expenses-daily',   '0 9 * * *', $$SELECT create_recurring_expenses_and_reminders('Günlük');$$);
SELECT cron.schedule('recurring-expenses-weekly',  '0 9 * * *', $$SELECT create_recurring_expenses_and_reminders('Haftalık');$$);
SELECT cron.schedule('recurring-expenses-monthly', '0 9 * * *', $$SELECT create_recurring_expenses_and_reminders('Aylık');$$);
SELECT cron.schedule('recurring-expenses-yearly',  '0 9 * * *', $$SELECT create_recurring_expenses_and_reminders('Senelik');$$);

-- Doğrulama
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE 'recurring-expenses%';
