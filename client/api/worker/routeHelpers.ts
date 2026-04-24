/**
 * Shared helpers for Hono worker route files.
 * Centralises: pagination parsing, ID validation, schema-driven body extraction,
 * and common validators (email, cron) so every module route can stay thin.
 */

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page: number;
  limit: number;
}

export function parsePagination(
  qs: Record<string, string>,
  defaults: { page?: number; limit?: number; maxLimit?: number } = {}
): PaginationParams {
  const { page: defaultPage = 1, limit: defaultLimit = 25, maxLimit = 100 } = defaults;
  const page = Math.max(1, parseInt(qs.page || String(defaultPage)) || defaultPage);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(qs.limit || String(defaultLimit)) || defaultLimit));
  return { page, limit };
}

// ── ID validation ─────────────────────────────────────────────────────────────

/** Returns the numeric id, or null if the string is not a valid integer. */
export function parseNumericId(param: string): number | null {
  const n = Number(param);
  return isNaN(n) ? null : n;
}

// ── Schema helpers ────────────────────────────────────────────────────────────

export interface FieldMeta {
  name: string;
  dbField: string;
  type: string;
}

/**
 * Walks a schema object (produced by defineSchema) and returns every field
 * that has a non-null dbField, regardless of tab/section nesting.
 */
export function getSchemaFields(schema: any): FieldMeta[] {
  const s = schema?.schema ?? schema; // unwrap defineSchema() return value if needed
  const fields: FieldMeta[] = [];
  for (const tab of s?.formTabs ?? []) {
    for (const sec of tab.sections ?? []) {
      for (const f of sec.fields ?? []) {
        if (f.dbField && f.dbField !== null) {
          fields.push({ name: f.name, dbField: f.dbField, type: f.type });
        }
      }
    }
  }
  return fields;
}

/**
 * Extracts only the fields declared in the schema from a request body,
 * serialising `type === 'object'` values to JSON strings for pg JSONB columns.
 * Accepts both the field name and the dbField name as keys in the body.
 */
export function extractBodyData(body: Record<string, any>, schema: any): Record<string, any> {
  const data: Record<string, any> = {};
  for (const { name, dbField, type } of getSchemaFields(schema)) {
    const val = body[name] !== undefined ? body[name] : body[dbField];
    if (val === undefined) continue;
    data[dbField] = type === 'object'
      ? (typeof val === 'string' ? val : JSON.stringify(val))
      : val;
  }
  return data;
}

// ── Validators ────────────────────────────────────────────────────────────────

export function isValidCronExpression(expr: string): boolean {
  if (!expr || typeof expr !== 'string') return false;
  if (expr.startsWith('@once:')) return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(expr.slice(6));
  const parts = expr.trim().split(/\s+/);
  return parts.length >= 5 && parts.length <= 7;
}

export function validateEmailList(emails: string[]): { isValid: boolean; invalidEmails: string[] } {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalid = emails.filter((e) => !emailRegex.test(e));
  return { isValid: invalid.length === 0, invalidEmails: invalid };
}
