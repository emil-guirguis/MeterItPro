export interface FieldMetadata {
  name: string;
  column: string;
  dbField?: string | null;
  type: string;
  sqlType: string;
  nullable: boolean;
  defaultValue: unknown;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  isTimestamp: boolean;
  readOnly?: boolean;
}

export interface RelationshipConfig {
  type: 'belongsTo' | 'hasOne' | 'hasMany';
  model: string;
  foreignKey: string;
  targetKey: string;
  as?: string;
}

export interface RelationshipMap {
  name: string;
  alias: string;
  type: 'belongsTo' | 'hasOne' | 'hasMany';
  relatedTable: string;
  foreignKey: string;
  targetKey: string;
  nestedIncludes: string[];
}

export interface SqlResult {
  sql: string;
  values: unknown[];
}

export interface SelectSqlResult extends SqlResult {
  relationshipMap: RelationshipMap[];
}

export interface JoinClauseResult {
  clause: string;
  selectAdditions: string;
  relationshipMap: RelationshipMap[];
}

export interface WhereClauseResult {
  clause: string;
  values: unknown[];
}

export interface SelectOptions {
  where?: Record<string, unknown>;
  include?: (string | Record<string, string[]>)[];
  order?: [string, string][];
  limit?: number;
  offset?: number;
  attributes?: string[];
  relationships?: Record<string, RelationshipConfig>;
}

export function extractFields(ModelClass: new (...args: unknown[]) => unknown): FieldMetadata[];

export function buildInsertSQL(
  tableName: string,
  fields: FieldMetadata[],
  data: Record<string, unknown>,
  context?: Record<string, unknown>
): SqlResult;

export function buildSelectSQL(
  tableName: string,
  fields: FieldMetadata[],
  options?: SelectOptions
): SelectSqlResult;

export function buildUpdateSQL(
  tableName: string,
  fields: FieldMetadata[],
  data: Record<string, unknown>,
  where: Record<string, unknown>
): SqlResult;

export function buildDeleteSQL(
  tableName: string,
  where: Record<string, unknown>,
  fields?: FieldMetadata[],
  doDeactivate?: boolean
): SqlResult;

export function buildWhereClause(
  conditions: Record<string, unknown>,
  tableName?: string,
  paramOffset?: number,
  fields?: FieldMetadata[] | null
): WhereClauseResult;

export function buildJoinClause(
  tableName: string,
  includes: (string | Record<string, string[]>)[],
  relationships: Record<string, RelationshipConfig>,
  parentAlias?: string | null
): JoinClauseResult;

export function mapJoinedResults(
  rows: Record<string, unknown>[],
  relationshipMap: RelationshipMap[],
  primaryKey?: string
): Record<string, unknown>[];

export function mapColumnToProperty(columnName: string): string;

export function mapPropertyToColumn(propertyName: string): string;

export function validateFieldType(field: FieldMetadata, value: unknown): boolean;

export function sanitizeValue(value: unknown, fieldType?: string | null): unknown;

export function deserializeRow(row: Record<string, unknown>): Record<string, unknown>;
