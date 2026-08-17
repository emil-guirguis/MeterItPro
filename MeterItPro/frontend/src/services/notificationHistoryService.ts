/**
 * Notification History Service
 * Handles API calls for notification history and audit trails
 */

import { apiClient } from './apiClient';

export interface NotificationHistoryRecord {
  notification_history_id: string;
  tenant_id: string;
  notification_rule_id?: string;
  users_id?: string;
  meter_id?: string;
  title: string;
  description?: string;
  status: 'sent' | 'failed' | 'pending';
  sent_at: string;
  created_at: string;
}

export const notificationHistoryService = {
  /**
   * Get notification history for tenant
   */
  async getHistory(
    limit = 50,
    offset = 0,
    meterId?: string
  ): Promise<{ history: NotificationHistoryRecord[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (meterId) {
      params.append('meter_id', meterId);
    }
    const response = await apiClient.get(`/notification-history?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get notification history for a specific meter (last 24 hours)
   */
  async getMeterHistory24h(meterId: string): Promise<NotificationHistoryRecord[]> {
    const response = await apiClient.get(`/notification-history/meter/${meterId}`);
    return response.data.data.notifications;
  },

  /**
   * Record a new notification in history
   */
  async recordNotification(data: {
    notification_rule_id?: string;
    users_id?: string;
    meter_id?: string;
    title: string;
    description?: string;
    status?: 'sent' | 'failed' | 'pending';
  }): Promise<NotificationHistoryRecord> {
    const response = await apiClient.post('/notification-history', data);
    return response.data.data.history;
  },
};
