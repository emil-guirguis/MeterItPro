/**
 * Central Enumeration Constants
 * 
 * Single source of truth for all enumeration values used across schemas.
 * Both DeviceWithSchema and MeterWithSchema reference these constants.
 */

const DEVICE_MANUFACTURERS = [
  'DENT Instruments',
  'Honeywell',
  'Siemens',
  'TBWC, Inc.',
];

const DEVICE_TYPES = [
  'Electric',
  'Gas',
  'Water',
  'Steam',
  'Other',
];

module.exports = {
  DEVICE_MANUFACTURERS,
  DEVICE_TYPES,
};
