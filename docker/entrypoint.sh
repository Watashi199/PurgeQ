#!/bin/bash
# Entry point script for API container

set -e

echo "PurgeQ API Starting..."

# Wait for database
echo "Waiting for database..."
until PGPASSWORD="$DB_PASSWORD" psql -h "postgres" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 1
done
echo "Database is available!"

# Wait for Redis
echo "Waiting for Redis..."
until redis-cli -h "redis" -p 6379 ping 2>/dev/null | grep -q PONG; do
  echo "Redis is unavailable - sleeping"
  sleep 1
done
echo "Redis is available!"

# Run migrations
echo "Running database migrations..."
alembic upgrade head || true

echo "Starting API server..."
exec uvicorn api.app.main:app --host 0.0.0.0 --port 8000 --reload
