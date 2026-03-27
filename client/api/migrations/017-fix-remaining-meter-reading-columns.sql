-- Fix any remaining meter_reading columns that weren't renamed by migration 011
-- Uses safe conditional renaming to avoid errors if already applied

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meter_reading' AND column_name = 'maximum_demand_real') THEN
    ALTER TABLE meter_reading RENAME COLUMN maximum_demand_real TO peak_kw;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meter_reading' AND column_name = 'power') THEN
    ALTER TABLE meter_reading RENAME COLUMN power TO kw;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meter_reading' AND column_name = 'power_phase_a') THEN
    ALTER TABLE meter_reading RENAME COLUMN power_phase_a TO phase_kw_a;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meter_reading' AND column_name = 'power_phase_b') THEN
    ALTER TABLE meter_reading RENAME COLUMN power_phase_b TO phase_kw_b;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meter_reading' AND column_name = 'power_phase_c') THEN
    ALTER TABLE meter_reading RENAME COLUMN power_phase_c TO phase_kw_c;
  END IF;


  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meter_reading' AND column_name = 'reactive_energy') THEN
    ALTER TABLE meter_reading RENAME COLUMN reactive_energy TO kvarh;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meter_reading' AND column_name = 'reactive_power') THEN
    ALTER TABLE meter_reading RENAME COLUMN reactive_power TO kvar;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meter_reading' AND column_name = 'reactive_power_phase_a') THEN
    ALTER TABLE meter_reading RENAME COLUMN reactive_power_phase_a TO phase_kvar_a;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meter_reading' AND column_name = 'reactive_power_phase_b') THEN
    ALTER TABLE meter_reading RENAME COLUMN reactive_power_phase_b TO phase_kvar_b;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meter_reading' AND column_name = 'reactive_power_phase_c') THEN
    ALTER TABLE meter_reading RENAME COLUMN reactive_power_phase_c TO phase_kvar_c;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meter_reading' AND column_name = 'voltage_thd') THEN
    ALTER TABLE meter_reading RENAME COLUMN voltage_thd TO total_thdv;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meter_reading' AND column_name = 'voltage_thd_phase_a') THEN
    ALTER TABLE meter_reading RENAME COLUMN voltage_thd_phase_a TO phase_thdv_a;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meter_reading' AND column_name = 'voltage_thd_phase_b') THEN
    ALTER TABLE meter_reading RENAME COLUMN voltage_thd_phase_b TO phase_thdv_b;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'meter_reading' AND column_name = 'voltage_thd_phase_c') THEN
    ALTER TABLE meter_reading RENAME COLUMN voltage_thd_phase_c TO phase_thdv_c;
  END IF;
END $$;
