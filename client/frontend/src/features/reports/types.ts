export interface Report {
  report_id: number;
  name: string;
  type: string;
  schedule: string;
  recipients: string[];
  config: Record<string, any>;
  active: boolean;
  meter_ids?: string[];
  element_ids?: string[];
  register_ids?: string[];
  html_format?: boolean;
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
