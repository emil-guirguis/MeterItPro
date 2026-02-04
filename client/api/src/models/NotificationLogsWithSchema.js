// /**
//  * NotificationLogs Model with Schema Definition
//  * 
//  * Auto-generated from database schema
//  * Single source of truth for NotificationLogs entity
//  */

// const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
// const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

// class NotificationLogs extends BaseModel {
//     constructor(data = {}) {
//         super(data);
        
//         // Auto-initialize all fields from schema
//         NotificationLogs.schema.initializeFromData(this, data);
//     }
    
//     /**
//      * @override
//      */
//     static get tableName() {
//         return 'notification_logs';
//     }
    
//     /**
//      * @override
//      */
//     static get primaryKey() {
//         return 'id';
//     }

//     // ===== SCHEMA DEFINITION (Single Source of Truth) =====
    
//     /**
//      * @override
//      */
//     static get schema() {
//         return defineSchema({
//             entityName: 'NotificationLogs',
//             tableName: 'notification_logs',
//             description: 'NotificationLogs entity',
            
//             // Form fields - user can edit these
//             formFields: {
//                 type: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: true,
//                     label: 'Type',
//                     dbField: 'type',
//                     maxLength: 50,
//                 }),
//                 meterId: field({
//                     type: FieldTypes.NUMBER,
//                     default: 0,
//                     required: false,
//                     label: 'Meter Id',
//                     dbField: 'meter_id',
//                 }),
//                 buildingId: field({
//                     type: FieldTypes.NUMBER,
//                     default: 0,
//                     required: false,
//                     label: 'Building Id',
//                     dbField: 'building_id',
//                 }),
//                 templateId: field({
//                     type: FieldTypes.NUMBER,
//                     default: 0,
//                     required: false,
//                     label: 'Template Id',
//                     dbField: 'template_id',
//                 }),
//                 recipients: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: false,
//                     label: 'Recipients',
//                     dbField: 'recipients',
//                 }),
//                 status: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: false,
//                     label: 'Status',
//                     dbField: 'status',
//                     maxLength: 50,
//                 }),
//                 errorMessage: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: false,
//                     label: 'Error Message',
//                     dbField: 'error_message',
//                 }),
//                 retryCount: field({
//                     type: FieldTypes.NUMBER,
//                     default: 0,
//                     required: false,
//                     label: 'Retry Count',
//                     dbField: 'retry_count',
//                 }),
//                 scheduledAt: field({
//                     type: FieldTypes.DATE,
//                     default: '',
//                     required: false,
//                     label: 'Scheduled At',
//                     dbField: 'scheduled_at',
//                 }),
//                 sentAt: field({
//                     type: FieldTypes.DATE,
//                     default: '',
//                     required: false,
//                     label: 'Sent At',
//                     dbField: 'sent_at',
//                 })
//             },
            
//             // Entity fields - read-only, system-managed
//             entityFields: {
//                 id: field({
//                     name: 'id',
//                     type: FieldTypes.NUMBER,
//                     default: null,
//                     readOnly: true,
//                     label: 'Id',
//                     dbField: 'id',
//                 }),
//                 createdAt: field({
//                     type: FieldTypes.DATE,
//                     default: null,
//                     readOnly: true,
//                     label: 'Created At',
//                     dbField: 'created_at',
//                 }),
//                 updatedAt: field({
//                     type: FieldTypes.DATE,
//                     default: null,
//                     readOnly: true,
//                     label: 'Updated At',
//                     dbField: 'updated_at',
//                 }),
//                 tenantId: field({
//                     type: FieldTypes.NUMBER,
//                     default: null,
//                     readOnly: true,
//                     label: 'Tenant ID',
//                     dbField: 'tenant_id',
//                 })
//             },
            
//             // Relationships
//             relationships: {
//                 meter: relationship({
//                     type: RelationshipTypes.BELONGS_TO,
//                     model: 'Meter',
//                     foreignKey: 'meter_id',
//                     autoLoad: false,
//                 }),
//                 template: relationship({
//                     type: RelationshipTypes.BELONGS_TO,
//                     model: 'EmailTemplates',
//                     foreignKey: 'template_id',
//                     autoLoad: false,
//                 }),
//             },
            
//             validation: {},
//         });
//     }
// }

// module.exports = NotificationLogs;
