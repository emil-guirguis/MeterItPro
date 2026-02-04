/**
 * Location Model with Schema Definition
 * 
 * Auto-generated from database schema
 * Single source of truth for Location entity
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, tab, section, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Location extends BaseModel {
    constructor(data = {}) {
        super(data);

        // Auto-initialize all fields from schema
        Location.schema.initializeFromData(this, data);
    }

    /**
     * @override
     */
    static get tableName() {
        return 'location';
    }

    /**
     * @override
     */
    static get primaryKey() {
        return 'location_id';
    }

    /**
     * @override
     */
    static get relationships() {
        return {
            device: {
                type: 'belongsTo',
                model: 'Contact',
                foreignKey: 'contact_id',
                targetKey: 'id'
            },
        };
    }
    /**
     * @override
     */
    static get schema() {
        return defineSchema({
            entityName: 'Location',
            tableName: 'location',
            description: 'Location entity',

            customListColumns: {},

            // NEW: Hierarchical tab structure with embedded field definitions
            formTabs: [
                tab({
                    name: 'Location',
                    order: 1,
                    sections: [
                        section({
                            name: 'Basic Information',
                            order: 1,
                            fields: [
                                field({
                                    name: 'name',
                                    order: 1,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: true,
                                    label: 'Name',
                                    dbField: 'name',
                                    maxLength: 200,
                                    placeholder: 'Location',
                                    filertable: ['main'],
                                    showOn: ['list', 'form'],
                                }),
                                field({
                                    name: 'type',
                                    order: 2,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: true,
                                    label: 'Type',
                                    dbField: 'type',
                                    maxLength: 20,
                                    enumValues: ['Warehouse', 'Apartment', 'Ofice', 'Retail', 'Hotel', 'Building', 'Other'],
                                    placeholder: 'Warehouse',
                                    showOn: ['list', 'form'],
                                }),
                            ],
                        }),
                        section({
                            name: 'Status',
                            order: 2,
                            fields: [
                                field({
                                    name: 'active',
                                    order: 2,
                                    type: FieldTypes.BOOLEAN,
                                    default: true,
                                    required: false,
                                    label: 'Active',
                                    dbField: 'active',
                                    showOn: ['list', 'form'],
                                }),
                            ],
                        }),
                    ],
                }),
                tab({
                    name: 'Address',
                    order: 2,
                    sections: [
                        section({
                            name: 'Address Information',
                            order: 1,
                            fields: [
                                field({
                                    name: 'street',
                                    order: 1,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: true,
                                    label: 'Street',
                                    dbField: 'street',
                                    maxLength: 200,
                                    placeholder: '1234 Street',
                                    showOn: ['form'],
                                }),
                                field({
                                    name: 'street2',
                                    order: 2,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: false,
                                    label: 'Street2',
                                    dbField: 'street2',
                                    maxLength: 100,
                                    placeholder: 'Unit A',
                                    showOn: ['form'],
                                }),
                                field({
                                    name: 'city',
                                    order: 3,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: true,
                                    label: 'City',
                                    dbField: 'city',
                                    maxLength: 100,
                                    placeholder: 'City',
                                    showOn: ['form'],
                                }),
                                field({
                                    name: 'state',
                                    order: 4,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: true,
                                    label: 'State',
                                    dbField: 'state',
                                    maxLength: 50,
                                    placeholder: 'State',
                                    showOn: ['form'],
                                }),
                                field({
                                    name: 'zip',
                                    order: 5,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: true,
                                    label: 'Zip',
                                    dbField: 'zip',
                                    placeholder: 'Zip',
                                    showOn: ['form'],
                                    maxLength: 20,
                                }),
                                field({
                                    name: 'country',
                                    order: 6,
                                    type: FieldTypes.COUNTRY,
                                    default: '',
                                    required: true,
                                    label: 'Country',
                                    dbField: 'country',
                                    maxLength: 100,
                                    placeholder: 'USA',
                                    showOn: ['form'],
                                }),
                            ],
                        }),
                    ],
                }),
                tab({
                    name: 'Additional Info',
                    order: 3,
                    sections: [
                        section({
                            name: 'Notes',
                            order: 1,
                            fields: [
                                field({
                                    name: 'notes',
                                    order: 1,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: false,
                                    label: 'Notes',
                                    dbField: 'notes',
                                    showOn: ['form'],
                                }),
                            ],
                        }),
                        section({
                            name: 'Audit',
                            order: 3,
                            fields: [
                                field({
                                    name: 'created_at',
                                    order: 1,
                                    type: FieldTypes.DATE,
                                    default: null,
                                    readOnly: true,
                                    label: 'Created At',
                                    dbField: 'created_at',
                                    showOn: ['form'],
                                }),
                                field({
                                    name: 'updated_at',
                                    order: 2,
                                    type: FieldTypes.DATE,
                                    default: null,
                                    readOnly: true,
                                    label: 'Updated At',
                                    dbField: 'updated_at',
                                    showOn: ['form'],
                                }),
                            ],
                        }),
                    ],
                }),
            ],

            // Entity fields - read-only, system-managed
            entityFields: {
                location_id: field({
                    name: 'location_id',
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: true,
                    label: 'Id',
                    dbField: 'location_id',
                }),
                tenant_id: field({
                    name: 'tenant_id',
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: false,
                    label: 'Tenant ID',
                    dbField: 'tenant_id',
                })
            },

            validation: {},
        });
    }
}

module.exports = Location;
