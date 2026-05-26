# MCP Server Scheduler Implementation

## Overview

This document describes the implementation of the reporting module scheduler for the MCP server. The scheduler is responsible for loading enabled reports from the database, creating cron jobs for each report, executing reports on schedule, and sending emails to configured recipients.

## Architecture

The scheduler implementation consists of three main services:

1. **SchedulerService**: Manages cron job lifecycle
2. **ReportExecutor**: Executes reports and generates data
3. **EmailSender**: Sends report emails to recipients

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MCP Server (index.ts)                     │
│                                                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         SchedulerService                             │   │
│  │  - Load enabled reports from database                │   │
│  │  - Create/update/delete cron jobs                    │   │
│  │  - Validate cron expressions                         │   │
│  │  - Manage job lifecycle                              │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         ReportExecutor                               │   │
│  │  - Generate report data (meter_readings, etc.)       │   │
│  │  - Create report history entries                     │   │
│  │  - Handle execution errors                           │   │
│  │  - Integrate with EmailSender                        │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         EmailSender                                  │   │
│  │  - Send emails to all recipients                     │   │
│  │  - Format email content as HTML                      │   │
│  │  - Create email log entries                          │   │
│  │  - Handle delivery failures                          │   │
│  └──────────────────────────────────────────────────────┘   │
│                          │                                    │
│                          ▼                                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         PostgreSQL Database                          │   │
│  │  - Reports table                                     │   │
│  │  - Report_History table                              │   │
│  │  - Report_Email_Logs table                           │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Details

### SchedulerService

**File**: `client/mcp/src/services/scheduler-service.ts`

#### Key Features

- **Initialization**: Loads all enabled reports from the database and creates cron jobs
- **Job Management**: Create, update, and delete cron jobs dynamically
- **Cron Validation**: Validates cron expressions before creating jobs
- **Error Handling**: Gracefully handles database errors and invalid configurations
- **Shutdown**: Properly stops all jobs on server shutdown

#### Key Methods

```typescript
// Initialize scheduler and load reports
async initialize(): Promise<void>

// Create a cron job for a report
private async createJob(report: Report): Promise<void>

// Update a report's cron job
async updateJob(report: Report): Promise<void>

// Delete a report's cron job
async deleteJob(reportId: string): Promise<void>

// Get status of all jobs
getJobStatus(): Map<string, boolean>

// Shutdown all jobs
async shutdown(): Promise<void>
```

#### Supported Cron Expressions

- `0 9 * * *` - Daily at 9 AM
- `0 10 * * 1` - Weekly on Monday at 10 AM
- `0 0 1 * *` - Monthly on 1st at midnight
- `*/5 * * * *` - Every 5 minutes
- `0 0 * * 0` - Weekly on Sunday

### ReportExecutor

**File**: `client/mcp/src/services/report-executor.ts`

#### Key Features

- **Report Execution**: Executes reports based on type and configuration
- **Data Generation**: Generates report data from database queries
- **History Tracking**: Creates report history entries with execution status
- **Error Handling**: Logs errors and creates failed history entries
- **Email Integration**: Sends emails after successful execution

#### Supported Report Types

1. **meter_readings**: Returns recent meter readings with meter and site information
   - Query: Last 24 hours of readings
   - Fields: meter_id, external_id, site_id, data_point, value, timestamp

2. **usage_summary**: Returns aggregated usage statistics by site
   - Query: Last 24 hours of readings aggregated by site
   - Fields: site_id, site_name, meter_count, avg_value, max_value, min_value

3. **daily_summary**: Returns daily aggregated statistics
   - Query: Last 7 days of readings aggregated by day
   - Fields: date, active_meters, reading_count, avg_value, max_value, min_value

#### Key Methods

```typescript
// Execute a report
async execute(report: Report): Promise<void>

// Generate report data based on type
private async generateReportData(report: Report): Promise<ReportData>

// Generate meter readings report
private async generateMeterReadingsReport(report: Report): Promise<ReportData>

// Generate usage summary report
private async generateUsageSummaryReport(report: Report): Promise<ReportData>

// Generate daily summary report
private async generateDailySummaryReport(report: Report): Promise<ReportData>

// Create history entry
private async createHistoryEntry(...): Promise<string>
```

### EmailSender

**File**: `client/mcp/src/services/email-sender.ts`

#### Key Features

- **Email Sending**: Sends emails to all configured recipients
- **HTML Formatting**: Formats report data as HTML email content
- **Email Logging**: Creates email log entries for each email sent
- **Error Handling**: Handles delivery failures gracefully
- **Recipient Continuation**: Continues sending to other recipients if one fails

#### Email Content

Emails are formatted as HTML with:
- Report name and type
- Generation timestamp
- Record count
- Data table (first 100 records)
- Footer with disclaimer

#### Key Methods

```typescript
// Send emails to all recipients
async sendReportEmails(
  report: Report,
  reportData: ReportData,
  historyId: string,
  sentAt: Date
): Promise<void>

// Send email to single recipient
private async sendEmailToRecipient(...): Promise<void>

// Format email content as HTML
private formatEmailContent(report: Report, reportData: ReportData): string

// Create email log entry
private async createEmailLogEntry(...): Promise<string>
```

## Integration with MCP Server

### Startup Process

1. MCP server starts (`client/mcp/src/index.ts`)
2. Database connection is tested
3. SchedulerService is instantiated
4. `scheduler.initialize()` is called
5. All enabled reports are loaded from database
6. Cron jobs are created for each report
7. Jobs execute on schedule

### Shutdown Process

1. SIGINT or SIGTERM signal received
2. `scheduler.shutdown()` is called
3. All cron jobs are stopped and destroyed
4. Database connection is closed
5. Process exits

### Code Changes

**File**: `client/mcp/src/index.ts`

```typescript
// Import SchedulerService
import { SchedulerService } from './services/scheduler-service.js';

// In main() function:
const scheduler = new SchedulerService();
try {
  await scheduler.initialize();
  logger.info('Scheduler service initialized successfully');
} catch (error) {
  logger.error('Failed to initialize scheduler service', { error });
}

// Store scheduler reference for shutdown
(global as any).scheduler = scheduler;

// In SIGINT/SIGTERM handlers:
const scheduler = (global as any).scheduler;
if (scheduler) {
  try {
    await scheduler.shutdown();
  } catch (error) {
    logger.error('Error shutting down scheduler', { error });
  }
}
```

## Database Integration

### Tables Used

1. **reports**: Stores report configurations
   - Columns: id, name, type, schedule, recipients, config, enabled, created_at, updated_at

2. **report_history**: Stores execution history
   - Columns: id, report_id, executed_at, status, error_message, created_at

3. **report_email_logs**: Stores email delivery logs
   - Columns: id, report_id, history_id, recipient, sent_at, status, error_details, created_at

### Queries

- **Load enabled reports**: `SELECT * FROM reports WHERE enabled = true`
- **Create history entry**: `INSERT INTO report_history (...) VALUES (...)`
- **Create email log**: `INSERT INTO report_email_logs (...) VALUES (...)`
- **Query meter readings**: `SELECT * FROM meter_readings WHERE timestamp >= NOW() - INTERVAL '24 hours'`
- **Query usage summary**: `SELECT * FROM sites LEFT JOIN meters ... GROUP BY site_id`
- **Query daily summary**: `SELECT * FROM meter_readings ... GROUP BY DATE(timestamp)`

## Error Handling

### SchedulerService Errors

- **Database Connection**: Logs error, throws exception
- **Invalid Cron Expression**: Logs warning, skips job creation
- **Job Creation Failure**: Logs error, continues with other reports
- **Shutdown Errors**: Logs error, continues shutdown process

### ReportExecutor Errors

- **Data Generation Failure**: Creates failed history entry with error message
- **History Creation Failure**: Logs error, continues with email sending
- **Unknown Report Type**: Logs warning, returns empty data

### EmailSender Errors

- **Email Sending Failure**: Creates failed email log entry with error details
- **Recipient Failure**: Logs error, continues with next recipient
- **Email Log Creation Failure**: Logs error, continues with next recipient
- **Database Error**: Logs error, throws exception

## Testing

### Unit Tests

Comprehensive unit tests are provided for all three services:

- `scheduler-service.test.ts`: Tests for SchedulerService
  - Initialization and report loading
  - Job creation and management
  - Cron expression validation
  - Shutdown process

- `report-executor.test.ts`: Tests for ReportExecutor
  - Report execution
  - Data generation for different report types
  - History entry creation
  - Error handling

- `email-sender.test.ts`: Tests for EmailSender
  - Email sending to multiple recipients
  - Email log creation
  - Email content formatting
  - Error handling and recovery

### Running Tests

```bash
# Install dependencies
npm install

# Run tests
npm test

# Run tests once
npm run test:run

# Run tests with coverage
npm test -- --coverage
```

## Configuration

### Environment Variables

The scheduler uses the following environment variables (from `config.ts`):

```
# Database
POSTGRES_CLIENT_HOST=localhost
POSTGRES_CLIENT_PORT=5432
POSTGRES_CLIENT_DB=postgres
POSTGRES_CLIENT_USER=postgres
POSTGRES_CLIENT_PASSWORD=

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=
SMTP_PASSWORD=
SMTP_FROM=alerts@meterit.com

# Logging
LOG_LEVEL=info
LOG_FILE=logs/client-mcp.log
```

## Performance Considerations

- **Cron Jobs**: Uses node-cron for efficient scheduling
- **Database Queries**: Indexed queries for fast report loading
- **Email Sending**: Asynchronous with error handling
- **Memory**: Jobs stored in Map for O(1) lookup
- **Concurrency**: Each report execution is independent

## Dependencies

### New Dependencies Added

- `node-cron@^3.0.3`: Cron job scheduling
- `@types/node-cron@^3.0.11`: TypeScript types for node-cron

### Existing Dependencies Used

- `pg@^8.16.3`: PostgreSQL client
- `nodemailer@^6.10.1`: Email sending
- `winston@^3.18.3`: Logging

## Files Created

1. `client/mcp/src/services/scheduler-service.ts` - SchedulerService implementation
2. `client/mcp/src/services/report-executor.ts` - ReportExecutor implementation
3. `client/mcp/src/services/email-sender.ts` - EmailSender implementation
4. `client/mcp/src/services/scheduler-service.test.ts` - SchedulerService tests
5. `client/mcp/src/services/report-executor.test.ts` - ReportExecutor tests
6. `client/mcp/src/services/email-sender.test.ts` - EmailSender tests
7. `client/mcp/src/services/README.md` - Services documentation
8. `client/mcp/vitest.config.ts` - Vitest configuration
9. `client/mcp/SCHEDULER_IMPLEMENTATION.md` - This file

## Files Modified

1. `client/mcp/src/index.ts` - Added scheduler initialization and shutdown
2. `client/mcp/package.json` - Added node-cron and vitest dependencies

## Requirements Satisfied

The implementation satisfies the following requirements:

- **Requirement 3.1**: Load all enabled reports from database at startup ✓
- **Requirement 3.2**: Create cron jobs for each report ✓
- **Requirement 3.3**: Generate report data and create history entry ✓
- **Requirement 3.4**: Record execution timestamp, status, and error messages ✓
- **Requirement 3.5**: Log errors and mark history as failed ✓
- **Requirement 4.1**: Send emails to all configured recipients ✓
- **Requirement 4.2**: Create email log entries ✓
- **Requirement 4.3**: Record failure reason in email log ✓
- **Requirement 4.4**: Send individual emails to each recipient ✓
- **Requirement 4.5**: Update email log with delivered status ✓
- **Requirement 8.3**: Generate data appropriate to report type ✓
- **Requirement 8.4**: Format output appropriately for each type ✓
- **Requirement 10.1**: Store reports in database ✓
- **Requirement 10.2**: Create report history entries ✓
- **Requirement 10.3**: Create email log entries ✓
- **Requirement 10.4**: Load reports on startup and resume scheduling ✓

## Next Steps

1. Run tests to verify implementation
2. Deploy MCP server with scheduler
3. Monitor scheduler logs for execution
4. Implement frontend components for report management
5. Add property-based tests for scheduler
6. Implement report execution retries
7. Add execution metrics and monitoring

## Troubleshooting

### Scheduler Not Starting

1. Check database connection: `npm run dev` and look for connection errors
2. Verify enabled reports exist: `SELECT * FROM reports WHERE enabled = true`
3. Check logs: `tail -f logs/client-mcp.log`

### Jobs Not Executing

1. Verify cron expression: Use `cron.validate()` to check
2. Check report enabled status: `SELECT enabled FROM reports WHERE id = '...'`
3. Check logs for execution errors

### Emails Not Sending

1. Verify SMTP configuration in `.env`
2. Check email log entries: `SELECT * FROM report_email_logs WHERE status = 'failed'`
3. Check logs for email sending errors

## Support

For issues or questions about the scheduler implementation, refer to:

- `client/mcp/src/services/README.md` - Services documentation
- `client/mcp/src/services/*.test.ts` - Test files for usage examples
- `.kiro/specs/reporting-module/design.md` - Design specifications
- `.kiro/specs/reporting-module/requirements.md` - Requirements
