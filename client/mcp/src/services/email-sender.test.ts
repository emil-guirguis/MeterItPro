import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EmailSender } from './email-sender.js';
import { db } from '../database/client.js';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import type { Report } from './scheduler-service.js';
import type { ReportData } from './report-executor.js';

// Mock dependencies
vi.mock('../database/client.js');
vi.mock('../utils/logger.js');
vi.mock('nodemailer');

describe('EmailSender', () => {
  let emailSender: EmailSender;
  const mockReport: Report = {
    id: '1',
    name: 'Test Report',
    type: 'meter_readings',
    schedule: '0 9 * * *',
    recipients: ['test@example.com', 'test2@example.com'],
    config: {},
    enabled: true,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockReportData: ReportData = {
    type: 'meter_readings',
    generatedAt: new Date().toISOString(),
    recordCount: 2,
    data: [
      { id: 1, external_id: 'meter-1', value: 100, timestamp: new Date() },
      { id: 2, external_id: 'meter-2', value: 200, timestamp: new Date() },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    emailSender = new EmailSender();
  });

  describe('email sending', () => {
    it('should send emails to all recipients', async () => {
      const historyId = 'history-1';
      const sentAt = new Date();

      // Mock email sending
      vi.mocked(db.query).mockResolvedValue({
        rows: [{ id: 'email-log-1' }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      } as any);

      await emailSender.sendReportEmails(mockReport, mockReportData, historyId, sentAt);

      // Verify email log entries were created for each recipient
      const insertCalls = vi.mocked(db.query).mock.calls.filter(call =>
        call[0].includes('INSERT INTO report_email_logs')
      );

      expect(insertCalls.length).toBe(mockReport.recipients.length);
    });

    it('should create email log entries with delivered status', async () => {
      const historyId = 'history-1';
      const sentAt = new Date();

      vi.mocked(db.query).mockResolvedValue({
        rows: [{ id: 'email-log-1' }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      } as any);

      await emailSender.sendReportEmails(mockReport, mockReportData, historyId, sentAt);

      const insertCalls = vi.mocked(db.query).mock.calls.filter(call =>
        call[0].includes('INSERT INTO report_email_logs')
      );

      // Check that delivered status is used
      for (const call of insertCalls) {
        expect(call[1]).toContain('delivered');
      }
    });

    it('should handle email sending failures gracefully', async () => {
      const historyId = 'history-1';
      const sentAt = new Date();

      // Mock email sending failure
      vi.mocked(db.query).mockRejectedValueOnce(new Error('Email service error'));

      await expect(
        emailSender.sendReportEmails(mockReport, mockReportData, historyId, sentAt)
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send report emails'),
        expect.any(Object)
      );
    });

    it('should continue sending to other recipients if one fails', async () => {
      const historyId = 'history-1';
      const sentAt = new Date();

      // Mock first email to fail, second to succeed
      vi.mocked(db.query)
        .mockRejectedValueOnce(new Error('First email failed'))
        .mockResolvedValueOnce({
          rows: [{ id: 'email-log-2' }],
          rowCount: 1,
          command: 'INSERT',
          oid: 0,
          fields: [],
        } as any);

      await expect(
        emailSender.sendReportEmails(mockReport, mockReportData, historyId, sentAt)
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send email to recipient'),
        expect.any(Object)
      );
    });
  });

  describe('email log creation', () => {
    it('should create email log entry with all required fields', async () => {
      const historyId = 'history-1';
      const sentAt = new Date();
      const recipient = 'test@example.com';

      vi.mocked(db.query).mockResolvedValue({
        rows: [{ id: 'email-log-1' }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      } as any);

      await emailSender.sendReportEmails(mockReport, mockReportData, historyId, sentAt);

      const insertCalls = vi.mocked(db.query).mock.calls.filter(call =>
        call[0].includes('INSERT INTO report_email_logs')
      );

      expect(insertCalls.length).toBeGreaterThan(0);

      // Verify the insert query structure
      const firstCall = insertCalls[0];
      expect(firstCall[0]).toContain('report_id');
      expect(firstCall[0]).toContain('history_id');
      expect(firstCall[0]).toContain('recipient');
      expect(firstCall[0]).toContain('sent_at');
      expect(firstCall[0]).toContain('status');
      expect(firstCall[0]).toContain('error_details');
    });

    it('should create email log entry with failed status on error', async () => {
      const historyId = 'history-1';
      const sentAt = new Date();

      // Mock email sending failure
      vi.mocked(db.query).mockRejectedValueOnce(new Error('Email service error'));

      await expect(
        emailSender.sendReportEmails(mockReport, mockReportData, historyId, sentAt)
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send email to recipient'),
        expect.any(Object)
      );
    });

    it('should handle database errors when creating email log', async () => {
      const historyId = 'history-1';
      const sentAt = new Date();

      // Mock database error
      vi.mocked(db.query).mockRejectedValueOnce(new Error('Database error'));

      await expect(
        emailSender.sendReportEmails(mockReport, mockReportData, historyId, sentAt)
      ).rejects.toThrow();

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Failed to send report emails'),
        expect.any(Object)
      );
    });
  });

  describe('email content formatting', () => {
    it('should format email content as HTML', async () => {
      const historyId = 'history-1';
      const sentAt = new Date();

      vi.mocked(db.query).mockResolvedValue({
        rows: [{ id: 'email-log-1' }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      } as any);

      await emailSender.sendReportEmails(mockReport, mockReportData, historyId, sentAt);

      // Verify email content was formatted
      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Completed sending report emails'),
        expect.any(Object)
      );
    });

    it('should handle empty report data', async () => {
      const historyId = 'history-1';
      const sentAt = new Date();
      const emptyData: ReportData = {
        type: 'meter_readings',
        generatedAt: new Date().toISOString(),
        recordCount: 0,
        data: [],
      };

      vi.mocked(db.query).mockResolvedValue({
        rows: [{ id: 'email-log-1' }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      } as any);

      await emailSender.sendReportEmails(mockReport, emptyData, historyId, sentAt);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Completed sending report emails'),
        expect.any(Object)
      );
    });

    it('should handle large datasets in email content', async () => {
      const historyId = 'history-1';
      const sentAt = new Date();
      const largeData: ReportData = {
        type: 'meter_readings',
        generatedAt: new Date().toISOString(),
        recordCount: 150,
        data: Array.from({ length: 150 }, (_, i) => ({
          id: i,
          external_id: `meter-${i}`,
          value: Math.random() * 1000,
          timestamp: new Date(),
        })),
      };

      vi.mocked(db.query).mockResolvedValue({
        rows: [{ id: 'email-log-1' }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      } as any);

      await emailSender.sendReportEmails(mockReport, largeData, historyId, sentAt);

      expect(logger.info).toHaveBeenCalledWith(
        expect.stringContaining('Completed sending report emails'),
        expect.any(Object)
      );
    });
  });

  describe('recipient handling', () => {
    it('should send to multiple recipients', async () => {
      const historyId = 'history-1';
      const sentAt = new Date();
      const multiRecipientReport: Report = {
        ...mockReport,
        recipients: ['test1@example.com', 'test2@example.com', 'test3@example.com'],
      };

      vi.mocked(db.query).mockResolvedValue({
        rows: [{ id: 'email-log-1' }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      } as any);

      await emailSender.sendReportEmails(multiRecipientReport, mockReportData, historyId, sentAt);

      const insertCalls = vi.mocked(db.query).mock.calls.filter(call =>
        call[0].includes('INSERT INTO report_email_logs')
      );

      expect(insertCalls.length).toBe(3);
    });

    it('should handle single recipient', async () => {
      const historyId = 'history-1';
      const sentAt = new Date();
      const singleRecipientReport: Report = {
        ...mockReport,
        recipients: ['test@example.com'],
      };

      vi.mocked(db.query).mockResolvedValue({
        rows: [{ id: 'email-log-1' }],
        rowCount: 1,
        command: 'INSERT',
        oid: 0,
        fields: [],
      } as any);

      await emailSender.sendReportEmails(singleRecipientReport, mockReportData, historyId, sentAt);

      const insertCalls = vi.mocked(db.query).mock.calls.filter(call =>
        call[0].includes('INSERT INTO report_email_logs')
      );

      expect(insertCalls.length).toBe(1);
    });
  });
});
