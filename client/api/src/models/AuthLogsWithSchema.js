/**
 * AuthLogs Model with Schema Definition
 * 
 * Auto-generated from database schema
 * Single source of truth for AuthLogs entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class AuthLogs extends BaseModel {
    constructor(data = {}) {
        super(data);
        
        // Auto-initialize all fields from schema
        AuthLogs.schema.initializeFromData(this, data);
    }
    
    /**
     * @override
     */
    static get tableName() {
        return 'auth_logs';
    }
    
    /**
     * @override
     */
    static get primaryKey() {
        return 'auth_logs_id';
    }

    // ===== SCHEMA DEFINITION (Single Source of Truth) =====
    
    /**
     * @override
     */
    static get schema() {
        return defineSchema({
            entityName: 'AuthLogs',
            tableName: 'auth_logs',
            description: 'Authentication logs entity for tracking login and auth events',
            
            customListColumns: {},
            
            // Form fields - user can edit these
            formFields: {
                userId: field({
                    type: FieldTypes.NUMBER,
                    default: 0,
                    required: true,
                    label: 'User ID',
                    dbField: 'user_id',
                }),
                eventType: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Event Type',
                    dbField: 'event_type',
                    maxLength: 50,
                }),
                status: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: true,
                    label: 'Status',
                    dbField: 'status',
                    maxLength: 20,
                }),
                ipAddress: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'IP Address',
                    dbField: 'ip_address',
                }),
                userAgent: field({
                    type: FieldTypes.STRING,
                    default: '',
                    required: false,
                    label: 'User Agent',
                    dbField: 'user_agent',
                }),
                details: field({
                    type: FieldTypes.JSON,
                    default: {},
                    required: false,
                    label: 'Details',
                    dbField: 'details',
                }),
            },
            
            // Entity fields - read-only, system-managed
            entityFields: {
                authLogsId: field({
                    name: 'auth_logs_id',
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: true,
                    label: 'Auth Logs ID',
                    dbField: 'auth_logs_id',
                }),
                createdAt: field({
                    type: FieldTypes.DATE,
                    default: null,
                    readOnly: true,
                    label: 'Created At',
                    dbField: 'created_at',
                }),
            },
            
            // Relationships
            relationships: {
                user: relationship({
                    type: RelationshipTypes.BELONGS_TO,
                    model: 'User',
                    foreignKey: 'user_id',
                    autoLoad: false,
                }),
            },
            
            validation: {},
        });
    }
}

module.exports = AuthLogs;
