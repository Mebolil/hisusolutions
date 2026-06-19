-- Sprint 1: Onboarding profil kolonları + Haftalık Nabız toggle
-- Migration kuralı: sadece ADD COLUMN IF NOT EXISTS

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_sector TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_revenue_range TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_focus TEXT DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS weekly_pulse_enabled BOOLEAN DEFAULT true;
