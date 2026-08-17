import apiClient from './apiClient';

export interface Report {
  report_id: number;
  name: string;
  type: string;
  schedule: string;
  recipients: string[];
  config: Record<string, any>;
  active: boolean;
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

export interface PaginatedResponse<T> {
  items?: T[];
  data?: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Create a new report
 */
export const createReport = async (report: Omit<Report, 'report_id' | 'created_at' | 'updated_at'>): Promise<Report> => {
  const response = await apiClient.post('/reports', report);
  return response.data.data;
};

/**
 * Get all reports with pagination
 */
export const getReports = async (page: number = 1, limit: number = 10): Promise<PaginatedResponse<Report>> => {
  const response = await apiClient.get('/reports', {
    params: { page, limit }
  });
  return response.data.data;
};

/**
 * Get a specific report by ID
 */
export const getReport = async (id: number): Promise<Report> => {
  const response = await apiClient.get(`/reports/${id}`);
  return response.data.data;
};

/**
 * Update a report
 */
export const updateReport = async (id: number, report: Partial<Omit<Report, 'report_id' | 'created_at' | 'updated_at'>>): Promise<Report> => {
  const response = await apiClient.put(`/reports/${id}`, report);
  return response.data.data;
};

/**
 * Delete a report
 */
export const deleteReport = async (id: number): Promise<void> => {
  await apiClient.delete(`/reports/${id}`);
};

/**
 * Toggle report enabled status
 */
export const toggleReportStatus = async (id: number): Promise<{ id: number; name: string; active: boolean; updated_at: string }> => {
  const response = await apiClient.patch(`/reports/${id}/toggle`);
  return response.data.data;
};

/**
 * Get report execution history
 */
export const getReportHistory = async (
  reportId: number,
  page: number = 1,
  limit: number = 10,
  startDate?: string,
  endDate?: string
): Promise<PaginatedResponse<ReportHistory>> => {
  const response = await apiClient.get(`/reports/${reportId}/history`, {
    params: { page, limit, startDate, endDate }
  });
  return response.data.data;
};

/**
 * Get email logs for a specific report execution
 */
export const getEmailLogs = async (reportId: number, historyId: number): Promise<{ emails: EmailLog[] }> => {
  const response = await apiClient.get(`/reports/${reportId}/history/${historyId}/emails`);
  return response.data.data;
};

/**
 * Search email logs by recipient
 */
export const searchEmailLogs = async (
  recipient: string,
  page: number = 1,
  limit: number = 10
): Promise<PaginatedResponse<EmailLog>> => {
  const response = await apiClient.get('/email-logs/search', {
    params: { recipient, page, limit }
  });
  return response.data.data;
};

/**
 * Export email logs as CSV or JSON
 */
export const exportEmailLogs = async (
  format: 'csv' | 'json' = 'csv',
  reportId?: number,
  startDate?: string,
  endDate?: string
): Promise<any> => {
  const response = await apiClient.get('/email-logs/export', {
    params: { format, reportId, startDate, endDate },
    responseType: format === 'csv' ? 'blob' : 'json'
  });
  return response.data;
};
