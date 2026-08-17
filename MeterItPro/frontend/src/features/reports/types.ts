import type { EmailFieldValue } from '@meterit/framework-frontend/components/formfield/EmailRecipientsField';

export type { EmailFieldValue };

export interface Report {
  report_id: number;
  name: string;
  type: string;
  cron: string;
  recipients: EmailFieldValue;
  time_frame?: string;
  visualization_type?: string;
  grouping_type?: string;
  attach_as?: string;
  active: boolean;
  meter_selections?: any[];
  created_at: string;
  updated_at: string;
}

export interface ReportHistory {
  report_history_id: number;
  report_id: number;
  executed_at: string;
  status: 'success' | 'failed';
  error_message: string | null;
  created_at: string;
}

export interface EmailLog {
  report_email_logs_id: number;
  report_id: number;
  report_history_id: number;
  recipient: string;
  sent_at: string;
  status: 'sent' | 'failed' | 'delivered';
  error_details: string | null;
  created_at: string;
}
