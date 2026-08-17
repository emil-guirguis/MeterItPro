/**
 * DeviceRegister entity representing the association between a device and a register
 * Database table: device_register
 * Primary key: device_id, register_id (composite)
 * Tenant filtered: No
 */
export type DeviceRegisterEntity = {
  device_register_id: number;
  device_id: number;
  register_id: number;
};
