# syntax=docker/dockerfile:1

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/

# Install deps needed for builds
RUN npm ci --prefix backend --include=dev
RUN npm ci --prefix frontend --include=dev

COPY . .
# Build frontend and backend
RUN npm --prefix frontend run build
RUN npm --prefix backend run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NODE_PATH=/app/backend/node_modules

COPY package*.json ./
COPY backend/package*.json ./backend/
COPY frontend/package*.json ./frontend/
# Install backend runtime deps
RUN npm ci --omit=dev --prefix backend

# Bring over built assets (server + client)
COPY --from=builder /app/build ./build

EXPOSE 8080

CMD ["node", "build/server/index.js"]
