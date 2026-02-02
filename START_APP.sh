#!/bin/bash

# ============================================================================
# Skill Connect - Application Startup Script
# ============================================================================
# This script manages the complete lifecycle of the Skill Connect application
# using Docker Compose

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_docker() {
    print_header "Checking Docker Installation"
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        print_info "Please install Docker from https://www.docker.com/products/docker-desktop"
        exit 1
    fi
    print_success "Docker is installed"
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        print_info "Please install Docker Compose or upgrade to Docker Desktop"
        exit 1
    fi
    print_success "Docker Compose is installed"
}

check_ports() {
    print_header "Checking Port Availability"
    
    PORTS=(3000 5000 5432 9000 9001 1025 8025)
    PORTS_IN_USE=false
    
    for port in "${PORTS[@]}"; do
        if nc -z localhost $port 2>/dev/null; then
            print_warning "Port $port is already in use"
            PORTS_IN_USE=true
        else
            print_success "Port $port is available"
        fi
    done
    
    if [ "$PORTS_IN_USE" = true ]; then
        print_warning "Some ports are in use. Existing containers will be stopped."
        print_info "If you have other applications on these ports, please stop them or change the ports in docker-compose.yml"
    fi
}

stop_containers() {
    print_header "Stopping Existing Containers"
    
    if docker-compose ps 2>/dev/null | grep -q "skill_connect"; then
        print_info "Stopping running containers..."
        docker-compose down -v 2>/dev/null || true
        sleep 2
        print_success "Containers stopped"
    else
        print_success "No running containers found"
    fi
}

build_and_start() {
    print_header "Building and Starting Services"
    
    print_info "Building images (this may take a few minutes)..."
    if docker-compose up --build -d; then
        print_success "Services started successfully"
    else
        print_error "Failed to start services"
        exit 1
    fi
}

wait_for_services() {
    print_header "Waiting for Services to Be Ready"
    
    services=(
        "skill_connect_postgres:5432"
        "skill_connect_minio:9000"
        "skill_connect_mailpit:1025"
        "skill_connect_backend:5000"
        "skill_connect_frontend:3000"
    )
    
    for service in "${services[@]}"; do
        name="${service%:*}"
        port="${service#*:}"
        counter=0
        max_attempts=30
        
        print_info "Waiting for $name on port $port..."
        
        while [ $counter -lt $max_attempts ]; do
            if docker-compose exec -T $name curl -s http://localhost:$port >/dev/null 2>&1 || \
               nc -z localhost $port 2>/dev/null; then
                print_success "$name is ready"
                break
            fi
            counter=$((counter + 1))
            echo -n "."
            sleep 2
        done
        
        if [ $counter -eq $max_attempts ]; then
            print_warning "$name took longer to start, continuing..."
        fi
    done
}

show_service_info() {
    print_header "Service Information"
    
    cat << EOF
${GREEN}✓ All Services Are Running!${NC}

${BLUE}Access Points:${NC}
  ${GREEN}Frontend${NC}        → http://localhost:3000
  ${GREEN}Backend Health${NC}  → http://localhost:5000/health
  ${GREEN}MinIO UI${NC}        → http://localhost:9001
                  Credentials: minioadmin / minioadmin@123456
  ${GREEN}Mailpit UI${NC}      → http://localhost:8025

${BLUE}Docker Containers:${NC}
EOF
    
    docker-compose ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "  (Unable to display container status)"
}

show_next_steps() {
    print_header "Next Steps"
    
    cat << EOF
${BLUE}1. Open your browser and navigate to:${NC}
   http://localhost:3000

${BLUE}2. Test the application:${NC}
   - Create a new account
   - Upload profile photo
   - Send messages
   - Upload resume
   - Subscribe to premium

${BLUE}3. View logs:${NC}
   docker-compose logs -f [service_name]
   
   Available services:
   - backend
   - frontend
   - postgres
   - minio
   - mailpit

${BLUE}4. Stop services:${NC}
   docker-compose down

${BLUE}5. Stop and remove data:${NC}
   docker-compose down -v
EOF
}

show_troubleshooting() {
    print_header "Troubleshooting"
    
    cat << EOF
${YELLOW}If you encounter any issues:${NC}

${BLUE}View logs:${NC}
  docker-compose logs -f backend
  docker-compose logs -f frontend

${BLUE}Check service health:${NC}
  curl http://localhost:5000/health
  docker-compose ps

${BLUE}Restart a specific service:${NC}
  docker-compose restart backend

${BLUE}Rebuild without cache:${NC}
  docker-compose up --build --force-recreate -d

${BLUE}Common Issues:${NC}
  - Port already in use: Stop other applications or change port mappings
  - Database not initializing: Wait 60 seconds and refresh browser
  - MinIO connection error: Check docker logs for container status
  - Frontend can't reach backend: Verify REACT_APP_API_URL in .env
EOF
}

main() {
    echo ""
    print_header "🚀 Skill Connect - Startup Script 🚀"
    
    # Run checks
    check_docker
    check_ports
    
    # Stop existing containers
    read -p "Do you want to stop existing containers? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        stop_containers
    fi
    
    # Build and start
    build_and_start
    
    # Wait for services
    wait_for_services
    
    # Show info
    show_service_info
    show_next_steps
    show_troubleshooting
    
    print_success "Setup complete! Your application is ready to use."
}

# Run main function
main

