/**
 * DTO for batch upload response
 */
export interface BatchUploadResponseDto {
  success: boolean;
  recordsProcessed: number;
  message?: string;
}
