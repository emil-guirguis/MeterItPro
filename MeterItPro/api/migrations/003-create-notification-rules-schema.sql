-- Notification Rules Database Schema
-- Creates tables for custom notification rules and history
-- Uses bigint IDENTITY for primary keys and follows naming convention: {tablename}_{tablename}_id

-- Table: public.notification_rule
-- Custom notification rules that can be created by admins
CREATE TABLE IF NOT EXISTS public.notification_rule (
  notification_rule_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
  tenant_id bigint NOT NULL,
  name varchar(255) NOT NULL,
  description text NULL,
  rule_type varchar(50) NOT NULL DEFAULT 'custom', -- 'meter_no_reading', 'meter_zero_reading', 'custom'
  active boolean NOT NULL DEFAULT true,
  threshold_hours int NULL, -- For meter_no_reading rules (e.g., 24)
  schedule_cron varchar(100) NOT NULL DEFAULT '0 * * * *', -- When to check/send notification
  created_by bigint NULL, -- Admin who created the rule
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notification_rule_pkey PRIMARY KEY (notification_rule_id)
) TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.notification_rule OWNER to postgres;
GRANT ALL ON TABLE public.notification_rule TO anon;
GRANT ALL ON TABLE public.notification_rule TO authenticated;
GRANT ALL ON TABLE public.notification_rule TO postgres;
GRANT ALL ON TABLE public.notification_rule TO service_role;

CREATE INDEX IF NOT EXISTS idx_notification_rule_tenant_id ON public.notification_rule(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_rule_active ON public.notification_rule(tenant_id, active);
CREATE INDEX IF NOT EXISTS idx_notification_rule_type ON public.notification_rule(rule_type);

-- Table: public.notification_rule_recipient
-- Users who receive notifications from a rule
CREATE TABLE IF NOT EXISTS public.notification_rule_recipient (
  notification_rule_recipient_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
  notification_rule_id bigint NOT NULL,
  users_id bigint NOT NULL,
  receive_email boolean NOT NULL DEFAULT true,
  email_address varchar(255) NULL, -- Can override user's primary email
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notification_rule_recipient_pkey PRIMARY KEY (notification_rule_recipient_id),
  CONSTRAINT notification_rule_recipient_rule_user_unique UNIQUE (notification_rule_id, users_id),
  CONSTRAINT notification_rule_recipient_rule_fk FOREIGN KEY (notification_rule_id) REFERENCES public.notification_rule (notification_rule_id) ON DELETE CASCADE
) TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.notification_rule_recipient OWNER to postgres;
GRANT ALL ON TABLE public.notification_rule_recipient TO anon;
GRANT ALL ON TABLE public.notification_rule_recipient TO authenticated;
GRANT ALL ON TABLE public.notification_rule_recipient TO postgres;
GRANT ALL ON TABLE public.notification_rule_recipient TO service_role;

CREATE INDEX IF NOT EXISTS idx_notification_rule_recipient_rule_id ON public.notification_rule_recipient(notification_rule_id);
CREATE INDEX IF NOT EXISTS idx_notification_rule_recipient_users_id ON public.notification_rule_recipient(users_id);

-- Table: public.notification_rule_meter
-- Meters monitored by a rule
CREATE TABLE IF NOT EXISTS public.notification_rule_meter (
  notification_rule_meter_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
  notification_rule_id bigint NOT NULL,
  meter_id bigint NOT NULL,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notification_rule_meter_pkey PRIMARY KEY (notification_rule_meter_id),
  CONSTRAINT notification_rule_meter_rule_meter_unique UNIQUE (notification_rule_id, meter_id),
  CONSTRAINT notification_rule_meter_rule_fk FOREIGN KEY (notification_rule_id) REFERENCES public.notification_rule (notification_rule_id) ON DELETE CASCADE
) TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.notification_rule_meter OWNER to postgres;
GRANT ALL ON TABLE public.notification_rule_meter TO anon;
GRANT ALL ON TABLE public.notification_rule_meter TO authenticated;
GRANT ALL ON TABLE public.notification_rule_meter TO postgres;
GRANT ALL ON TABLE public.notification_rule_meter TO service_role;

CREATE INDEX IF NOT EXISTS idx_notification_rule_meter_rule_id ON public.notification_rule_meter(notification_rule_id);
CREATE INDEX IF NOT EXISTS idx_notification_rule_meter_meter_id ON public.notification_rule_meter(meter_id);

-- Table: public.notification_history
-- Track all notifications sent (for history and audit trail)
CREATE TABLE IF NOT EXISTS public.notification_history (
  notification_history_id bigint NOT NULL GENERATED ALWAYS AS IDENTITY ( INCREMENT 1 START 1 MINVALUE 1 MAXVALUE 9223372036854775807 CACHE 1 ),
  tenant_id bigint NOT NULL,
  notification_rule_id bigint NULL, -- NULL if system-generated
  users_id bigint NULL,
  meter_id bigint NULL,
  title varchar(255) NOT NULL,
  description text NULL,
  status varchar(20) NOT NULL DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  sent_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT notification_history_pkey PRIMARY KEY (notification_history_id),
  CONSTRAINT notification_history_rule_fk FOREIGN KEY (notification_rule_id) REFERENCES public.notification_rule (notification_rule_id) ON DELETE SET NULL
) TABLESPACE pg_default;

ALTER TABLE IF EXISTS public.notification_history OWNER to postgres;
GRANT ALL ON TABLE public.notification_history TO anon;
GRANT ALL ON TABLE public.notification_history TO authenticated;
GRANT ALL ON TABLE public.notification_history TO postgres;
GRANT ALL ON TABLE public.notification_history TO service_role;

CREATE INDEX IF NOT EXISTS idx_notification_history_tenant_id ON public.notification_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_rule_id ON public.notification_history(notification_rule_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_users_id ON public.notification_history(users_id);
CREATE INDEX IF NOT EXISTS idx_notification_history_sent_at ON public.notification_history(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_history_status ON public.notification_history(status);
