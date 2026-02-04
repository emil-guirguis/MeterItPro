/**
 * Contact Model with Schema Definition
 * 
 * Single source of truth for Contact entity schema.
 * Frontend will fetch this schema via API instead of duplicating it.
 */

const BaseModel = require('../../../../framework/backend/api/base/BaseModel');
const { defineSchema, field, tab, section, FieldTypes } = require('../../../../framework/backend/api/base/SchemaDefinition');

class Contact extends BaseModel {
    constructor(data = {}) {
        super(data);

        // Auto-initialize all fields from schema
        // This eliminates the need to manually list every field!
        Contact.schema.initializeFromData(this, data);
    }

    /**
     * Getter to provide contact_id as an alias for id
     * This ensures the update method can find the primary key value
     */
    get contact_id() {
        return this.id;
    }

    /**
     * Setter to allow setting contact_id
     */
    set contact_id(value) {
        this.id = value;
    }

    /**
     * @override
     */
    static get tableName() {
        return 'contact';
    }

    /**
     * @override
     */
    static get primaryKey() {
        return 'contact_id';
    }

    /**
     * @override
     */
    static get schema() {
        const schemaDefinition = {
            entityName: 'Contact',
            tableName: 'contact',
            description: 'Contact entity for customers, vendors, and other business contacts',
            formMaxWidth: '400px',

            customListColumns: {
                //                 createTwoLineColumn,
                //   createPhoneColumn,
                //   createStatusColumn,
                //   createLocationColumn,
                //   createBadgeListColumn,

            },

            // NEW: Hierarchical tab structure with embedded field definitions
            formTabs: [
                tab({
                    name: 'Contact',
                    order: 1,
                    sections: [
                        section({
                            name: 'Information',
                            order: 1,
                            flex: 1,  // Takes remaining space
                            fields: [
                                field({
                                    name: 'name',
                                    order: 1,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: true,
                                    label: 'Name',
                                    dbField: 'name',
                                    minLength: 2,
                                    maxLength: 100,
                                    placeholder: 'John Doe',
                                    filertable: ['main'],
                                    showOn: ['list', 'form'],
                                }),
                                field({
                                    name: 'company',
                                    order: 2,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: false,
                                    label: 'Company',
                                    dbField: 'company',
                                    maxLength: 200,
                                    placeholder: 'Acme Corporation',
                                    filertable: ['true'],
                                    showOn: ['list', 'form'],
                                }),
                                field({
                                    name: 'role',
                                    order: 3,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: false,
                                    label: 'Role',
                                    dbField: 'role',
                                    maxLength: 100,
                                    enumValues: ['Vendor', 'Customer', 'Contractor', 'Technician', 'Client', 'Sales Manager'],
                                    placeholder: 'Vendor',
                                    filertable: ['true'],
                                    showOn: ['list', 'form'],
                                }),
                                field({
                                    name: 'email',
                                    order: 4,
                                    type: FieldTypes.EMAIL,
                                    default: '',
                                    required: true,
                                    label: 'Email',
                                    dbField: 'email',
                                    maxLength: 254,
                                    pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
                                    placeholder: 'john@example.com',
                                    showOn: ['form'],
                                }),
                                field({
                                    name: 'phone',
                                    order: 5,
                                    type: FieldTypes.PHONE,
                                    default: '',
                                    required: false,
                                    label: 'Phone',
                                    dbField: 'phone',
                                    maxLength: 50,
                                    placeholder: '(555) 123-4567',
                                    showOn: ['list', 'form'],
                                }),
                            ],
                        }),
                        section({
                            name: 'Status',
                            order: 2,
                            maxWidth: '100px',
                            flexGrow: 0,
                            flexShrink: 0,
                            fields: [
                                field({
                                    name: 'active',
                                    order: 1,
                                    type: FieldTypes.BOOLEAN,
                                    default: true,
                                    readOnly: false,
                                    label: 'Active',
                                    dbField: 'active',
                                    description: 'Whether the contact is active',
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
                                    required: false,
                                    label: 'Street Address',
                                    dbField: 'street',
                                    maxLength: 200,
                                    placeholder: '123 Main St',
                                    showOn: ['form'],
                                }),
                                field({
                                    name: 'street2',
                                    order: 2,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: false,
                                    label: 'Street Address 2',
                                    dbField: 'street2',
                                    maxLength: 100,
                                    placeholder: 'Suite 100',
                                    showOn: ['form'],
                                }),
                                field({
                                    name: 'city',
                                    order: 3,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: false,
                                    label: 'City',
                                    dbField: 'city',
                                    maxLength: 100,
                                    placeholder: 'New York',
                                    showOn: ['form'],
                                }),
                                field({
                                    name: 'state',
                                    order: 4,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: false,
                                    label: 'State',
                                    dbField: 'state',
                                    maxLength: 50,
                                    placeholder: 'NY',
                                    showOn: ['form'],
                                }),
                                field({
                                    name: 'zip',
                                    order: 5,
                                    type: FieldTypes.STRING,
                                    default: '',
                                    required: false,
                                    label: 'ZIP Code',
                                    dbField: 'zip',
                                    maxLength: 20,
                                    pattern: '^[0-9]{5}(-[0-9]{4})?$',
                                    placeholder: '10001',
                                    showOn: ['form'],
                                }),
                                field({
                                    name: 'country',
                                    order: 6,
                                    type: FieldTypes.COUNTRY,
                                    default: 'US',
                                    required: false,
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
                    sectionOrientation: 'vertical',
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
                                    maxLength: 5000,
                                    placeholder: 'Additional notes...',
                                    showOn: ['form'],
                                }),
                            ],
                        }),
                        section({
                            name: 'Audit',
                            order: 2,
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
                contact_id: field({
                    name: 'contact_id',
                    type: FieldTypes.NUMBER,
                    default: null,
                    readOnly: true,
                    label: 'ID',
                    dbField: 'contact_id',
                }),
                tenant_id: field({
                    name: 'tenant_id',
                    type: FieldTypes.NUMBER,
                    default: 0,
                    readOnly: false,
                    label: 'Tenant ID',
                    dbField: 'tenant_id',
                }),
            },

            relationships: {},

            validation: {
                // Entity-level validation rules
                custom: (data) => {
                    const errors = {};

                    // Ensure at least one contact method
                    if (!data.email && !data.phone) {
                        errors._form = 'At least one contact method (email or phone) is required';
                    }

                    // Validate ZIP code format if provided
                    if (data.zip && data.country === 'US') {
                        const zipRegex = /^[0-9]{5}(-[0-9]{4})?$/;
                        if (!zipRegex.test(data.zip)) {
                            errors.zip = 'Invalid US ZIP code format';
                        }
                    }

                    return errors;
                },
            },
        };

        const schema = defineSchema(schemaDefinition);
        return schema;
    }
}

module.exports = Contact;
