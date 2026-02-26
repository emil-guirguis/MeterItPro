-- Notification System Database Schema
-- Creates tables for notifications and notification settings
-- Uses bigint IDENTITY for primary keys and follows naming convention: {tablename}_{tablename}_id

-- Table: public.notification
CREATE TABLE IF NOT EXISTS public.notification (
  notification_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
  tenant_id bigint NOT NULL,
  users_id bigint NULL,
  meter_id bigint NULL,
  meter_element_id bigint NULL,
  notification_type varchar(50) NOT NULL,
  severity varchar(20) NOT NULL DEFAULT 'warning',
  title varchar(255) NOT NULL,
  description text NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notification_pkey PRIMARY KEY (notification_id)
) TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.notification OWNER to postgres;
GRANT ALL ON TABLE public.notification TO anon;
GRANT ALL ON TABLE public.notification TO authenticated;
GRANT ALL ON TABLE public.notification TO postgres;
GRANT ALL ON TABLE public.notification TO service_role;

CREATE INDEX IF NOT EXISTS idx_notification_tenant_id ON public.notification(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_tenant_users ON public.notification(tenant_id, users_id);
CREATE INDEX IF NOT EXISTS idx_notification_created_at ON public.notification(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_type ON public.notification(tenant_id, notification_type);

-- Table: public.notification_settings
CREATE TABLE IF NOT EXISTS public.notification_settings (
  notification_settings_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
  tenant_id bigint NOT NULL,
  health_check_cron varchar(100) NOT NULL DEFAULT '0 * * * *',
  daily_email_cron varchar(100) NOT NULL DEFAULT '0 9 * * *',
  email_template_id bigint NULL,
  enabled boolean NOT NULL DEFAULT true,
  stale_threshold_hours int NOT NULL DEFAULT 2,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notification_settings_pkey PRIMARY KEY (notification_settings_id),
  CONSTRAINT notification_settings_tenant_id_key UNIQUE (tenant_id)
) TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.notification_settings OWNER to postgres;
GRANT ALL ON TABLE public.notification_settings TO anon;
GRANT ALL ON TABLE public.notification_settings TO authenticated;
GRANT ALL ON TABLE public.notification_settings TO postgres;
GRANT ALL ON TABLE public.notification_settings TO service_role;
