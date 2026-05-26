# Client MCP Server

This is the Client MCP (Model Context Protocol) Server for the MeterIT dual-deployment architecture. It runs on the centralized Client System and provides:

- AI-assisted querying of multi-site data
- Alert monitoring and email notifications
- Report generation across all sites
- System health monitoring

## Directory Structure

```
client/mcp/
├── src/
│   ├── index.ts                 # MCP server entry point
│   └── tools/                   # MCP tools
├── .env.example                 # Environment configuration template
├── package.json
└── README.md
```

## Setup

1. Copy `.env.example` to `.env` and configure:
   - Client Database connection
   - Email/SMTP settings for alerts
   - Alert configuration

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

4. Start the server:
   ```bash
   npm start
   ```

## Configuration

See `.env.example` for all available configuration options.

## MCP Tools

The Client MCP provides the following tools:

- `query_meters` - Query meter information across all sites
- `query_readings` - Query readings with filters (site, meter, date range)
- `get_site_status` - Get connectivity status of Syncs
- `send_alert_email` - Send alert emails for critical events
- `configure_alert_rules` - Configure alert thresholds and rules
- `generate_report` - Generate multi-site reports
