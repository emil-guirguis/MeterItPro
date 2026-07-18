# Build context is the repo root (sync/api imports framework/backend/shared)
FROM node:24 AS builder
WORKDIR /build/sync/api
COPY sync/api/package*.json ./
RUN npm ci --legacy-peer-deps
COPY sync/api/tsconfig.json ./
COPY sync/api/src ./src
COPY framework /build/framework
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY sync/api/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps
COPY --from=builder /build/sync/api/dist ./dist
EXPOSE 3002
CMD ["node", "dist/sync/api/src/server.js"]
