// /**
//  * EmailLogs Model with Schema Definition
//  * 
//  * Auto-generated from database schema
//  * Single source of truth for EmailLogs entity
//  */

// const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
// const { defineSchema, field, relationship, FieldTypes, RelationshipTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

// class EmailLogs extends BaseModel {
//     constructor(data = {}) {
//         super(data);
        
//         // Auto-initialize all fields from schema
//         EmailLogs.schema.initializeFromData(this, data);
//     }
    
//     /**
//      * @override
//      */
//     static get tableName() {
//         return 'email_logs';
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
//             entityName: 'EmailLogs',
//             tableName: 'email_logs',
//             description: 'EmailLogs entity',
            
//             // Form fields - user can edit these
//             formFields: {
//                 messageId: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: false,
//                     label: 'Message Id',
//                     dbField: 'message_id',
//                     maxLength: 255,
//                 }),
//                 recipient: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: true,
//                     label: 'Recipient',
//                     dbField: 'recipient',
//                 }),
//                 subject: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: false,
//                     label: 'Subject',
//                     dbField: 'subject',
//                     maxLength: 500,
//                 }),
//                 status: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: false,
//                     label: 'Status',
//                     dbField: 'status',
//                     maxLength: 50,
//                 }),
//                 response: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: false,
//                     label: 'Response',
//                     dbField: 'response',
//                 }),
//                 error: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: false,
//                     label: 'Error',
//                     dbField: 'error',
//                 }),
//                 templateId: field({
//                     type: FieldTypes.NUMBER,
//                     default: 0,
//                     required: false,
//                     label: 'Template Id',
//                     dbField: 'template_id',
//                 }),
//                 trackingId: field({
//                     type: FieldTypes.STRING,
//                     default: '',
//                     required: false,
//                     label: 'Tracking Id',
//                     dbField: 'tracking_id',
//                     maxLength: 100,
//                 }),
//                 openedAt: field({
//                     type: FieldTypes.DATE,
//                     default: '',
//                     required: false,
//                     label: 'Opened At',
//                     dbField: 'opened_at',
//                 }),
//                 clickedAt: field({
//                     type: FieldTypes.DATE,
//                     default: '',
//                     required: false,
//                     label: 'Clicked At',
//                     dbField: 'clicked_at',
//                 })
//             },
            
//             // Entity fields - read-only, system-managed
//             entityFields: {
//                 id: field({
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

// module.exports = EmailLogs;
