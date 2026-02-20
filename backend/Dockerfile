# syntax=docker/dockerfile:1

# Stage 1: Build
FROM node:24-alpine AS builder

WORKDIR /app

COPY backend/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

COPY backend/ .
RUN npm run build

# Stage 2: Production
FROM node:24-alpine

WORKDIR /app

COPY --from=builder /app/package*.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --omit=dev

COPY --from=builder /app/dist ./dist

RUN mkdir -p uploads

EXPOSE 3000

CMD ["node", "dist/main"]
