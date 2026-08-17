-- Migration: Add description field to device_register table
-- Purpose: Store descriptions for device registers
-- Database: Sync Database
-- Date: 2026-03-26

-- Add description column if it doesn't exist
ALTER TABLE device_register
  ADD COLUMN IF NOT EXISTS description VARCHAR(500);

-- Add comment/documentation
COMMENT ON COLUMN device_register.description IS 'Description of the device register for display and documentation purposes';
