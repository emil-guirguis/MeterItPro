# Build context is the repo root (MeterItProSync/api imports framework/backend/shared)
FROM node:24 AS builder
WORKDIR /build/MeterItProSync/api
COPY MeterItProSync/api/package*.json ./
RUN npm ci --legacy-peer-deps
COPY MeterItProSync/api/tsconfig.json ./
COPY MeterItProSync/api/src ./src
COPY framework /build/framework
RUN npm run build

FROM node:24-slim
WORKDIR /app
ENV NODE_ENV=production
COPY MeterItProSync/api/package*.json ./
RUN npm ci --omit=dev --legacy-peer-deps
COPY --from=builder /build/MeterItProSync/api/dist ./dist
EXPOSE 3002
CMD ["node", "dist/MeterItProSync/api/src/server.js"]
