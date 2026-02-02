#!/bin/bash

# Skill Connect - Production Setup Script
# This script sets up the entire application for production deployment

set -e

echo "=========================================="
echo "Skill Connect - Production Setup"
echo "=========================================="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

echo "✅ Docker is installed"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

echo "✅ Docker Compose is installed"
echo ""

# Navigate to project directory
cd "$(dirname "$0")"
PROJECT_DIR=$(pwd)

echo "📁 Project Directory: $PROJECT_DIR"
echo ""

# Clean up old containers and volumes (optional)
echo "🧹 Cleaning up old containers and volumes..."
docker-compose down -v 2>/dev/null || true
echo ""

# Create necessary directories
echo "📂 Creating necessary directories..."
mkdir -p backend/uploads
mkdir -p frontend/build
echo "✅ Directories created"
echo ""

# Build images
echo "🔨 Building Docker images..."
echo "   Building backend..."
docker-compose build backend

echo "   Building frontend..."
docker-compose build frontend
echo "✅ Images built successfully"
echo ""

# Start services
echo "🚀 Starting services..."
docker-compose up -d postgres
echo "   ⏳ Waiting for PostgreSQL to be ready..."
sleep 15

docker-compose up -d minio
echo "   ⏳ Waiting for MinIO to be ready..."
sleep 10

docker-compose up -d mailpit
echo "   ⏳ Waiting for Mailpit to be ready..."
sleep 5

docker-compose up -d backend
echo "   ⏳ Waiting for Backend to be ready..."
sleep 30

docker-compose up -d frontend
echo "   ⏳ Waiting for Frontend to be ready..."
sleep 30

echo "✅ All services started"
echo ""

# Check service status
echo "📊 Service Status:"
docker-compose ps
echo ""

# Display URLs
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "🌐 Application URLs:"
echo "   Frontend:   http://localhost:3000"
echo "   Backend:    http://localhost:5000"
echo "   MinIO UI:   http://localhost:9001"
echo "   Mailpit UI: http://localhost:8025"
echo ""
echo "📚 API Documentation:"
echo "   Health Check: http://localhost:5000/health"
echo "   Ready Check:  http://localhost:5000/api/ready"
echo ""
echo "🔐 MinIO Credentials:"
echo "   Username: minioadmin"
echo "   Password: minioadmin@123456"
echo ""
echo "📧 Default Admin Credentials:"
echo "   Email:    admin@skillconnect.com"
echo "   Password: admin123"
echo ""
echo "⚠️  IMPORTANT: Change default credentials in production!"
echo ""
echo "Commands:"
echo "   View logs:     docker-compose logs -f"
echo "   Stop:          docker-compose down"
echo "   Restart:       docker-compose restart"
echo "=========================================="
