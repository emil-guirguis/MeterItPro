# Stage 1 — build the React app
FROM node:24-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --legacy-peer-deps
COPY tsconfig*.json index.html vite.config.ts ./
COPY src ./src
# VITE_API_URL=/ lets nginx proxy /api to the local sync-api (machine-agnostic)
# VITE_CLIENT_API_URL is the fixed remote API — same on all machines
ARG VITE_API_URL=/
ARG VITE_CLIENT_API_URL=https://meteritpro.com/api
ARG VITE_APP_VERSION=dev
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_CLIENT_API_URL=$VITE_CLIENT_API_URL
ENV VITE_APP_VERSION=$VITE_APP_VERSION
RUN npm run build

# Stage 2 — serve with nginx
FROM nginx:stable-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
