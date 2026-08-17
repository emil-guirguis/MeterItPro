/**
 * DTO for sync result response
 */
export interface SyncResultDto {
  success: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  error?: string;
  timestamp: Date;
}
