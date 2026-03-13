export const config = {
  database: {
    host: process.env.POSTGRES_CLIENT_HOST || process.env.POSTGRES_HOST || 'localhost',
    port: parseInt(process.env.POSTGRES_CLIENT_PORT || process.env.POSTGRES_PORT || '5432', 10),
    database: process.env.POSTGRES_CLIENT_DB || process.env.POSTGRES_DB || 'postgres',
    user: process.env.POSTGRES_CLIENT_USER || process.env.POSTGRES_USER || 'postgres',
    password: process.env.POSTGRES_CLIENT_PASSWORD || process.env.POSTGRES_PASSWORD || '',
  },
  email: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    user: process.env.SMTP_USER || '',
    password: process.env.SMTP_PASSWORD || '',
    from: process.env.SMTP_FROM || 'alerts@meterit.com',
  },
  alerts: {
    recipients: (process.env.ALERT_EMAIL_RECIPIENTS || '').split(',').filter(Boolean),
    checkIntervalMinutes: parseInt(process.env.ALERT_CHECK_INTERVAL_MINUTES || '5', 10),
  },
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/client-mcp.log',
  },
};
