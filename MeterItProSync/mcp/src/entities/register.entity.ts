/**
 * Register entity representing a meter register/data point
 * Database table: register
 * Primary key: register_id
 * Tenant filtered: No
 */
export type RegisterEntity = {
  register_id: number;
  name: string;
  register: number;
  unit: string;
  field_name: string;
};
