-- BütçeCRM 15 Gün Ücretsiz Trial — Migration
-- Supabase Dashboard > SQL Editor'de çalıştır

-- 1. profiles tablosuna trial kolonları ekle
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS trial_notified_at TIMESTAMPTZ;

-- 2. Yeni kullanıcı kaydında otomatik profil oluştur (trial ile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, plan, trial_ends_at)
  VALUES (NEW.id, 'trial', now() + interval '15 days')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. (Opsiyonel) Mevcut kullanıcılara trial ver (henüz planı olmayanlar)
-- UPDATE profiles
-- SET plan = 'trial', trial_ends_at = now() + interval '15 days'
-- WHERE plan IS NULL OR plan = '';
