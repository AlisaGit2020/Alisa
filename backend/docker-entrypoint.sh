#!/bin/sh
set -e

echo "Running database migrations..."
npm run migration:run:prod

echo "Starting application..."
exec node dist/main
