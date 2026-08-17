-- Add contact email to tenant table
ALTER TABLE public.tenant
  ADD COLUMN IF NOT EXISTS contact_email varchar(255) DEFAULT '';
