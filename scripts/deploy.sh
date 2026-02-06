#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Pulling latest changes..."
git pull

echo "Building containers..."
docker compose -f docker-compose.prod.yml --env-file .env.production build

echo "Starting services..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo "Cleaning up old images..."
docker image prune -f

echo "Deploy complete."
docker compose -f docker-compose.prod.yml ps
