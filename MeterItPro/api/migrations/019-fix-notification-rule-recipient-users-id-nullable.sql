-- Remove users_id from notification_rule_recipient
-- Recipients are now freeform email addresses only

ALTER TABLE public.notification_rule_recipient
  DROP CONSTRAINT IF EXISTS notification_rule_recipient_rule_user_unique;

DROP INDEX IF EXISTS idx_notification_rule_recipient_users_id;

ALTER TABLE public.notification_rule_recipient
  DROP COLUMN IF EXISTS users_id;

ALTER TABLE public.notification_rule_recipient
  DROP COLUMN IF EXISTS receive_email;

CREATE UNIQUE INDEX IF NOT EXISTS idx_notification_rule_recipient_rule_email
  ON public.notification_rule_recipient (notification_rule_id, email_address);
