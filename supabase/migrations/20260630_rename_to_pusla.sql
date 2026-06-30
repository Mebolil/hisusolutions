-- Pusla İsim Değişikliği — Kullanıcı Plan Değerleri
-- Tarih: 2026-06-30
-- Çalıştırmadan önce tablo yapısını doğrula:
--   cd /tmp && supabase db query --linked "\d profiles"
-- Mevcut kullanıcıların plan değerlerini 'pusla' olarak güncelle

UPDATE profiles
SET plan = 'pusla'
WHERE plan IN ('butcecrm', 'butceleme');
