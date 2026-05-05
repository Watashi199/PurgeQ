#!/bin/bash
# Wait for database
echo "Waiting for database..."
while ! PGPASSWORD="$DB_PASSWORD" psql -h postgres -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "Database is unavailable - sleeping"
  sleep 1
done
echo "Database is available!"

# Run migrations
echo "Running migrations..."
alembic upgrade head

# Start API
echo "Starting API..."
exec uvicorn api.app.main:app --host 0.0.0.0 --port 8000 --reload