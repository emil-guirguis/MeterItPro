# BACnet Meter Reading Agent - Disabled

## Location

The BACnet Meter Reading Agent is initialized and started in:

**File:** `MeterItProSync/mcp/src/index.ts`

**Lines:** 145-157

## Code

### Before (Enabled)
```typescript
// Start BACnet Meter Reading Agent
console.log('▶️  [Services] Starting BACnet Meter Reading Agent...');
await this.bacnetMeterReadingAgent.start();
console.log('✅ [Services] BACnet Meter Reading Agent started');
```

### After (Disabled)
```typescript
// Start BACnet Meter Reading Agent
console.log('▶️  [Services] Starting BACnet Meter Reading Agent...');
// DISABLED: await this.bacnetMeterReadingAgent.start();
console.log('⏸️  [Services] BACnet Meter Reading Agent disabled (not started)');
```

## What This Does

The BACnet Meter Reading Agent:
- Collects meter readings from BACnet devices
- Runs on a schedule (default: every 60 seconds)
- Stores readings in the local database
- Can be triggered manually via the UI

## Why Disable It

You might want to disable it to:
- Focus on meter sync functionality
- Avoid BACnet connection errors
- Reduce system load during testing
- Debug other components

## How to Re-enable

To re-enable the agent, change the code back to:

```typescript
// Start BACnet Meter Reading Agent
console.log('▶️  [Services] Starting BACnet Meter Reading Agent...');
await this.bacnetMeterReadingAgent.start();
console.log('✅ [Services] BACnet Meter Reading Agent started');
```

## Related Components

### Initialization
- **File:** `MeterItProSync/mcp/src/index.ts` (line 145)
- **Class:** `BACnetMeterReadingAgent`
- **File:** `MeterItProSync/mcp/src/bacnet-collection/bacnet-reading-agent.ts`

### API Endpoints
- `GET /api/meter-reading/status` - Get agent status
- `POST /api/meter-reading/trigger` - Manually trigger collection

### Frontend Component
- **File:** `MeterItProSync/frontend/src/components/BACnetMeterReadingCard.tsx`
- Shows agent status and allows manual triggering

## Configuration

The agent is configured with environment variables:

```bash
BACNET_COLLECTION_INTERVAL_SECONDS=60      # Collection interval
BACNET_AUTO_START=false                     # Auto-start on server start
BACNET_INTERFACE=0.0.0.0                    # BACnet interface
BACNET_PORT=47808                           # BACnet port
BACNET_CONNECTION_TIMEOUT_MS=5000           # Connection timeout
BACNET_READ_TIMEOUT_MS=3000                 # Read timeout
```

## Rebuild and Test

1. **Rebuild the project:**
   ```bash
   cd MeterItProSync/mcp
   npm run build
   ```

2. **Restart the MCP server:**
   - Stop the current server (Ctrl+C)
   - Start it again: `npm run dev`

3. **Check the console output:**
   ```
   📊 [Services] Initializing BACnet Meter Reading Agent...
   ✅ [Services] BACnet Meter Reading Agent initialized
   ▶️  [Services] Starting BACnet Meter Reading Agent...
   ⏸️  [Services] BACnet Meter Reading Agent disabled (not started)
   ```

4. **Verify in the UI:**
   - Open http://localhost:3003
   - Go to Sync Status page
   - The "BACnet Meter Reading Agent" card should show "Stopped"

## Other Agents

The MCP server also has:

1. **Meter Sync Agent** - Syncs meter configuration from remote database
   - Still enabled
   - Runs on schedule (default: every 60 minutes)

2. **Sync Manager** - Syncs readings to client system
   - Still enabled
   - Runs on schedule

## Notes

- The agent is still initialized, just not started
- The API endpoints still work (they'll return "not running" status)
- The UI will show the agent as stopped
- You can re-enable it anytime by uncommenting the `await` line

## Files Modified

- `MeterItProSync/mcp/src/index.ts` - Disabled the `start()` call
