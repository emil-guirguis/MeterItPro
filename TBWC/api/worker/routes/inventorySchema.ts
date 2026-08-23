// ===== INVENTORY schema (tbwc-site public.inventory) =====
// Served at GET /api/schema/inventory. PK is `inventory_id` (bigint identity).
import {
  defineSchema,
  field,
  tab,
  section,
  FieldTypes,
} from '@meterit/framework-backend/api/base/SchemaDefinition';

export const inventorySchema = defineSchema({
  entityName: 'Inventory',
  tableName: 'inventory',
  idFieldName: 'inventory_id',
  description: 'TBWC product catalog (Unit Price | Project BOM)',
  formMaxWidth: '900px',
  customListColumns: {},

  formTabs: [
    tab({
      name: 'Item',
      order: 1,
      sections: [
        section({
          name: 'Identity',
          order: 1,
          fields: [
            field({ name: 'part_number', order: 1, type: FieldTypes.STRING, default: '', required: true, label: 'Part #', dbField: 'part_number', maxLength: 200, showOn: ['list', 'form'] }),
            field({ name: 'description', order: 2, type: FieldTypes.STRING, default: '', required: false, label: 'Description', dbField: 'description', maxLength: 2000, showOn: ['list', 'form'] }),
            field({ name: 'category', order: 3, type: FieldTypes.STRING, default: '', required: false, label: 'Category', dbField: 'category', maxLength: 300, showOn: ['list', 'form'] }),
            field({ name: 'upc_code', order: 4, type: FieldTypes.STRING, default: '', required: false, label: 'UPC', dbField: 'upc_code', maxLength: 100, showOn: ['form'] }),
            field({ name: 'distribution_type', order: 5, type: FieldTypes.STRING, default: '', required: false, label: 'Distribution', dbField: 'distribution_type', maxLength: 100, showOn: ['form'] }),
            field({ name: 'is_active', order: 6, type: FieldTypes.BOOLEAN, default: true, required: false, label: 'Active', dbField: 'is_active', showOn: ['form'] }),
          ],
        }),
        section({
          name: 'Pricing',
          order: 2,
          fields: [
            field({ name: 'base_price', order: 1, type: FieldTypes.CURRENCY, default: null, required: false, label: 'Base Price', dbField: 'base_price', showOn: ['list', 'form'] }),
            field({ name: 'msrp', order: 2, type: FieldTypes.CURRENCY, default: null, required: false, label: 'MSRP', dbField: 'msrp', showOn: ['form'] }),
            field({ name: 'dnet_cost', order: 3, type: FieldTypes.CURRENCY, default: null, required: false, label: 'D-NET Cost', dbField: 'dnet_cost', showOn: ['form'] }),
            field({ name: 'moq', order: 4, type: FieldTypes.NUMBER, default: null, required: false, label: 'MOQ', dbField: 'moq', showOn: ['form'] }),
            field({ name: 'pack_qty', order: 5, type: FieldTypes.NUMBER, default: null, required: false, label: 'Pack Qty', dbField: 'pack_qty', showOn: ['form'] }),
            field({ name: 'service_days', order: 6, type: FieldTypes.NUMBER, default: null, required: false, label: 'Service Days', dbField: 'service_days', showOn: ['form'] }),
            field({ name: 'unit_weight', order: 7, type: FieldTypes.NUMBER, default: null, required: false, label: 'Unit Weight (lbs)', dbField: 'unit_weight', showOn: ['form'] }),
          ],
        }),
      ],
    }),
  ],

  entityFields: {
    inventory_id: field({ name: 'inventory_id', type: FieldTypes.NUMBER, default: null, readOnly: true, label: 'ID', dbField: 'inventory_id' }),
  },
  validation: {},
});
