#!/bin/bash

# Skill Connect - Complete Cleanup and Restart Script
# This script safely removes all containers and volumes, then restarts fresh

echo "=========================================="
echo "Skill Connect - Docker Cleanup & Restart"
echo "=========================================="
echo ""

echo "[1/5] Stopping all containers..."
docker-compose down -v --remove-orphans 2>/dev/null || true

echo "[2/5] Removing orphaned containers..."
docker container prune -f 2>/dev/null || true

echo "[3/5] Removing orphaned volumes..."
docker volume prune -f 2>/dev/null || true

echo "[4/5] Killing any processes on ports..."
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:5432 | xargs kill -9 2>/dev/null || true
lsof -ti:1025 | xargs kill -9 2>/dev/null || true
lsof -ti:8025 | xargs kill -9 2>/dev/null || true
lsof -ti:9000 | xargs kill -9 2>/dev/null || true
lsof -ti:9001 | xargs kill -9 2>/dev/null || true

echo "[5/5] Starting fresh containers with rebuild..."
sleep 2
docker-compose up -d --build

echo ""
echo "=========================================="
echo "Waiting for services to be ready..."
echo "=========================================="

# Wait for database
echo "Waiting for PostgreSQL..."
for i in {1..30}; do
  if docker-compose exec -T postgres pg_isready -U admin &>/dev/null; then
    echo "✓ PostgreSQL is ready"
    break
  fi
  echo "  Attempt $i/30..."
  sleep 2
done

# Wait for backend
echo "Waiting for Backend API..."
for i in {1..30}; do
  if curl -s http://localhost:5000/health >/dev/null 2>&1; then
    echo "✓ Backend API is ready"
    break
  fi
  echo "  Attempt $i/30..."
  sleep 2
done

# Wait for frontend
echo "Waiting for Frontend..."
for i in {1..30}; do
  if curl -s http://localhost:3000 >/dev/null 2>&1; then
    echo "✓ Frontend is ready"
    break
  fi
  echo "  Attempt $i/30..."
  sleep 2
done

echo ""
echo "=========================================="
echo "✓ All services are ready!"
echo "=========================================="
echo ""
echo "Access your application:"
echo "  Frontend:   http://localhost:3000"
echo "  Backend:    http://localhost:5000"
echo "  Database:   localhost:5432"
echo "  Mailpit:    http://localhost:8025"
echo "  MinIO:      http://localhost:9000"
echo ""
echo "View logs:"
echo "  docker-compose logs -f"
echo ""
