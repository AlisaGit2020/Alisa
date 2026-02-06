#!/bin/bash
set -e

cd "$(dirname "$0")/.."

if [ -z "$1" ]; then
  echo "Usage: $0 <domain> [email]"
  echo "Example: $0 alisa.example.com admin@example.com"
  exit 1
fi

DOMAIN=$1
EMAIL=${2:-""}

echo "Requesting SSL certificate for ${DOMAIN}..."

# Start nginx temporarily with HTTP only for the ACME challenge
# Create a temporary config that only serves HTTP
docker compose -f docker-compose.prod.yml --env-file .env.production up -d nginx

# Request the certificate
if [ -n "$EMAIL" ]; then
  docker compose -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot \
    --webroot-path=/var/www/certbot \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    -d "$DOMAIN"
else
  docker compose -f docker-compose.prod.yml run --rm certbot \
    certonly --webroot \
    --webroot-path=/var/www/certbot \
    --register-unsafely-without-email \
    --agree-tos \
    -d "$DOMAIN"
fi

echo "SSL certificate obtained. Restarting nginx..."
docker compose -f docker-compose.prod.yml --env-file .env.production restart nginx

echo "SSL setup complete for ${DOMAIN}"
