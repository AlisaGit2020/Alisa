#!/bin/bash
set -e

cd "$(dirname "$0")/.."

echo "Pulling latest changes..."
git pull

echo "Building containers..."
DOCKER_BUILDKIT=1 docker compose -f docker-compose.prod.yml --env-file .env.production build

echo "Starting services..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo "Waiting for services to initialize (migrations run on container startup)..."
sleep 15

echo "Cleaning up old images..."
docker image prune -f

echo "Deploy complete."
docker compose -f docker-compose.prod.yml --env-file .env.production ps
