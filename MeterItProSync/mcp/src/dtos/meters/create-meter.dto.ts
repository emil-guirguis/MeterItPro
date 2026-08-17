/**
 * DTO for creating a new meter
 */
export interface CreateMeterDto {
  device_id: number;
  name: string;
  active: boolean;
  ip: string;
  port: string;
  meter_element_id: number;
  element: string;
}
