#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Pulling latest changes..."
git pull

echo "Building containers (sequential to reduce memory usage)..."
DOCKER_BUILDKIT=1 docker compose -f docker-compose.prod.yml --env-file .env.production build

echo "Starting services..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo "Waiting for services to initialize..."
sleep 10

echo "Running database migrations..."
docker compose -f docker-compose.prod.yml --env-file .env.production exec -T backend npm run migration:run:prod

echo "Cleaning up old images..."
docker image prune -f

echo "Deploy complete."
docker compose -f docker-compose.prod.yml --env-file .env.production ps
