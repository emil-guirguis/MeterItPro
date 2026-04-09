FROM node:22 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
RUN npm ci --omit=dev
COPY --from=builder /app/dist ./dist
COPY migrations ./migrations
# MCP HTTP port (internal, used by sync-api for meter connectivity checks)
EXPOSE 3003
CMD ["node", "dist/index.js"]
