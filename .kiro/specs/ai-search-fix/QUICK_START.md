# AI Search Feature - Quick Start

## TL;DR
The AI search feature is implemented and tested. To use it:

1. **Start Backend**
   ```bash
   cd client/backend && npm run dev
   ```

2. **Start Frontend**
   ```bash
   cd MeterItPro/frontend && npm run dev
   ```

3. **Login** to the application

4. **Search** using the search bar in the header

## What Works
- ✅ Search bar in header
- ✅ Voice recognition (click microphone)
- ✅ Partial keyword matching
- ✅ Relevance scoring
- ✅ Pagination
- ✅ Error handling
- ✅ 15/15 tests passing

## If Search Returns No Results

### Check 1: Is Backend Running?
```bash
curl http://localhost:3001/api/health
```
Should return `"status": "OK"`

### Check 2: Are You Logged In?
- Open DevTools (F12)
- Go to Application > localStorage
- Look for `auth_token` or `token`
- If missing, login to app

### Check 3: Do Devices Exist?
```bash
psql -U postgres -d meteritpro
SELECT COUNT(*) FROM public.device;
```
Should return > 0

### Check 4: Create Test Device
```sql
INSERT INTO public.device (device_id, tenant_id, name, type, location, status)
VALUES ('device-1', 'your-tenant-id', 'Test Meter', 'meter', 'Building A', 'active');
```

## Test It
```bash
cd client/backend
npm test -- aiSearch.test.js --run
```
Should show: `Tests: 15 passed, 15 total`

## Files
- Backend: `client/backend/src/routes/aiSearch.js`
- Frontend: `framework/frontend/layout/components/Header.tsx`
- Tests: `client/backend/src/routes/aiSearch.test.js`

## Features
- Exact name matching (+10 points)
- Partial name matching (+5 points)
- Type matching (+3 points)
- Location matching (+2 points)
- Status matching (+1 point)
- Case-insensitive search
- Pagination support
- Tenant isolation
- Authentication required

## Troubleshooting
See `TROUBLESHOOTING_GUIDE.md` for detailed help
