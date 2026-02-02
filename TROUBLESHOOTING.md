# Skill Connect - Troubleshooting Guide

## Common Issues and Solutions

### 1. Docker Build Issues

#### Error: "cannot replace to directory node_modules with file"

**Cause:** Docker is trying to overwrite files that are read-only or conflicting with mounted volumes.

**Solution:**
```bash
# Clear all Docker containers and volumes
docker-compose down -v

# Rebuild from scratch
docker-compose build --no-cache

# Start services
docker-compose up -d
```

#### Error: "build context contains too many layers"

**Solution:**
- Ensure .dockerignore files exist in both frontend and backend
- Remove unnecessary files from build context
- Use docker buildx for better layer caching

### 2. Database Connection Issues

#### Error: "ECONNREFUSED 127.0.0.1:5432"

**Cause:** Backend cannot connect to PostgreSQL container.

**Solutions:**
```bash
# Check if postgres is running
docker-compose logs postgres

# Verify container is healthy
docker-compose ps postgres

# Restart postgres
docker-compose restart postgres

# Wait for health check
sleep 30
```

#### Error: "the server does not support SSL connections"

**Cause:** PostgreSQL running in development mode without SSL support.

**Solution:** Already configured in database.js:
```javascript
dbConfig.ssl = process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false;
```

#### Error: "table does not exist"

**Cause:** Database initialization script didn't run properly.

**Solution:**
```bash
# Manually run init script
docker exec skill_connect_postgres psql -U postgres -d skill_connect -f /docker-entrypoint-initdb.d/init.sql

# Or use validation script
docker exec skill_connect_backend node scripts/validate-db.js
```

### 3. Frontend Issues

#### Error: "Cannot GET /health"

**Cause:** Frontend development server running instead of serving static build.

**Solution:** Check frontend is built correctly:
```bash
# Stop frontend
docker-compose stop frontend

# Rebuild
docker-compose build frontend

# Start
docker-compose up -d frontend
```

#### Error: "REACT_APP_API_URL not accessible"

**Cause:** Frontend cannot reach backend API.

**Solutions:**
```bash
# Verify backend is running
curl http://localhost:5000/health

# Check frontend environment variables
docker-compose logs frontend | grep REACT_APP_API_URL

# Ensure backend is healthy
docker-compose ps backend
```

#### Error: "Failed to fetch API endpoint"

**Cause:** CORS issues or API endpoint doesn't exist.

**Solution:**
```bash
# Check backend logs for errors
docker-compose logs backend -f

# Verify API endpoints
curl http://localhost:5000/api/all-users
curl http://localhost:5000/api/user-stats

# Check CORS configuration in server.js
# Should have: app.use(cors());
```

### 4. MinIO Issues

#### Error: "Cannot connect to MinIO at minio:9000"

**Cause:** MinIO container not running or not ready.

**Solution:**
```bash
# Check MinIO status
docker-compose logs minio

# Verify it's running
docker-compose ps minio

# Check health
curl http://localhost:9000/minio/health/live
```

#### Error: "The request signature we calculated does not match"

**Cause:** Wrong MinIO credentials in .env

**Solution:** Verify credentials match docker-compose.yml:
```
MINIO_ROOT_USER: minioadmin
MINIO_ROOT_PASSWORD: minioadmin@123456
```

### 5. API Endpoint Issues

#### Error: "Cannot POST /api/login"

**Cause:** Login route not found or not properly registered.

**Solution:**
```bash
# Check auth routes are loaded
docker-compose logs backend | grep "Route"

# Test health endpoint
curl http://localhost:5000/health

# Verify backend is ready
curl http://localhost:5000/api/ready
```

#### Error: "Error fetching users: No database pool"

**Cause:** Database not initialized when routes are called.

**Solution:** Ensure database is ready before making API calls:
```javascript
const apiUrl = process.env.REACT_APP_API_URL || 'http://localhost:5000';
// Add retry logic
const retryFetch = async (url, retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      return await axios.get(url);
    } catch (err) {
      if (i === retries - 1) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
};
```

### 6. Email Service Issues

#### Error: "Cannot connect to Mailpit"

**Solution:**
```bash
# Check Mailpit status
docker-compose logs mailpit

# Verify SMTP port
netstat -an | grep 1025

# Test email sending
curl -X POST http://localhost:5000/api/test-email -d '{"to":"test@example.com"}'
```

### 7. Volume Mount Issues

#### Error: "permission denied" on volume mounts

**Solution:**
```bash
# Check volume permissions
docker exec skill_connect_backend ls -la /app

# Fix permissions
docker exec skill_connect_backend chmod -R 755 /app

# Or rebuild without volumes for testing
```

### 8. Memory Issues

#### Error: "JavaScript heap out of memory"

**Solution:**
```bash
# Increase Node memory
# In docker-compose.yml for backend:
environment:
  NODE_OPTIONS: --max-old-space-size=1024

# Or rebuild with more memory
docker-compose up -d --build
```

### 9. Network Issues

#### Error: "Cannot connect to backend from frontend"

**Solutions:**

Option 1: Verify containers are on same network
```bash
docker network ls | grep skill_connect
docker network inspect skill_connect_network
```

Option 2: Check DNS resolution
```bash
docker exec skill_connect_frontend ping backend
docker exec skill_connect_backend ping frontend
```

Option 3: Use localhost instead of container names for browser
```
REACT_APP_API_URL=http://localhost:5000
```

### 10. General Debugging

#### Enable verbose logging:

```bash
# Backend
docker-compose logs backend -f --tail=100

# Frontend
docker-compose logs frontend -f --tail=100

# Database
docker-compose logs postgres -f --tail=50
```

#### Check service status:

```bash
# All services
docker-compose ps

# Resource usage
docker stats

# Check port bindings
netstat -tlnp | grep LISTEN
```

#### Reset everything:

```bash
# Stop all services
docker-compose down -v

# Prune unused Docker resources
docker system prune -a

# Rebuild everything
docker-compose up --build -d
```

## Performance Troubleshooting

### Slow API Responses

```bash
# Check database query performance
docker exec skill_connect_postgres psql -U postgres -d skill_connect -c "SELECT query, calls, total_time FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Monitor server resources
docker stats skill_connect_backend
```

### Frontend Slow Loading

```bash
# Check build size
docker exec skill_connect_frontend du -sh /app/build

# Analyze dependencies
docker exec skill_connect_frontend npm list --depth=0

# Check frontend logs for slow requests
docker-compose logs frontend | grep "ms"
```

## Health Check Commands

```bash
# Frontend health
curl -v http://localhost:3000

# Backend health
curl -v http://localhost:5000/health

# Database health
docker exec skill_connect_postgres pg_isready -U postgres

# MinIO health
curl http://localhost:9000/minio/health/live

# Mailpit health
curl http://localhost:1025

# Full API readiness
curl http://localhost:5000/api/ready
```

## Emergency Procedures

### Kill and restart all services:

```bash
docker-compose kill
docker-compose up -d
```

### Force rebuild:

```bash
docker-compose down
docker-compose build --no-cache --force-rm
docker-compose up -d
```

### Reset database:

```bash
docker-compose exec postgres psql -U postgres -c "DROP DATABASE IF EXISTS skill_connect;"
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE skill_connect;"
docker-compose restart backend
```

### Clean everything:

```bash
docker-compose down -v
docker system prune -a --volumes
docker-compose up -d
```

## Performance Optimization

### Database
- Add indexes: `CREATE INDEX idx_email ON users(email);`
- Regular maintenance: `VACUUM ANALYZE;`
- Monitor slow queries

### Backend
- Enable caching
- Use connection pooling
- Optimize query performance

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- Bundle analysis

## Monitoring

### Real-time Logs

```bash
docker-compose logs -f --tail=100
```

### Metrics

```bash
docker stats --no-stream
```

### Network Debugging

```bash
docker network inspect skill_connect_network
```

---

**Need More Help?**

1. Check service logs: `docker-compose logs [service]`
2. Verify configurations in .env files
3. Ensure all ports are available
4. Check Docker daemon is running
5. Review error messages carefully

For production issues, always check the backend logs first as they contain detailed error information.
