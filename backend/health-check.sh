#!/bin/bash

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Skill Connect - Health Check${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Track failures
FAILURES=0

# Check Docker
echo -e "${YELLOW}Checking Docker...${NC}"
if docker ps &> /dev/null; then
    echo -e "${GREEN}✓ Docker is running${NC}"
else
    echo -e "${RED}✗ Docker is not running${NC}"
    FAILURES=$((FAILURES + 1))
fi

# Check containers
echo -e "\n${YELLOW}Checking containers...${NC}"

containers=("skill_connect_backend" "skill_connect_frontend" "skill_connect_postgres" "skill_connect_minio" "skill_connect_mailpit")

for container in "${containers[@]}"; do
    if docker ps | grep -q "$container"; then
        STATUS=$(docker inspect -f '{{.State.Health.Status}}' "$container" 2>/dev/null || echo "running")
        echo -e "${GREEN}✓ $container is running ($STATUS)${NC}"
    else
        echo -e "${RED}✗ $container is not running${NC}"
        FAILURES=$((FAILURES + 1))
    fi
done

# Check backend API
echo -e "\n${YELLOW}Checking Backend API...${NC}"
if curl -s http://localhost:5000/health | grep -q "OK"; then
    echo -e "${GREEN}✓ Backend API is responding${NC}"
else
    echo -e "${RED}✗ Backend API is not responding${NC}"
    FAILURES=$((FAILURES + 1))
fi

# Check frontend
echo -e "\n${YELLOW}Checking Frontend...${NC}"
if curl -s http://localhost:3000 | grep -q "<!DOCTYPE" || curl -s http://localhost:3000 | grep -q "html"; then
    echo -e "${GREEN}✓ Frontend is responding${NC}"
else
    echo -e "${YELLOW}⚠ Frontend may still be loading...${NC}"
fi

# Check PostgreSQL
echo -e "\n${YELLOW}Checking PostgreSQL...${NC}"
if docker exec skill_connect_postgres pg_isready -U admin &> /dev/null; then
    echo -e "${GREEN}✓ PostgreSQL is responding${NC}"
else
    echo -e "${RED}✗ PostgreSQL is not responding${NC}"
    FAILURES=$((FAILURES + 1))
fi

# Check MinIO
echo -e "\n${YELLOW}Checking MinIO...${NC}"
if curl -s http://localhost:9000/minio/health/live &> /dev/null; then
    echo -e "${GREEN}✓ MinIO is responding${NC}"
else
    echo -e "${RED}✗ MinIO is not responding${NC}"
    FAILURES=$((FAILURES + 1))
fi

# Check Mailpit
echo -e "\n${YELLOW}Checking Mailpit...${NC}"
if curl -s http://localhost:8025 | grep -q "Mailpit"; then
    echo -e "${GREEN}✓ Mailpit is responding${NC}"
else
    echo -e "${YELLOW}⚠ Mailpit may be starting...${NC}"
fi

# Check environment file
echo -e "\n${YELLOW}Checking Configuration...${NC}"
if [ -f .env ]; then
    echo -e "${GREEN}✓ .env file exists${NC}"
else
    echo -e "${RED}✗ .env file not found${NC}"
    FAILURES=$((FAILURES + 1))
fi

# Database tables
echo -e "\n${YELLOW}Checking Database Tables...${NC}"
TABLES=$(docker exec skill_connect_postgres psql -U admin -d skill_connect_db -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';" 2>/dev/null)

if [ ! -z "$TABLES" ] && [ "$TABLES" -gt 0 ]; then
    echo -e "${GREEN}✓ Database has $TABLES tables${NC}"
else
    echo -e "${YELLOW}⚠ Database tables might not be initialized${NC}"
fi

# Summary
echo -e "\n${BLUE}========================================${NC}"
if [ $FAILURES -eq 0 ]; then
    echo -e "${GREEN}Health Check: ALL SYSTEMS OK ✓${NC}"
else
    echo -e "${RED}Health Check: $FAILURES ISSUES FOUND${NC}"
fi
echo -e "${BLUE}========================================${NC}\n"

# Service summary
echo -e "${BLUE}Service URLs:${NC}"
echo -e "  Frontend:    http://localhost:3000"
echo -e "  Backend:     http://localhost:5000"
echo -e "  MinIO:       http://localhost:9001"
echo -e "  Mailpit:     http://localhost:8025"
echo -e "  PostgreSQL:  localhost:5432\n"

exit $FAILURES
