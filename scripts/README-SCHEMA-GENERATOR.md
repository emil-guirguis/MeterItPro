# Database Schema to Code Generator

## Overview

This tool automatically generates backend models and frontend schemas from your PostgreSQL database tables. It eliminates manual synchronization errors and ensures consistency across your full stack.

## Features

✅ **Reads live database schema** - Queries PostgreSQL information_schema  
✅ **Generates backend models** - Creates BaseModel-compatible classes  
✅ **Generates frontend schemas** - Creates defineEntitySchema configurations  
✅ **Type-safe** - Proper TypeScript types for frontend  
✅ **Customizable** - Generated code includes TODOs for customization  
✅ **Summary report** - Creates a summary file with next steps  

## Usage

### Basic Usage

```bash
# From project root
node scripts/schema-generator.js <table_name>

# Example
node scripts/schema-generator.js meter
```

### What It Generates

The tool creates 3 files in the `generated/` directory:

1. **Backend Model** (`Meter.js`)
   - BaseModel-compatible class
   - All database fields mapped
   - Basic CRUD methods inherited
   - Placeholder for relationships
   - Custom methods template

2. **Frontend Schema** (`meterConfig.ts`)
   - defineEntitySchema configuration
   - Form fields with validation
   - Entity fields (read-only)
   - TypeScript types
   - List columns configuration
   - Export configuration

3. **Summary** (`meter_schema_summary.txt`)
   - Generation metadata
   - Column list
   - Next steps guide

## Generated Code Structure

### Backend Model Example

```javascript
class Meter extends BaseModel {
  constructor(meterData = {}) {
    super(meterData);
    
    // All database fields automatically mapped
    this.meter_id = meterData.meter_id;
    this.name = meterData.name;
    this.type = meterData.type;
    // ... more fields
  }

  static get tableName() {
    return 'meter';
  }

  static get primaryKey() {
    return 'id';
  }

  static get relationships() {
    return {
      // TODO: Add your relationships
    };
  }
}
```

### Frontend Schema Example

```typescript
export const meterSchema = defineEntitySchema({
  formFields: {
    name: field({ type: 'string', default: '', required: true, label: 'Name' }),
    type: field({ type: 'string', default: '', required: true, label: 'Type' }),
    // ... more fields
  },
  
  entityFields: {
    id: { type: 'number' as const, default: 0, readOnly: true },
    createdAt: { type: 'date' as const, default: new Date(), readOnly: true },
    // ... more read-only fields
  },
  
  entityName: 'Meter',
  description: 'Meter entity for managing meter records',
});
```

## Type Mapping

The tool automatically maps PostgreSQL types to JavaScript/TypeScript types:

| PostgreSQL Type | JS/TS Type |
|----------------|------------|
| integer, bigint, smallint, numeric | number |
| varchar, char, text | string |
| boolean | boolean |
| date, timestamp | date |
| json, jsonb | object |
| uuid | string |

## Next Steps After Generation

1. **Review Generated Files**
   - Check field mappings
   - Verify type conversions
   - Review default values

2. **Copy to Project**
   ```bash
   # Backend
   cp generated/Meter.js client/backend/src/models/Meter.js
   
   # Frontend
   cp generated/meterConfig.ts client/frontend/src/features/meters/meterConfig.ts
   ```

3. **Customize Backend Model**
   - Add relationships in `relationships()` getter
   - Add custom business logic methods
   - Update `getStats()` query
   - Add validation methods

4. **Customize Frontend Schema**
   - Update field validation rules
   - Customize column rendering
   - Add filters
   - Configure bulk actions
   - Update export mapping

5. **Update Form Components**
   - Import new schema
   - Update form fields
   - Add custom validation
   - Handle special field types

## Configuration

The tool uses your `.env` file for database connection:

```env
POSTGRES_HOST=your-host
POSTGRES_PORT=5432
POSTGRES_DB=your-database
POSTGRES_USER=your-user
POSTGRES_PASSWORD=your-password
```

## Advanced Usage

### Generate for Multiple Tables

```bash
# Generate schemas for all your tables
node scripts/schema-generator.js users
node scripts/schema-generator.js devices
node scripts/schema-generator.js locations
node scripts/schema-generator.js meters
```

### Regenerate After Schema Changes

When you modify your database schema:

1. Run migrations
2. Regenerate the code
3. Compare with existing files
4. Merge custom logic

```bash
# After migration
npm run db:migrate

# Regenerate
node scripts/schema-generator.js meter

# Use diff tool to compare
code --diff client/backend/src/models/Meter.js generated/Meter.js
```

## Troubleshooting

### "Cannot find module 'pg'"

Make sure pg is installed in client/backend:

```bash
cd client/backend
npm install
```

### "Table not found"

Verify:
- Table name is correct (case-sensitive)
- Database connection is working
- You have permissions to query information_schema

### "Connection refused"

Check:
- Database is running
- .env file has correct credentials
- Firewall allows connection

## Examples

### Generate Meter Schema

```bash
$ node scripts/schema-generator.js meter

🔍 Querying schema for table: meter

✅ Found 20 columns

=== TABLE SCHEMA ===
  id: bigint NOT NULL
  name: character varying(200) NOT NULL
  type: character varying(50) NOT NULL
  ...

📝 Generating backend model...
✅ Backend model saved to: generated/Meter.js

📝 Generating frontend schema...
✅ Frontend schema saved to: generated/meterConfig.ts

📄 Summary saved to: generated/meter_schema_summary.txt

✨ Generation complete!
```

### Generate Device Schema

```bash
$ node scripts/schema-generator.js device

🔍 Querying schema for table: device
✅ Found 15 columns
...
✨ Generation complete!
```

## Tips

1. **Always review generated code** - The tool creates a good starting point but may need customization

2. **Keep custom logic separate** - Add custom methods below the generated sections so they're easy to preserve

3. **Use version control** - Commit generated files so you can track changes

4. **Document customizations** - Add comments explaining why you deviated from generated code

5. **Regenerate periodically** - When schema changes, regenerate and merge carefully

## Integration with Workflow

```bash
# 1. Design database schema
# 2. Create migration
npm run db:migrate

# 3. Generate code
node scripts/schema-generator.js meter

# 4. Review and customize
code generated/Meter.js
code generated/meterConfig.ts

# 5. Copy to project
cp generated/Meter.js client/backend/src/models/
cp generated/meterConfig.ts client/frontend/src/features/meters/

# 6. Update components
# Edit MeterForm.tsx and MeterList.tsx to use new schema

# 7. Test
npm test
```

## Future Enhancements

Potential improvements:
- [ ] Auto-detect relationships from foreign keys
- [ ] Generate API routes
- [ ] Generate test files
- [ ] Support for enums
- [ ] Custom type mappings configuration
- [ ] Interactive mode with prompts
- [ ] Diff and merge tool
- [ ] Generate migration from model changes

## Support

For issues or questions:
1. Check the generated summary file
2. Review this README
3. Check database connection
4. Verify table exists and has correct permissions
