# BACnet Timeout Diagnosis

## Current Issue

The BACnet client is timing out when trying to read from meter at `10.10.10.22:47808`:

```
⏱️  BACnet batch read timeout for 10.10.10.22:47808 (1 registers) after 33000ms
```

## Root Cause Analysis

The meter is **not responding to BACnet requests**. This is NOT a database issue - it's a BACnet communication issue.

### Current Timeout Configuration

From `MeterItProSync/mcp/src/index.ts`:
- `readTimeoutMs`: 3000ms (3 seconds)
- `batchReadTimeoutMs`: 5000ms (5 seconds)  
- `sequentialReadTimeoutMs`: 3000ms (3 seconds)
- `connectivityCheckTimeoutMs`: 2000ms (2 seconds)

### Why It's Timing Out

1. Initial batch read times out after 5000ms
2. Batch size is reduced from N to 1
3. Sequential fallback is attempted, times out after 3000ms
4. Process repeats multiple times
5. Total time accumulates to 33000ms+

## Possible Causes

### 1. Meter is Offline
- Check if the meter at `10.10.10.22:47808` is powered on
- Verify network connectivity to the meter
- Check if the IP address is correct

### 2. Meter is Not Responding to BACnet
- Verify the meter supports BACnet protocol
- Check if BACnet is enabled on the meter
- Verify the port 47808 is correct (standard BACnet port)
- Check firewall rules between sync server and meter

### 3. Network Issues
- Check network latency to the meter
- Verify no packet loss on the network path
- Check if there's a firewall blocking BACnet traffic
- Verify the meter is on the same network or properly routed

### 4. Meter Configuration
- Verify the meter's BACnet device ID is correct
- Check if the meter requires authentication
- Verify the meter's APDU size matches the client

## Diagnostic Steps

### Step 1: Test Network Connectivity
```bash
# From the sync server, test if you can reach the meter
ping 10.10.10.22

# Test if port 47808 is open
telnet 10.10.10.22 47808
# or
nc -zv 10.10.10.22 47808
```

### Step 2: Check BACnet Configuration
```bash
# Verify BACnet interface is listening
netstat -an | grep 47808
# or
ss -an | grep 47808
```

### Step 3: Enable Debug Logging
Add to `.env`:
```
LOG_LEVEL=debug
VERBOSE_LOGGING=true
```

Then restart the sync MCP server and check logs for more details.

### Step 4: Test with Longer Timeout
Temporarily increase timeouts to see if the meter eventually responds:

Add to `.env`:
```
BACNET_READ_TIMEOUT_MS=10000
BACNET_BATCH_READ_TIMEOUT_MS=15000
BACNET_SEQUENTIAL_READ_TIMEOUT_MS=10000
BACNET_CONNECTIVITY_CHECK_TIMEOUT_MS=5000
```

If it works with longer timeouts, the meter is slow but functional.

### Step 5: Test Connectivity Check
The system has a connectivity check that runs before reading:
```
Checking connectivity for meter 1 at 10.10.10.22:47808
```

If this fails, the meter is marked as offline and skipped.

## Solutions

### Solution 1: Verify Meter is Online
1. Check meter power and network connection
2. Verify IP address is correct
3. Test ping and port connectivity
4. Check meter's BACnet configuration

### Solution 2: Increase Timeouts (Temporary)
If the meter is slow but functional:
```
BACNET_READ_TIMEOUT_MS=10000
BACNET_BATCH_READ_TIMEOUT_MS=15000
BACNET_SEQUENTIAL_READ_TIMEOUT_MS=10000
```

### Solution 3: Disable Connectivity Check
If connectivity check is causing issues:
```
BACNET_ENABLE_CONNECTIVITY_CHECK=false
```

### Solution 4: Disable Sequential Fallback
If sequential fallback is causing issues:
```
BACNET_ENABLE_SEQUENTIAL_FALLBACK=false
```

### Solution 5: Disable Adaptive Batch Sizing
If batch sizing is causing issues:
```
BACNET_ADAPTIVE_BATCH_SIZING=false
```

## Current Configuration

### Environment Variables
```
BACNET_INTERFACE=0.0.0.0
BACNET_PORT=47808
BACNET_CONNECTION_TIMEOUT_MS=5000
BACNET_READ_TIMEOUT_MS=3000
BACNET_BATCH_READ_TIMEOUT_MS=5000
BACNET_SEQUENTIAL_READ_TIMEOUT_MS=3000
BACNET_CONNECTIVITY_CHECK_TIMEOUT_MS=2000
BACNET_ENABLE_CONNECTIVITY_CHECK=true
BACNET_ENABLE_SEQUENTIAL_FALLBACK=true
BACNET_ADAPTIVE_BATCH_SIZING=true
```

### What Each Setting Does

| Setting | Default | Purpose |
|---------|---------|---------|
| `BACNET_INTERFACE` | 0.0.0.0 | Interface to listen on for BACnet |
| `BACNET_PORT` | 47808 | BACnet UDP port |
| `BACNET_CONNECTION_TIMEOUT_MS` | 5000 | Timeout for establishing connection |
| `BACNET_READ_TIMEOUT_MS` | 3000 | Timeout for single property read |
| `BACNET_BATCH_READ_TIMEOUT_MS` | 5000 | Timeout for batch read |
| `BACNET_SEQUENTIAL_READ_TIMEOUT_MS` | 3000 | Timeout for sequential fallback |
| `BACNET_CONNECTIVITY_CHECK_TIMEOUT_MS` | 2000 | Timeout for connectivity check |
| `BACNET_ENABLE_CONNECTIVITY_CHECK` | true | Check if meter is online before reading |
| `BACNET_ENABLE_SEQUENTIAL_FALLBACK` | true | Fall back to sequential reads on batch timeout |
| `BACNET_ADAPTIVE_BATCH_SIZING` | true | Reduce batch size on timeout |

## Recommended Actions

1. **First**: Verify the meter at `10.10.10.22:47808` is online and reachable
2. **Second**: Check if BACnet is enabled on the meter
3. **Third**: Test with `ping` and `telnet` to confirm connectivity
4. **Fourth**: If meter is slow, increase timeouts
5. **Fifth**: If meter is offline, mark it as offline in the system

## Next Steps

1. Run diagnostic commands from Step 1-2 above
2. Check meter's BACnet configuration
3. Verify network connectivity
4. Report findings and we can adjust configuration accordingly

## Related Files

- `MeterItProSync/mcp/src/bacnet-collection/bacnet-client.ts` - BACnet communication
- `MeterItProSync/mcp/src/bacnet-collection/collection-cycle-manager.ts` - Collection orchestration
- `MeterItProSync/mcp/src/index.ts` - Configuration loading
- `.env` - Environment variables
- `MeterItProSync/mcp/.env` - Sync-specific configuration
