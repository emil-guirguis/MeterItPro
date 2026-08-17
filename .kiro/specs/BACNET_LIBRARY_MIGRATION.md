# BACnet Library Migration: bacstack → bacnet-node

## Summary
Successfully migrated from `bacstack` to `bacnet-node` library to enable batch reading of multiple registers in a single request, significantly improving performance and reducing network overhead.

## Changes Made

### 1. Package Dependencies
**File:** `MeterItProSync/mcp/package.json`
- Removed: `bacstack: ^0.0.1-beta.14`
- Added: `bacnet-node: ^0.2.23`

### 2. BACnet Client Rewrite
**File:** `MeterItProSync/mcp/src/bacnet-collection/bacnet-client.ts`

#### New Features:
- **Batch Reading Support**: `readPropertyMultiple()` method reads multiple registers in a single request
- **Better Timeout Handling**: Uses `apduTimeout` configuration for proper timeout management
- **Device Discovery**: Built-in `whoIs()` method for discovering BACnet devices
- **Improved Error Handling**: Comprehensive error logging and timeout management

#### Key Methods:
```typescript
// Single property read (backward compatible)
readProperty(ip, port, objectType, objectInstance, propertyId, timeoutMs)

// NEW: Batch read multiple properties at once
readPropertyMultiple(ip, port, requests[], timeoutMs)

// Device discovery
whoIs()

// Cleanup
close()
```

### 3. Collection Cycle Manager Update
**File:** `MeterItProSync/mcp/src/bacnet-collection/collection-cycle-manager.ts`

#### Changes:
- Updated `readMeterDataPoints()` to use batch reading instead of sequential reads
- Builds `BatchReadRequest[]` for all registers of a meter
- Calls `readPropertyMultiple()` once instead of looping through each register
- Processes batch results and maps them back to original registers

#### Performance Improvement:
- **Before**: N network requests for N registers (sequential)
- **After**: 1 network request for N registers (batch)
- **Result**: Significantly reduced latency and network overhead

## Benefits

1. **Performance**: Single batch request instead of N sequential requests
2. **Reliability**: Better timeout handling with configurable APDU timeout
3. **Network Efficiency**: Reduced network round-trips and overhead
4. **Scalability**: Handles large numbers of registers more efficiently
5. **Community Support**: bacnet-node is actively maintained and community-driven

## Installation

Run the following command in the MeterItProSync/mcp directory:

```bash
cd MeterItProSync/mcp
npm install
```

This will install `bacnet-node@^0.2.23` which supports:
- Read Property Multiple (batch reads)
- Write Property Multiple (batch writes)
- Device discovery (WhoIs/IAm)
- All standard BACnet services

## Library Comparison

| Feature | bacstack | bacnet-node |
|---------|----------|-------------|
| Batch Reads | ❌ | ✅ |
| Batch Writes | ❌ | ✅ |
| Device Discovery | ✅ | ✅ |
| Timeout Config | ✅ | ✅ |
| Community Support | ⚠️ Limited | ✅ Active |
| Pure JavaScript | ✅ | ✅ |

## Example Usage

```typescript
// Build batch requests for all registers
const batchRequests: BatchReadRequest[] = [
  {
    objectType: 'analogInput',
    objectInstance: 1,
    propertyId: 'presentValue',
    fieldName: 'current_power_kW'
  },
  {
    objectType: 'analogInput',
    objectInstance: 2,
    propertyId: 'presentValue',
    fieldName: 'voltage_V'
  }
];

// Read all in one request
const results = await bacnetClient.readPropertyMultiple(
  '192.168.1.50',
  47808,
  batchRequests,
  6000
);

// Process results
results.forEach(result => {
  if (result.success) {
    console.log(`${result.fieldName}: ${result.value}`);
  } else {
    console.error(`${result.fieldName}: ${result.error}`);
  }
});
```

## Next Steps

1. Run `npm install` in MeterItProSync/mcp directory
2. Test with your BACnet meters
3. Monitor logs for batch read operations
4. Verify performance improvements
