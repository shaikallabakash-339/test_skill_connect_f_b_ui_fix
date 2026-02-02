# 🎉 SKILL CONNECT - COMPLETE WORKING SETUP

**Status:** ✅ FULLY FUNCTIONAL  
**Last Updated:** February 2, 2026  
**All Tests Passing:** ✅

---

## 🚀 QUICK START (5 MINUTES)

### Prerequisites
- Docker Desktop installed and running
- Terminal/Command Prompt access

### Start Application
```bash
cd /workspaces/test_skill_connect_f_b_ui_fix
docker-compose down -v
docker-compose up -d
sleep 20  # Wait for services to initialize
```

### Access Application
- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5000
- **MinIO Dashboard:** http://localhost:9001
- **Mailpit (Email):** http://localhost:8025

---

## 📝 TEST SIGNUP (Copy & Paste)

### Option 1: Using cURL
```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "fullName": "John Doe",
    "password": "SecurePassword123",
    "phone": "9876543210",
    "status": "employed",
    "dob": "1990-05-15",
    "city": "Mumbai",
    "state": "Maharashtra",
    "country": "India",
    "company_name": "Tech Company Ltd",
    "qualification": "B.Tech",
    "branch": "Computer Science",
    "passoutYear": "2015"
  }'
```

### Option 2: Using Frontend
1. Go to http://localhost:3000
2. Click "Sign Up"
3. Fill in the form with:
   - Email: john@example.com
   - Full Name: John Doe
   - Password: SecurePassword123
   - Other fields as desired
4. Click "Create Account"
5. Should see success message and redirect to login

---

## ✅ VERIFY SIGNUP DATA

```bash
# Check if user was saved to database
docker-compose exec postgres psql -U postgres -d skill_connect \
  -c "SELECT email, fullname, company_name, city, status, created_at FROM users;"
```

Expected output:
```
       email       | fullname |  company_name    | city   | status   |     created_at
------------------+----------+------------------+--------+----------+---------------------
john@example.com   | John Doe | Tech Company Ltd | Mumbai | employed | 2026-02-02 12:XX:XX
```

---

## 📊 WHAT'S INCLUDED

### Backend Services
- ✅ Node.js API Server (Port 5000)
- ✅ PostgreSQL Database (Port 5432)
- ✅ MinIO S3 Storage (Port 9000)
- ✅ Mailpit Email Service (Port 1025, 8025)

### Frontend
- ✅ React Application (Port 3000)
- ✅ User Dashboard with CSS styling
- ✅ Admin Dashboard with CSS styling
- ✅ Login/Signup Pages
- ✅ Responsive Design

### Core Features
- ✅ User Registration & Authentication
- ✅ User Profiles with company info
- ✅ Real-time Messaging
- ✅ Resume Upload
- ✅ Admin Dashboard
- ✅ Donation Management
- ✅ Email Notifications
- ✅ File Storage (MinIO)

---

## 🔧 COMMON COMMANDS

### Container Management
```bash
# View all running containers
docker-compose ps

# View real-time logs
docker-compose logs -f backend

# Stop containers
docker-compose down

# Stop and remove volumes (CAREFUL - deletes data)
docker-compose down -v

# Rebuild containers
docker-compose up -d --build

# Restart specific service
docker-compose restart backend
```

### Database Commands
```bash
# Connect to PostgreSQL
docker-compose exec postgres psql -U postgres -d skill_connect

# View all users
docker-compose exec postgres psql -U postgres -d skill_connect \
  -c "SELECT * FROM users;"

# View specific user
docker-compose exec postgres psql -U postgres -d skill_connect \
  -c "SELECT * FROM users WHERE email='john@example.com';"

# Count total users
docker-compose exec postgres psql -U postgres -d skill_connect \
  -c "SELECT COUNT(*) FROM users;"

# Delete all users (reset database)
docker-compose exec postgres psql -U postgres -d skill_connect \
  -c "DELETE FROM users;"

# View table structure
docker-compose exec postgres psql -U postgres -d skill_connect -c "\d users"
```

### Testing
```bash
# Test API is alive
curl http://localhost:5000/api/status

# Test signup
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","fullName":"Test","password":"Test123","status":"employed"}'

# Test login
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"Test123"}'
```

---

## 🛠️ TROUBLESHOOTING

### Docker Containers Won't Start
```bash
# Clean everything and start fresh
docker-compose down -v --remove-orphans
docker system prune -f
docker-compose up -d --build
sleep 20
docker-compose ps
```

### Database Errors
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Reset database completely
docker-compose down -v
docker-compose up -d postgres
sleep 10
docker-compose up -d
```

### Frontend Not Loading
```bash
# Clear browser cache (Ctrl+Shift+R)
# Or restart frontend container
docker-compose restart frontend

# Check frontend logs
docker-compose logs frontend
```

### Port Already in Use
```bash
# Find what's using the port (example port 5000)
lsof -i :5000

# Kill the process (if needed)
kill -9 <PID>

# Or change port in docker-compose.yml
```

### "Column does not exist" Error
- This should be fixed now, but if it happens:
```bash
docker-compose down -v
docker-compose up -d
sleep 20
```

---

## 📁 PROJECT STRUCTURE

```
test_skill_connect_f_b_ui_fix/
├── backend/
│   ├── config/          # Database configuration
│   ├── routes/          # API routes
│   ├── utils/           # Utilities
│   ├── scripts/         # Database initialization
│   └── server.js        # Main server file
├── frontend/
│   ├── src/
│   │   ├── pages/       # React pages (Login, Signup, etc)
│   │   ├── styles/      # CSS files
│   │   ├── components/  # Reusable components
│   │   └── App.js       # Main React component
│   └── public/
├── docker-compose.yml   # Container orchestration
├── Dockerfile          # Container definitions
└── README.md           # This file
```

---

## 🎯 USER ROLES

### Regular User
- Sign up and create profile
- Search other users
- Send messages (limited)
- Upload resume
- View donations
- Make donations

### Admin User
- Manage all users
- Send bulk messages
- View analytics
- Manage donations
- Approve subscriptions

---

## 🔒 Default Admin Credentials

**Email:** admin@skillconnect.com  
**Password:** admin123

(Change these in production!)

---

## 📞 API ENDPOINTS (Main)

### Authentication
- `POST /api/signup` - User registration
- `POST /api/login` - User login
- `POST /api/admin-login` - Admin login

### Users
- `GET /api/all-users` - Get all users
- `GET /api/user/:email` - Get user by email
- `PUT /api/user/:userId/update` - Update user profile
- `POST /api/user/:userId/upload-profile-image` - Upload profile photo

### Messages
- `GET /api/messages/:email` - Get user messages
- `POST /api/send-message` - Send bulk message (admin)

### Resumes
- `POST /api/upload-resume` - Upload resume
- `GET /api/resumes/:email` - Get user resumes

### Donations
- `GET /api/donations` - Get donations
- `POST /api/donations` - Create donation

---

## 💾 DATABASE SCHEMA

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  fullname TEXT NOT NULL,
  password TEXT NOT NULL,
  company_name TEXT,
  dob TEXT,
  city TEXT,
  state TEXT,
  country TEXT,
  phone TEXT,
  status TEXT,
  qualification TEXT,
  branch TEXT,
  passoutyear TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

Plus tables for: messages, resumes, conversations, notifications, donations, etc.

---

## 🌍 Environment Variables

Create `.env` file in root directory:
```env
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=skill_connect
DB_USER=postgres
DB_PASSWORD=postgres

# API
NODE_ENV=development
PORT=5000

# MinIO
MINIO_ENDPOINT=minio
MINIO_PORT=9000
MINIO_USE_SSL=false

# Email
SENDPULSE_HOST=smtp.sendpulse.com
SENDPULSE_PORT=587

# Frontend
REACT_APP_API_URL=http://localhost:5000
```

---

## 📝 NOTES

- All containers run in Docker
- Database persists in `pgdata` volume
- Files stored in MinIO (can be accessed at localhost:9001)
- Emails captured by Mailpit (viewable at localhost:8025)
- No emails actually sent in development

---

## ✨ RECENT FIXES

✅ Fixed database column mismatch (`company` → `company_name`)  
✅ Fixed all backend routes to use correct column names  
✅ Fixed Docker Compose health checks  
✅ Verified CSS styling in dashboards  
✅ Tested signup flow end-to-end  

---

## 🎓 LEARNING RESOURCES

- React: https://react.dev
- Docker: https://docs.docker.com
- PostgreSQL: https://www.postgresql.org/docs
- Express.js: https://expressjs.com

---

## 📧 SUPPORT

For issues, check:
1. Docker logs: `docker-compose logs -f`
2. Database: `docker-compose exec postgres psql ...`
3. File: `DOCKER_AND_DATABASE_FIXES.md` (detailed troubleshooting)

---

**Your Skill Connect platform is ready! 🚀**

Happy coding! 😊
