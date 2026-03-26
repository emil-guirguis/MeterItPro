/**
 * Notification Rule Service
 * Handles API calls for custom notification rules
 */

import { apiClient } from './apiClient';

export interface NotificationRule {
  notification_rule_id: string;
  tenant_id: string;
  name: string;
  description?: string;
  rule_type: 'custom' | 'meter_no_reading' | 'meter_zero_reading' | 'demand_threshold';
  active: boolean;
  threshold_hours?: number;
  demand_threshold?: number;
  schedule_cron: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationRuleRecipient {
  notification_rule_recipient_id: string;
  users_id: string;
  receive_email: boolean;
  email_address?: string;
}

export interface NotificationRuleMeter {
  notification_rule_meter_id: string;
  meter_id: string;
  meter_element_id: string | null;
}

export interface NotificationRuleDetail extends NotificationRule {
  recipients: NotificationRuleRecipient[];
  meters: NotificationRuleMeter[];
}

export interface CreateNotificationRuleRequest {
  name: string;
  description?: string;
  rule_type?: 'custom' | 'meter_no_reading' | 'meter_zero_reading' | 'demand_threshold';
  threshold_hours?: number;
  demand_threshold?: number;
  schedule_cron: string;
  recipients: Array<{
    users_id: string;
    receive_email: boolean;
    email_address?: string;
  }>;
  meter_elements: Array<{ meter_id: string; meter_element_id: string }>;
}

export const notificationRuleService = {
  /**
   * List all notification rules
   */
  async listRules(
    limit = 100,
    offset = 0,
    active?: boolean
  ): Promise<{ rules: NotificationRule[]; total: number }> {
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    if (active !== undefined) {
      params.append('active', String(active));
    }
    const response = await apiClient.get(`/notification-rules?${params.toString()}`);
    return response.data.data;
  },

  /**
   * Get a specific notification rule with recipients and meters
   */
  async getRule(id: string): Promise<NotificationRuleDetail> {
    const response = await apiClient.get(`/notification-rules/${id}`);
    return response.data.data.rule;
  },

  /**
   * Create a new notification rule
   */
  async createRule(data: CreateNotificationRuleRequest): Promise<NotificationRuleDetail> {
    const response = await apiClient.post('/notification-rules', data);
    return response.data.data.rule;
  },

  /**
   * Update a notification rule
   */
  async updateRule(id: string, data: Partial<CreateNotificationRuleRequest>): Promise<NotificationRule> {
    const response = await apiClient.put(`/notification-rules/${id}`, data);
    return response.data.data.rule;
  },

  /**
   * Delete a notification rule
   */
  async deleteRule(id: string): Promise<void> {
    await apiClient.delete(`/notification-rules/${id}`);
  },

  /**
   * Toggle rule active status
   */
  async toggleRuleStatus(id: string, active: boolean): Promise<NotificationRule> {
    return this.updateRule(id, { active });
  },
};
