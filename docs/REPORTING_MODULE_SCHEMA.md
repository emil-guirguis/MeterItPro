# Reporting Module Database Schema

## Overview

This document describes the database schema created for the Reporting Module. The schema consists of three main tables that support report creation, scheduling, execution tracking, and email delivery logging.

## Tables

### 1. Report Table

**Purpose**: Stores report configurations and metadata

**Table Name**: `report`

**Columns**:
- `report_id` (BIGINT, Primary Key, IDENTITY): Unique identifier for the report
- `name` (VARCHAR(255), NOT NULL, UNIQUE): Report name (must be unique)
- `type` (VARCHAR(50), NOT NULL): Report type (e.g., meter_readings, usage_summary)
- `schedule` (VARCHAR(255), NOT NULL): Cron expression or predefined schedule
- `recipients` (TEXT[], NOT NULL): Array of email addresses to receive the report
- `config` (JSONB, NOT NULL): JSON object with type-specific configuration
- `enabled` (BOOLEAN, DEFAULT true): Whether the report is active for scheduling
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): Last modification timestamp

**Constraints**:
- Primary Key: `report_pkey` on `report_id`
- Unique Constraint: `report_name_key` on `name` (prevents duplicate report names)

### 2. Report_History Table

**Purpose**: Logs each report execution with status and error information

**Table Name**: `report_history`

**Columns**:
- `report_history_id` (BIGINT, Primary Key, IDENTITY): Unique identifier for the history entry
- `report_id` (BIGINT, NOT NULL, Foreign Key): Reference to the report
- `executed_at` (TIMESTAMP, NOT NULL): When the report was executed
- `status` (VARCHAR(20), NOT NULL): Execution status (success, failed)
- `error_message` (TEXT): Error details if execution failed
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): When record was created

**Constraints**:
- Primary Key: `report_history_pkey` on `report_history_id`
- Foreign Key: `report_id` → `report(report_id)` with ON DELETE CASCADE

**Indexes**:
- `idx_report_history_report_id`: Single column index on `report_id`
- `idx_report_history_executed_at`: Single column index on `executed_at`
- `idx_report_history_report_executed`: Composite index on `(report_id, executed_at DESC)`

### 3. Report_Email_Logs Table

**Purpose**: Tracks individual email delivery attempts for each report execution

**Table Name**: `report_email_logs`

**Columns**:
- `report_email_logs_id` (BIGINT, Primary Key, IDENTITY): Unique identifier for the email log entry
- `report_id` (BIGINT, NOT NULL, Foreign Key): Reference to the report
- `report_history_id` (BIGINT, NOT NULL, Foreign Key): Reference to the report execution
- `recipient` (VARCHAR(255), NOT NULL): Email address that received the email
- `sent_at` (TIMESTAMP, NOT NULL): When the email was sent
- `status` (VARCHAR(20), NOT NULL): Delivery status (sent, failed, delivered)
- `error_details` (TEXT): Error information if delivery failed
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP): When record was created

**Constraints**:
- Primary Key: `report_email_logs_pkey` on `report_email_logs_id`
- Foreign Key: `report_id` → `report(report_id)` with ON DELETE CASCADE
- Foreign Key: `report_history_id` → `report_history(report_history_id)` with ON DELETE CASCADE

**Indexes**:
- `idx_report_email_logs_report_id`: Single column index on `report_id`
- `idx_report_email_logs_history_id`: Single column index on `report_history_id`
- `idx_report_email_logs_recipient`: Single column index on `recipient`
- `idx_report_email_logs_sent_at`: Single column index on `sent_at`
- `idx_report_email_logs_history_recipient`: Composite index on `(report_history_id, recipient)`

## Data Relationships

```
report (1) ──── (N) report_history
  │                      │
  │                      └──── (N) report_email_logs
  │
  └──────────────────────────── (N) report_email_logs
```

### Cascading Deletes

When a report is deleted:
1. All associated `report_history` entries are deleted
2. All associated `report_email_logs` entries are deleted (via cascade from report_history)

When a report execution (history entry) is deleted:
1. All associated `report_email_logs` entries are deleted

## Migration Files

### 001-create-reporting-schema.sql
SQL file containing all table and index creation statements. This file is provided for reference and can be used directly in PostgreSQL clients.

### 002-create-reporting-tables.js
JavaScript migration file that executes each SQL statement individually. This is the primary migration file used to set up the schema.

## Running Migrations

To run the reporting module migrations:

```bash
node client/backend/migrations/002-create-reporting-tables.js
```

To verify the tables were created correctly:

```bash
node client/backend/verify-reporting-tables.js
```

## Query Performance Considerations

The indexes are designed to optimize common query patterns:

1. **Finding report history by report**: `idx_report_history_report_id`
2. **Finding recent executions**: `idx_report_history_executed_at`
3. **Finding executions for a specific report in date order**: `idx_report_history_report_executed`
4. **Finding email logs by report**: `idx_report_email_logs_report_id`
5. **Finding email logs by execution**: `idx_report_email_logs_history_id`
6. **Finding email logs by recipient**: `idx_report_email_logs_recipient`
7. **Finding recent email deliveries**: `idx_report_email_logs_sent_at`
8. **Finding email logs for a specific execution and recipient**: `idx_report_email_logs_history_recipient`

## Requirements Satisfied

This schema implementation satisfies the following requirements:

- **Requirement 10.1**: Reports are stored in the Report table with all configuration details
- **Requirement 10.2**: Report executions are logged in the Report_History table
- **Requirement 10.3**: Email delivery attempts are logged in the Report_Email_Logs table

## Schema Changes from Previous Version

- **Table Naming**: Changed from `reports` to `report` (singular)
- **Primary Key Type**: Changed from UUID to BIGINT with IDENTITY (auto-increment)
- **Primary Key Naming**: Changed to follow convention `{tablename}_id` (e.g., `report_id`, `report_history_id`, `report_email_logs_id`)
- **Foreign Key Naming**: Updated to use `report_id` instead of `reports_id` for consistency
- **Column Collation**: Added explicit PostgreSQL collation specifications
- **Permissions**: Added explicit GRANT statements for all roles (anon, authenticated, postgres, service_role)

## Notes

- All tables use BIGINT IDENTITY primary keys for better performance and consistency with application standards
- JSONB is used for the `config` field to allow flexible, type-specific configuration
- TEXT arrays are used for the `recipients` field to store multiple email addresses
- Timestamps use CURRENT_TIMESTAMP for automatic server-side timestamp generation
- All tables are in the `public` schema with explicit permissions granted to all roles
