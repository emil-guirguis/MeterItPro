-- Seed adminsupport user (password = '1234')
-- Also backfill is_support_admin flag for any existing adminsupport/supersupport roles

INSERT INTO public.users (name, email, passwordhash, role, active, tenant_id, is_support_admin)
VALUES
  ('Admin Support', 'adminsupport@system.local', '$2a$10$3z/KEMI68VSeYAW87/mFm.SdxEM.wD7ykA/JYnATCBzROg/KRaT3a', 'adminsupport', true, 1, true)
ON CONFLICT (email) DO NOTHING;

-- Backfill flags in case 042 ran before this seed existed
UPDATE users SET is_support_admin = true WHERE role IN ('adminsupport', 'supersupport') AND is_support_admin = false;
UPDATE users SET is_super_admin   = true WHERE role = 'superadmin'  AND is_super_admin = false;
