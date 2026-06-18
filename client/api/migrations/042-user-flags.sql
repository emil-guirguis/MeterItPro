-- Migration 042: Add is_super_admin and is_support_admin flags to users
-- Replaces role-based admin access control with explicit boolean flags.

ALTER TABLE users ADD COLUMN IF NOT EXISTS is_super_admin boolean NOT NULL DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_support_admin boolean NOT NULL DEFAULT false;

-- Migrate existing role-based admin accounts to flags
UPDATE users SET is_super_admin = true WHERE role = 'superadmin';
UPDATE users SET is_super_admin = true, is_support_admin = true WHERE role = 'supersupport';
UPDATE users SET is_support_admin = true WHERE role = 'adminsupport';
