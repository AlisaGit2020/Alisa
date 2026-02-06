# Stage 1: Build frontend
FROM node:20-alpine AS builder

WORKDIR /app

# Copy frontend package files and install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Copy frontend source
COPY frontend/ .

# Copy backend/src for @alisa-backend path alias resolution
COPY backend/src/ ../backend/src/

ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

RUN npm run build

# Stage 2: Nginx
FROM nginx:1.27-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/nginx.conf
COPY nginx/conf.d/default.conf.template /etc/nginx/templates/default.conf.template

# Copy custom entrypoint that substitutes only $DOMAIN
COPY nginx/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

# Copy built frontend assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Create directories for certbot and uploads
RUN mkdir -p /var/www/certbot /app/uploads

EXPOSE 80 443

ENTRYPOINT ["/docker-entrypoint.sh"]
