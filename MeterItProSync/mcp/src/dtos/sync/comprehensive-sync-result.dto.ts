/**
 * DTO for comprehensive sync result response
 */
export interface ComprehensiveSyncResultDto {
  success: boolean;
  tenants: {
    inserted: number;
    updated: number;
    deleted: number;
  };
  meters: {
    inserted: number;
    updated: number;
    deleted: number;
  };
  deviceRegisters: {
    inserted: number;
    updated: number;
    deleted: number;
    skipped: number;
  };
  error?: string;
  timestamp: Date;
}
