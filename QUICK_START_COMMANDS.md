# 🚀 QUICK START - COPY AND PASTE COMMANDS

## Option A: Automated (Recommended)
```bash
cd /workspaces/test_skill_connect_f_b_ui_fix
chmod +x SETUP_AND_START.sh
./SETUP_AND_START.sh
```

## Option B: Step by Step Manual

### Step 1: Stop old services
```bash
cd /workspaces/test_skill_connect_f_b_ui_fix
docker-compose down -v
```

### Step 2: Start everything
```bash
docker-compose up -d
```

### Step 3: Wait for database to initialize
```bash
sleep 15
```

### Step 4: Verify services are running
```bash
docker-compose ps
```

You should see all 5 containers as RUNNING:
- skill_connect_postgres
- skill_connect_minio
- skill_connect_mailpit
- skill_connect_backend
- skill_connect_frontend

### Step 5: Open in browser
```bash
# Frontend
http://localhost:3000

# Admin
http://localhost:3000/admin-login

# MinIO
http://localhost:9001

# Mailpit
http://localhost:8025
```

---

## Test Commands

### 1. Create a user (Signup Test)
```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "testuser@example.com",
    "fullName": "Test User",
    "password": "Test@123456",
    "phone": "9876543210",
    "status": "employed",
    "dob": "1995-01-15",
    "city": "Mumbai",
    "state": "MH",
    "country": "India"
  }'
```

Expected response:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "...",
    "email": "testuser@example.com",
    "fullName": "Test User",
    "status": "employed",
    "createdAt": "..."
  }
}
```

### 2. Check database has the user
```bash
docker exec skill_connect_postgres psql -U postgres -d skill_connect \
  -c "SELECT id, email, fullname, status, company_name FROM users;"
```

### 3. Check MinIO is working
```bash
curl http://localhost:9000/minio/health/live
```

### 4: Check Mailpit is working
```bash
curl http://localhost:8025/api/v1/database
```

### 5: Get all users (Admin feature)
```bash
curl http://localhost:5000/api/all-users
```

### 6: Get user stats (for Admin Dashboard)
```bash
curl http://localhost:5000/api/user-stats
```

### 7: Get message stats (for Admin Dashboard)
```bash
curl http://localhost:5000/api/message-stats
```

---

## Login Credentials

| User Type | Email | Password |
|-----------|-------|----------|
| Admin | admin@skillconnect.com | admin123 |
| MinIO | minioadmin | minioadmin@123456 |
| Database | postgres | postgres123 |

---

## Service URLs

| Service | URL | Port |
|---------|-----|------|
| Frontend | http://localhost:3000 | 3000 |
| Backend API | http://localhost:5000 | 5000 |
| MinIO Console | http://localhost:9001 | 9001 |
| MinIO API | http://localhost:9000 | 9000 |
| Mailpit | http://localhost:8025 | 8025 |
| Mailpit SMTP | localhost:1025 | 1025 |
| PostgreSQL | localhost:5432 | 5432 |

---

## Stop Services
```bash
docker-compose down
```

To also remove all data/volumes:
```bash
docker-compose down -v
```

---

## View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f postgres
docker-compose logs -f minio
docker-compose logs -f mailpit
docker-compose logs -f frontend
```

---

## Restart a service
```bash
docker-compose restart backend
# or
docker-compose restart postgres
# or
docker-compose restart minio
```

---

## Common Issues & Fixes

### Issue: "Address already in use"
```bash
# Kill the process using the port (example: port 3000)
lsof -i :3000
kill -9 <PID>

# Or change the port in docker-compose.yml
# Change "3000:3000" to "3001:3000"
```

### Issue: Database connection error
```bash
# Check if postgres is running
docker-compose ps postgres

# Restart postgres
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Issue: Frontend can't connect to backend
```bash
# Check backend is running
curl http://localhost:5000

# Check frontend environment variable
docker-compose logs frontend | grep REACT_APP_API_URL

# Restart frontend
docker-compose restart frontend
```

### Issue: MinIO bucket not found
```bash
# MinIO bucket gets created automatically on first backend startup
# But if needed, manually create it:
docker exec skill_connect_minio \
  mc mb minio/skill-connect-bucket
```

### Issue: Reset everything from scratch
```bash
# Remove all containers and volumes
docker-compose down -v

# Remove node_modules and build artifacts
rm -rf frontend/node_modules frontend/build
rm -rf backend/node_modules

# Start fresh
docker-compose up -d

# Wait for services
sleep 15

# Check status
docker-compose ps
```

---

## Backend Development (without Docker)

### Start backend locally:
```bash
cd backend
npm install
npm start
```

Create a `.env` file in backend folder:
```
NODE_ENV=development
PORT=5000

DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=skill_connect

MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin@123456
MINIO_BUCKET=skill-connect-bucket

MAILPIT_HOST=localhost
MAILPIT_PORT=1025

JWT_SECRET=your_jwt_secret_key_change_in_production
```

### Start frontend locally:
```bash
cd frontend
npm install
npm start
```

Create a `.env` file in frontend folder:
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENVIRONMENT=development
```

---

## Production Deployment

Change docker-compose.yml:
```yaml
environment:
  NODE_ENV: production
  REACT_APP_API_URL: https://yourdomain.com/api
```

Or use environment variables:
```bash
NODE_ENV=production docker-compose up -d
```

---

That's it! Everything should work now. 🎉
