/**
 * TypeScript interfaces and type definitions for System Notifications Agent
 */

// Notification types
export type NotificationType = 'failing' | 'stale';

// Notification model
export interface Notification {
  id: string;
  meter_id: string;
  element_id: string;
  notification_type: NotificationType;
  created_at: string;
  cleared: boolean;
}

// Request to create a notification
export interface CreateNotificationRequest {
  meter_id: string;
  element_id: string;
  notification_type: NotificationType;
}

// Meter health issue from check_meter_health tool
export interface MeterHealthIssue {
  meter_id: string;
  element_id: string;
  issue_type: NotificationType;
  last_update: string; // ISO timestamp
  status: string; // error message or "stale"
}

// Response from check_meter_health tool
export interface CheckMeterHealthResponse {
  issues: MeterHealthIssue[];
}

// Notification settings
export interface NotificationSettings {
  id: string;
  health_check_cron: string;
  daily_email_cron: string;
  email_template_id: string | null;
  enabled: boolean;
  updated_at: string;
}

// Request to update notification settings
export interface UpdateNotificationSettingsRequest {
  health_check_cron?: string;
  daily_email_cron?: string;
  email_template_id?: string | null;
  enabled?: boolean;
}

// Email template with notification fields
export interface EmailTemplate {
  id: string;
  type: string;
  name: string;
  subject: string;
  body: string;
  sendTo?: string | string[];
  sendFrom?: string;
  variables?: string[];
  created_at: string;
  updated_at: string;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

// List response with pagination
export interface ListResponse<T> {
  items: T[];
  total: number;
  limit: number;
  offset: number;
}
