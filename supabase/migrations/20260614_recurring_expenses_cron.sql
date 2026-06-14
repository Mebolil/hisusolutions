-- Tekrar eden giderleri otomatik oluşturan pg_cron job'ları
-- Supabase Dashboard > SQL Editor'de çalıştır
-- pg_cron extension Supabase'de varsayılan olarak aktif

-- Aylık tekrar edenler — her ayın 1'i saat 09:00
SELECT cron.schedule(
  'recurring-expenses-monthly',
  '0 9 1 * *',
  $$
    INSERT INTO expenses (user_id, expense_date, category, amount, paid_amount, payment_status, note, is_recurring, recurrence_interval)
    SELECT
      user_id,
      date_trunc('month', CURRENT_DATE)::date,  -- Bu ayın 1'i
      category,
      amount,
      0,
      'bekliyor',
      note,
      true,
      recurrence_interval
    FROM expenses
    WHERE is_recurring = true
      AND recurrence_interval = 'Aylık'
      -- Geçen ay bu kategori + tutar + user kombinasyonu zaten kopyalanmış mı kontrolü
      AND NOT EXISTS (
        SELECT 1 FROM expenses e2
        WHERE e2.user_id = expenses.user_id
          AND e2.category = expenses.category
          AND e2.amount = expenses.amount
          AND e2.is_recurring = true
          AND date_trunc('month', e2.expense_date) = date_trunc('month', CURRENT_DATE)
      )
    GROUP BY user_id, category, amount, paid_amount, note, is_recurring, recurrence_interval;
  $$
);

-- Haftalık tekrar edenler — her Pazartesi saat 09:00
SELECT cron.schedule(
  'recurring-expenses-weekly',
  '0 9 * * 1',
  $$
    INSERT INTO expenses (user_id, expense_date, category, amount, paid_amount, payment_status, note, is_recurring, recurrence_interval)
    SELECT
      user_id,
      CURRENT_DATE,
      category,
      amount,
      0,
      'bekliyor',
      note,
      true,
      recurrence_interval
    FROM expenses
    WHERE is_recurring = true
      AND recurrence_interval = 'Haftalık'
      AND NOT EXISTS (
        SELECT 1 FROM expenses e2
        WHERE e2.user_id = expenses.user_id
          AND e2.category = expenses.category
          AND e2.amount = expenses.amount
          AND e2.is_recurring = true
          AND e2.expense_date >= CURRENT_DATE - interval '7 days'
          AND e2.expense_date < CURRENT_DATE
      )
    GROUP BY user_id, category, amount, paid_amount, note, is_recurring, recurrence_interval;
  $$
);

-- Senelik tekrar edenler — her yılın 1 Ocak'ı saat 09:00
SELECT cron.schedule(
  'recurring-expenses-yearly',
  '0 9 1 1 *',
  $$
    INSERT INTO expenses (user_id, expense_date, category, amount, paid_amount, payment_status, note, is_recurring, recurrence_interval)
    SELECT
      user_id,
      date_trunc('year', CURRENT_DATE)::date,
      category,
      amount,
      0,
      'bekliyor',
      note,
      true,
      recurrence_interval
    FROM expenses
    WHERE is_recurring = true
      AND recurrence_interval = 'Senelik'
      AND NOT EXISTS (
        SELECT 1 FROM expenses e2
        WHERE e2.user_id = expenses.user_id
          AND e2.category = expenses.category
          AND e2.amount = expenses.amount
          AND e2.is_recurring = true
          AND date_trunc('year', e2.expense_date) = date_trunc('year', CURRENT_DATE)
      )
    GROUP BY user_id, category, amount, paid_amount, note, is_recurring, recurrence_interval;
  $$
);

-- Günlük tekrar edenler — her gün saat 09:00
SELECT cron.schedule(
  'recurring-expenses-daily',
  '0 9 * * *',
  $$
    INSERT INTO expenses (user_id, expense_date, category, amount, paid_amount, payment_status, note, is_recurring, recurrence_interval)
    SELECT
      user_id,
      CURRENT_DATE,
      category,
      amount,
      0,
      'bekliyor',
      note,
      true,
      recurrence_interval
    FROM expenses
    WHERE is_recurring = true
      AND recurrence_interval = 'Günlük'
      AND NOT EXISTS (
        SELECT 1 FROM expenses e2
        WHERE e2.user_id = expenses.user_id
          AND e2.category = expenses.category
          AND e2.amount = expenses.amount
          AND e2.is_recurring = true
          AND e2.expense_date = CURRENT_DATE
      )
    GROUP BY user_id, category, amount, paid_amount, note, is_recurring, recurrence_interval;
  $$
);

-- Kurulum doğrulama — çalıştırdıktan sonra bu sorgu aktif job'ları gösterir
-- SELECT jobname, schedule, active FROM cron.job WHERE jobname LIKE 'recurring-expenses%';
