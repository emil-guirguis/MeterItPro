# Meter Table Schema Analysis

## Overview
This document provides a comprehensive analysis of the meter table structure in the MeterItProSync/mcp database, including primary keys, unique constraints, and related schema definitions.

---

## Meter Table Structure

### Location
- **File:** `MeterItProSync/mcp/src/database/connection-pools.ts` (lines 163-180)
- **Compiled:** `MeterItProSync/mcp/dist/database/connection-pools.js`

### SQL Definition
```sql
CREATE TABLE IF NOT EXISTS meter (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  serial_number VARCHAR(255),
  installation_date VARCHAR(50),
  device_id VARCHAR(255),
  location_id VARCHAR(255),
  ip VARCHAR(50),
  port VARCHAR(10),
  protocol VARCHAR(50),
  status VARCHAR(50),
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at VARCHAR(50),
  updated_at VARCHAR(50)
)
```

### Column Definitions

| Column Name | Data Type | Constraints | Default | Notes |
|-------------|-----------|-------------|---------|-------|
| `id` | VARCHAR(255) | PRIMARY KEY | - | Unique identifier for the meter |
| `name` | VARCHAR(255) | NOT NULL | - | Display name of the meter |
| `type` | VARCHAR(100) | - | - | Type of meter (e.g., electric, water, gas) |
| `serial_number` | VARCHAR(255) | - | - | Serial number of the physical meter |
| `installation_date` | VARCHAR(50) | - | - | Date when meter was installed |
| `device_id` | VARCHAR(255) | - | - | Device identifier |
| `location_id` | VARCHAR(255) | - | - | Reference to location |
| `ip` | VARCHAR(50) | - | - | IP address for network communication |
| `port` | VARCHAR(10) | - | - | Port number for network communication |
| `protocol` | VARCHAR(50) | - | - | Communication protocol (e.g., BACnet, Modbus) |
| `status` | VARCHAR(50) | - | - | Current status of the meter |
| `notes` | TEXT | - | - | Additional notes or comments |
| `active` | BOOLEAN | - | true | Whether the meter is active |
| `created_at` | VARCHAR(50) | - | - | Timestamp when record was created |
| `updated_at` | VARCHAR(50) | - | - | Timestamp when record was last updated |

---

## Primary Key

### Definition
- **Type:** Single Column Primary Key
- **Column:** `id`
- **Data Type:** VARCHAR(255)
- **Constraint:** PRIMARY KEY

### Characteristics
- Uniquely identifies each meter record
- Non-nullable
- Used as the main identifier for meter lookups
- Stored as a string (VARCHAR) rather than numeric

---

## Unique Constraints

### Composite Key Constraint
**Important:** The meter table uses a **composite unique constraint** on `(id, meter_element_id)` in the upsert operation.

#### Location
- **File:** `MeterItProSync/mcp/src/database/sync-database.ts` (lines 89-100)
- **File:** `MeterItProSync/mcp/src/database/connection-pools.ts` (upsertMeter method)

#### SQL Implementation
```sql
INSERT INTO meter (id, name, ip, port, active, element, meter_element_id)
VALUES ($1, $2, $3, $4, $5, $6, $7)
ON CONFLICT (id, meter_element_id) DO UPDATE SET
  id = $1,
  name = $2,
  ip = $3,
  port = $4,
  active = $5,
  element = $6,
  meter_element_id = $7
```

#### Explanation
- The `ON CONFLICT (id, meter_element_id)` clause creates a composite unique constraint
- This allows the same meter ID to exist multiple times in the table, but only if it has different `meter_element_id` values
- This is used for the upsert operation to handle both inserts and updates

### Why Composite Key?
According to `METER_SYNC_COMPOSITE_KEY_FIX.md`:
- **Before:** Each meter could only appear once (unique by `meter_id`)
- **Now:** Each meter can have multiple elements, but each combination of `(meter_id, meter_element_id)` must be unique

This allows:
- A single meter to have multiple elements (Temperature, Humidity, Pressure, etc.)
- Each element to be tracked separately
- Proper synchronization of meter-element combinations

---

## Related Table: meter_element

### Purpose
The meter table works in conjunction with a `meter_element` table to support multiple elements per meter.

### Relationship
- **Foreign Key:** `meter_id` in meter_reading table references `meter.id`
- **Composite Key:** `(meter_id, meter_element_id)` uniquely identifies a meter-element combination

### Example Data Structure
```
Meter Table:
meter_id | name      | ip          | port | active
---------|-----------|-------------|------|--------
1        | Meter A   | 192.168.1.1 | 502  | true
2        | Meter B   | 192.168.1.2 | 502  | true

Meter Element (implied):
meter_id | meter_element_id | element
---------|------------------|----------
1        | 1                | Temperature
1        | 2                | Humidity
2        | 1                | Pressure
```

---

## Related Tables

### meter_reading Table
```sql
CREATE TABLE IF NOT EXISTS meter_reading (
  id SERIAL PRIMARY KEY,
  meter_id VARCHAR(255) NOT NULL REFERENCES meter(id),
  timestamp TIMESTAMP NOT NULL,
  data_point VARCHAR(255),
  value NUMERIC,
  unit VARCHAR(50),
  is_synchronized BOOLEAN DEFAULT false,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Indexes:**
- `idx_meter_reading_meter_id` on `meter_id`
- `idx_meter_reading_is_synchronized` on `is_synchronized`

### sync_log Table
```sql
CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  batch_size INTEGER,
  success BOOLEAN,
  error_message TEXT,
  synced_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

**Indexes:**
- `idx_sync_log_synced_at` on `synced_at`

---

## MeterEntity TypeScript Interface

### Location
- **File:** `MeterItProSync/mcp/src/types/entities.ts` (lines 44-50)

### Definition
```typescript
export interface MeterEntity {
  meter_id: number;
  name: string;
  active: boolean;
  ip: string;
  port: string;
  meter_element_id: number;
  element: string;
}
```

### Field Mapping
| TypeScript Field | SQL Column | Type | Notes |
|------------------|-----------|------|-------|
| `meter_id` | `id` | number | Primary key identifier |
| `name` | `name` | string | Display name |
| `active` | `active` | boolean | Active status |
| `ip` | `ip` | string | IP address |
| `port` | `port` | string | Port number |
| `meter_element_id` | `meter_element_id` | number | Element identifier (composite key) |
| `element` | `element` | string | Element name/type |

---

## Upsert Operation

### Location
- **File:** `MeterItProSync/mcp/src/database/connection-pools.ts` (upsertMeter method)
- **File:** `MeterItProSync/mcp/src/database/sync-database.ts` (upsertMeter method)

### Logic
1. **Attempt INSERT** with the meter data
2. **ON CONFLICT** with composite key `(id, meter_element_id)`:
   - If conflict occurs, perform UPDATE instead
   - Update all fields with new values

### Key Points
- Uses PostgreSQL `ON CONFLICT` clause for upsert
- Composite key ensures proper handling of multiple elements per meter
- Preserves meter ID and element ID during update

---

## Sync Mechanism

### Composite Key Lookup
The sync process uses composite keys for efficient lookups:

```typescript
// Create maps using composite key format: "meter_id:meter_element_id"
const remoteMap = new Map(
  remoteMeters.map((m: MeterEntity) => [`${m.meter_id}:${m.meter_element_id}`, m])
);
const localMap = new Map(
  localMeters.map((m: MeterEntity) => [`${m.meter_id}:${m.meter_element_id}`, m])
);

// Use composite key for lookups
const compositeKey = `${remoteMeter.meter_id}:${remoteMeter.meter_element_id}`;
if (!localMap.has(compositeKey)) {
  // Insert new meter-element combination
}
```

### Sync Operations
1. **Insert:** New meter-element combinations not in local database
2. **Update:** Existing combinations with changed values
3. **Delete:** Local combinations not in remote database

---

## Database Initialization

### Location
- **File:** `MeterItProSync/mcp/src/database/connection-pools.ts` (initialize method)

### Initialization Process
1. Creates `tenant` table
2. Creates `meter` table with schema above
3. Creates `meter_reading` table with foreign key to meter
4. Creates `sync_log` table
5. Creates indexes for performance optimization

### Indexes Created
```sql
CREATE INDEX IF NOT EXISTS idx_meter_reading_meter_id ON meter_reading(meter_id);
CREATE INDEX IF NOT EXISTS idx_meter_reading_is_synchronized ON meter_reading(is_synchronized);
CREATE INDEX IF NOT EXISTS idx_sync_log_synced_at ON sync_log(synced_at);
```

---

## Key Findings

### 1. Primary Key Structure
- **Single column primary key:** `id` (VARCHAR(255))
- **Type:** String-based identifier
- **Purpose:** Uniquely identifies each meter record

### 2. Unique Constraints
- **Composite unique constraint:** `(id, meter_element_id)`
- **Purpose:** Ensures each meter-element combination is unique
- **Implementation:** PostgreSQL `ON CONFLICT` clause in upsert

### 3. Multi-Element Support
- A single meter can have multiple elements
- Each element is tracked separately
- Composite key enables this flexibility

### 4. Synchronization
- Uses composite keys for efficient comparison
- Supports insert, update, and delete operations
- Handles remote-to-local database synchronization

### 5. Data Types
- Meter IDs are stored as VARCHAR(255) strings
- Timestamps stored as VARCHAR(50) strings
- Numeric values use NUMERIC type for precision

---

## Related Documentation

### Files Referenced
1. `MeterItProSync/mcp/src/database/connection-pools.ts` - Schema definition and initialization
2. `MeterItProSync/mcp/src/database/sync-database.ts` - Upsert implementation
3. `MeterItProSync/mcp/src/types/entities.ts` - TypeScript interface definitions
4. `MeterItProSync/mcp/src/sync-service/meter-sync-agent.ts` - Sync logic with composite keys
5. `MeterItPro/METER_SYNC_COMPOSITE_KEY_FIX.md` - Composite key implementation details

### Key Concepts
- **Composite Key:** Combination of `meter_id` and `meter_element_id` for uniqueness
- **Upsert:** INSERT with ON CONFLICT UPDATE pattern
- **Synchronization:** Remote-to-local database sync using composite keys

---

## Summary

The meter table in the MeterItProSync/mcp database uses:
- **Primary Key:** Single column `id` (VARCHAR(255))
- **Unique Constraint:** Composite key on `(id, meter_element_id)` via PostgreSQL ON CONFLICT
- **Purpose:** Store meter configurations with support for multiple elements per meter
- **Synchronization:** Uses composite keys to properly handle meter-element combinations during sync operations

This design allows flexible meter management with multiple elements while maintaining data integrity through composite key constraints.
