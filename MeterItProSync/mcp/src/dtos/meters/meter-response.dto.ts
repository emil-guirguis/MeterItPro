/**
 * DTO for meter API response
 */
export interface MeterResponseDto {
  meter_id: number;
  device_id: number;
  name: string;
  active: boolean;
  ip: string;
  port: string;
  meter_element_id: number;
  element: string;
}
