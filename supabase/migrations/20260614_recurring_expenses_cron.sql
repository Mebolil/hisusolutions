-- Tekrar eden giderleri + hatırlatıcıları tüm kullanıcılar için otomatik oluşturan sistem
-- Supabase Dashboard > SQL Editor'de çalıştır

-- 1. pg_cron aktif et
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. reminders.auto_key unique constraint (mükerrer önleme)
ALTER TABLE reminders ADD CONSTRAINT reminders_auto_key_unique UNIQUE (auto_key);

-- 3. Ortak fonksiyon: tüm kullanıcılar için gider + hatırlatıcı oluştur
CREATE OR REPLACE FUNCTION create_recurring_expenses_and_reminders(p_interval text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
DECLARE
  rec RECORD;
  new_expense_id uuid;
  expense_date_val date;
  remind_on_val date;
BEGIN
  -- Aralığa göre gider tarihi hesapla
  CASE p_interval
    WHEN 'Aylık'    THEN expense_date_val := date_trunc('month', CURRENT_DATE)::date;
    WHEN 'Haftalık' THEN expense_date_val := CURRENT_DATE;
    WHEN 'Senelik'  THEN expense_date_val := date_trunc('year', CURRENT_DATE)::date;
    WHEN 'Günlük'   THEN expense_date_val := CURRENT_DATE;
    ELSE RETURN;
  END CASE;

  -- Her kullanıcı + kategori + tutar için en son recurring kaydı al
  -- SECURITY DEFINER + postgres owner sayesinde RLS bypass edilir → tüm kullanıcılar kapsanır
  FOR rec IN
    SELECT DISTINCT ON (user_id, category, amount)
      id, user_id, category, amount, note, recurrence_interval
    FROM expenses
    WHERE is_recurring = true
      AND recurrence_interval = p_interval
    ORDER BY user_id, category, amount, expense_date DESC
  LOOP
    -- Bu dönem için zaten oluşturulduysa geç
    CONTINUE WHEN EXISTS (
      SELECT 1 FROM expenses e2
      WHERE e2.user_id = rec.user_id
        AND e2.category = rec.category
        AND e2.amount = rec.amount
        AND e2.is_recurring = true
        AND e2.expense_date = expense_date_val
    );

    -- Yeni gider oluştur (bekliyor statüsünde)
    INSERT INTO expenses (
      user_id, expense_date, category, amount,
      paid_amount, payment_status, note,
      is_recurring, recurrence_interval
    ) VALUES (
      rec.user_id, expense_date_val, rec.category, rec.amount,
      0, 'bekliyor', rec.note,
      true, rec.recurrence_interval
    )
    RETURNING id INTO new_expense_id;

    -- Hatırlatıcı: ödeme gününden 3 gün önce, minimum bugün
    remind_on_val := GREATEST(expense_date_val - interval '3 days', CURRENT_DATE)::date;

    INSERT INTO reminders (
      user_id, expense_id, type, title, message,
      remind_on, due_date, status, source, auto_key,
      is_recurring, recurrence_interval
    ) VALUES (
      rec.user_id,
      new_expense_id,
      'expense',
      rec.category || ' ödemesi yaklaşıyor',
      rec.category || ' için ' || to_char(rec.amount, 'FM999G999G990') || ' ₺ ödeme ' || to_char(expense_date_val, 'DD.MM.YYYY') || ' tarihinde yapılacak.',
      remind_on_val,
      expense_date_val,
      'pending',
      'auto',
      'recurring-' || p_interval || '-' || rec.user_id::text || '-' || rec.category || '-' || expense_date_val::text,
      true,
      rec.recurrence_interval
    )
    ON CONFLICT (auto_key) DO NOTHING;

  END LOOP;
END;
$func$;

-- 4. Cron job'ları (önceki varsa önce kaldır)
SELECT cron.unschedule(jobname) FROM cron.job WHERE jobname LIKE 'recurring-expenses%';

SELECT cron.schedule('recurring-expenses-monthly', '0 9 1 * *', $$SELECT create_recurring_expenses_and_reminders('Aylık');$$);
SELECT cron.schedule('recurring-expenses-weekly',  '0 9 * * 1', $$SELECT create_recurring_expenses_and_reminders('Haftalık');$$);
SELECT cron.schedule('recurring-expenses-yearly',  '0 9 1 1 *', $$SELECT create_recurring_expenses_and_reminders('Senelik');$$);
SELECT cron.schedule('recurring-expenses-daily',   '0 9 * * *', $$SELECT create_recurring_expenses_and_reminders('Günlük');$$);

-- Doğrulama
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE 'recurring-expenses%';
