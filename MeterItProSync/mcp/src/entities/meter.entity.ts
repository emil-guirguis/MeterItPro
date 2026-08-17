/**
 * Meter entity representing a meter device
 * Database table: meter
 * Primary key: meter_id, meter_element_id (composite)
 * Tenant filtered: Yes
 */
export type MeterEntity = {
  meter_id: number;
  device_id: number;
  name: string;
  active: boolean;
  ip: string;
  port: string;
  meter_element_id: number;
  element: string;
};
