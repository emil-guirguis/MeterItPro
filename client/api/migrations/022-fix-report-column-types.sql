-- Fix report table column types and naming
-- 1. Rename 'config' -> 'settings'
-- 2. Shrink 'schedule' to varchar(100)
-- 3. Rename 'enabled' -> 'active' if not already done
-- 4. Change 'meter_selections' text -> jsonb
-- 5. Change 'recipients' text[] -> jsonb  { "from": "...", "to": ["...", "..."] }

-- Rename config -> settings
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report' AND column_name = 'config') THEN
    ALTER TABLE public.report RENAME COLUMN config TO settings;
  END IF;
END $$;

-- Shrink schedule to varchar(100)
ALTER TABLE public.report
  ALTER COLUMN schedule TYPE character varying(100);

-- Rename enabled -> active
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'report' AND column_name = 'enabled') THEN
    ALTER TABLE public.report RENAME COLUMN enabled TO active;
  END IF;
END $$;

-- Change meter_selections text -> jsonb
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'report' AND column_name = 'meter_selections' AND data_type = 'text'
  ) THEN
    ALTER TABLE public.report
      ALTER COLUMN meter_selections TYPE jsonb
      USING CASE WHEN meter_selections IS NULL OR meter_selections = '' THEN NULL
                 ELSE meter_selections::jsonb END;
  END IF;
END $$;

-- Change recipients text[] -> jsonb storing { "from": null, "to": [...emails] }
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'report' AND column_name = 'recipients' AND data_type = 'ARRAY'
  ) THEN
    ALTER TABLE public.report
      ALTER COLUMN recipients TYPE jsonb
      USING jsonb_build_object('from', NULL, 'to', array_to_json(recipients)::jsonb);
  END IF;
END $$;
