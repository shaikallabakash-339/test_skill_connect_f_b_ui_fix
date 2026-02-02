#!/bin/bash

# ============================================================================
# Skill Connect - Verification & Testing Script
# ============================================================================
# This script verifies that all services are running correctly

set -e

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

test_passed() {
    echo -e "${GREEN}✓ PASSED: $1${NC}"
}

test_failed() {
    echo -e "${RED}✗ FAILED: $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

test_docker_containers() {
    print_header "Testing Docker Containers"
    
    local expected_containers=(
        "skill_connect_postgres"
        "skill_connect_minio"
        "skill_connect_mailpit"
        "skill_connect_backend"
        "skill_connect_frontend"
    )
    
    local running_containers=$(docker-compose ps --services 2>/dev/null || echo "")
    
    for container in "${expected_containers[@]}"; do
        if docker ps | grep -q "$container"; then
            test_passed "Container $container is running"
        else
            test_failed "Container $container is NOT running"
        fi
    done
}

test_port_connectivity() {
    print_header "Testing Port Connectivity"
    
    # Test PostgreSQL
    if nc -z localhost 5432 2>/dev/null; then
        test_passed "PostgreSQL (port 5432)"
    else
        test_failed "PostgreSQL (port 5432) - Connection refused"
    fi
    
    # Test MinIO
    if nc -z localhost 9000 2>/dev/null; then
        test_passed "MinIO (port 9000)"
    else
        test_failed "MinIO (port 9000) - Connection refused"
    fi
    
    # Test Mailpit
    if nc -z localhost 1025 2>/dev/null; then
        test_passed "Mailpit (port 1025)"
    else
        test_failed "Mailpit (port 1025) - Connection refused"
    fi
    
    # Test Backend
    if nc -z localhost 5000 2>/dev/null; then
        test_passed "Backend (port 5000)"
    else
        test_failed "Backend (port 5000) - Connection refused"
    fi
    
    # Test Frontend
    if nc -z localhost 3000 2>/dev/null; then
        test_passed "Frontend (port 3000)"
    else
        test_failed "Frontend (port 3000) - Connection refused"
    fi
}

test_backend_health() {
    print_header "Testing Backend Health Endpoints"
    
    # Test basic health
    if curl -s http://localhost:5000/health | grep -q "OK\|connected"; then
        test_passed "Backend health endpoint"
    else
        test_failed "Backend health endpoint"
    fi
    
    # Test ready endpoint
    if curl -s http://localhost:5000/api/ready | grep -q "ready"; then
        test_passed "Backend ready endpoint"
    else
        test_failed "Backend ready endpoint (database may not be initialized yet)"
    fi
}

test_database_connection() {
    print_header "Testing Database Connection"
    
    if docker exec skill_connect_postgres psql -U postgres -d skill_connect -c "SELECT 1" >/dev/null 2>&1; then
        test_passed "PostgreSQL connection"
    else
        test_failed "PostgreSQL connection"
    fi
    
    # Test if tables exist
    if docker exec skill_connect_postgres psql -U postgres -d skill_connect -c "\dt" | grep -q "users"; then
        test_passed "Database tables exist"
    else
        test_failed "Database tables not found"
    fi
}

test_minio_connection() {
    print_header "Testing MinIO Connection"
    
    if curl -s http://localhost:9000/minio/health/live | grep -q "OK"; then
        test_passed "MinIO health check"
    else
        print_warning "MinIO health check failed (may be normal on first startup)"
    fi
}

test_mailpit_connection() {
    print_header "Testing Mailpit Connection"
    
    if curl -s http://localhost:8025 | grep -q "Mailpit\|mailpit"; then
        test_passed "Mailpit web interface"
    else
        print_warning "Mailpit web interface check failed"
    fi
}

test_api_endpoints() {
    print_header "Testing API Endpoints"
    
    # Test root endpoint
    if curl -s http://localhost:5000 | grep -q "Backend Server\|running"; then
        test_passed "Backend root endpoint"
    else
        print_warning "Backend root endpoint returned unexpected response"
    fi
    
    # Test users endpoint
    if curl -s http://localhost:5000/api/users 2>/dev/null | grep -q "success"; then
        test_passed "GET /api/users endpoint"
    else
        print_warning "GET /api/users endpoint failed (may be expected if database isn't initialized)"
    fi
}

test_frontend_connection() {
    print_header "Testing Frontend"
    
    if curl -s http://localhost:3000 | grep -q "react\|Skill Connect\|html"; then
        test_passed "Frontend web interface"
    else
        print_warning "Frontend web interface check failed"
    fi
}

test_container_logs() {
    print_header "Checking Recent Container Logs"
    
    print_info "Backend logs (last 5 lines):"
    docker-compose logs --tail=5 backend 2>/dev/null || echo "  (Unable to retrieve logs)"
    
    echo ""
    print_info "Database logs (last 5 lines):"
    docker-compose logs --tail=5 postgres 2>/dev/null || echo "  (Unable to retrieve logs)"
}

show_service_urls() {
    print_header "Service Access URLs"
    
    cat << EOF
${GREEN}Frontend:${NC}
  http://localhost:3000

${GREEN}Backend API:${NC}
  http://localhost:5000
  Health: http://localhost:5000/health

${GREEN}MinIO Console:${NC}
  http://localhost:9001
  Credentials: minioadmin / minioadmin@123456

${GREEN}Mailpit Console:${NC}
  http://localhost:8025

${GREEN}Database Connection:${NC}
  Host: localhost
  Port: 5432
  Database: skill_connect
  User: postgres
  Password: postgres123
EOF
}

show_next_steps() {
    print_header "Next Steps"
    
    cat << EOF
${BLUE}1. Open Frontend:${NC}
   http://localhost:3000

${BLUE}2. Test Signup:${NC}
   - Create new account with test email
   - Fill in required fields
   - Submit form

${BLUE}3. Test Login:${NC}
   - Login with created credentials

${BLUE}4. View Logs:${NC}
   docker-compose logs -f backend

${BLUE}5. If something is wrong:${NC}
   - Check container logs
   - Verify database is initialized
   - Restart failed container:
     docker-compose restart [container_name]
EOF
}

main() {
    echo ""
    print_header "🔍 Skill Connect - Verification & Testing 🔍"
    
    test_docker_containers
    test_port_connectivity
    
    # Wait a moment before testing services
    sleep 2
    
    test_backend_health
    test_database_connection
    test_minio_connection
    test_mailpit_connection
    test_api_endpoints
    test_frontend_connection
    
    test_container_logs
    show_service_urls
    show_next_steps
}

# Run main function
main

