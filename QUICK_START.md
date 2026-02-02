# Skill Connect - Quick Start Guide

## 30-Second Setup

```bash
# 1. Navigate to project
cd /path/to/skill-connect

# 2. Make scripts executable
chmod +x START_APP.sh VERIFY_SETUP.sh

# 3. Start application
./START_APP.sh

# 4. Wait for services (2-3 minutes)
# 5. Open http://localhost:3000
```

## Service URLs

| Service | URL | Credentials |
|---------|-----|-------------|
| Frontend | http://localhost:3000 | - |
| Backend API | http://localhost:5000 | - |
| MinIO Console | http://localhost:9001 | minioadmin / minioadmin@123456 |
| Mailpit | http://localhost:8025 | - |
| PostgreSQL | localhost:5432 | postgres / postgres123 |

## Test Credentials

### User Signup
```
Email: test@example.com
Password: TestPass123
Status: Employed
DOB: 01/15/1990
Phone: +1234567890
```

### Admin Login
```
Email: admin@skillconnect.com
Password: admin123
```

## Common Commands

### Start Services
```bash
./START_APP.sh          # Automated startup
docker-compose up -d    # Manual start (background)
docker-compose up       # Manual start (foreground with logs)
```

### Stop Services
```bash
docker-compose down     # Stop containers
docker-compose down -v  # Stop and remove volumes (delete data)
```

### View Logs
```bash
docker-compose logs -f                    # All services
docker-compose logs -f backend           # Specific service
docker-compose logs -f frontend          # Last 100 lines
tail -f docker-compose logs              # Follow logs
```

### Restart Services
```bash
docker-compose restart                   # All services
docker-compose restart backend          # Specific service
```

### Database Commands
```bash
# Connect to database
docker exec -it skill_connect_postgres psql -U postgres -d skill_connect

# View users
SELECT email, fullname, status FROM users;

# View messages
SELECT * FROM user_messages LIMIT 5;

# View subscriptions
SELECT u.email, us.status FROM user_subscriptions us JOIN users u ON u.id = us.user_id;
```

### Health Checks
```bash
# Backend health
curl http://localhost:5000/health

# Database ready
curl http://localhost:5000/api/ready

# MinIO health
curl http://localhost:9000/minio/health/live

# Get all users
curl http://localhost:5000/api/users
```

## Troubleshooting

### Issue: "Cannot connect to server"
```bash
# Check backend status
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Wait 30 seconds
sleep 30

# Try again
```

### Issue: "Database error"
```bash
# Check database
docker-compose logs postgres

# Initialize database manually
docker exec skill_connect_postgres psql -U postgres -d skill_connect \
  -f /docker-entrypoint-initdb.d/init.sql

# Verify tables
docker exec skill_connect_postgres psql -U postgres -d skill_connect -c "\dt"
```

### Issue: "Port already in use"
```bash
# Find process using port
lsof -i :3000          # Frontend
lsof -i :5000          # Backend
lsof -i :5432          # Database

# Kill process
kill -9 <PID>

# Or change port in docker-compose.yml
```

### Issue: "Cannot upload files"
```bash
# Check MinIO
docker-compose logs minio

# Verify MinIO health
curl http://localhost:9000/minio/health/live

# Restart MinIO
docker-compose restart minio
```

## Testing Workflows

### Test 1: Complete User Flow (5 minutes)
1. Open http://localhost:3000
2. Click "Sign Up"
3. Fill in Step 1 details
4. Fill in Step 2 details
5. Click "Create Account"
6. Login with created credentials
7. View dashboard

### Test 2: File Upload (3 minutes)
1. Login as user
2. Click "Upload Resume"
3. Select PDF or Word file
4. Verify in MinIO console
5. Can download/delete

### Test 3: Admin Features (5 minutes)
1. Navigate to http://localhost:3000/admin
2. Login as admin
3. View users
4. Send message
5. Approve payments

### Test 4: Messaging (5 minutes)
1. Create 2 user accounts
2. Open app in 2 windows
3. Search and message each other
4. Verify real-time delivery

### Test 5: Premium Upgrade (5 minutes)
1. Login as user
2. Click "Upgrade to Premium"
3. Upload payment screenshot
4. Login as admin
5. Approve payment
6. Verify premium status

## File Locations

```
Configuration:
- Backend env: /backend/.env
- Frontend env: /frontend/.env
- Docker: /docker-compose.yml
- Database SQL: /backend/scripts/init-db.sql

Source Code:
- Backend: /backend/server.js
- Frontend: /frontend/src/App.js
- Routes: /backend/routes/
- Pages: /frontend/src/pages/

Documentation:
- Setup: /CRITICAL_SETUP.md
- Testing: /TESTING_GUIDE.md
- Complete: /IMPLEMENTATION_COMPLETE.md
```

## Environment Variables

### Backend Required
```
DB_HOST=postgres
DB_USER=postgres
DB_PASSWORD=postgres123
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin@123456
JWT_SECRET=your-secret
```

### Frontend Required
```
REACT_APP_API_URL=http://localhost:5000
```

## Performance Tips

1. **Faster builds**: Use `--build` only when dependencies change
   ```bash
   docker-compose up -d        # Without rebuild
   docker-compose up --build   # With rebuild (slower)
   ```

2. **Check resources**: Ensure Docker has enough:
   - CPU: ≥2 cores
   - Memory: ≥4GB
   - Disk: ≥5GB free

3. **Monitor logs**: Keep terminal open for logs
   ```bash
   docker-compose logs -f
   ```

## Deployment Checklist

- [ ] All containers running
- [ ] Health checks passing
- [ ] Database initialized
- [ ] Can signup new user
- [ ] Can login
- [ ] Can upload resume
- [ ] Can send messages
- [ ] Can upload payment
- [ ] Admin can approve payment
- [ ] Premium status working

## Quick Support

### Verify Installation
```bash
./VERIFY_SETUP.sh
```

### View All Logs
```bash
docker-compose logs
```

### Full Restart (Nuclear Option)
```bash
docker-compose down -v
docker-compose up --build -d
sleep 60
./VERIFY_SETUP.sh
```

## Next Steps

1. ✓ Application running
2. ✓ Services initialized
3. → Test all features using TESTING_GUIDE.md
4. → Configure production settings
5. → Deploy to production

## Getting Help

- Check `/CRITICAL_SETUP.md` for detailed setup
- See `/TESTING_GUIDE.md` for step-by-step tests
- Review `/IMPLEMENTATION_COMPLETE.md` for architecture
- Check container logs: `docker-compose logs [service]`
- Test endpoints: `curl http://localhost:5000/health`

## Key Features Ready to Use

✓ User authentication (signup/login)
✓ Profile management
✓ Resume uploads
✓ Real-time messaging
✓ Admin dashboard
✓ Premium subscriptions
✓ Email notifications
✓ File storage (MinIO)
✓ Database persistence
✓ Docker containerization

## Estimated Timeline

- **Setup**: 2-3 minutes
- **Services Ready**: 3-5 minutes
- **First User Created**: 2 minutes
- **Full Feature Test**: 15-20 minutes
- **Production Deployment**: 30-60 minutes

---

**Ready to go!** 🚀

For detailed information, see CRITICAL_SETUP.md

