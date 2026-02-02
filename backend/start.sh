#!/bin/bash

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Skill Connect - Docker Setup${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker found${NC}"

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Docker Compose found${NC}\n"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from .env.example...${NC}"
    cp .env.example .env
    echo -e "${GREEN}✓ .env file created${NC}"
    echo -e "${YELLOW}Please update the .env file with your configuration${NC}\n"
fi

# Prompt to continue
read -p "Ready to start containers? (y/n) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Exiting..."
    exit 1
fi

# Stop existing containers
echo -e "\n${YELLOW}Stopping existing containers...${NC}"
docker-compose down 2>/dev/null || true

# Build images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose build

if [ $? -ne 0 ]; then
    echo -e "${RED}Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Build successful${NC}\n"

# Start containers
echo -e "${YELLOW}Starting containers...${NC}"
docker-compose up -d

if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to start containers!${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Containers started${NC}\n"

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to be ready...${NC}"
sleep 10

# Check container status
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Container Status${NC}"
echo -e "${BLUE}========================================${NC}\n"

docker-compose ps

# Print service URLs
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}Service URLs${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${GREEN}Frontend:${NC}         http://localhost:3000"
echo -e "${GREEN}Backend API:${NC}       http://localhost:5000"
echo -e "${GREEN}MinIO Console:${NC}     http://localhost:9001"
echo -e "${GREEN}Mailpit (Email):${NC}   http://localhost:8025"
echo -e "${GREEN}PostgreSQL:${NC}        localhost:5432\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Credentials${NC}"
echo -e "${BLUE}========================================${NC}\n"

echo -e "${GREEN}Admin Login:${NC}"
echo -e "  Email:    admin@skillconnect.com"
echo -e "  Password: admin123\n"

echo -e "${GREEN}MinIO Access:${NC}"
echo -e "  Username: minioadmin"
echo -e "  Password: minioadmin123\n"

echo -e "${GREEN}Database:${NC}"
echo -e "  Username: admin"
echo -e "  Password: admin123\n"

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Setup Complete! 🎉${NC}"
echo -e "${BLUE}========================================${NC}\n"

# View logs
read -p "View logs? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    docker-compose logs -f
fi
