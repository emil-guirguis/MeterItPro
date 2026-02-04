/**
 * BaseModel - Core model class for dynamic CRUD generation
 * 
 * Provides automatic CRUD operations based on model field definitions.
 * Child classes only need to define their structure through a constructor
 * and provide static configuration properties.
 * 
 * @example
 * class Meter extends BaseModel {
 *   constructor(data = {}) {
 *     super(data);
 *     this.id = data.id;
 *     this.name = data.name;
 *   }
 * 
 *   static get tableName() { return 'meter'; }
 *   static get primaryKey() { return 'id'; }
 * }
 */

const { 
  extractFields,
  buildInsertSQL,
  buildSelectSQL,
  buildUpdateSQL,
  buildDeleteSQL,
  buildWhereClause,
  buildJoinClause,
  mapJoinedResults,
  deserializeRow
} = require('../../shared/utils/modelHelpers');

const {
  handleDatabaseError,
  validateRequiredFields,
  validateFieldTypes
} = require('./errorHandler');

const {
  ConfigurationError,
  NotFoundError
} = require('./errors');

const { logQuery } = require('../../shared/utils/logger');

class BaseModel {
  /**
   * Constructor - Initialize model instance with data
   * 
   * @param {Object} data - Initial data for the model instance
   */
  constructor(data = {}) {
    // Initialize instance with provided data
    // Child classes will define their own fields
    // This base constructor just ensures the pattern is followed
    
    // Note: Field extraction is deferred until first use of _getFields()
    // This allows child class constructors to complete before validation
  }

  /**
   * Extract and cache field metadata from constructor
   * Uses the modelHelpers.extractFields utility to parse the constructor
   * and identify field definitions
   * 
   * @returns {Array<Object>} Array of field metadata objects
   * @private
   */
  static _getFields() {
    // Check if fields are already cached
    if (this._fields) {
      return this._fields;
    }

    // Validate that required configuration is defined
    this._validateConfiguration();

    // Extract fields from constructor using modelHelpers
    let fields = extractFields(this);
    
    console.log('\n' + '█'.repeat(120));
    console.log('█ FIELD EXTRACTION FOR:', this.name);
    console.log('█'.repeat(120));
    console.log('Extracted from constructor:', fields.map(f => f.name));
    
    // Also include fields from schema if available
    if (this.schema) {
      // Build a map of all schema fields (both form and entity fields)
      const schemaFields = {};
      
      // Add form fields from schema
      if (this.schema.formFields) {
        Object.assign(schemaFields, this.schema.formFields);
      }
      
      // Add entity fields from schema
      if (this.schema.entityFields) {
        Object.assign(schemaFields, this.schema.entityFields);
      }
      
      console.log('Schema form fields:', Object.keys(this.schema.formFields || {}));
      console.log('Schema entity fields:', Object.keys(this.schema.entityFields || {}));
      
      // Merge schema fields with extracted fields, preferring schema definitions
      const fieldMap = new Map();
      
      // Add extracted fields first
      fields.forEach(f => fieldMap.set(f.name, f));
      
      // Add/override with schema fields
      Object.entries(schemaFields).forEach(([name, fieldDef]) => {
        // Skip fields with dbField: null (custom-rendered fields like "elements")
        if (fieldDef.dbField === null) {
          return;
        }
        
        // Convert schema field definition to BaseModel field format
        const dbField = fieldDef.dbField || name;
        fieldMap.set(name, {
          ...fieldDef,
          name,
          dbField: dbField,  // CRITICAL: Use dbField not column for deserializeRow compatibility
          column: dbField,   // Keep column for backward compatibility
          type: fieldDef.type,
          required: fieldDef.required || false,
          readOnly: fieldDef.readOnly || false,
          default: fieldDef.default,
        });
      });
      
      fields = Array.from(fieldMap.values());
      console.log('Final merged fields:', fields.map(f => ({ name: f.name, dbField: f.column || f.dbField, type: f.type })));
    }
    
    console.log('█'.repeat(120) + '\n');

    this._fields = fields;

    return this._fields;
  }

  /**
   * Validate that required configuration properties are defined
   * Throws descriptive errors if tableName or primaryKey are missing
   * 
   * @throws {ConfigurationError} If tableName is not defined
   * @throws {ConfigurationError} If primaryKey is not defined
   * @private
   */
  static _validateConfiguration() {
    // Skip validation if this is the BaseModel class itself
    if (this === BaseModel) {
      return;
    }

    // Check tableName - try to access it and catch the error
    try {
      const tableName = this.tableName;
      if (!tableName) {
        throw new Error('tableName is empty');
      }
    } catch (error) {
      throw new ConfigurationError(
        `tableName must be defined in ${this.name} model class. ` +
        `Add: static get tableName() { return 'your_table_name'; }`,
        { model: this.name }
      );
    }

    // Check primaryKey - try to access it and catch the error
    try {
      const primaryKey = this.primaryKey;
      if (!primaryKey) {
        throw new Error('primaryKey is empty');
      }
    } catch (error) {
      throw new ConfigurationError(
        `primaryKey must be defined in ${this.name} model class. ` +
        `Add: static get primaryKey() { return 'id'; }`,
        { model: this.name }
      );
    }
  }

  /**
   * Get the table name for this model
   * MUST be overridden by child classes
   * 
   * @returns {string} The database table name
   * @throws {ConfigurationError} If not overridden in child class
   */
  static get tableName() {
    throw new ConfigurationError(
      `tableName must be defined in ${this.name} model class. ` +
      `Add: static get tableName() { return 'your_table_name'; }`,
      { model: this.name }
    );
  }

  /**
   * Get the primary key field name for this model
   * MUST be overridden by child classes
   * Defaults to 'id' if not specified
   * 
   * @returns {string} The primary key field name
   * @throws {ConfigurationError} If not overridden in child class
   */
  static get primaryKey() {
    throw new ConfigurationError(
      `primaryKey must be defined in ${this.name} model class. ` +
      `Add: static get primaryKey() { return 'id'; }`,
      { model: this.name }
    );
  }

  /**
   * Get schema configuration for this model
   * Can be overridden by child classes to define schema
   * 
   * @returns {Object|null} Schema configuration object
   */
  static get schema() {
    return null;
  }

  /**
   * Get relationship configuration for this model
   * Can be overridden by child classes to define relationships
   * 
   * @returns {Object} Relationship configuration object
   * @example
   * static get relationships() {
   *   return {
   *     device: {
   *       type: 'belongsTo',
   *       model: 'Device',
   *       foreignKey: 'device_id',
   *       targetKey: 'id'
   *     }
   *   };
   * }
   */
  static get relationships() {
    return {};
  }

  /**
   * Get timestamp configuration for this model
   * Determines if created_at and updated_at should be automatically managed
   * 
   * @returns {boolean} True if timestamps should be managed automatically
   */
  static get timestamps() {
    return true;
  }

  /**
   * Process query parameters and extract filters based on schema
   * Automatically handles type conversion and validation
   * 
   * @param {Object} queryParams - Query parameters from request
   * @param {Array<string>} systemParams - System parameters to skip (e.g., ['page', 'limit', 'search'])
   * @returns {Object} Processed where clause with filters
   * 
   * @example
   * const where = Model.processFilters(req.query, ['page', 'limit', 'search', 'sortBy', 'sortOrder']);
   */
  static processFilters(queryParams = {}, systemParams = ['page', 'limit', 'search', 'sortBy', 'sortOrder']) {
    const where = {};
    
    // Get schema to identify filterable fields
    const schema = this.schema;
    if (!schema) {
      return where; // No schema, no filters
    }
    
    const formFields = schema.formFields || {};
    
    // Process each query parameter
    Object.entries(queryParams).forEach(([key, value]) => {
      // Skip system parameters
      if (systemParams.includes(key)) {
        return;
      }
      
      // Skip empty or null values
      if (value === '' || value === null || value === undefined) {
        return;
      }
      
      // Check if this field exists in the schema
      const fieldDef = formFields[key];
      if (!fieldDef) {
        return; // Skip unknown fields
      }
      
      // Convert filter value to appropriate type based on field definition
      let filterValue = value;
      
      if (fieldDef.type === 'boolean') {
        // Convert string "true"/"false" to boolean
        filterValue = value === 'true' || value === true;
      } else if (fieldDef.type === 'number') {
        // Convert to number
        filterValue = parseInt(value, 10);
      }
      // For string and other types, use value as-is
      
      // Apply filter to where clause
      where[key] = filterValue;
    });
    
    return where;
  }

  /**
   * Get database connection
   * Provides access to the database for executing queries
   * 
   * @returns {Object} Database connection instance
   * @private
   */
  static _getDb() {
    // Import database connection (lazy load to avoid circular dependencies)
    if (!this._db) {
      this._db = require('../../../../client/api/src/config/database');
    }
    return this._db;
  }

  /**
   * Get database connection for custom queries in child classes
   * This is the public API for accessing the database connection
   * 
   * @returns {Object} Database connection instance with query() and transaction() methods
   * 
   * @example
   * // In a child class custom method
   * static async getStats() {
   *   const db = this.getDb();
   *   const result = await db.query('SELECT COUNT(*) FROM meter');
   *   return result.rows[0];
   * }
   */
  static getDb() {
    return this._getDb();
  }

  /**
   * Execute a function within a database transaction
   * Automatically handles BEGIN, COMMIT, and ROLLBACK
   * 
   * @param {Function} callback - Async function that receives a database client
   * @returns {Promise<*>} Result from the callback function
   * @throws {ModelError} If transaction fails
   * 
   * @example
   * // Transfer operation with transaction
   * await Meter.transaction(async (client) => {
   *   await client.query('UPDATE meter SET status = $1 WHERE id = $2', ['inactive', 1]);
   *   await client.query('UPDATE meter SET status = $1 WHERE id = $2', ['active', 2]);
   * });
   * 
   */
  static async transaction(callback) {
    try {
      const db = this._getDb();
      return await db.transaction(callback);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this._handleDatabaseError(err, 'transaction', '', []);
      throw err; // Ensure function returns
    }
  }

  /**
   * Map database result row to model instance
   * Applies type deserialization before creating the instance
   * 
   * @param {Object} row - Database result row
   * @returns {Object} Model instance
   * @private
   */
  static _mapResultToInstance(row) {
    if (!row) {
      return null;
    }
    
    console.log('\n' + '█'.repeat(120));
    console.log('█ [BASEMODEL] _mapResultToInstance - START');
    console.log('█'.repeat(120));
    console.log('Model:', this.name);
    console.log('Row keys:', Object.keys(row));
    console.log('Row data:', JSON.stringify(row, null, 2));
    
    // Deserialize database values to proper JavaScript types
    const fields = this._getFields();
    console.log('Fields available:', fields.map(f => ({ name: f.name, dbField: f.dbField, type: f.type })));
    
    const deserializedRow = deserializeRow(row, fields);
    
    console.log('After deserializeRow:');
    console.log('Deserialized keys:', Object.keys(deserializedRow));
    console.log('Deserialized data:', JSON.stringify(deserializedRow, null, 2));
    console.log('█'.repeat(120) + '\n');
    
    return new this(deserializedRow);
  }

  /**
   * Handle database errors and throw appropriate custom errors
   * Uses the errorHandler utility to parse PostgreSQL errors
   * 
   * @param {Error} error - Database error
   * @param {string} operation - Operation being performed
   * @param {string|null} sql - SQL query that failed (optional)
   * @param {Array} params - Query parameters (optional)
   * @throws {ModelError} Custom error based on error code
   * @private
   */
  static _handleDatabaseError(error, operation, sql = null, params = []) {
    // Use the centralized error handler
    // Ensure error is an Error object
    const err = error instanceof Error ? error : new Error(String(error));
    handleDatabaseError(err, operation, this.name, this.tableName, sql || '', params);
  }

  /**
   * Create a new record in the database
   * 
   * @param {Object} data - Data for the new record
   * @returns {Promise<Object>} Created model instance
   * @throws {ValidationError} If validation fails
   * @throws {ModelError} If database error occurs
   * 
   * @example
   * const meter = await Meter.create({
   *   id: 'M001',
   *   name: 'Main Meter',
   *   type: 'electric'
   * });
   */
  static async create(data) {
    let sql = '';
    let values = [];
    
    try {
      // Get fields and validate configuration
      const fields = this._getFields();
      
      // Automatically set tenant_id if model has tenant_id field
      const hasTenantIdField = fields.some(f => f.name === 'tenant_id');
      if (hasTenantIdField) {
        // Get tenant_id from data or global context
        let tenantId = data.tenant_id;
        
        // If not in data, try to get from global context (set by middleware)
        if (tenantId === undefined && global.currentTenantId) {
          tenantId = global.currentTenantId;
        }
        
        // Set tenant_id if available
        if (tenantId !== undefined && tenantId !== null) {
          data = { ...data, tenant_id: tenantId };
          
          console.log('\n' + '█'.repeat(120));
          console.log('█ [BASEMODEL] TENANT ID SET ON CREATE');
          console.log('█'.repeat(120));
          console.log('Model:', this.name);
          console.log('Tenant ID:', tenantId);
          console.log('█'.repeat(120) + '\n');
        }
      }
      
      // Validate field types before query execution
      validateFieldTypes(data, fields, this.name);
      
      // Build INSERT query
      const queryResult = buildInsertSQL(this.tableName, fields, data);
      sql = queryResult.sql;
      values = queryResult.values;
      
      // Log query for debugging
      logQuery('create', this.name, sql, values);
      
      // Execute query
      const db = this._getDb();
      const result = await db.query(sql, values);
      
      // Map result to model instance
      if (result.rows && result.rows.length > 0) {
        return this._mapResultToInstance(result.rows[0]);
      }
      
      throw new Error('Failed to create record: no data returned');
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this._handleDatabaseError(err, 'create', sql, values);
      throw err; // Ensure function returns
    }
  }

  /**
   * Find a record by its primary key
   * 
   * @param {*} id - Primary key value
   * @param {Object} options - Query options (include for relationships)
   * @returns {Promise<Object|null>} Model instance or null if not found
   * 
   * @example
   * const meter = await Meter.findById(5);
   * const meterWithDevice = await Meter.findById(5, { include: ['device'] });
   */
  static async findById(id, options = {}) {
    let sql = '';
    let values = [];
    
    try {
      // Get fields and validate configuration
      const fields = this._getFields();
      
      // Build WHERE condition for primary key
      const where = { [this.primaryKey]: id };
      
      // Build SELECT query with relationships if specified
      const queryOptions = {
        ...options,
        where,
        relationships: this.relationships,
        limit: 1
      };
      
      const queryResult = buildSelectSQL(this.tableName, fields, queryOptions);
      sql = queryResult.sql;
      values = queryResult.values;
      const relationshipMap = queryResult.relationshipMap;
      
      // Log query for debugging
      logQuery('findById', this.name, sql, values);
      
      // Execute query
      const db = this._getDb();
      const result = await db.query(sql, values);
      
      // Return first result or null
      if (result.rows && result.rows.length > 0) {
        // Map joined results to nested objects if relationships were included
        let rows = result.rows;
        if (relationshipMap && relationshipMap.length > 0) {
          rows = mapJoinedResults(rows, relationshipMap, this.primaryKey);
        }
        
        return this._mapResultToInstance(rows[0]);
      }
      
      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      console.error(`[${this.name}] findById error:`, err.message);
      console.error(`[${this.name}] SQL:`, sql);
      console.error(`[${this.name}] Values:`, values);
      // Propagate the error instead of handling it silently
      throw err;
    }
  }

  /**
   * Find the first record matching the given conditions
   * 
   * @param {Object} where - WHERE conditions
   * @param {Object} options - Query options (include for relationships)
   * @returns {Promise<Object|null>} Model instance or null if not found
   * 
   * @example
   * const meter = await Meter.findOne({ id: 'M001' });
   * const meterWithDevice = await Meter.findOne(
   *   { status: 'active' },
   *   { include: ['device'] }
   * );
   */
  static async findOne(where, options = {}) {
    let sql = '';
    let values = [];
    
    try {
      // Get fields and validate configuration
      const fields = this._getFields();
      
      // Automatically apply tenant filtering if model has tenant_id field
      const hasTenantIdField = fields.some(f => f.name === 'tenant_id');
      if (hasTenantIdField) {
        // Get tenant_id from options or global context
        let tenantId = options.tenant_id || options.tenantId;
        
        // If not in options, try to get from global context (set by middleware)
        if (tenantId === undefined && global.currentTenantId) {
          tenantId = global.currentTenantId;
        }
        
        // Apply tenant filtering if tenant_id is available
        if (tenantId !== undefined && tenantId !== null) {
          where = where || {};
          where.tenant_id = tenantId;
          
          console.log('\n' + '█'.repeat(120));
          console.log('█ [BASEMODEL] TENANT FILTERING APPLIED (findOne)');
          console.log('█'.repeat(120));
          console.log('Model:', this.name);
          console.log('Tenant ID:', tenantId);
          console.log('Where clause:', JSON.stringify(where));
          console.log('█'.repeat(120) + '\n');
        }
      }
      
      // Build SELECT query
      const queryOptions = {
        ...options,
        where,
        relationships: this.relationships,
        limit: 1
      };
      
      const queryResult = buildSelectSQL(this.tableName, fields, queryOptions);
      sql = queryResult.sql;
      values = queryResult.values;
      const relationshipMap = queryResult.relationshipMap;
      
      // Log query for debugging
      logQuery('findOne', this.name, sql, values);
      
      console.log('\n' + '█'.repeat(120));
      console.log('█ [BASEMODEL] findOne - SQL STATEMENT');
      console.log('█'.repeat(120));
      console.log('Model:', this.name);
      console.log('Table:', this.tableName);
      console.log('Where clause:', JSON.stringify(where));
      console.log('SQL:', sql);
      console.log('Values:', JSON.stringify(values));
      console.log('█'.repeat(120) + '\n');
      
      // Execute query
      const db = this._getDb();
      const result = await db.query(sql, values);
      
      console.log('\n' + '█'.repeat(120));
      console.log('█ [BASEMODEL] findOne - QUERY RESULT');
      console.log('█'.repeat(120));
      console.log('Rows returned:', result.rows ? result.rows.length : 0);
      if (result.rows && result.rows.length > 0) {
        console.log('First row keys:', Object.keys(result.rows[0]));
        console.log('First row data:', JSON.stringify(result.rows[0], null, 2));
      }
      console.log('█'.repeat(120) + '\n');
      
      // Return first result or null
      if (result.rows && result.rows.length > 0) {
        // Map joined results to nested objects if relationships were included
        let rows = result.rows;
        if (relationshipMap && relationshipMap.length > 0) {
          rows = mapJoinedResults(rows, relationshipMap, this.primaryKey);
        }
        
        console.log('\n' + '█'.repeat(120));
        console.log('█ [BASEMODEL] findOne - BEFORE _mapResultToInstance');
        console.log('█'.repeat(120));
        console.log('Row to map:', JSON.stringify(rows[0], null, 2));
        console.log('█'.repeat(120) + '\n');
        
        const instance = this._mapResultToInstance(rows[0]);
        
        console.log('\n' + '█'.repeat(120));
        console.log('█ [BASEMODEL] findOne - AFTER _mapResultToInstance');
        console.log('█'.repeat(120));
        console.log('Instance keys:', Object.keys(instance));
        console.log('Instance data:', {
          users_id: instance.users_id,
          email: instance.email,
          name: instance.name,
          role: instance.role,
          tenant_id: instance.tenant_id,
          active: instance.active
        });
        console.log('█'.repeat(120) + '\n');
        
        return instance;
      }
      
      return null;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this._handleDatabaseError(err, 'findOne', sql, values);
      return null; // Ensure function returns
    }
  }

  /**
   * Find all records matching the given conditions
   * 
   * @param {Object} options - Query options (where, include, order, limit, offset)
   * @returns {Promise<Object>} Object with rows array and pagination metadata
   * 
   * @example
   * // Simple query
   * const result = await Meter.findAll();
   * 
   * // With filtering
   * const result = await Meter.findAll({
   *   where: { status: 'active', type: 'electric' }
   * });
   * 
   * // With pagination and sorting
   * const result = await Meter.findAll({
   *   where: { status: 'active' },
   *   order: [['name', 'ASC']],
   *   limit: 10,
   *   offset: 0
   * });
   * 
   * // With relationships
   * const result = await Meter.findAll({
   *   include: ['device', 'location'],
   *   limit: 10
   * });
   */
  static async findAll(options = {}) {
    let sql = '';
    let values = [];
    
    try {
      // Get fields and validate configuration
      const fields = this._getFields();
      
      // Automatically apply tenant filtering if model has tenant_id field
      const hasTenantIdField = fields.some(f => f.name === 'tenant_id');
      if (hasTenantIdField) {
        // Get tenant_id from options or global context
        let tenantId = options.tenant_id || options.tenantId;
        
        // If not in options, try to get from global context (set by middleware)
        if (tenantId === undefined && global.currentTenantId) {
          tenantId = global.currentTenantId;
        }
        
        // Apply tenant filtering if tenant_id is available
        if (tenantId !== undefined && tenantId !== null) {
          options.where = options.where || {};
          options.where.tenant_id = tenantId;
          
          console.log('\n' + '█'.repeat(120));
          console.log('█ [BASEMODEL] TENANT FILTERING APPLIED');
          console.log('█'.repeat(120));
          console.log('Model:', this.name);
          console.log('Tenant ID:', tenantId);
          console.log('Where clause:', JSON.stringify(options.where));
          console.log('█'.repeat(120) + '\n');
        }
      }
      
      // Build SELECT query
      const queryOptions = {
        ...options,
        relationships: this.relationships
      };
      
      const queryResult = buildSelectSQL(this.tableName, fields, queryOptions);
      sql = queryResult.sql;
      values = queryResult.values;
      const relationshipMap = queryResult.relationshipMap;
      
      // Log query for debugging
      logQuery('findAll', this.name, sql, values);
      
      // Execute query
      const db = this._getDb();
      const result = await db.query(sql, values);
      
      // Map joined results to nested objects if relationships were included
      let rows = result.rows;
      if (relationshipMap && relationshipMap.length > 0) {
        rows = mapJoinedResults(rows, relationshipMap, this.primaryKey);
      }
      
      // Map results to model instances
      rows = rows.map(row => this._mapResultToInstance(row));
      
      // Calculate pagination metadata
      const limit = options.limit || null;
      const offset = options.offset || 0;
      
      // Get total count if pagination is used
      let total = rows.length;
      let totalPages = 1;
      let currentPage = 1;
      
      if (limit) {
        // Execute count query to get total records (pass tenant_id if available)
        const countResult = await this.count(options.where || {}, { tenant_id: options.tenant_id });
        total = countResult;
        totalPages = Math.ceil(total / limit);
        currentPage = Math.floor(offset / limit) + 1;
      }
      
      return {
        rows,
        pagination: {
          total,
          limit,
          offset,
          totalPages,
          currentPage,
          hasNextPage: limit ? (offset + limit) < total : false,
          hasPreviousPage: offset > 0
        }
      };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      // If SQL wasn't built yet, include the options in the error context
      const errorContext = {
        operation: 'findAll',
        model: this.name,
        options: options,
        sql: sql || 'SQL not built - error during query construction',
        values: values
      };
      console.error('findAll error context:', JSON.stringify(errorContext, null, 2));
      this._handleDatabaseError(err, 'findAll', sql, values);
      throw err; // Ensure function returns
    }
  }

  /**
   * Count records matching the given conditions
   * 
   * @param {Object} where - WHERE conditions
   * @returns {Promise<number>} Count of matching records
   * 
   * @example
   * const totalMeters = await Meter.count();
   * const activeMeters = await Meter.count({ status: 'active' });
   */
  static async count(where = {}, options = {}) {
    let sql = '';
    let values = [];
    
    try {
      // Automatically apply tenant filtering if model has tenant_id field
      const fields = this._getFields();
      const hasTenantIdField = fields.some(f => f.name === 'tenant_id');
      if (hasTenantIdField) {
        // Get tenant_id from options or global context
        let tenantId = options.tenant_id || options.tenantId;
        
        // If not in options, try to get from global context (set by middleware)
        if (tenantId === undefined && global.currentTenantId) {
          tenantId = global.currentTenantId;
        }
        
        // Apply tenant filtering if tenant_id is available
        if (tenantId !== undefined && tenantId !== null) {
          where = where || {};
          where.tenant_id = tenantId;
          
          console.log('\n' + '█'.repeat(120));
          console.log('█ [BASEMODEL] TENANT FILTERING APPLIED (count)');
          console.log('█'.repeat(120));
          console.log('Model:', this.name);
          console.log('Tenant ID:', tenantId);
          console.log('Where clause:', JSON.stringify(where));
          console.log('█'.repeat(120) + '\n');
        }
      }
      
      // Build WHERE clause
      let whereClause = '';
      
      if (where && Object.keys(where).length > 0) {
        const whereResult = buildWhereClause(where, this.tableName);
        whereClause = ` WHERE ${whereResult.clause}`;
        values = whereResult.values;
      }
      
      // Build COUNT query
      sql = `SELECT COUNT(*) as count FROM ${this.tableName}${whereClause}`;
      
      // Log query for debugging
      logQuery('count', this.name, sql, values);
      
      // Execute query
      const db = this._getDb();
      const result = await db.query(sql, values);
      
      return parseInt(result.rows[0].count, 10);
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this._handleDatabaseError(err, 'count', sql, values);
      return 0; // Ensure function returns
    }
  }

  /**
   * Check if any records exist matching the given conditions
   * 
   * @param {Object} where - WHERE conditions
   * @returns {Promise<boolean>} True if at least one record exists
   * 
   * @example
   * const exists = await Meter.exists({ meterid: 'M001' });
   */
  static async exists(where) {
    try {
      const count = await this.count(where);
      return count > 0;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      this._handleDatabaseError(err, 'exists', '', []);
      return false; // Ensure function returns
    }
  }

  // ============================================================================
  // Instance CRUD Methods
  // ============================================================================

  /**
   * Update the current instance in the database
   * Only updates fields that are provided in the data parameter
   * Automatically updates the updated_at timestamp
   * 
   * @param {Object} data - Fields to update
   * @returns {Promise<Object>} Updated model instance
   * @throws {ValidationError} If validation fails
   * @throws {NotFoundError} If primary key is not set
   * @throws {ModelError} If database error occurs
   * 
   * @example
   * const meter = await Meter.findById(5);
   * await meter.update({ name: 'Updated Name', status: 'inactive' });
   * console.log(meter.name); // 'Updated Name'
   */
  async update(data) {
    let sql = '';
    let values = [];
    
    try {
      // Get the constructor (class) of this instance
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      
      // Get fields and validate configuration
      const fields = ModelClass._getFields();
      
      // Get primary key value from current instance
      const primaryKey = ModelClass.primaryKey;
      const primaryKeyValue = this[primaryKey];
      
      if (!primaryKeyValue) {
        throw new NotFoundError(
          `Cannot update: primary key '${primaryKey}' is not set on this instance`,
          { model: ModelClass.name, primaryKey }
        );
      }
      
      // Validate field types before query execution
      validateFieldTypes(data, fields, ModelClass.name);
      
      // Build WHERE condition for primary key
      const where = { [primaryKey]: primaryKeyValue };
      
      // Build UPDATE query
      const queryResult = buildUpdateSQL(
        ModelClass.tableName,
        fields,
        data,
        where
      );
      sql = queryResult.sql;
      values = queryResult.values;
      
      // Log query for debugging
      logQuery('update', ModelClass.name, sql, values);
      
      // ALWAYS log SQL for debugging (even without DEBUG_SQL flag)
      console.log('\n' + '█'.repeat(100));
      console.log('█ SQL UPDATE STATEMENT');
      console.log('█'.repeat(100));
      console.log('Model:', ModelClass.name);
      console.log('SQL:', sql);
      console.log('Values:', JSON.stringify(values, null, 2));
      console.log('█'.repeat(100) + '\n');
      
      // Execute query
      const db = ModelClass._getDb();
      const result = await db.query(sql, values);
      
      console.log('\n' + '█'.repeat(100));
      console.log('█ SQL UPDATE RESULT');
      console.log('█'.repeat(100));
      console.log('Rows affected:', result.rowCount);
      console.log('Returned data:', JSON.stringify(result.rows, null, 2));
      console.log('█'.repeat(100) + '\n');
      
      // Update current instance properties with returned data
      if (result.rows && result.rows.length > 0) {
        const updatedData = result.rows[0];
        Object.keys(updatedData).forEach(key => {
          this[key] = updatedData[key];
        });
        return this;
      }
      
      throw new NotFoundError(
        `Failed to update record: no data returned for ${primaryKey}=${primaryKeyValue}`,
        { model: ModelClass.name, primaryKey, primaryKeyValue }
      );
    } catch (error) {
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      const err = error instanceof Error ? error : new Error(String(error));
      ModelClass._handleDatabaseError(err, 'update', sql, values);
      throw err; // Ensure function returns
    }
  }

  /**
   * Delete the current instance from the database
   * 
   * @returns {Promise<Object>} Deleted record data
   * @throws {NotFoundError} If primary key is not set
   * @throws {ForeignKeyError} If foreign key constraint prevents deletion
   * @throws {ModelError} If database error occurs
   * 
   * @example
   * const meter = await Meter.findById(5);
   * const deletedData = await meter.delete();
   * console.log(deletedData); // { id: 5, meterid: 'M001', ... }
   */
  async delete() {
    let sql = '';
    let values = [];
    
    try {
      // Get the constructor (class) of this instance
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      
      // Get fields and validate configuration
      const fields = ModelClass._getFields();
      
      // Get primary key value from current instance
      const primaryKey = ModelClass.primaryKey;
      const primaryKeyValue = this[primaryKey];
      
      if (!primaryKeyValue) {
        throw new NotFoundError(
          `Cannot delete: primary key '${primaryKey}' is not set on this instance`,
          { model: ModelClass.name, primaryKey }
        );
      }
      
      // Build WHERE condition for primary key
      const where = { [primaryKey]: primaryKeyValue };
      
      // Build DELETE query
      const queryResult = buildDeleteSQL(ModelClass.tableName, where, fields, true);
      sql = queryResult.sql;
      values = queryResult.values;
      
      // Log query for debugging
      logQuery('delete', ModelClass.name, sql, values);
      
      // Execute query
      const db = ModelClass._getDb();
      const result = await db.query(sql, values);
      
      // Return deleted record data
      if (result.rows && result.rows.length > 0) {
        return result.rows[0];
      }
      
      throw new NotFoundError(
        `Failed to delete record: no data returned for ${primaryKey}=${primaryKeyValue}`,
        { model: ModelClass.name, primaryKey, primaryKeyValue }
      );
    } catch (error) {
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      const err = error instanceof Error ? error : new Error(String(error));
      ModelClass._handleDatabaseError(err, 'delete', sql, values);
      throw err; // Ensure function returns
    }
  }

  /**
   * Save the current instance to the database
   * Creates a new record if primary key is not set, otherwise updates existing record
   * 
   * @returns {Promise<Object>} Saved model instance
   * @throws {ValidationError} If validation fails
   * @throws {ModelError} If database error occurs
   * 
   * @example
   * // Create new record
   * const meter = new Meter({ meterid: 'M001', name: 'Main Meter' });
   * await meter.save();
   * console.log(meter.meter_id); // 5 (assigned by database)
   * 
   * // Update existing record
   * meter.name = 'Updated Name';
   * await meter.save();
   */
  async save() {
    try {
      // Get the constructor (class) of this instance
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      
      // Get primary key value from current instance
      const primaryKey = ModelClass.primaryKey;
      const primaryKeyValue = this[primaryKey];
      
      if (primaryKeyValue) {
        // Primary key exists - update existing record
        // Get all instance properties as data
        const data = {};
        const fields = ModelClass._getFields();
        fields.forEach((/** @type {any} */ field) => {
          if (this[field.name] !== undefined && field.name !== primaryKey) {
            data[field.name] = this[field.name];
          }
        });
        
        return await this.update(data);
      } else {
        // Primary key doesn't exist - create new record
        // Get all instance properties as data
        const data = {};
        const fields = ModelClass._getFields();
        fields.forEach((/** @type {any} */ field) => {
          if (this[field.name] !== undefined) {
            data[field.name] = this[field.name];
          }
        });
        
        // Create new record
        const created = await ModelClass.create(data);
        
        // Update current instance with created data
        Object.keys(created).forEach(key => {
          this[key] = created[key];
        });
        
        return this;
      }
    } catch (error) {
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      const err = error instanceof Error ? error : new Error(String(error));
      ModelClass._handleDatabaseError(err, 'save', '', []);
      throw err; // Ensure function returns
    }
  }

  /**
   * Reload the current instance from the database
   * Refreshes all properties with current database values
   * 
   * @returns {Promise<Object>} Reloaded model instance
   * @throws {NotFoundError} If primary key is not set or record not found
   * @throws {ModelError} If database error occurs
   * 
   * @example
   * const meter = await Meter.findById(5);
   * // ... some time passes, database may have changed ...
   * await meter.reload();
   * console.log(meter.name); // Current value from database
   */
  async reload() {
    try {
      // Get the constructor (class) of this instance
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      
      // Get primary key value from current instance
      const primaryKey = ModelClass.primaryKey;
      const primaryKeyValue = this[primaryKey];
      
      if (!primaryKeyValue) {
        throw new NotFoundError(
          `Cannot reload: primary key '${primaryKey}' is not set on this instance`,
          { model: ModelClass.name, primaryKey }
        );
      }
      
      // Fetch current data from database
      const reloaded = await ModelClass.findById(primaryKeyValue);
      
      if (!reloaded) {
        throw new NotFoundError(
          `Cannot reload: record with ${primaryKey}=${primaryKeyValue} not found`,
          { model: ModelClass.name, primaryKey, primaryKeyValue }
        );
      }
      
      // Update current instance properties with reloaded data
      Object.keys(reloaded).forEach(key => {
        this[key] = reloaded[key];
      });
      
      return this;
    } catch (error) {
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      const err = error instanceof Error ? error : new Error(String(error));
      ModelClass._handleDatabaseError(err, 'reload', '', []);
      throw err; // Ensure function returns
    }
  }

  // ============================================================================
  // Relationship Loading Methods
  // ============================================================================

  /**
   * Load a relationship for the current instance
   * Supports BELONGS_TO, HAS_MANY, HAS_ONE, and MANY_TO_MANY relationships
   * 
   * @param {string} relationshipName - Name of the relationship to load
   * @param {Object} options - Loading options
   * @param {Array<string>} [options.select] - Fields to select from related model
   * @param {Object} [options.where] - Additional WHERE conditions
   * @param {Array} [options.order] - Order by clauses
   * @param {number} [options.limit] - Limit number of results (for HAS_MANY)
   * @param {Set<string>} [options._loadedPath] - Internal: Track loaded relationships to prevent cycles
   * @returns {Promise<Object|Array|null>} Related data (single object for BELONGS_TO/HAS_ONE, array for HAS_MANY)
   * @throws {ConfigurationError} If relationship is not defined
   * @throws {ModelError} If database error occurs
   * 
   * @example
   * // Load a BELONGS_TO relationship
   * const meter = await Meter.findById(5);
   * const device = await meter.loadRelationship('device');
   * console.log(device.manufacturer);
   * 
   * @example
   * // Load a HAS_MANY relationship with options
   * const location = await Location.findById(10);
   * const meters = await location.loadRelationship('meters', {
   *   select: ['id', 'name', 'status'],
   *   where: { status: 'active' },
   *   order: [['name', 'ASC']],
   *   limit: 10
   * });
   */
  async loadRelationship(relationshipName, options = {}) {
    try {
      // Get the constructor (class) of this instance
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      
      // Get relationship definition
      const relationships = ModelClass.relationships;
      const relationship = relationships[relationshipName];
      
      if (!relationship) {
        throw new ConfigurationError(
          `Relationship '${relationshipName}' is not defined in ${ModelClass.name} model`,
          { model: ModelClass.name, relationshipName, availableRelationships: Object.keys(relationships) }
        );
      }
      
      // Initialize cycle detection if not provided
      const loadedPath = options._loadedPath || new Set();
      const currentPath = `${ModelClass.name}.${relationshipName}`;
      
      // Check for circular dependency
      if (loadedPath.has(currentPath)) {
        console.warn(`Circular dependency detected: ${currentPath} already loaded in path: ${Array.from(loadedPath).join(' -> ')}`);
        return null;
      }
      
      // Add current path to loaded set
      const newLoadedPath = new Set(loadedPath);
      newLoadedPath.add(currentPath);
      
      // Get the related model class
      const RelatedModel = this._getRelatedModel(relationship.model);
      
      // Load relationship based on type
      switch (relationship.type) {
        case 'belongsTo':
          return await this._loadBelongsTo(relationship, RelatedModel, options, newLoadedPath);
        
        case 'hasMany':
          return await this._loadHasMany(relationship, RelatedModel, options, newLoadedPath);
        
        case 'hasOne':
          return await this._loadHasOne(relationship, RelatedModel, options, newLoadedPath);
        
        case 'manyToMany':
          return await this._loadManyToMany(relationship, RelatedModel, options, newLoadedPath);
        
        default:
          throw new ConfigurationError(
            `Unknown relationship type '${relationship.type}' for relationship '${relationshipName}'`,
            { model: ModelClass.name, relationshipName, relationshipType: relationship.type }
          );
      }
    } catch (error) {
      const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
      const err = error instanceof Error ? error : new Error(String(error));
      ModelClass._handleDatabaseError(err, 'loadRelationship', '', []);
      throw err;
    }
  }

  /**
   * Get related model class by name
   * 
   * @param {string} modelName - Name of the model class
   * @returns {typeof BaseModel} Model class
   * @throws {ConfigurationError} If model cannot be found
   * @private
   */
  _getRelatedModel(modelName) {
    try {
      // Try to require the model from the standard location
      // This assumes models are in client/backend/src/models/
      const modelPath = `../../../../client/api/src/models/${modelName}WithSchema`;
      return require(modelPath);
    } catch (error) {
      // Try without "WithSchema" suffix
      try {
        const modelPath = `../../../../client/api/src/models/${modelName}`;
        return require(modelPath);
      } catch (error2) {
        const errorMessage = error2 instanceof Error ? error2.message : String(error2);
        throw new ConfigurationError(
          `Cannot load related model '${modelName}'. Make sure the model file exists.`,
          { modelName, error: errorMessage }
        );
      }
    }
  }

  /**
   * Load a BELONGS_TO relationship
   * Example: Meter belongs to Device (meter.device_id -> device.id)
   * 
   * @param {Object} relationship - Relationship definition
   * @param {typeof BaseModel} RelatedModel - Related model class
   * @param {Object} options - Loading options
   * @param {Set<string>} loadedPath - Loaded relationship path for cycle detection
   * @returns {Promise<Object|null>} Related instance or null
   * @private
   */
  async _loadBelongsTo(relationship, RelatedModel, options, loadedPath) {
    const foreignKeyValue = this[relationship.foreignKey];
    
    if (!foreignKeyValue) {
      return null;
    }
    
    // Build query options
    const queryOptions = {
      where: { [relationship.targetKey]: foreignKeyValue },
      ...(options.where && { where: { ...options.where, [relationship.targetKey]: foreignKeyValue } }),
    };
    
    // Apply select fields if specified
    if (options.select || relationship.select) {
      queryOptions.select = options.select || relationship.select;
    }
    
    // Load the related record
    const related = await RelatedModel.findOne(queryOptions.where, queryOptions);
    
    // Store on instance
    const alias = relationship.as || relationship.model.toLowerCase();
    this[alias] = related;
    
    return related;
  }

  /**
   * Load a HAS_MANY relationship
   * Example: Location has many Meters (location.id <- meter.location_id)
   * 
   * @param {Object} relationship - Relationship definition
   * @param {typeof BaseModel} RelatedModel - Related model class
   * @param {Object} options - Loading options
   * @param {Set<string>} loadedPath - Loaded relationship path for cycle detection
   * @returns {Promise<Array>} Array of related instances
   * @private
   */
  async _loadHasMany(relationship, RelatedModel, options, loadedPath) {
    const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
    const primaryKeyValue = this[ModelClass.primaryKey];
    
    if (!primaryKeyValue) {
      return [];
    }
    
    // Build query options
    const queryOptions = {
      where: { [relationship.foreignKey]: primaryKeyValue },
      ...(options.where && { where: { ...options.where, [relationship.foreignKey]: primaryKeyValue } }),
    };
    
    // Apply select fields if specified
    if (options.select || relationship.select) {
      queryOptions.select = options.select || relationship.select;
    }
    
    // Apply order if specified
    if (options.order) {
      queryOptions.order = options.order;
    }
    
    // Apply limit if specified
    if (options.limit) {
      queryOptions.limit = options.limit;
    }
    
    // Load the related records
    const result = await RelatedModel.findAll(queryOptions);
    const related = result.rows || [];
    
    // Store on instance
    const alias = relationship.as || `${relationship.model.toLowerCase()}s`;
    this[alias] = related;
    
    return related;
  }

  /**
   * Load a HAS_ONE relationship
   * Example: User has one Profile (user.id <- profile.user_id)
   * 
   * @param {Object} relationship - Relationship definition
   * @param {typeof BaseModel} RelatedModel - Related model class
   * @param {Object} options - Loading options
   * @param {Set<string>} loadedPath - Loaded relationship path for cycle detection
   * @returns {Promise<Object|null>} Related instance or null
   * @private
   */
  async _loadHasOne(relationship, RelatedModel, options, loadedPath) {
    const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
    const primaryKeyValue = this[ModelClass.primaryKey];
    
    if (!primaryKeyValue) {
      return null;
    }
    
    // Build query options
    const queryOptions = {
      where: { [relationship.foreignKey]: primaryKeyValue },
      ...(options.where && { where: { ...options.where, [relationship.foreignKey]: primaryKeyValue } }),
    };
    
    // Apply select fields if specified
    if (options.select || relationship.select) {
      queryOptions.select = options.select || relationship.select;
    }
    
    // Load the related record
    const related = await RelatedModel.findOne(queryOptions.where, queryOptions);
    
    // Store on instance
    const alias = relationship.as || relationship.model.toLowerCase();
    this[alias] = related;
    
    return related;
  }

  /**
   * Load a MANY_TO_MANY relationship
   * Example: Student has many Courses through Enrollments
   * 
   * @param {Object} relationship - Relationship definition
   * @param {typeof BaseModel} RelatedModel - Related model class
   * @param {Object} options - Loading options
   * @param {Set<string>} loadedPath - Loaded relationship path for cycle detection
   * @returns {Promise<Array>} Array of related instances
   * @private
   */
  async _loadManyToMany(relationship, RelatedModel, options, loadedPath) {
    const ModelClass = /** @type {typeof BaseModel} */ (this.constructor);
    const primaryKeyValue = this[ModelClass.primaryKey];
    
    if (!primaryKeyValue || !relationship.through) {
      return [];
    }
    
    // Build query with JOIN through junction table
    const db = ModelClass._getDb();
    const junctionTable = relationship.through;
    const relatedTable = RelatedModel.tableName;
    
    // Build SELECT clause
    let selectClause = `${relatedTable}.*`;
    if (options.select || relationship.select) {
      const fields = options.select || relationship.select;
      selectClause = fields.map(f => `${relatedTable}.${f}`).join(', ');
    }
    
    // Build WHERE clause
    let whereClause = `${junctionTable}.${relationship.foreignKey} = $1`;
    const values = [primaryKeyValue];
    
    if (options.where) {
      let paramIndex = 2;
      Object.entries(options.where).forEach(([key, value]) => {
        whereClause += ` AND ${relatedTable}.${key} = $${paramIndex}`;
        values.push(value);
        paramIndex++;
      });
    }
    
    // Build ORDER clause
    let orderClause = '';
    if (options.order) {
      const orderParts = options.order.map(([field, direction]) => `${relatedTable}.${field} ${direction}`);
      orderClause = ` ORDER BY ${orderParts.join(', ')}`;
    }
    
    // Build LIMIT clause
    let limitClause = '';
    if (options.limit) {
      limitClause = ` LIMIT ${options.limit}`;
    }
    
    // Execute query
    const sql = `
      SELECT ${selectClause}
      FROM ${relatedTable}
      INNER JOIN ${junctionTable} ON ${relatedTable}.${relationship.targetKey} = ${junctionTable}.${relationship.targetKey}
      WHERE ${whereClause}
      ${orderClause}
      ${limitClause}
    `;
    
    const result = await db.query(sql, values);
    const related = result.rows.map(row => RelatedModel._mapResultToInstance(row));
    
    // Store on instance
    const alias = relationship.as || `${relationship.model.toLowerCase()}s`;
    this[alias] = related;
    
    return related;
  }

  /**
   * Load multiple relationships at once
   * 
   * @param {Array<string>} relationshipNames - Array of relationship names to load
   * @param {Object} options - Loading options (applied to all relationships)
   * @returns {Promise<Object>} Object with relationship names as keys and loaded data as values
   * 
   * @example
   * const meter = await Meter.findById(5);
   * const relationships = await meter.loadRelationships(['device', 'location']);
   * console.log(relationships.device.manufacturer);
   * console.log(relationships.location.name);
   */
  async loadRelationships(relationshipNames, options = {}) {
    const results = {};
    
    for (const relationshipName of relationshipNames) {
      results[relationshipName] = await this.loadRelationship(relationshipName, options);
    }
    
    return results;
  }

  /**
   * Batch load a relationship for multiple instances
   * This is more efficient than loading relationships one by one
   * 
   * @param {Array<BaseModel>} instances - Array of model instances
   * @param {string} relationshipName - Name of the relationship to load
   * @param {Object} options - Query options
   * @returns {Promise<Map>} Map of instance ID to related data
   * 
   * @example
   * const meters = await Meter.findAll({ where: { status: 'active' } });
   * const devicesMap = await Meter.batchLoadRelationship(meters, 'device');
   * meters.forEach(meter => {
   *   meter.device = devicesMap.get(meter.meter_id);
   * });
   */
  static async batchLoadRelationship(instances, relationshipName, options = {}) {
    if (!instances || instances.length === 0) {
      return new Map();
    }

    const ModelClass = this;
    const relationships = ModelClass.relationships;
    
    if (!relationships || !relationships[relationshipName]) {
      throw new Error(`Relationship '${relationshipName}' not defined in ${ModelClass.name}`);
    }

    const relationship = relationships[relationshipName];
    const RelatedModel = require(`../../../client/api/src/models/${relationship.model}WithSchema`);
    
    const results = new Map();

    try {
      if (relationship.type === 'belongsTo') {
        // Collect all foreign key values
        const foreignKeyValues = instances
          .map(instance => instance[relationship.foreignKey])
          .filter(val => val != null);

        if (foreignKeyValues.length === 0) {
          return results;
        }

        // Load all related records in one query
        const relatedRecords = await RelatedModel.findAll({
          where: {
            [RelatedModel.primaryKey]: foreignKeyValues
          },
          select: options.select
        });

        // Create a map of related records by their primary key
        const relatedMap = new Map();
        relatedRecords.forEach(record => {
          relatedMap.set(record[RelatedModel.primaryKey], record);
        });

        // Map related records back to instances
        instances.forEach(instance => {
          const foreignKeyValue = instance[relationship.foreignKey];
          if (foreignKeyValue != null) {
            results.set(instance[ModelClass.primaryKey], relatedMap.get(foreignKeyValue));
          }
        });

      } else if (relationship.type === 'hasMany') {
        // Collect all primary key values
        const primaryKeyValues = instances.map(instance => instance[ModelClass.primaryKey]);

        // Load all related records in one query
        const relatedRecords = await RelatedModel.findAll({
          where: {
            [relationship.foreignKey]: primaryKeyValues
          },
          select: options.select
        });

        // Group related records by foreign key
        const groupedRecords = new Map();
        relatedRecords.forEach(record => {
          const foreignKeyValue = record[relationship.foreignKey];
          if (!groupedRecords.has(foreignKeyValue)) {
            groupedRecords.set(foreignKeyValue, []);
          }
          groupedRecords.get(foreignKeyValue).push(record);
        });

        // Map grouped records back to instances
        instances.forEach(instance => {
          const primaryKeyValue = instance[ModelClass.primaryKey];
          results.set(primaryKeyValue, groupedRecords.get(primaryKeyValue) || []);
        });
      }

      return results;
    } catch (error) {
      console.error(`Error batch loading relationship '${relationshipName}':`, error);
      throw error;
    }
  }

  /**
   * Load relationships for multiple instances efficiently
   * Uses batch loading to minimize database queries
   * 
   * @param {Array<BaseModel>} instances - Array of model instances
   * @param {Array<string>} relationshipNames - Names of relationships to load
   * @param {Object} options - Query options
   * @returns {Promise<void>} Modifies instances in place
   * 
   * @example
   * const meters = await Meter.findAll({ where: { status: 'active' } });
   * await Meter.batchLoadRelationships(meters, ['device', 'location']);
   * meters.forEach(meter => {
   *   console.log(meter.device.manufacturer);
   *   console.log(meter.location.name);
   * });
   */
  static async batchLoadRelationships(instances, relationshipNames, options = {}) {
    if (!instances || instances.length === 0) {
      return;
    }

    for (const relationshipName of relationshipNames) {
      const relatedMap = await this.batchLoadRelationship(instances, relationshipName, options);
      
      // Assign related data to instances
      instances.forEach(instance => {
        const primaryKeyValue = instance[this.primaryKey];
        instance[relationshipName] = relatedMap.get(primaryKeyValue);
      });
    }
  }
}

module.exports = BaseModel;
