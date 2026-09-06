-- Periodic re-verification for rep-type users: every 90 days a rep must
-- re-confirm their email (link mailed via the same send-mail edge fn used
-- for the rep_leads invite flow) or their login is locked.
-- last_verified_at defaults to now() so existing users get a fresh 90-day
-- window instead of being locked out immediately on deploy.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS last_verified_at timestamptz NOT NULL DEFAULT now(),
  ADD COLUMN IF NOT EXISTS locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS verify_token text,
  ADD COLUMN IF NOT EXISTS verify_token_expires_at timestamptz;

CREATE UNIQUE INDEX IF NOT EXISTS users_verify_token_idx
  ON public.users (verify_token)
  WHERE verify_token IS NOT NULL;
