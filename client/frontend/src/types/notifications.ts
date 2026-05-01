/**
 * Notification types for the frontend
 */

export type NotificationType = 'stale' | 'all_zero' | 'error_status' | 'meter_no_reading' | 'meter_zero_reading';
export type NotificationSeverity = 'info' | 'warning' | 'error';

export interface Notification {
  id: string;                        // maps from notification_id
  tenant_id: string;
  users_id: string | null;
  meter_id: string | null;
  meter_element_id: string | null;
  notification_type: NotificationType;
  severity: NotificationSeverity;
  title: string;
  description: string | null;
  created_at: string;
}

export interface NotificationListResponse {
  notifications: Notification[];
  total: number;
  limit: number;
  offset: number;
}

export interface NotificationCountResponse {
  count: number;
}
