/**
 * SQL helper re-exports from the shared framework.
 *
 * All logic lives in framework/backend/shared/helpers/sql-functions.ts.
 * This file exists only to provide a stable local import path for the sync/mcp package.
 */
export { execQuery, transformMetersWithElements } from '../../../../framework/backend/shared/helpers/sql-functions.js';
