# MeterIt Pro API Documentation

This document describes how to access the API documentation for both the Client API and Sync API.

## Client API (Cloudflare Workers)

The Client API is built with Cloudflare Workers and Hono framework.

### Accessing Swagger UI

**Production:**
- Swagger UI: https://meteritpro.com/swagger
- OpenAPI Spec: https://meteritpro.com/swagger/openapi.json

**Local Development:**
- Swagger UI: http://localhost:8787/swagger
- OpenAPI Spec: http://localhost:8787/swagger/openapi.json

### Starting Local Development

```bash
cd MeterItPro/api
npm run worker:dev
```

The worker will be available at `http://localhost:8787`

### Key Endpoints

- `GET /api/health` - Health check
- `POST /api/auth/login` - User login
- `GET /api/users/me` - Get current user
- `GET /api/meters` - List meters
- `GET /api/meterreadings` - Get meter readings
- `POST /api/sync/connect` - Connect sync client

## Sync API (Node.js Express)

The Sync API is a Node.js Express server that provides local data management and synchronization endpoints.

### Accessing Swagger UI

**Local Development:**
- Swagger UI: http://localhost:3002/swagger
- OpenAPI Spec: http://localhost:3002/swagger/swagger.json

### Starting Local Development

```bash
cd MeterItProSync/api
npm install
npm run dev
```

The API will be available at `http://localhost:3002`

### Key Endpoints

- `GET /health` - Basic health check
- `GET /api/health/sync-db` - Check local sync database
- `GET /api/health/remote-db` - Check remote client database
- `GET /api/health/mcp` - Check MCP server health
- `GET /api/health/remote-api` - Check remote client API
- `GET /api/local/tenant` - Get tenant information
- `POST /api/local/tenant` - Save tenant information
- `GET /api/local/meters` - Get local meters
- `GET /api/local/readings` - Get recent readings
- `GET /api/local/sync-status` - Get sync status

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Sync Frontend (React)                     │
│                   (MeterItProSync/frontend)                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP Requests
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        ▼                                 ▼
┌──────────────────────┐        ┌──────────────────────┐
│   Sync API (Node.js) │        │  Client API (Worker) │
│   Port: 3002         │        │  Port: 8787 (dev)    │
│   Express + Swagger  │        │  Hono + Swagger      │
└──────────────────────┘        └──────────────────────┘
        │                                 │
        │                                 │
        ▼                                 ▼
┌──────────────────────┐        ┌──────────────────────┐
│  Local Sync DB       │        │  Remote Client DB    │
│  (PostgreSQL)        │        │  (PostgreSQL)        │
└──────────────────────┘        └──────────────────────┘
```

## Authentication

### Client API
- Uses JWT Bearer tokens
- Login endpoint: `POST /api/auth/login`
- Include token in Authorization header: `Authorization: Bearer <token>`

### Sync API
- Uses API Key authentication for sync endpoints
- Include API key in header: `X-API-Key: <api_key>`
- Public endpoints (like `/health`) don't require authentication

## Testing the APIs

### Using curl

**Client API:**
```bash
# Health check
curl http://localhost:8787/api/health

# Login
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password"}'
```

**Sync API:**
```bash
# Health check
curl http://localhost:3002/health

# Get tenant info
curl http://localhost:3002/api/local/tenant

# Check sync database
curl http://localhost:3002/api/health/sync-db
```

### Using Swagger UI

1. Open the Swagger UI in your browser (see URLs above)
2. Click on an endpoint to expand it
3. Click "Try it out"
4. Fill in any required parameters
5. Click "Execute"

## Environment Variables

### Sync API (.env)
```
SYNC_API_PORT=3002
DATABASE_URL=postgresql://user:password@localhost:5432/sync_db
REMOTE_DATABASE_URL=postgresql://user:password@localhost:5432/client_db
CLIENT_API_URL=http://localhost:8787
```

### Client API (wrangler.toml)
```
FRONTEND_URL=https://meteritpro.com,http://localhost:5173
```

## Troubleshooting

### Sync API not responding
- Ensure the server is running: `npm run dev` in `MeterItProSync/api`
- Check that port 3002 is not in use
- Verify database connections in `.env`

### Client API not responding
- Ensure the worker is running: `npm run worker:dev` in `MeterItPro/api`
- Check that port 8787 is not in use
- Verify Cloudflare credentials for production deployment

### CORS errors
- Both APIs have CORS enabled for local development
- Check the `FRONTEND_URL` environment variable
- Ensure the frontend origin is in the allowed list

## API Response Format

### Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Operation completed successfully"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
```

## Rate Limiting

- Client API: Rate limiting is configured via `express-rate-limit`
- Sync API: No rate limiting (local network only)

## Support

For issues or questions about the API:
1. Check the Swagger documentation
2. Review the error messages in the response
3. Check the server logs for detailed error information
4. Contact MeterIt Pro Support

