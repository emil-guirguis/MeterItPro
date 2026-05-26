# BACnet Meter Reading Agent Configuration

This document describes all configuration options for the BACnet Meter Reading Agent, including timeout settings and feature flags.

## Overview

The BACnet Meter Reading Agent can be configured through environment variables. All configuration options have sensible defaults, so you only need to set values that differ from the defaults.

## Timeout Configuration

### Batch Read Timeout

**Environment Variable:** `BACNET_BATCH_READ_TIMEOUT_MS`  
**Default Value:** `5000` (milliseconds)  
**Description:** Maximum time allowed for a batch read operation to complete. When a batch read exceeds this timeout, the system returns partial results for any registers that completed before the timeout.

**Example:**
```bash
BACNET_BATCH_READ_TIMEOUT_MS=7000
```

### Sequential Read Timeout

**Environment Variable:** `BACNET_SEQUENTIAL_READ_TIMEOUT_MS`  
**Default Value:** `3000` (milliseconds)  
**Description:** Maximum time allowed for individual sequential read operations when falling back from batch reads. This timeout applies to each register read individually.

**Example:**
```bash
BACNET_SEQUENTIAL_READ_TIMEOUT_MS=4000
```

### Connectivity Check Timeout

**Environment Variable:** `BACNET_CONNECTIVITY_CHECK_TIMEOUT_MS`  
**Default Value:** `2000` (milliseconds)  
**Description:** Maximum time allowed for a connectivity check operation. This is used to verify if a meter is online before attempting batch reads.

**Example:**
```bash
BACNET_CONNECTIVITY_CHECK_TIMEOUT_MS=3000
```

### Connection Timeout

**Environment Variable:** `BACNET_CONNECTION_TIMEOUT_MS`  
**Default Value:** `5000` (milliseconds)  
**Description:** APDU-level timeout for BACnet protocol operations. This is the underlying timeout for all BACnet communication.

**Example:**
```bash
BACNET_CONNECTION_TIMEOUT_MS=6000
```

## Feature Flags

Feature flags allow you to enable or disable specific functionality in the BACnet Meter Reading Agent.

### Enable Connectivity Check

**Environment Variable:** `BACNET_ENABLE_CONNECTIVITY_CHECK`  
**Default Value:** `true`  
**Valid Values:** `true`, `false`  
**Description:** When enabled, the system performs a connectivity check before attempting to read from a meter. This prevents timeouts for offline meters and improves overall reliability.

**Example:**
```bash
BACNET_ENABLE_CONNECTIVITY_CHECK=true
```

### Enable Sequential Fallback

**Environment Variable:** `BACNET_ENABLE_SEQUENTIAL_FALLBACK`  
**Default Value:** `true`  
**Valid Values:** `true`, `false`  
**Description:** When enabled, if a batch read fails completely, the system falls back to reading registers sequentially. This improves data collection reliability when batch operations are unreliable.

**Example:**
```bash
BACNET_ENABLE_SEQUENTIAL_FALLBACK=true
```

### Enable Adaptive Batch Sizing

**Environment Variable:** `BACNET_ADAPTIVE_BATCH_SIZING`  
**Default Value:** `true`  
**Valid Values:** `true`, `false`  
**Description:** When enabled, the system automatically reduces batch size when timeouts occur. This helps find the optimal batch size for each meter and improves reliability over time.

**Example:**
```bash
BACNET_ADAPTIVE_BATCH_SIZING=true
```

## Collection Configuration

### Collection Interval

**Environment Variable:** `BACNET_COLLECTION_INTERVAL_SECONDS`  
**Default Value:** `60` (seconds)  
**Description:** How often the system performs a complete collection cycle (reading all meters).

**Example:**
```bash
BACNET_COLLECTION_INTERVAL_SECONDS=120
```

### Auto Start

**Environment Variable:** `BACNET_AUTO_START`  
**Default Value:** `true`  
**Valid Values:** `true`, `false`  
**Description:** When enabled, the BACnet Meter Reading Agent automatically starts when the MCP server starts. When disabled, you must manually trigger collection.

**Example:**
```bash
BACNET_AUTO_START=true
```

## BACnet Network Configuration

### BACnet Interface

**Environment Variable:** `BACNET_INTERFACE`  
**Default Value:** `0.0.0.0`  
**Description:** The network interface to bind the BACnet client to. Use `0.0.0.0` to listen on all interfaces.

**Example:**
```bash
BACNET_INTERFACE=192.168.1.100
```

### BACnet Port

**Environment Variable:** `BACNET_PORT`  
**Default Value:** `47808`  
**Description:** The UDP port for BACnet communication. Standard BACnet port is 47808.

**Example:**
```bash
BACNET_PORT=47808
```

## Complete Configuration Example

Here's a complete example `.env` file with all BACnet configuration options:

```bash
# Timeout Configuration (in milliseconds)
BACNET_BATCH_READ_TIMEOUT_MS=5000
BACNET_SEQUENTIAL_READ_TIMEOUT_MS=3000
BACNET_CONNECTIVITY_CHECK_TIMEOUT_MS=2000
BACNET_CONNECTION_TIMEOUT_MS=5000

# Feature Flags
BACNET_ENABLE_CONNECTIVITY_CHECK=true
BACNET_ENABLE_SEQUENTIAL_FALLBACK=true
BACNET_ADAPTIVE_BATCH_SIZING=true

# Collection Configuration
BACNET_COLLECTION_INTERVAL_SECONDS=60
BACNET_AUTO_START=true

# BACnet Network Configuration
BACNET_INTERFACE=0.0.0.0
BACNET_PORT=47808
```

## Configuration Recommendations

### For Reliable Networks

If your network is stable and meters respond quickly:

```bash
BACNET_BATCH_READ_TIMEOUT_MS=3000
BACNET_SEQUENTIAL_READ_TIMEOUT_MS=2000
BACNET_CONNECTIVITY_CHECK_TIMEOUT_MS=1000
BACNET_ENABLE_CONNECTIVITY_CHECK=true
BACNET_ENABLE_SEQUENTIAL_FALLBACK=true
BACNET_ADAPTIVE_BATCH_SIZING=true
```

### For Unreliable Networks

If your network is unstable or meters respond slowly:

```bash
BACNET_BATCH_READ_TIMEOUT_MS=10000
BACNET_SEQUENTIAL_READ_TIMEOUT_MS=5000
BACNET_CONNECTIVITY_CHECK_TIMEOUT_MS=3000
BACNET_ENABLE_CONNECTIVITY_CHECK=true
BACNET_ENABLE_SEQUENTIAL_FALLBACK=true
BACNET_ADAPTIVE_BATCH_SIZING=true
```

### For Maximum Performance

If you want to prioritize speed over reliability:

```bash
BACNET_BATCH_READ_TIMEOUT_MS=2000
BACNET_SEQUENTIAL_READ_TIMEOUT_MS=1000
BACNET_CONNECTIVITY_CHECK_TIMEOUT_MS=500
BACNET_ENABLE_CONNECTIVITY_CHECK=false
BACNET_ENABLE_SEQUENTIAL_FALLBACK=false
BACNET_ADAPTIVE_BATCH_SIZING=false
```

### For Maximum Reliability

If you want to prioritize reliability over speed:

```bash
BACNET_BATCH_READ_TIMEOUT_MS=15000
BACNET_SEQUENTIAL_READ_TIMEOUT_MS=8000
BACNET_CONNECTIVITY_CHECK_TIMEOUT_MS=5000
BACNET_ENABLE_CONNECTIVITY_CHECK=true
BACNET_ENABLE_SEQUENTIAL_FALLBACK=true
BACNET_ADAPTIVE_BATCH_SIZING=true
```

## Monitoring Configuration

The BACnet Meter Reading Agent collects metrics about timeout events and offline meters. These metrics are available through the `get_meter_reading_status` MCP tool and include:

- Total timeout events
- Timeout events per meter
- Average timeout recovery time
- List of offline meters with consecutive failure counts
- Recovery methods used (batch size reduction, sequential fallback, offline)

## Troubleshooting

### Frequent Timeouts

If you're experiencing frequent timeouts:

1. Increase `BACNET_BATCH_READ_TIMEOUT_MS` to give meters more time to respond
2. Enable `BACNET_ADAPTIVE_BATCH_SIZING` to automatically reduce batch sizes
3. Enable `BACNET_ENABLE_SEQUENTIAL_FALLBACK` to fall back to sequential reads
4. Check network connectivity and meter responsiveness

### Slow Collection Cycles

If collection cycles are taking too long:

1. Decrease `BACNET_BATCH_READ_TIMEOUT_MS` to fail faster on unresponsive meters
2. Disable `BACNET_ENABLE_CONNECTIVITY_CHECK` if connectivity checks are slow
3. Disable `BACNET_ENABLE_SEQUENTIAL_FALLBACK` to skip sequential fallback
4. Increase `BACNET_COLLECTION_INTERVAL_SECONDS` to run cycles less frequently

### Offline Meters Not Being Detected

If offline meters are not being properly detected:

1. Enable `BACNET_ENABLE_CONNECTIVITY_CHECK` to check meter connectivity
2. Decrease `BACNET_CONNECTIVITY_CHECK_TIMEOUT_MS` to detect offline meters faster
3. Check that meters are actually offline and not just slow to respond

## Environment Variable Parsing

All timeout values are parsed as integers (milliseconds). All feature flags are parsed as booleans:
- `true` values: `true`, `1`, `yes`, `on`
- `false` values: `false`, `0`, `no`, `off`, or any other value

For example, these are all equivalent:
```bash
BACNET_ENABLE_CONNECTIVITY_CHECK=true
BACNET_ENABLE_CONNECTIVITY_CHECK=1
BACNET_ENABLE_CONNECTIVITY_CHECK=yes
```

And these are all equivalent:
```bash
BACNET_ENABLE_CONNECTIVITY_CHECK=false
BACNET_ENABLE_CONNECTIVITY_CHECK=0
BACNET_ENABLE_CONNECTIVITY_CHECK=no
```
