-- Add admin-managed fields to the device catalog
ALTER TABLE public.device
  ADD COLUMN IF NOT EXISTS number_of_elements integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS default_price numeric(10,2) NOT NULL DEFAULT 0;
