-- Enable Row-Level Security on all public tables.
-- The Worker connects as the postgres superuser via Hyperdrive, which bypasses RLS.
-- No policies are added: anon/authenticated roles via PostgREST are denied all access.

ALTER TABLE public.contact              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cost                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_setting ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_device        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_cost          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_document      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorite             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa_methods     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_2fa_backup_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_otp_codes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_status_log     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_otp_codes        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.location             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dashboard            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.register             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_virtual        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_history       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_reading        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_register      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_element        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rule    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rule_recipient ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_email_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_rule_meter ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_server          ENABLE ROW LEVEL SECURITY;
