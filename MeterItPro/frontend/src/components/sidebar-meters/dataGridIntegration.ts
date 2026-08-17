import type { MeterReading } from './types';
import { metersService } from '../../services/metersService';

/**
 * Data Grid Integration Layer
 * Handles fetching and formatting readings for the existing data grid
 */

export interface DataGridReadingsResult {
  readings: MeterReading[];
  loading: boolean;
  error: string | null;
}

/**
 * Fetch readings for a selected meter
 * @param meterId - The meter ID
 * @param limit - Optional limit on number of readings
 * @returns Promise<MeterReading[]> - Array of readings sorted by created_date descending
 */
export async function fetchMeterReadingsForGrid(
  meterId: string,
  limit?: number
): Promise<MeterReading[]> {
  try {
    const readings = await metersService.getMeterReadings(meterId, limit);
    // Readings are already sorted by created_date descending in the service
    return readings;
  } catch (error) {
    console.error(`Failed to fetch readings for meter ${meterId}:`, error);
    throw error;
  }
}

/**
 * Fetch readings for a selected meter element
 * @param meterId - The meter ID
 * @param elementId - The meter element ID
 * @param limit - Optional limit on number of readings
 * @returns Promise<MeterReading[]> - Array of readings sorted by created_date descending
 */
export async function fetchMeterElementReadingsForGrid(
  meterId: string,
  elementId: string,
  limit?: number
): Promise<MeterReading[]> {
  try {
    const readings = await metersService.getMeterElementReadings(meterId, elementId, limit);
    // Readings are already sorted by created_date descending in the service
    return readings;
  } catch (error) {
    console.error(
      `Failed to fetch readings for meter element ${meterId}/${elementId}:`,
      error
    );
    throw error;
  }
}

/**
 * Format readings for the existing data grid schema
 * @param readings - Array of meter readings
 * @returns Formatted readings compatible with existing data grid
 */
export function formatReadingsForGrid(readings: MeterReading[]): any[] {
  return readings.map((reading) => ({
    ...reading,
    // Ensure dates are properly formatted
    createdDate: new Date(reading.createdDate),
    // Add any additional formatting needed for the grid
  }));
}

/**
 * Get readings for either a meter or meter element
 * @param meterId - The meter ID
 * @param elementId - Optional meter element ID
 * @param limit - Optional limit on number of readings
 * @returns Promise<MeterReading[]> - Array of readings
 */
export async function getReadingsForSelection(
  meterId: string,
  elementId?: string,
  limit?: number
): Promise<MeterReading[]> {
  if (elementId) {
    return fetchMeterElementReadingsForGrid(meterId, elementId, limit);
  } else {
    return fetchMeterReadingsForGrid(meterId, limit);
  }
}
