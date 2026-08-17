/**
 * DTO for updating an existing meter
 */
export interface UpdateMeterDto {
  device_id?: number;
  name?: string;
  active?: boolean;
  ip?: string;
  port?: string;
  meter_element_id?: number;
  element?: string;
}
