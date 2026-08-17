# Batch Loading Relationships

## Overview

Batch loading is an optimization technique that loads relationships for multiple model instances in a single database query, rather than executing N+1 queries.

## The N+1 Problem

### Without Batch Loading (N+1 queries)
```javascript
// Load 100 meters
const meters = await Meter.findAll({ limit: 100 });

// Load device for each meter (100 additional queries!)
for (const meter of meters) {
  meter.device = await meter.loadRelationship('device');
}
// Total: 101 queries (1 for meters + 100 for devices)
```

### With Batch Loading (2 queries)
```javascript
// Load 100 meters
const meters = await Meter.findAll({ limit: 100 });

// Load all devices in one query
await Meter.batchLoadRelationships(meters, ['device']);
// Total: 2 queries (1 for meters + 1 for all devices)
```

## API Reference

### `batchLoadRelationship(instances, relationshipName, options)`

Load a single relationship for multiple instances.

**Parameters:**
- `instances` (Array<BaseModel>) - Array of model instances
- `relationshipName` (string) - Name of the relationship to load
- `options` (Object) - Query options
  - `select` (Array<string>) - Fields to select from related model

**Returns:** `Promise<Map>` - Map of instance ID to related data

**Example:**
```javascript
const meters = await Meter.findAll({ where: { status: 'active' } });
const devicesMap = await Meter.batchLoadRelationship(meters, 'device');

// Assign devices to meters
meters.forEach(meter => {
  meter.device = devicesMap.get(meter.meter_id);
});
```

### `batchLoadRelationships(instances, relationshipNames, options)`

Load multiple relationships for multiple instances.

**Parameters:**
- `instances` (Array<BaseModel>) - Array of model instances
- `relationshipNames` (Array<string>) - Names of relationships to load
- `options` (Object) - Query options
  - `select` (Array<string>) - Fields to select from related models

**Returns:** `Promise<void>` - Modifies instances in place

**Example:**
```javascript
const meters = await Meter.findAll({ where: { status: 'active' } });

// Load multiple relationships efficiently
await Meter.batchLoadRelationships(meters, ['device', 'location']);

// All relationships are now loaded
meters.forEach(meter => {
  console.log(meter.device.manufacturer);
  console.log(meter.location.name);
});
```

## Use Cases

### 1. List Views with Related Data

When displaying a list of items with related data:

```javascript
// In your API route
router.get('/meters', async (req, res) => {
  const meters = await Meter.findAll({
    where: { tenant_id: req.user.tenant_id }
  });
  
  // Efficiently load related data
  await Meter.batchLoadRelationships(meters, ['device', 'location']);
  
  res.json({ success: true, data: meters });
});
```

### 2. Export Operations

When exporting data with relationships:

```javascript
async function exportMeters(tenantId) {
  const meters = await Meter.findAll({
    where: { tenant_id: tenantId }
  });
  
  // Load all relationships needed for export
  await Meter.batchLoadRelationships(meters, [
    'device',
    'location',
    'readings'
  ]);
  
  return meters.map(meter => ({
    name: meter.name,
    device: meter.device.manufacturer,
    location: meter.location.name,
    lastReading: meter.readings[0]?.value
  }));
}
```

### 3. Dashboard Aggregations

When computing statistics across multiple entities:

```javascript
async function getDashboardStats(tenantId) {
  const meters = await Meter.findAll({
    where: { tenant_id: tenantId, status: 'active' }
  });
  
  // Load devices to group by manufacturer
  await Meter.batchLoadRelationships(meters, ['device']);
  
  const byManufacturer = {};
  meters.forEach(meter => {
    const manufacturer = meter.device.manufacturer;
    byManufacturer[manufacturer] = (byManufacturer[manufacturer] || 0) + 1;
  });
  
  return byManufacturer;
}
```

## Performance Comparison

### Test Scenario: Load 100 meters with device and location

| Method | Queries | Time |
|--------|---------|------|
| Individual loading | 201 | ~2000ms |
| Batch loading | 3 | ~50ms |
| **Improvement** | **98.5% fewer queries** | **40x faster** |

## Supported Relationship Types

### BELONGS_TO
Loads parent records efficiently by collecting all foreign key values and querying in one batch.

```javascript
// Each meter belongs to one device
await Meter.batchLoadRelationships(meters, ['device']);
```

### HAS_MANY
Loads child records efficiently by collecting all primary key values and querying in one batch.

```javascript
// Each location has many meters
await Location.batchLoadRelationships(locations, ['meters']);
```

## Best Practices

### 1. Use Batch Loading for Lists
Always use batch loading when displaying lists of items with relationships.

### 2. Select Only Needed Fields
Reduce data transfer by selecting only required fields:

```javascript
await Meter.batchLoadRelationships(meters, ['device'], {
  select: ['id', 'manufacturer', 'model']
});
```

### 3. Avoid Over-Fetching
Don't load relationships you don't need:

```javascript
// Bad: Loading all relationships
await Meter.batchLoadRelationships(meters, [
  'device', 'location', 'readings', 'statusLogs', 
  'maintenance', 'triggers', 'alerts'
]);

// Good: Load only what you need
await Meter.batchLoadRelationships(meters, ['device', 'location']);
```

### 4. Consider Pagination
For very large datasets, paginate before batch loading:

```javascript
const page = 1;
const limit = 100;
const offset = (page - 1) * limit;

const meters = await Meter.findAll({
  where: { tenant_id: tenantId },
  limit,
  offset
});

await Meter.batchLoadRelationships(meters, ['device', 'location']);
```

## Limitations

1. **Circular References**: Batch loading doesn't automatically prevent circular references. Be careful when loading nested relationships.

2. **Memory Usage**: Loading large numbers of related records can consume significant memory. Consider pagination.

3. **Complex Queries**: Batch loading uses simple WHERE IN queries. For complex filtering, you may need custom queries.

## Migration Guide

### Before (N+1 queries)
```javascript
const meters = await Meter.findAll();
for (const meter of meters) {
  meter.device = await meter.loadRelationship('device');
  meter.location = await meter.loadRelationship('location');
}
```

### After (Batch loading)
```javascript
const meters = await Meter.findAll();
await Meter.batchLoadRelationships(meters, ['device', 'location']);
```

## Monitoring

To monitor query performance, enable query logging:

```javascript
// In your database configuration
const pool = new Pool({
  // ... other config
  log: (msg) => console.log('[DB Query]', msg)
});
```

Look for patterns of repeated queries - these are candidates for batch loading optimization.
