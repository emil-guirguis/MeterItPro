import winston from 'winston';

export function formatSqlForDebug(sql: string, params: any[]): string {
  let paramIndex = 1;
  let formattedSql = sql;
  params.forEach((param) => {
    const placeholder = `$${paramIndex}`;
    let value: string;
    if (param === null || param === undefined) {
      value = 'NULL';
    } else if (typeof param === 'string') {
      value = `'${param.replace(/'/g, "''")}'`;
    } else if (param instanceof Date) {
      value = `'${param.toISOString()}'`;
    } else {
      value = String(param);
    }
    formattedSql = formattedSql.replace(placeholder, value);
    paramIndex++;
  });
  return formattedSql
    .replace(/\bFROM\b/gi, '\nFROM')
    .replace(/\bJOIN\b/gi, '\nJOIN')
    .replace(/\bWHERE\b/gi, '\nWHERE')
    .replace(/\bGROUP BY\b/gi, '\nGROUP BY')
    .replace(/\bORDER BY\b/gi, '\nORDER BY')
    .replace(/\bLIMIT\b/gi, '\nLIMIT')
    .replace(/\bOFFSET\b/gi, '\nOFFSET')
    .replace(/\bAND\b/gi, '\n  AND')
    .replace(/\bON\b/gi, '\n  ON');
}
import { config } from '../config.js';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';

// Ensure log directory exists
const logDir = dirname(config.logging.file);
if (!existsSync(logDir)) {
  mkdirSync(logDir, { recursive: true });
}

export const logger = winston.createLogger({
  level: config.logging.level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: config.logging.file,
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});
