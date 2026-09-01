-- Pin search_path on the updated-at trigger functions.
--
-- These trigger functions were created ad-hoc (Supabase SQL editor), not via a
-- migration, and had a role-mutable search_path (proconfig = null). A mutable
-- search_path lets objects in an earlier-resolved schema shadow references,
-- which is a privilege-escalation vector for SECURITY DEFINER functions.
--
-- Each body only assigns CURRENT_TIMESTAMP (a keyword, not a schema-resolved
-- function) and returns NEW, so SET search_path = '' is safe: there is nothing
-- to resolve. CREATE OR REPLACE brings the definitions under migration control
-- and pins the search_path. Column names are preserved exactly as they exist in
-- the live database (note the differing updatedAt / updatedat / updated_at).

CREATE OR REPLACE FUNCTION public.update_brands_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    NEW.updatedAt = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_email_logs_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_email_templates_updatedat()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    NEW.updatedat = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_meter_triggers_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_meter_usage_alerts_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_notification_logs_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_updatedat_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;
