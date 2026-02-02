# Skill Connect - Professional Networking Platform

A full-stack application for professional networking, skill sharing, and job connections.

## Project Structure

```
skill-connect/
├── backend/                 # Node.js Express backend API
│   ├── config/             # Database and utility configurations
│   ├── routes/             # API route handlers
│   ├── utils/              # Helper utilities (email, password, validation)
│   ├── middleware/         # Express middleware
│   ├── scripts/            # Database initialization scripts
│   ├── Dockerfile          # Backend Docker configuration
│   ├── package.json        # Backend dependencies
│   └── .env                # Backend environment variables
│
├── frontend/               # React.js frontend application
│   ├── src/
│   │   ├── pages/         # React page components
│   │   ├── components/    # Reusable components
│   │   └── services/      # API client service
│   ├── Dockerfile         # Frontend Docker configuration
│   ├── package.json       # Frontend dependencies
│   └── .env               # Frontend environment variables
│
├── docker-compose.yml     # Docker Compose orchestration
└── README.md              # This file
```

## Prerequisites

- Docker and Docker Compose installed
- Git installed

## Quick Start with Docker

### First Time Setup - Fresh Clean Start (Recommended)

```bash
# Navigate to project
cd skill-connect

# Run the cleanup and restart script
bash CLEANUP_AND_RESTART.sh
```

This automated script will:
- Stop and remove all containers
- Clean up all volumes and data
- Kill any processes on conflicting ports (1025, 3000, 5000, 5432, 8025, 9000, 9001)
- Rebuild all Docker images
- Start all services with a fresh database
- Wait for all services to be ready
- Display the access URLs

### Subsequent Restarts (After Initial Setup)

```bash
# Simple restart
docker-compose up -d

# Wait 30-45 seconds for services to initialize
# Check status
docker-compose ps
```

### Services That Start

- PostgreSQL database (port 5432)
- MinIO object storage (ports 9000, 9001)
- Mailpit email testing (ports 1025, 8025)
- Backend API (port 5000)
- Frontend React app (port 3000)

### Access the Application

Once all services are ready:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **MinIO Web UI**: http://localhost:9001 (user: minioadmin, pass: minioadmin123)
- **Mailpit Web UI**: http://localhost:8025 (view sent emails)
- **Database**: `localhost:5432` (user: admin, pass: admin123)

### Test Sign Up

1. Go to http://localhost:3000
2. Click "Sign Up" button
3. Fill in the form with your details
4. Click submit - data should be stored in PostgreSQL
5. Check database:

```bash
docker-compose exec postgres psql -U admin -d skill_connect_db -c "SELECT email, fullname, status FROM users;"
```

Expected output: Your signup data should appear as a row in the users table

## Services Overview

### PostgreSQL Database
- Container: `skill_connect_postgres`
- Port: 5432
- Database: `skill_connect_db`
- User: `admin`
- Password: `admin123`

### MinIO (S3-Compatible Storage)
- Container: `skill_connect_minio`
- API Port: 9000
- Web UI Port: 9001
- Access Key: `minioadmin`
- Secret Key: `minioadmin123`

### Mailpit (Email Testing)
- Container: `skill_connect_mailpit`
- SMTP Port: 1025
- Web UI Port: 8025

### Backend API
- Container: `skill_connect_backend`
- Port: 5000
- Entry: `node server.js`

### Frontend
- Container: `skill_connect_frontend`
- Port: 3000
- Entry: `npm start`

## Environment Variables

### Backend (.env)
Database, MinIO, Email, and Admin configurations are set in `/backend/.env`

### Frontend (.env)
API URL and app settings are in `/frontend/.env`

## Common Commands

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Stop Services
```bash
docker-compose down
```

### Stop and Remove Data
```bash
docker-compose down -v
```

### Rebuild Images
```bash
docker-compose up --build
```

### Access Database
```bash
docker exec -it skill_connect_postgres psql -U admin -d skill_connect_db
```

## Troubleshooting

### Signup Data Not Saving to Database

**Problem**: Signup page shows success but data doesn't appear in PostgreSQL

**Solutions**:

1. **Check if database is initialized**:
```bash
# Check database readiness
curl http://localhost:5000/api/ready

# Check backend logs for database errors
docker-compose logs backend | grep -i "database\|error\|table"
```

2. **Verify users table exists**:
```bash
docker-compose exec postgres psql -U admin -d skill_connect_db -c "\dt users"
```

3. **Check if data is actually being inserted**:
```bash
docker-compose exec postgres psql -U admin -d skill_connect_db -c "SELECT COUNT(*) FROM users;"
```

4. **Force database re-initialization**:
```bash
# Clean restart
docker-compose down -v
bash CLEANUP_AND_RESTART.sh
```

### Port Already in Use

**Error**: "Ports are not available" or "bind: address already in use"

**Solution**:
```bash
# Use the cleanup script (handles all ports)
bash CLEANUP_AND_RESTART.sh

# Or manually kill processes on these ports:
lsof -ti:1025 | xargs kill -9 2>/dev/null || true
lsof -ti:3000 | xargs kill -9 2>/dev/null || true
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:5432 | xargs kill -9 2>/dev/null || true
lsof -ti:8025 | xargs kill -9 2>/dev/null || true
lsof -ti:9000 | xargs kill -9 2>/dev/null || true
lsof -ti:9001 | xargs kill -9 2>/dev/null || true
```

### Database Connection Failed

**Error**: "database does not exist" or "connection refused"

**Solutions**:
```bash
# Check PostgreSQL is running and healthy
docker-compose ps postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify database exists
docker-compose exec postgres psql -U admin -l

# If database missing, restart everything
bash CLEANUP_AND_RESTART.sh
```

### Backend API Not Responding

**Error**: "Cannot reach http://localhost:5000"

**Solutions**:
```bash
# Check if backend container is running
docker-compose ps backend

# Check backend logs for errors
docker-compose logs backend

# Verify database connection in backend logs
docker-compose logs backend | grep -i "database\|postgresql"

# Restart backend only
docker-compose restart backend
```

### Frontend Can't Connect to Backend

**Error**: "Failed to connect to backend API" on frontend

**Solutions**:
1. Check frontend .env has correct API URL:
```bash
cat frontend/.env | grep REACT_APP_API_URL
# Should show: REACT_APP_API_URL=http://backend:5000
```

2. Verify backend is running:
```bash
curl http://localhost:5000/health
```

3. Check frontend logs:
```bash
docker-compose logs frontend
```

4. Restart frontend:
```bash
docker-compose restart frontend
```

### Email (Mailpit) Not Working

**Problem**: Emails not being sent during signup

**Solution**:
```bash
# Check Mailpit is running
docker-compose ps mailpit

# View Mailpit web UI
# Open http://localhost:8025 in browser

# Check backend email config
docker-compose exec backend printenv | grep MAIL

# Verify backend can reach Mailpit
docker-compose exec backend curl mailpit:8025
```

### MinIO (File Upload) Not Working

**Problem**: Resume upload fails

**Solution**:
```bash
# Check MinIO is running
docker-compose ps minio

# Check MinIO web UI
# Open http://localhost:9001 (minioadmin / minioadmin123)

# Check backend MinIO config
docker-compose exec backend printenv | grep MINIO

# Verify backend can reach MinIO
docker-compose exec backend curl minio:9000
```

### Container Build Fails

**Error**: "failed to build" or Docker build errors

**Solution**:
```bash
# Clean rebuild
docker-compose down
docker system prune -a -f
docker volume prune -f
bash CLEANUP_AND_RESTART.sh
```

### Duplicate Extension Errors in Logs

**Error**: "duplicate key value violates unique constraint" with "uuid-ossp"

**Note**: This is normal on first run - database.js has been fixed to handle these gracefully. Server will continue running normally.

## API Endpoints

### Authentication
- `POST /signup` - Register new user
- `POST /login` - Login user
- `POST /forgot-password` - Reset password

### Users
- `GET /users` - Get all users
- `GET /user/:email` - Get user profile
- `PUT /user/:email` - Update user profile
- `GET /user-stats` - Get user statistics

### Resumes
- `POST /upload-resume` - Upload resume
- `GET /user-resume` - Get user resume
- `GET /resume-users` - List all resume users
- `DELETE /delete-resume` - Delete resume

## Key Features

- User authentication with password hashing (bcryptjs)
- User profile management
- Resume upload and storage
- Email notifications
- Admin dashboard
- Real-time messaging
- Subscription management

## Security

- Passwords hashed with bcryptjs
- Input validation and sanitization
- Environment variables for secrets
- Docker network isolation
- CORS enabled

## Database Schema

Tables include:
- `users` - User profiles
- `resumes` - Uploaded resumes
- `messages` - Admin messages
- `donations` - User donations
- `subscriptions` - Premium subscriptions

## Support

For issues or questions, check the logs:

```bash
docker-compose logs
```

## License

Copyright (c) 2025 Your Company Name. All rights reserved.
