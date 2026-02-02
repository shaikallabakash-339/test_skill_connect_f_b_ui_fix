# Skill Connect - Complete Testing Guide

## Table of Contents
1. [Environment Setup](#environment-setup)
2. [Starting the Application](#starting-the-application)
3. [Manual Testing Procedures](#manual-testing-procedures)
4. [API Testing](#api-testing)
5. [Troubleshooting](#troubleshooting)

## Environment Setup

### Requirements
- Docker & Docker Compose
- Node.js 18+ (for local development)
- Postman or cURL (for API testing)
- Web browser (Chrome/Firefox/Safari)

### Ports Required
- 3000 (Frontend)
- 5000 (Backend)
- 5432 (PostgreSQL)
- 9000 (MinIO API)
- 9001 (MinIO Console)
- 1025 (Mailpit SMTP)
- 8025 (Mailpit Console)

## Starting the Application

### Option 1: Using Docker Compose (Recommended)
```bash
# Make startup script executable
chmod +x START_APP.sh

# Run the script
./START_APP.sh
```

### Option 2: Manual Docker Compose
```bash
# Build and start all services
docker-compose up --build -d

# Wait for services to initialize (30-60 seconds)
sleep 60

# Verify services are running
docker-compose ps
```

### Option 3: Local Development
```bash
# Terminal 1: Start PostgreSQL (Docker only)
docker run -d \
  --name postgres \
  -e POSTGRES_PASSWORD=postgres123 \
  -e POSTGRES_DB=skill_connect \
  -p 5432:5432 \
  postgres:15-alpine

# Terminal 2: Start MinIO
docker run -d \
  --name minio \
  -e MINIO_ROOT_USER=minioadmin \
  -e MINIO_ROOT_PASSWORD=minioadmin@123456 \
  -p 9000:9000 \
  -p 9001:9001 \
  minio/minio server /data --console-address ":9001"

# Terminal 3: Backend
cd backend
npm install
npm start

# Terminal 4: Frontend
cd frontend
npm install
npm start
```

## Manual Testing Procedures

### Test 1: Frontend Loads Successfully
1. Open http://localhost:3000 in browser
2. **Expected**: Skill Connect home page loads
3. **Verify**: Navigation menu visible, login/signup links present

### Test 2: User Signup Flow
1. Click "Sign Up" or navigate to /signup
2. **Step 1 - Basic Info**:
   - Email: test@example.com
   - Full Name: Test User
   - Password: TestPass123
   - Click "Continue"

3. **Step 2 - Profile Details**:
   - Phone: +1 234-567-8900
   - City: New York
   - State: NY
   - Country: USA
   - Status: Employed (or Graduated/Pursuing)
   - DOB: 01/15/1990
   - Company: Tech Corp
   - Qualification: B.Tech
   - Branch: Computer Science
   - Passout Year: 2020
   - Click "Create Account"

4. **Expected**: 
   - Success toast notification
   - Redirect to login page
   - New user email appears in database

5. **Verify with Database**:
```bash
docker exec skill_connect_postgres psql -U postgres -d skill_connect -c \
  "SELECT email, fullname, status FROM users WHERE email = 'test@example.com';"
```

### Test 3: User Login Flow
1. Navigate to http://localhost:3000/login
2. Enter email: test@example.com
3. Enter password: TestPass123
4. Click "Login"

**Expected**: 
- Redirect to dashboard
- User profile visible
- Navbar shows user info

### Test 4: User Dashboard Features
1. **Home Tab**:
   - View all users
   - Search by name/company
   - Filter by status
   - View profile details
   - Edit profile

2. **Messages Tab**:
   - Search for users to message
   - Send message to another user
   - View message history
   - Check message notifications

3. **Profile Section**:
   - Update profile information
   - Upload profile photo
   - View profile completeness

### Test 5: Resume Upload
1. In dashboard, click "Upload Resume"
2. Select a PDF or Word file
3. **Expected**: 
   - File uploads to MinIO
   - Resume appears in list
   - Can view/download resume
   - Can delete resume

4. **Verify with MinIO Console**:
   - Navigate to http://localhost:9001
   - Login: minioadmin / minioadmin@123456
   - Check "resumes" bucket for uploaded files

### Test 6: Admin Dashboard
1. Navigate to http://localhost:3000/admin
2. Login with:
   - Email: admin@skillconnect.com
   - Password: admin123

**Expected**: Admin dashboard loads with:
- View all users
- Send messages by category
- View resumes
- Manage donations
- Verify payments

### Test 7: Premium Subscription
1. In user dashboard, click "Upgrade to Premium"
2. Upload payment screenshot
3. **Expected**:
   - Screenshot uploads to MinIO
   - Admin notification received
   - Payment pending approval

4. **As Admin**:
   - Navigate to admin dashboard
   - Find pending payment
   - Click "Approve"

5. **As User**:
   - Refresh dashboard
   - Premium status updated
   - Can chat with unlimited users

### Test 8: Real-Time Messaging
1. Open app in two browser windows (different users)
2. In Window 1: Search for Window 2 user
3. Send message: "Hello"
4. In Window 2:
   - **Expected**: Message appears instantly
   - Notification received
5. Reply from Window 2
6. In Window 1: **Expected**: Reply appears instantly

## API Testing

### Using cURL

#### Test Backend Health
```bash
# Check backend status
curl http://localhost:5000/health

# Check if database is ready
curl http://localhost:5000/api/ready
```

#### Test Signup Endpoint
```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "fullName": "New User",
    "password": "Password123",
    "phone": "+1234567890",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "status": "employed",
    "dob": "1990-01-15"
  }'
```

#### Test Login Endpoint
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "password": "Password123"
  }'
```

#### Test Get Users
```bash
curl http://localhost:5000/api/users
```

#### Test Get User Profile
```bash
curl http://localhost:5000/api/user/newuser@example.com
```

### Using Postman

1. **Create Signup Request**:
   - Method: POST
   - URL: http://localhost:5000/api/signup
   - Body (raw JSON):
   ```json
   {
     "email": "test@postman.com",
     "fullName": "Postman User",
     "password": "Test@123",
     "status": "employed",
     "phone": "+1234567890"
   }
   ```

2. **Create Login Request**:
   - Method: POST
   - URL: http://localhost:5000/api/login
   - Body:
   ```json
   {
     "email": "test@postman.com",
     "password": "Test@123"
   }
   ```

3. **Create Get Users Request**:
   - Method: GET
   - URL: http://localhost:5000/api/users

## Testing with Database

### Connect to Database
```bash
docker exec -it skill_connect_postgres psql -U postgres -d skill_connect
```

### Useful Database Commands

**View all users**:
```sql
SELECT id, email, fullname, status, created_at FROM users LIMIT 10;
```

**Check messages**:
```sql
SELECT * FROM user_messages ORDER BY created_at DESC LIMIT 10;
```

**Check resumes**:
```sql
SELECT email, name, resume_url, created_at FROM resumes;
```

**Check subscriptions**:
```sql
SELECT u.email, us.status, us.is_approved FROM user_subscriptions us
JOIN users u ON u.id = us.user_id;
```

**Count users by status**:
```sql
SELECT status, COUNT(*) FROM users GROUP BY status;
```

## Email Testing

### Mailpit Console
1. Open http://localhost:8025
2. View all emails sent during testing
3. Check email content, recipients, subject

### Expected Emails
- **Signup**: Welcome email sent to new user
- **Messages**: Notification emails for admin messages
- **Payment**: Payment received notification

## Troubleshooting

### Issue: Signup fails with "Cannot connect to server"

**Solution**:
```bash
# Check backend is running
docker-compose ps backend

# Check backend logs
docker-compose logs backend

# Restart backend
docker-compose restart backend

# Wait 30 seconds for database to initialize
sleep 30

# Try signup again
```

### Issue: Database tables not found

**Solution**:
```bash
# Manually initialize database
docker exec skill_connect_postgres psql -U postgres -d skill_connect \
  -f /docker-entrypoint-initdb.d/init.sql

# Verify tables
docker exec skill_connect_postgres psql -U postgres -d skill_connect -c "\dt"
```

### Issue: MinIO upload fails

**Solution**:
```bash
# Check MinIO is running
docker-compose ps minio

# Check MinIO health
curl http://localhost:9000/minio/health/live

# Restart MinIO
docker-compose restart minio
```

### Issue: Frontend shows blank page

**Solution**:
```bash
# Check frontend container logs
docker-compose logs frontend

# Check if port 3000 is in use
lsof -i :3000

# Rebuild frontend
docker-compose up --build frontend
```

### Issue: Messages not updating real-time

**Solution**:
```bash
# Check backend is connected to database
curl http://localhost:5000/api/ready

# Check message polling interval in frontend logs
docker-compose logs frontend | grep -i message

# Increase polling frequency in UserDashboard.js if needed
```

## Performance Testing

### Load Testing User Signup
```bash
# Using Apache Bench
ab -n 100 -c 10 -p payload.json -T application/json http://localhost:5000/api/signup

# Using wrk
wrk -t4 -c100 -d30s http://localhost:3000
```

### Database Performance
```sql
-- Check slow queries
EXPLAIN ANALYZE SELECT * FROM users WHERE email = 'test@example.com';

-- Check index usage
\di

-- Monitor query performance
SELECT query, calls, mean_time FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;
```

## Checklist for Complete Testing

- [ ] Frontend loads without errors
- [ ] Signup flow completes successfully
- [ ] Login with created credentials works
- [ ] User dashboard displays all tabs
- [ ] Profile information can be edited
- [ ] Resume can be uploaded to MinIO
- [ ] Messages can be sent between users
- [ ] Real-time message delivery works
- [ ] Admin dashboard accessible
- [ ] Admin can view all users
- [ ] Premium upgrade flow works
- [ ] Payment screenshot upload works
- [ ] Admin can approve/reject payments
- [ ] Premium user can chat with unlimited users
- [ ] Emails sent via Mailpit
- [ ] MinIO console shows uploaded files
- [ ] Database shows all created records
- [ ] No console errors in browser
- [ ] No errors in backend logs
- [ ] Health endpoints return correct status

## Success Criteria

✓ Application is ready for deployment when:
- All manual tests pass
- No errors in logs
- Database populated with test data
- Email service working (Mailpit)
- File uploads working (MinIO)
- Premium subscription flow working
- Real-time messaging working
- All API endpoints responding correctly

