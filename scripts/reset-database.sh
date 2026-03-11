#!/bin/bash

# Script to reset database in Docker
# This will drop the database volume and recreate it

echo "🛑 Stopping containers..."
docker compose down

echo "🗑️  Removing PostgreSQL volume..."
docker volume rm backend_postgres-data 2>/dev/null || echo "Volume may not exist, continuing..."

echo "🚀 Starting containers..."
docker compose up -d postgres

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

echo "✅ Database reset complete!"
echo ""
echo "📝 Next steps:"
echo "   1. Run migrations: docker exec -it backend-api-1 sh -c 'npm run typeorm:migration:run'"
echo "   2. (Optional) Seed data: docker exec -it backend-api-1 sh -c 'npm run seed'"
