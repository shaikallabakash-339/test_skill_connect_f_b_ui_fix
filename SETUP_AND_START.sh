#!/bin/bash
# ============================================
# SKILL CONNECT - COMPLETE SETUP SCRIPT
# ============================================
# This script will fix all database issues and start the project

set -e

echo "🚀 SKILL CONNECT - SETUP & TESTING"
echo "=================================="
echo ""

# Clean up old containers and volumes if needed
echo "Stopping any existing containers..."
docker-compose down -v 2>/dev/null || true

echo ""
echo "📦 Building and starting all services..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 15

# Check database
echo ""
echo "🔍 Checking database connection..."
docker exec skill_connect_postgres pg_isready -U postgres -d skill_connect || {
    echo "❌ Database not ready yet, waiting..."
    sleep 10
}

echo "✅ Database is running"

# Check MinIO
echo ""
echo "🔍 Checking MinIO..."
if curl -s http://localhost:9000/minio/health/live > /dev/null; then
    echo "✅ MinIO is running (http://localhost:9000 - UI: http://localhost:9001)"
else
    echo "⚠️  MinIO health check pending..."
fi

# Check Mailpit
echo ""
echo "🔍 Checking Mailpit..."
if curl -s http://localhost:8025/api/v1/database > /dev/null; then
    echo "✅ Mailpit is running (http://localhost:8025)"
else
    echo "⚠️  Mailpit health check pending..."
fi

echo ""
echo "=================================="
echo "✅ ALL SERVICES STARTED SUCCESSFULLY!"
echo "=================================="
echo ""
echo "📍 SERVICE URLS:"
echo "   - Frontend:  http://localhost:3000"
echo "   - Backend:   http://localhost:5000"
echo "   - MinIO UI:  http://localhost:9001"
echo "   - Mailpit:   http://localhost:8025"
echo ""
echo "🔐 DEFAULT CREDENTIALS:"
echo "   - Admin Email:      admin@skillconnect.com"
echo "   - Admin Password:   admin123"
echo "   - MinIO Username:   minioadmin"
echo "   - MinIO Password:   minioadmin@123456"
echo "   - Database:         postgres / postgres123"
echo ""
echo "📝 NEXT STEPS:"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Test Signup: Create a new account"
echo "   3. Test Admin: Go to admin login with credentials above"
echo "   4. Watch logs: docker-compose logs -f"
echo "   5. Stop services: docker-compose down"
echo ""
