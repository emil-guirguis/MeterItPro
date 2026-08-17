-- Quality engine schema: reading quality flags, gap tracking, watermarks.
-- Phase 1 of data-trust / VEE layer.

-- 1. Quality flags on meter_reading. Existing rows default to 'valid'.
ALTER TABLE public.meter_reading
  ADD COLUMN IF NOT EXISTS quality VARCHAR(10) NOT NULL DEFAULT 'valid'
    CONSTRAINT meter_reading_quality_check
    CHECK (quality IN ('valid', 'suspect', 'estimated', 'missing')),
  ADD COLUMN IF NOT EXISTS validation_flags TEXT[];

-- 2. Gap tracking: one row per detected reading gap. Absence of rows made queryable.
CREATE TABLE IF NOT EXISTS public.meter_reading_gap (
  meter_reading_gap_id      SERIAL PRIMARY KEY,
  tenant_id                 INTEGER NOT NULL REFERENCES public.tenant(tenant_id),
  meter_id                  INTEGER NOT NULL,
  meter_element_id          INTEGER NOT NULL,
  gap_start                 TIMESTAMPTZ NOT NULL,
  gap_end                   TIMESTAMPTZ,          -- NULL = gap still ongoing (tail gap)
  expected_interval_minutes INTEGER NOT NULL DEFAULT 15,
  missing_count             INTEGER,              -- expected readings missing in this gap
  status                    VARCHAR(10) NOT NULL DEFAULT 'open'
    CONSTRAINT meter_reading_gap_status_check
    CHECK (status IN ('open', 'closed', 'filled')), -- closed = backfill arrived, filled = estimated
  detected_at               TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  closed_at                 TIMESTAMPTZ,
  active                    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meter_reading_gap_tenant_status
  ON public.meter_reading_gap (tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_meter_reading_gap_element_status
  ON public.meter_reading_gap (meter_element_id, status);

-- One ongoing tail gap per element at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_meter_reading_gap_open_tail
  ON public.meter_reading_gap (tenant_id, meter_id, meter_element_id)
  WHERE gap_end IS NULL AND status = 'open';

-- 3. Watermarks: incremental scan state per meter element.
CREATE TABLE IF NOT EXISTS public.meter_element_watermark (
  meter_element_watermark_id SERIAL PRIMARY KEY,
  tenant_id                  INTEGER NOT NULL REFERENCES public.tenant(tenant_id),
  meter_id                   INTEGER NOT NULL,
  meter_element_id           INTEGER NOT NULL UNIQUE,
  last_checked_at            TIMESTAMPTZ,          -- engine has scanned readings up to here
  last_reading_at            TIMESTAMPTZ,          -- newest reading seen for this element
  expected_interval_minutes  INTEGER NOT NULL DEFAULT 15,
  active                     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_meter_element_watermark_tenant
  ON public.meter_element_watermark (tenant_id);

-- RLS: same pattern as 038 — enable, no policies (Worker connects as superuser via Hyperdrive).
ALTER TABLE public.meter_reading_gap       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meter_element_watermark ENABLE ROW LEVEL SECURITY;
