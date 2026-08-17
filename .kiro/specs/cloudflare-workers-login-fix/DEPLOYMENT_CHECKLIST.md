# Cloudflare Workers Deployment Checklist

## Quick Fix Applied
✅ Updated frontend `.env` file to point to Cloudflare Workers API: `https://meteritpro-api.emilguirguis.workers.dev/api`

## Verification Steps

### 1. Frontend Configuration
- [x] `.env` updated with correct API URL
- [x] `.env.production` already has correct URL
- [ ] Rebuild and redeploy frontend to Cloudflare Pages

### 2. Cloudflare Workers Secrets
Verify these secrets are set in your Cloudflare Workers dashboard:

```bash
# Check if secrets are set (run these commands):
npx wrangler secret list

# If not set, add them:
npx wrangler secret put JWT_SECRET
npx wrangler secret put DATABASE_URL
```

**Required Secrets:**
- `JWT_SECRET` - Your JWT signing key (same as Node.js version)
- `DATABASE_URL` - PostgreSQL connection string for Hyperdrive

### 3. Hyperdrive Configuration
- [ ] Verify Hyperdrive binding ID in `wrangler.toml` is correct: `48644504510e40829be6f314dacc1ef3`
- [ ] Test database connection: `curl https://meteritpro-api.emilguirguis.workers.dev/api/health`
- [ ] Expected response: `{"status":"OK","database":"Connected",...}`

### 4. CORS Configuration
- [ ] Verify `FRONTEND_URL` in `wrangler.toml` is set to your production domain
- [ ] Current setting: `https://meteritpro.com`
- [ ] If using different domain, update `wrangler.toml`

### 5. Environment Variables
Check `wrangler.toml` [vars] section:
```toml
[vars]
NODE_ENV = "production"
FRONTEND_URL = "https://meteritpro.com"
```

### 6. Test Login Flow
1. Open browser DevTools (F12)
2. Go to Network tab
3. Attempt login
4. Check the POST request to `/api/auth/login`
5. Look for:
   - Status code (should be 200 for success, 401 for invalid credentials)
   - Response body (should contain token and user data)
   - Any error messages in console

### 7. Common Issues & Solutions

**Issue: 500 Error on Login**
- Check Cloudflare Workers logs: `npx wrangler tail`
- Verify JWT_SECRET is set and matches Node.js version
- Verify DATABASE_URL is correct and Hyperdrive is connected

**Issue: CORS Error**
- Verify FRONTEND_URL in wrangler.toml matches your domain
- Check browser console for CORS error details
- Ensure frontend is using correct API URL

**Issue: Database Connection Failed**
- Test Hyperdrive: `curl https://meteritpro-api.emilguirguis.workers.dev/api/health`
- Verify DATABASE_URL secret is set
- Check Hyperdrive configuration in Cloudflare dashboard

## Deployment Commands

```bash
# Build and deploy Workers API
cd MeterItPro/api
npm run build
npx wrangler deploy

# Rebuild and deploy frontend
cd MeterItPro/frontend
npm run build
# Deploy to Cloudflare Pages (via dashboard or CLI)
```

## Next Steps

1. Update frontend `.env` ✅ (DONE)
2. Rebuild frontend with new API URL
3. Verify Cloudflare Workers secrets are set
4. Test login endpoint
5. Check Cloudflare Workers logs for any errors
6. Monitor production for issues
