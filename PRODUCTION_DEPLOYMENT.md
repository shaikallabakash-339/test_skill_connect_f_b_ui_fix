# Skill Connect - Professional Networking Platform

## Production Deployment Guide

This guide provides step-by-step instructions to deploy Skill Connect in a production environment using Docker Compose.

### Prerequisites

- Docker (version 20.10+)
- Docker Compose (version 1.29+)
- At least 4GB RAM
- Ports 3000, 5000, 5432, 9000, 9001, 1025, 8025 available
- Linux/Mac/Windows with Docker Desktop

### Quick Start - Production Setup

```bash
# 1. Clone or navigate to project directory
cd /workspaces/test_skill_connect_f_b_ui_fix

# 2. Run the automated setup script
bash setup-production.sh

# Or manually run Docker Compose:
docker-compose up -d
```

### Manual Setup Steps

#### Step 1: Build Backend and Frontend

```bash
docker-compose build backend
docker-compose build frontend
```

#### Step 2: Start Core Services

```bash
# Start Database
docker-compose up -d postgres

# Wait for database to be ready (30 seconds)
sleep 30

# Start MinIO (Object Storage)
docker-compose up -d minio

# Start Email Service
docker-compose up -d mailpit
```

#### Step 3: Start Application Services

```bash
# Start Backend
docker-compose up -d backend

# Wait for backend to initialize (40 seconds)
sleep 40

# Start Frontend
docker-compose up -d frontend
```

#### Step 4: Verify Setup

```bash
# Check all services are running
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:5000 | - |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin@123456 |
| Mailpit (Email) | http://localhost:8025 | - |
| Database | localhost:5432 | postgres / postgres123 |

### API Health Checks

```bash
# Basic health check
curl http://localhost:5000/health

# Database readiness check
curl http://localhost:5000/api/ready
```

### Database Initialization

The database is automatically initialized with:
- All required tables
- Proper indexes for performance
- UUID extensions for PostgreSQL
- Foreign key constraints

### Common Issues & Solutions

#### Issue: "cannot replace to directory node_modules with file"

**Solution:** 
- Ensure your docker-compose.yml has correct volume mounting
- Clear old volumes: `docker-compose down -v`
- Rebuild images: `docker-compose build --no-cache`

#### Issue: "Cannot connect to server"

**Solution:**
- Verify backend is running: `docker-compose logs backend | grep "Server running"`
- Check port 5000 is not in use: `lsof -i :5000`
- Ensure REACT_APP_API_URL is set to `http://localhost:5000`

#### Issue: "Database connection failed"

**Solution:**
- Check PostgreSQL is running: `docker-compose logs postgres`
- Verify credentials in docker-compose.yml match backend .env
- Wait 30 seconds for database initialization
- Check database is healthy: `docker-compose ps | grep postgres`

#### Issue: "MinIO connection failed"

**Solution:**
- Verify MinIO is running: `docker-compose logs minio`
- Check credentials: minioadmin / minioadmin@123456
- Ensure port 9000 is available
- Wait for MinIO health check to pass

### Environment Variables

#### Frontend (.env or docker-compose.yml)

```bash
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=production
NODE_ENV=production
```

#### Backend (.env)

```bash
NODE_ENV=production
PORT=5000
DB_HOST=postgres
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=skill_connect
MINIO_HOST=minio
MINIO_PORT=9000
```

### Production Checklist

- [ ] Change default admin password
- [ ] Change MinIO credentials
- [ ] Update JWT_SECRET in backend .env
- [ ] Set up proper HTTPS/SSL certificates
- [ ] Configure SendPulse email service
- [ ] Set up backup strategy for database
- [ ] Configure logging and monitoring
- [ ] Set up rate limiting
- [ ] Enable authentication on all sensitive endpoints
- [ ] Review and update CORS settings

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop services and remove volumes (WARNING: deletes data)
docker-compose down -v

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend

# Last 100 lines
docker-compose logs --tail=100 backend
```

### Database Backup

```bash
# Backup database
docker exec skill_connect_postgres pg_dump -U postgres skill_connect > backup.sql

# Restore database
docker exec -i skill_connect_postgres psql -U postgres skill_connect < backup.sql
```

### Performance Optimization

1. **Enable Redis caching** (optional)
   - Add Redis service to docker-compose.yml
   - Configure backend to use Redis

2. **Enable CDN** (optional)
   - Configure CloudFront or similar for static files
   - Update MinIO bucket policy for public access

3. **Database optimization**
   - Regular VACUUM and ANALYZE
   - Monitor query performance
   - Create additional indexes as needed

### Monitoring

Monitor services using:

```bash
# Watch resource usage
docker stats

# Check service health
docker-compose ps

# View error logs
docker-compose logs --tail=50 backend | grep ERROR
```

### Support & Troubleshooting

For detailed logs and debugging:

```bash
# Enable verbose logging
docker-compose logs -f --tail=200 backend

# Check system resources
docker system df

# Cleanup unused images
docker image prune -a
```

### Security Recommendations

1. **Database**
   - Use strong passwords
   - Restrict database access to backend only
   - Enable SSL connections in production

2. **MinIO**
   - Change default credentials
   - Enable bucket policies
   - Use signed URLs for file access

3. **Backend**
   - Use HTTPS/TLS
   - Implement rate limiting
   - Enable CORS properly
   - Use strong JWT secrets
   - Validate all user inputs

4. **Frontend**
   - Use HTTPS only
   - Implement CSP headers
   - Regular security updates
   - XSS protection

### Deployment to Cloud

For deploying to cloud providers:

1. **AWS ECS**: Use docker-compose compatibility
2. **Google Cloud Run**: Convert to cloud-specific format
3. **Azure Container Instances**: Use ACR registries
4. **Kubernetes**: Create Helm charts from docker-compose

### Getting Help

- Check logs: `docker-compose logs -f`
- Verify connections: `curl http://localhost:5000/health`
- Inspect containers: `docker exec -it skill_connect_backend sh`
- Review documentation: See API_DOCUMENTATION.md

---

**Last Updated:** February 2, 2026
**Version:** 1.0.0
