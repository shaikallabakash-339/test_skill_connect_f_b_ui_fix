================================================================================
                    SKILL CONNECT - READ ME FIRST!
================================================================================

Welcome to Skill Connect Platform! This file guides you to get started quickly.

================================================================================
QUICK START (5 MINUTES)
================================================================================

1. COPY ENVIRONMENT FILE:
   cp .env.example .env
   (No changes needed for local testing)

2. START ALL SERVICES:
   docker-compose up -d

3. WAIT 30 SECONDS, then access:
   Frontend: http://localhost:3000
   Backend: http://localhost:5000
   Admin: http://localhost:3000/admin-login

4. SIGN UP:
   - Email: test@example.com
   - Full Name: Test User
   - Password: Test123456
   - Status: Employed
   - Date of Birth: 1995-05-15

5. LOGIN:
   - Email: test@example.com
   - Password: Test123456

That's it! You're done.

================================================================================
IF YOU HAVE ISSUES
================================================================================

Check logs:
  docker-compose logs -f

Stop and restart:
  docker-compose down
  docker-compose up -d

Full database from scratch:
  docker-compose down -v
  docker-compose up -d

For detailed help, see SETUP_AND_TEST.md

================================================================================
IMPORTANT FILES
================================================================================

START FIRST:
  1. This file (you're reading it!)
  2. SETUP_AND_TEST.md - Complete setup and testing guide

DOCKER REFERENCE:
  - DOCKER_LOCAL_SETUP.md - Detailed Docker guide
  - DOCKER_SINGLE_COMMANDS.txt - Single-line commands for testing

DETAILED GUIDES:
  - DOCKER_LOCAL_SETUP.md - Complete Docker documentation
  - .env.example - Environment variables reference

================================================================================
ARCHITECTURE
================================================================================

Services Running:
  ✓ PostgreSQL Database (Port 5432)
  ✓ MinIO Storage (Port 9000, 9001)
  ✓ Mailpit Email (Port 1025, 8025)
  ✓ Backend API (Port 5000)
  ✓ Frontend App (Port 3000)

Database:
  - Automatically initialized on first run
  - Tables created in PostgreSQL
  - Data persists in Docker volumes

Frontend:
  - React with Framer Motion animations
  - Responsive design (mobile, tablet, desktop)
  - Signup → Login → Dashboard flow

Backend:
  - Express.js Node server
  - Full REST API
  - Real-time messaging support

Storage:
  - MinIO for file uploads (resumes, images)
  - PostgreSQL for data
  - Mailpit for email testing (development)

================================================================================
TEST ACCOUNTS
================================================================================

ADMIN:
  Email: admin@skillconnect.com
  Password: admin123
  Access: http://localhost:3000/admin-login

USER (Create your own):
  1. Go to http://localhost:3000/signup
  2. Fill the form
  3. Click Sign Up
  4. Login with your credentials

DATABASE TEST (optional):
  docker exec -it postgres psql -U admin -d skill_connect_db
  SELECT * FROM users;

================================================================================
COMMON PORTS
================================================================================

Frontend:        http://localhost:3000
Backend API:     http://localhost:5000
PostgreSQL:      localhost:5432
MinIO:           http://localhost:9001 (minioadmin/minioadmin123)
Mailpit:         http://localhost:8025

================================================================================
DOCKER COMMANDS CHEAT SHEET
================================================================================

Start everything:
  docker-compose up -d

Check status:
  docker-compose ps

View logs (all):
  docker-compose logs -f

View logs (specific service):
  docker-compose logs -f backend
  docker-compose logs -f frontend
  docker-compose logs -f postgres

Stop everything:
  docker-compose down

Stop and remove volumes (fresh start):
  docker-compose down -v

Restart a service:
  docker-compose restart backend
  docker-compose restart frontend

Access PostgreSQL:
  docker exec -it postgres psql -U admin -d skill_connect_db

Access container shell:
  docker exec -it skill_connect_backend sh

View resource usage:
  docker stats

Remove stopped containers:
  docker container prune

Remove all unused images:
  docker image prune -a

================================================================================
TROUBLESHOOTING
================================================================================

ERROR: "Port already in use"
  → Kill the process using that port
  → Or change the port in docker-compose.yml

ERROR: "Cannot connect to PostgreSQL"
  → Wait 30 seconds for PostgreSQL to start
  → Check: docker-compose logs postgres
  → Restart: docker-compose restart postgres

ERROR: "Frontend cannot reach backend"
  → Verify REACT_APP_API_URL=http://localhost:5000 in .env
  → Check backend is running: curl http://localhost:5000/api/health
  → Restart frontend

ERROR: "Signup fails with database error"
  → Check database logs: docker-compose logs postgres
  → Verify all tables created: docker exec -it postgres psql -U admin -d skill_connect_db -c "\dt"
  → Restart all: docker-compose restart

FRESH START:
  docker-compose down -v
  rm .env
  cp .env.example .env
  docker-compose up -d

================================================================================
NEXT STEPS
================================================================================

1. ✓ Start services (docker-compose up -d)
2. ✓ Access http://localhost:3000
3. ✓ Create test account via signup
4. ✓ Test login and dashboard
5. → Read SETUP_AND_TEST.md for detailed testing
6. → Read DOCKER_LOCAL_SETUP.md for production setup

================================================================================
PRODUCTION DEPLOYMENT
================================================================================

For production deployment:
  1. Read DOCKER_LOCAL_SETUP.md - "PART 2: Production Environment Setup"
  2. Create .env.production with secure credentials
  3. Use: docker-compose -f docker-compose.prod.yml up -d

================================================================================
NEED HELP?
================================================================================

Issue solving priority:
  1. Check logs: docker-compose logs -f
  2. Read SETUP_AND_TEST.md
  3. Read DOCKER_LOCAL_SETUP.md
  4. Check Docker is running and healthy: docker ps

Most common issues are:
  - Port conflicts (kill process, try again)
  - Database not ready (wait 30 seconds)
  - Frontend env vars (check .env file exists)
  - Network issues (restart: docker-compose restart)

================================================================================
ENJOY YOUR SKILL CONNECT PLATFORM!
================================================================================

You now have a fully functional professional networking platform with:
  ✓ User authentication
  ✓ Real-time messaging
  ✓ Admin dashboard
  ✓ Donation features
  ✓ Payment subscriptions
  ✓ File uploads
  ✓ Responsive design
  ✓ Production-ready code

Start building!

================================================================================
