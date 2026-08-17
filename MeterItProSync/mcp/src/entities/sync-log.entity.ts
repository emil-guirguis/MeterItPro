/**
 * SyncLog entity representing a sync operation log
 * Database table: sync_log
 * Primary key: sync_log_id
 * Tenant filtered: No
 */
export type SyncLog = {
  sync_log_id: number;
  batch_size: number;
  success: boolean;
  error_message?: string;
  synced_at: Date;
};
