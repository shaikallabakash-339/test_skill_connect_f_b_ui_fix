# Skill Connect - Critical Setup & Fixes

## Overview
This document outlines all the critical fixes applied and how to properly deploy the application.

## Issues Fixed

### 1. **Backend Database Connection Issues**
- ✅ Fixed column name mismatch: `company` → `company_name` in users table
- ✅ Fixed database config exports to properly export pool, testConnection, and initTables
- ✅ Fixed MinIO service import from wrong config file
- ✅ Added automatic database initialization on server start

### 2. **Docker & Container Issues**
- ✅ Updated both Dockerfile with system dependencies and health checks
- ✅ Improved docker-compose.yml with proper health checks and service dependencies
- ✅ Added correct environment variables for MinIO, Mailpit, and database in docker-compose

### 3. **Frontend Configuration**
- ✅ Ensured REACT_APP_API_URL is correctly set in .env files
- ✅ Updated frontend Dockerfile with proper build setup
- ✅ Added health checks for frontend service

## Prerequisites

Before running the application, ensure you have:
- Docker and Docker Compose installed
- Node.js 18+ (for local development)
- Port availability: 3000 (frontend), 5000 (backend), 5432 (postgres), 9000 (minio), 8025 (mailpit)

## Quick Start with Docker

### Step 1: Clone and Navigate
```bash
cd /path/to/project
```

### Step 2: Build and Start All Services
```bash
docker-compose up --build
```

This will start:
- **PostgreSQL** (port 5432)
- **MinIO** (port 9000 API, 9001 Web UI)
- **Mailpit** (port 1025 SMTP, 8025 Web UI)
- **Backend** (port 5000)
- **Frontend** (port 3000)

### Step 3: Wait for Services to Be Ready
The services will automatically initialize. You can check status at:
- **Frontend**: http://localhost:3000
- **Backend Health**: http://localhost:5000/health
- **MinIO Console**: http://localhost:9001 (minioadmin/minioadmin@123456)
- **Mailpit Console**: http://localhost:8025

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
DB_HOST=postgres (or localhost for local dev)
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=skill_connect
MINIO_HOST=minio (or localhost for local dev)
MINIO_PORT=9000
MINIO_USE_SSL=false
JWT_SECRET=your_jwt_secret_key_change_in_production
```

### Frontend (.env)
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

## Database Schema

The database automatically initializes with the following tables:
- `users` - User profiles and authentication
- `messages` - Admin system messages
- `message_recipients` - Message delivery tracking
- `resumes` - Resume storage metadata
- `user_messages` - Real-time chat messages
- `user_conversations` - Conversation tracking
- `old_age_homes` - Orphan home listings
- `orphans` - Orphan home listings
- `donations` - Donation records
- `email_logs` - Email sending logs
- `subscription_plans` - Premium subscription plans
- `user_subscriptions` - User subscription records
- `payment_records` - Payment transaction records

## Key Features

### 1. **User Authentication**
- Signup with email, password, and profile information
- Login with email and password
- Password hashing with bcryptjs
- Session management

### 2. **Profile Management**
- View and update user profile
- Upload profile photo to MinIO
- View all user profiles with search and filter

### 3. **Messaging**
- Real-time chat with other users
- Admin messages to specific user categories
- Message notifications
- Free users limited to 5 conversations, premium users unlimited

### 4. **Resume Management**
- Upload resumes to MinIO
- Store resume metadata in database
- Download and delete resumes
- View all user resumes (admin)

### 5. **Premium Subscription**
- Premium subscription with payment verification
- Upload payment screenshot for verification
- Admin approval of payments
- Upgrade features with premium status

### 6. **File Storage (MinIO)**
- Profile photos bucket: `profile-photos`
- Resumes bucket: `resumes`
- QR codes bucket: `qr-codes`
- General images bucket: `images`
- Payment screenshots bucket: `payment-screenshots`

### 7. **Email Services**
- Mailpit for local email testing (development)
- SendPulse integration for production emails
- Email logs and statistics tracking

## Common Issues and Solutions

### Issue: "Cannot connect to database"
**Solution**: 
1. Check if PostgreSQL is running: `docker ps | grep postgres`
2. Verify DB credentials in docker-compose.yml
3. Check if database tables are initialized: Connect to PostgreSQL and run `\dt` to list tables

### Issue: "MinIO connection refused"
**Solution**:
1. Ensure MinIO container is running: `docker ps | grep minio`
2. Check MinIO health: `curl http://localhost:9000/minio/health/live`
3. Verify MinIO credentials in .env files

### Issue: "Frontend cannot connect to backend"
**Solution**:
1. Verify REACT_APP_API_URL in frontend/.env
2. Check backend is running: `curl http://localhost:5000/health`
3. Check browser console for CORS errors
4. Ensure backend CORS is enabled (it is by default)

### Issue: "Signup fails with 'Database initialization in progress'"
**Solution**:
1. Wait 30-60 seconds for database to fully initialize
2. Check backend logs: `docker logs skill_connect_backend`
3. Manually initialize database if needed:
   ```bash
   docker exec skill_connect_postgres psql -U postgres -d skill_connect -f /docker-entrypoint-initdb.d/init.sql
   ```

## API Endpoints

### Authentication
- `POST /api/signup` - Register new user
- `POST /api/login` - User login
- `POST /api/forgot-password` - Reset password
- `GET /api/user/:email` - Get user profile
- `PUT /api/user/:email` - Update user profile

### Messages
- `GET /api/messages/:category` - Get admin messages
- `POST /api/messages/send-to-category` - Send admin message (admin only)
- `GET /api/user-messages/:email` - Get user messages
- `POST /api/user-messages/send` - Send message to user
- `GET /api/conversations/:email` - Get user conversations

### Resumes
- `POST /api/upload-resume` - Upload resume
- `GET /api/resumes/:email` - Get user resumes
- `DELETE /api/resume/:id` - Delete resume

### Admin
- `GET /api/admin/users` - Get all users
- `POST /api/admin/approve-payment` - Approve payment (admin)
- `POST /api/admin/send-message` - Send admin message

### Subscriptions
- `POST /api/subscriptions/upload-payment` - Upload payment screenshot
- `GET /api/subscriptions/plans` - Get subscription plans
- `POST /api/subscriptions/create` - Create subscription

## Deployment Checklist

- [ ] Update JWT_SECRET in production
- [ ] Update REACT_APP_API_URL for production domain
- [ ] Configure real email service (SendPulse)
- [ ] Set up SSL certificates for MinIO
- [ ] Configure proper database backups
- [ ] Set up monitoring and logging
- [ ] Test all payment flows
- [ ] Set up admin account
- [ ] Configure QR codes for payments
- [ ] Test email notifications

## Next Steps

1. Verify all services are running
2. Test signup flow
3. Test user dashboard
4. Test messaging features
5. Test premium subscription
6. Test file uploads

## Support

For issues, check:
1. Container logs: `docker logs [container_name]`
2. Database connection: `docker exec skill_connect_postgres psql -U postgres -d skill_connect -c "SELECT 1"`
3. MinIO status: `curl http://localhost:9000/minio/health/live`
4. Backend health: `curl http://localhost:5000/health`

