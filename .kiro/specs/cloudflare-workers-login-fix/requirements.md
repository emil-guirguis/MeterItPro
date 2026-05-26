# Cloudflare Workers Login Fix - Requirements

## Overview
After migrating from Node.js to Cloudflare Workers, the login endpoint returns a 500 error. The frontend is unable to authenticate users on the deployed site.

## User Stories

### 1. Frontend API Configuration
As a user accessing the deployed site, I need the frontend to connect to the correct Cloudflare Workers API endpoint so that login requests reach the deployed backend.

**Acceptance Criteria:**
- Frontend environment variable `VITE_API_BASE_URL` points to the Cloudflare Workers API URL
- Login requests are sent to `https://meteritpro-api.emilguirguis.workers.dev/api/auth/login`
- API responses are properly received and processed

### 2. Environment Variables Verification
As a developer, I need to verify that all required environment variables are properly configured in the Cloudflare Workers deployment so that the API functions correctly.

**Acceptance Criteria:**
- `JWT_SECRET` is set in Cloudflare Workers secrets
- `DATABASE_URL` is configured for Hyperdrive connection
- `FRONTEND_URL` is set to the correct production domain
- All environment variables are accessible to the Worker

### 3. Error Handling and Logging
As a developer, I need clear error messages and logging from the login endpoint so that I can diagnose any remaining issues.

**Acceptance Criteria:**
- Login endpoint logs detailed error information to console
- Error responses include meaningful messages (not generic 500 errors)
- Database connection errors are clearly identified
- Authentication failures are properly logged

## Current Issues

1. **Frontend API URL Mismatch**: Frontend still points to `http://localhost:3001/api` instead of Cloudflare Workers URL
2. **Potential Environment Variable Issues**: JWT_SECRET and DATABASE_URL may not be properly configured in Cloudflare
3. **Generic 500 Error**: Login endpoint returns generic 500 error without details

## Success Criteria

- User can successfully log in via the deployed Cloudflare Workers API
- Frontend correctly connects to the Workers endpoint
- All environment variables are properly configured
- Error messages are clear and actionable
