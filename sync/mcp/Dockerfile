FROM node:24 AS builder
WORKDIR /build/sync/mcp
COPY sync/mcp/package*.json ./
RUN npm ci --legacy-peer-deps
COPY sync/mcp/tsconfig.json ./
COPY sync/mcp/src ./src
COPY framework /build/framework
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY sync/mcp/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps
COPY --from=builder /build/sync/mcp/dist ./dist
COPY sync/mcp/migrations ./migrations
# MCP HTTP port (internal, used by sync-api for meter connectivity checks)
EXPOSE 3003
CMD ["node", "dist/sync/mcp/src/index.js"]
