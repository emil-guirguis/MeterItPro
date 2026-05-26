# Schema Generator - Quick Start Guide

## 🚀 Quick Start

```bash
# Generate code from database table
node scripts/schema-generator.js <table_name>

# Example
node scripts/schema-generator.js meter
```

## 📁 Output Files

All files are created in `generated/` directory:

- `Meter.js` - Backend model
- `meterConfig.ts` - Frontend schema  
- `meter_schema_summary.txt` - Summary & next steps

## ✅ Common Use Cases

### 1. New Feature - Generate Everything

```bash
# Generate from database
node scripts/schema-generator.js users

# Copy to project
cp generated/User.js client/backend/src/models/
cp generated/userConfig.ts client/frontend/src/features/users/

# Customize and integrate
```

### 2. Schema Changed - Regenerate

```bash
# After migration
npm run db:migrate

# Regenerate
node scripts/schema-generator.js meter

# Compare and merge
code --diff client/backend/src/models/Meter.js generated/Meter.js
```

### 3. Sync Frontend with Backend

```bash
# Regenerate from database (source of truth)
node scripts/schema-generator.js meter

# Update frontend
cp generated/meterConfig.ts client/frontend/src/features/meters/
```

## 🔧 What to Customize

### Backend Model (`Meter.js`)

```javascript
// 1. Add relationships
static get relationships() {
  return {
    device: {
      type: 'belongsTo',
      model: 'Device',
      foreignKey: 'device_id',
      targetKey: 'id'
    }
  };
}

// 2. Add custom methods
static async findBySerialNumber(serialNumber) {
  return this.findOne({ serial_number: serialNumber });
}

// 3. Add validation
validate() {
  if (!this.name) throw new Error('Name is required');
  if (!this.type) throw new Error('Type is required');
}
```

### Frontend Schema (`meterConfig.ts`)

```typescript
// 1. Update field validation
name: field({ 
  type: 'string', 
  default: '', 
  required: true, 
  label: 'Meter Name',
  minLength: 3,
  maxLength: 100
}),

// 2. Customize columns
export const meterColumns: ColumnDefinition<Meter>[] = [
  {
    key: 'name',
    label: 'Meter Name',
    sortable: true,
    render: (value, meter) => (
      <div className="meter-name">
        <strong>{value}</strong>
        <span>{meter.type}</span>
      </div>
    )
  },
  // ... more columns
];

// 3. Add filters
export const meterFilters: FilterDefinition[] = [
  {
    key: 'type',
    label: 'Type',
    type: 'select',
    options: [
      { label: 'Electric', value: 'electric' },
      { label: 'Gas', value: 'gas' },
      { label: 'Water', value: 'water' },
    ]
  }
];
```

## 📋 Checklist After Generation

- [ ] Review generated files in `generated/` directory
- [ ] Copy backend model to `client/backend/src/models/`
- [ ] Copy frontend schema to `client/frontend/src/features/*/`
- [ ] Add relationships in backend model
- [ ] Customize field validation in frontend schema
- [ ] Update list columns and filters
- [ ] Update form components to use new schema
- [ ] Test CRUD operations
- [ ] Commit changes

## 🎯 Pro Tips

1. **Always review before copying** - Generated code is a starting point
2. **Keep custom logic separate** - Add below generated sections
3. **Use version control** - Easy to see what changed
4. **Regenerate after migrations** - Keep in sync with database
5. **Document deviations** - Comment why you changed generated code

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| "Cannot find module 'pg'" | `cd client/backend && npm install` |
| "Table not found" | Check table name (case-sensitive) |
| "Connection refused" | Verify .env database credentials |
| Wrong types generated | Check type mapping in script |

## 📚 Full Documentation

See `scripts/README-SCHEMA-GENERATOR.md` for complete documentation.

## 🔄 Typical Workflow

```
Database Schema (Source of Truth)
         ↓
    [Migration]
         ↓
  [Schema Generator] ← You are here
         ↓
   Generated Code
         ↓
  [Review & Customize]
         ↓
   Copy to Project
         ↓
  [Update Components]
         ↓
      [Test]
```

## 💡 Examples

### Generate for all tables

```bash
for table in users devices locations meters readings; do
  node scripts/schema-generator.js $table
done
```

### Compare with existing

```bash
# Generate
node scripts/schema-generator.js meter

# Diff backend
diff client/backend/src/models/Meter.js generated/Meter.js

# Diff frontend  
diff client/frontend/src/features/meters/meterConfig.ts generated/meterConfig.ts
```

### Backup before overwrite

```bash
# Backup existing
cp client/backend/src/models/Meter.js client/backend/src/models/Meter.js.backup

# Generate and copy
node scripts/schema-generator.js meter
cp generated/Meter.js client/backend/src/models/

# If needed, restore
cp client/backend/src/models/Meter.js.backup client/backend/src/models/Meter.js
```
