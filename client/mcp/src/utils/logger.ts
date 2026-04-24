import winston from 'winston';
import { existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { config } from '../config.js';

export { formatSqlForDebug } from '../../../../framework/backend/shared/helpers/worker-logger.js';
export type { Logger } from '../../../../framework/backend/shared/helpers/logger.js';

const { level, file } = config.logging;
const logDir = dirname(file);
if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });

export const logger = winston.createLogger({
  level,
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), winston.format.simple()),
    }),
    new winston.transports.File({ filename: file, maxsize: 10_485_760, maxFiles: 5 }),
  ],
});
