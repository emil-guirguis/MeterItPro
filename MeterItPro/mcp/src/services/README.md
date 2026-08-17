# Reporting Module Services

This directory contains the core services for the reporting module scheduler implementation.

## Services

### SchedulerService

The `SchedulerService` is responsible for managing the lifecycle of report scheduling. It:

- **Loads enabled reports** from the database at startup
- **Creates cron jobs** for each report based on their schedule
- **Manages job lifecycle** (create, update, delete)
- **Validates cron expressions** before creating jobs
- **Handles graceful shutdown** of all jobs

#### Key Methods

- `initialize()`: Load all enabled reports and create cron jobs
- `createJob(report)`: Create a cron job for a specific report
- `updateJob(report)`: Update a report's cron job (delete old, create new)
- `deleteJob(reportId)`: Delete a report's cron job
- `getJobStatus()`: Get the status of all active jobs
- `shutdown()`: Stop all jobs and cleanup

#### Usage

```typescript
const scheduler = new SchedulerService();
await scheduler.initialize();

// Later, when shutting down
await scheduler.shutdown();
```

### ReportExecutor

The `ReportExecutor` is responsible for executing reports and generating report data. It:

- **Generates report data** based on report type (meter_readings, usage_summary, daily_summary)
- **Creates report history entries** with execution status and error details
- **Handles execution errors** gracefully
- **Integrates with EmailSender** to send emails after successful execution

#### Supported Report Types

1. **meter_readings**: Returns recent meter readings with meter and site information
2. **usage_summary**: Returns aggregated usage statistics by site
3. **daily_summary**: Returns daily aggregated statistics over the past 7 days

#### Key Methods

- `execute(report)`: Execute a report and send emails
- `generateReportData(report)`: Generate data based on report type
- `createHistoryEntry(...)`: Create a report history entry in the database

#### Usage

```typescript
const executor = new ReportExecutor();
await executor.execute(report);
```

### EmailSender

The `EmailSender` is responsible for sending report emails to recipients. It:

- **Sends emails** to all configured recipients
- **Formats email content** as HTML with report data
- **Creates email log entries** for each email sent
- **Handles delivery failures** gracefully
- **Continues sending** to other recipients if one fails

#### Key Methods

- `sendReportEmails(report, reportData, historyId, sentAt)`: Send emails to all recipients
- `formatEmailContent(report, reportData)`: Format email content as HTML

#### Usage

```typescript
const emailSender = new EmailSender();
await emailSender.sendReportEmails(report, reportData, historyId, sentAt);
```

## Database Integration

All services interact with the PostgreSQL database through the `db` client:

- **Reports table**: Stores report configurations
- **Report_History table**: Stores execution history with status and error details
- **Report_Email_Logs table**: Stores email delivery logs

## Error Handling

All services implement comprehensive error handling:

- **Validation errors**: Invalid cron expressions, missing fields
- **Database errors**: Connection failures, query errors
- **Email errors**: SMTP failures, invalid recipients
- **Execution errors**: Data generation failures, unexpected exceptions

Errors are logged using the Winston logger and propagated appropriately.

## Testing

Each service has comprehensive unit tests:

- `scheduler-service.test.ts`: Tests for SchedulerService
- `report-executor.test.ts`: Tests for ReportExecutor
- `email-sender.test.ts`: Tests for EmailSender

Run tests with:

```bash
npm test
```

## Configuration

Services use configuration from `config.ts`:

- **Database**: PostgreSQL connection settings
- **Email**: SMTP settings for email delivery
- **Logging**: Winston logger configuration

## Integration with MCP Server

The scheduler is integrated into the MCP server startup:

1. MCP server starts and connects to database
2. SchedulerService is initialized
3. All enabled reports are loaded from database
4. Cron jobs are created for each report
5. Jobs execute on schedule and send emails
6. On shutdown, all jobs are stopped gracefully

## Performance Considerations

- **Cron jobs**: Use node-cron for efficient scheduling
- **Database queries**: Indexed queries for fast report loading
- **Email sending**: Asynchronous with error handling
- **Memory**: Jobs are stored in a Map for O(1) lookup
- **Concurrency**: Each report execution is independent

## Future Enhancements

- Add support for custom report types
- Implement report execution retries
- Add email template customization
- Implement report data caching
- Add execution metrics and monitoring
- Support for report scheduling via API
