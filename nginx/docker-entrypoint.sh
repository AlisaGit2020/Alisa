#!/bin/sh
set -e

# Substitute only $DOMAIN in the nginx config template
envsubst '${DOMAIN}' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# If SSL certificates don't exist yet, use HTTP-only config for initial setup
if [ ! -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
  echo "SSL certificates not found. Starting with HTTP-only config for certificate provisioning."
  cat > /etc/nginx/conf.d/default.conf <<'HTTPCONF'
server {
    listen 80;
    server_name _;

    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files $uri $uri/ /index.html;
    }
}
HTTPCONF
fi

exec nginx -g 'daemon off;'
