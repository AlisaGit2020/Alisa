#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Pulling latest changes..."
git pull

echo "Stopping containers to free memory for build..."
docker compose -f docker-compose.prod.yml --env-file .env.production down

echo "Building containers (sequentially to avoid OOM on 4GB server)..."
# Build one at a time to prevent memory exhaustion
DOCKER_BUILDKIT=1 docker compose -f docker-compose.prod.yml --env-file .env.production build backend
DOCKER_BUILDKIT=1 docker compose -f docker-compose.prod.yml --env-file .env.production build nginx

echo "Starting services..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo "Waiting for services to initialize (migrations run on container startup)..."
sleep 15

echo "Cleaning up old images..."
docker image prune -f

echo "Deploy complete."
docker compose -f docker-compose.prod.yml --env-file .env.production ps
