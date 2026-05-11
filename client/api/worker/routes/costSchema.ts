import { defineSchema, field, tab, section, FieldTypes } from '../../../../framework/backend/api/base/SchemaDefinition';

export const costSchema = defineSchema({
  entityName: 'Cost',
  tableName: 'cost',
  description: 'Global cost rate definitions',
  formMaxWidth: '600px',
  idFieldName: 'cost_id',

  formTabs: [
    tab({
      name: 'General',
      order: 1,
      sections: [
        section({
          name: 'Details',
          order: 1,
          flex: 1,
          fields: [
            field({ name: 'name',     order: 1, type: FieldTypes.STRING,  default: '', required: true,  label: 'Name',     dbField: 'name',     minLength: 1, maxLength: 255, placeholder: 'Electricity Rate', filterable: ['main'], showOn: ['list', 'form'] }),
            field({ name: 'quantity', order: 2, type: FieldTypes.NUMBER,  default: 0,  required: true,  label: 'Quantity', dbField: 'quantity', showOn: ['list', 'form'] }),
            field({ name: 'rate',     order: 3, type: FieldTypes.NUMBER,  default: 0,  required: true,  label: 'Rate',     dbField: 'rate',     showOn: ['list', 'form'] }),
          ],
        }),
        section({
          name: 'Status',
          order: 2,
          maxWidth: '150px',
          fields: [
            field({ name: 'active', order: 1, type: FieldTypes.BOOLEAN, default: true, required: false, label: 'Active', dbField: 'active', showOn: ['list', 'form'] }),
          ],
        }),
      ],
    }),
    tab({
      name: 'Audit',
      order: 2,
      sections: [
        section({
          name: 'Audit',
          order: 1,
          fields: [
            field({ name: 'created_at',           order: 1, type: FieldTypes.DATETIME, default: null, readOnly: true, label: 'Created At',      dbField: 'created_at',           showOn: ['form'] }),
            field({ name: 'updated_at',           order: 2, type: FieldTypes.DATETIME, default: null, readOnly: true, label: 'Updated At',      dbField: 'updated_at',           showOn: ['form'] }),
            field({ name: 'modified_by_users_id', order: 3, type: FieldTypes.NUMBER,   default: null, readOnly: true, label: 'Modified By (ID)', dbField: 'modified_by_users_id', showOn: ['form'] }),
          ],
        }),
      ],
    }),
  ],

  entityFields: {
    cost_id: field({ name: 'cost_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'ID', dbField: 'cost_id' }),
  },
});
