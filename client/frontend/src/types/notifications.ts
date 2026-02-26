/**
 * Notification types for the frontend
 */

export type NotificationType = 'stale' | 'all_zero' | 'error_status';
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

export interface NotificationSettings {
  id: string | null;
  health_check_cron: string;
  daily_email_cron: string;
  email_template_id: string | null;
  enabled: boolean;
  stale_threshold_hours: number;
  updated_at: string | null;
}

export interface UpdateNotificationSettingsRequest {
  health_check_cron?: string;
  daily_email_cron?: string;
  email_template_id?: string | null;
  enabled?: boolean;
  stale_threshold_hours?: number;
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
