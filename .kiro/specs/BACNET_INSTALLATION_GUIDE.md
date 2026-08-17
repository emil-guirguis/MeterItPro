# BACnet Library Installation Guide

## Quick Start

### Step 1: Install Dependencies
```bash
cd MeterItProSync/mcp
npm install
```

This will install `bacnet-node@^0.2.23` and all other required packages.

### Step 2: Verify Installation
```bash
npm list bacnet-node
```

You should see:
```
bacnet-node@0.2.23
```

### Step 3: Build the Project
```bash
npm run build
```

### Step 4: Test the Installation
```bash
npm run dev
```

## What Changed

### Old Library (bacstack)
- Single property reads only
- Sequential requests for multiple registers
- Limited timeout configuration

### New Library (bacnet-node)
- ✅ Batch property reads (multiple registers in one request)
- ✅ Better timeout handling
- ✅ Active community support
- ✅ More BACnet services supported

## Key Features

### Batch Reading
Instead of reading 10 registers with 10 separate network calls:
```typescript
// OLD WAY (10 calls)
for (const register of registers) {
  const value = await bacnetClient.readProperty(...);
}

// NEW WAY (1 call)
const results = await bacnetClient.readPropertyMultiple(
  ip, port, batchRequests, timeout
);
```

### Performance Impact
- **10 registers**: ~10x faster
- **50 registers**: ~50x faster
- **100 registers**: ~100x faster

## Troubleshooting

### npm install fails
```
npm error code ETARGET
npm error notarget No matching version found for bacnet-node@...
```

**Solution**: Make sure you're using the correct version:
```bash
npm install bacnet-node@0.2.23
```

### Module not found error
```
Error: Cannot find module 'bacnet-node'
```

**Solution**: Run `npm install` in the MeterItProSync/mcp directory:
```bash
cd MeterItProSync/mcp
npm install
```

### TypeScript compilation errors
```
error TS2307: Cannot find module 'bacnet-node'
```

**Solution**: Rebuild TypeScript:
```bash
npm run build
```

## Verification

After installation, verify the batch reading is working by checking the logs:

```
Performing batch read of 10 registers from meter 12345
BACnet batch read successful: 192.168.1.50:47808 analogInput:1 = 123.45
BACnet batch read successful: 192.168.1.50:47808 analogInput:2 = 456.78
...
```

## Support

For issues with bacnet-node, visit:
- GitHub: https://github.com/fh-kiel/node-bacnet
- NPM: https://www.npmjs.com/package/bacnet-node
