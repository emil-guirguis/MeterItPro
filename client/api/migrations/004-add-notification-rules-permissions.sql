-- Add Notification Rules Permissions to Existing Users
-- Assigns appropriate notification rule permissions based on user role
-- Permissions are stored as JSONB arrays

-- Manager users - add full notification rule management permissions
UPDATE public.users
SET permissions = CASE
  WHEN permissions IS NULL THEN
    '["notification_rule:create", "notification_rule:read", "notification_rule:update", "notification_rule:delete"]'::jsonb
  ELSE
    jsonb_insert(permissions, '{0}'::text[], '"notification_rule:create"'::jsonb)
    || jsonb_insert(permissions, '{1}'::text[], '"notification_rule:read"'::jsonb)
    || jsonb_insert(permissions, '{2}'::text[], '"notification_rule:update"'::jsonb)
    || jsonb_insert(permissions, '{3}'::text[], '"notification_rule:delete"'::jsonb)
END
WHERE role = 'manager'
AND (
  permissions IS NULL
  OR NOT (permissions @> '"notification_rule:create"'::jsonb)
);

-- Technician users - add full notification rule management permissions
UPDATE public.users
SET permissions = CASE
  WHEN permissions IS NULL THEN
    '["notification_rule:create", "notification_rule:read", "notification_rule:update", "notification_rule:delete"]'::jsonb
  ELSE
    (permissions || '["notification_rule:create", "notification_rule:read", "notification_rule:update", "notification_rule:delete"]'::jsonb)
END
WHERE role = 'technician'
AND (
  permissions IS NULL
  OR NOT (permissions @> '"notification_rule:create"'::jsonb)
);

-- Viewer users - add read-only notification rule permission
UPDATE public.users
SET permissions = CASE
  WHEN permissions IS NULL THEN
    '["notification_rule:read"]'::jsonb
  ELSE
    (permissions || '["notification_rule:read"]'::jsonb)
END
WHERE role = 'viewer'
AND (
  permissions IS NULL
  OR NOT (permissions @> '"notification_rule:read"'::jsonb)
);
