#!/bin/bash

# Skill Connect - Production Test Script
# This script tests all components of the application

set -e

echo "=========================================="
echo "Skill Connect - Production Test Suite"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
PASS=0
FAIL=0

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -w "\n%{http_code}" $url 2>/dev/null || echo -e "\n000")
    status=$(echo "$response" | tail -n1)
    
    if [ "$status" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC}"
        ((PASS++))
    else
        echo -e "${RED}✗ FAIL${NC} (Expected $expected_status, got $status)"
        ((FAIL++))
    fi
}

# Wait for services
echo "⏳ Waiting for services to be ready..."
sleep 10
echo ""

# Frontend Tests
echo "========== FRONTEND TESTS =========="
test_endpoint "Frontend" "http://localhost:3000" 200
echo ""

# Backend Tests
echo "========== BACKEND TESTS =========="
test_endpoint "Backend Health" "http://localhost:5000/health" 200
test_endpoint "Backend Ready" "http://localhost:5000/api/ready" 200
echo ""

# API Tests
echo "========== API ENDPOINT TESTS =========="
test_endpoint "All Users Endpoint" "http://localhost:5000/api/all-users" 200
test_endpoint "User Stats Endpoint" "http://localhost:5000/api/user-stats" 200
echo ""

# Service Status
echo "========== SERVICE STATUS =========="
echo -n "PostgreSQL: "
if docker exec skill_connect_postgres pg_isready -U postgres &>/dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ Failed${NC}"
    ((FAIL++))
fi

echo -n "MinIO: "
if curl -s http://localhost:9000/minio/health/live &>/dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ Failed${NC}"
    ((FAIL++))
fi

echo -n "Mailpit: "
if curl -s http://localhost:1025 &>/dev/null; then
    echo -e "${GREEN}✓ Running${NC}"
    ((PASS++))
else
    echo -e "${RED}✗ Failed${NC}"
    ((FAIL++))
fi

echo ""

# Container Status
echo "========== CONTAINER STATUS =========="
docker-compose ps
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed:${NC} $PASS"
echo -e "${RED}Failed:${NC} $FAIL"
echo ""

if [ $FAIL -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    echo ""
    echo "Application is ready for production use."
    echo ""
    echo "Access points:"
    echo "  Frontend: http://localhost:3000"
    echo "  Backend:  http://localhost:5000"
    echo "  MinIO:    http://localhost:9001 (minioadmin/minioadmin@123456)"
    echo "  Mailpit:  http://localhost:8025"
    exit 0
else
    echo -e "${RED}✗ Some tests failed!${NC}"
    echo ""
    echo "Check service logs:"
    echo "  docker-compose logs backend"
    echo "  docker-compose logs frontend"
    echo "  docker-compose logs postgres"
    exit 1
fi
