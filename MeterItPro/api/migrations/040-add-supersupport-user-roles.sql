-- Add supersupport and user role types, insert one seed user per role
-- Password hash is bcrypt of '1234'

-- Update role check constraint to include new roles
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE public.users ADD CONSTRAINT users_role_check
  CHECK (role::text = ANY (ARRAY[
    'superadmin'::text,
    'supersupport'::text,
    'admin'::text,
    'manager'::text,
    'technician'::text,
    'viewer'::text,
    'user'::text
  ]));

-- Seed users (one per role type, password = '1234')
INSERT INTO public.users (name, email, passwordhash, role, active, tenant_id)
VALUES
  ('Super Admin',    'superadmin@system.local',    '$2a$10$3z/KEMI68VSeYAW87/mFm.SdxEM.wD7ykA/JYnATCBzROg/KRaT3a', 'superadmin',    true, 1),
  ('Super Support',  'supersupport@system.local',  '$2a$10$3z/KEMI68VSeYAW87/mFm.SdxEM.wD7ykA/JYnATCBzROg/KRaT3a', 'supersupport',  true, 1),
  ('User',           'user@system.local',          '$2a$10$3z/KEMI68VSeYAW87/mFm.SdxEM.wD7ykA/JYnATCBzROg/KRaT3a', 'user',          true, 1)
ON CONFLICT (email) DO NOTHING;
