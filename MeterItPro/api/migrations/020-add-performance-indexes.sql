-- Performance Indexes
-- Adds composite indexes on the most-queried columns to speed up
-- tenant-scoped list, filter, and time-series aggregation queries.

-- ============================================================
-- meter_reading  (highest query volume)
-- ============================================================

-- Primary lookup: tenant + meter + element + time (list & consumption endpoints)
CREATE INDEX IF NOT EXISTS idx_meter_reading_lookup
  ON public.meter_reading (tenant_id, meter_id, meter_element_id, created_at DESC);

-- Time-series aggregation (consumption endpoint groups by time range)
CREATE INDEX IF NOT EXISTS idx_meter_reading_tenant_time
  ON public.meter_reading (tenant_id, created_at DESC);

-- Sync status filter (unsynchronised readings upload queue)
CREATE INDEX IF NOT EXISTS idx_meter_reading_sync_status
  ON public.meter_reading (tenant_id, is_synchronized)
  WHERE is_synchronized = false;

-- ============================================================
-- meter
-- ============================================================

-- Tenant list query (default list view)
CREATE INDEX IF NOT EXISTS idx_meter_tenant
  ON public.meter (tenant_id);

-- Active meters only (most UI lists filter by active)
CREATE INDEX IF NOT EXISTS idx_meter_tenant_active
  ON public.meter (tenant_id, active);

-- ============================================================
-- users
-- ============================================================

-- Tenant user list
CREATE INDEX IF NOT EXISTS idx_users_tenant
  ON public.users (tenant_id);

-- Login lookup (auth.ts uses LOWER(email) = LOWER($1))
CREATE INDEX IF NOT EXISTS idx_users_email_lower
  ON public.users (LOWER(email));

-- ============================================================
-- favorite
-- ============================================================

-- Favorite lookup by user + table + record (favorites.ts composite filter)
CREATE INDEX IF NOT EXISTS idx_favorite_lookup
  ON public.favorite (tenant_id, users_id, table_name);

-- ============================================================
-- notification_rule
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_notification_rule_tenant
  ON public.notification_rule (tenant_id);

-- ============================================================
-- dashboard
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_dashboard_tenant
  ON public.dashboard (tenant_id);
