# ⚡ QUICK START GUIDE - Skill Connect

## 🚀 Running the Application Locally

### **Prerequisites**
- Node.js 14+ and npm
- Docker & Docker Compose
- PostgreSQL 12+ (if not using Docker)
- Git

### **1. Clone & Setup**
```bash
# Clone repository
git clone <repo-url>
cd test_skill_connect_f_b_ui_fix

# Install dependencies
cd backend && npm install
cd ../frontend && npm install
```

### **2. Start Services with Docker**
```bash
# From project root
docker-compose up -d

# Services will start:
# - PostgreSQL on port 5432
# - MinIO on port 9000
# - Mailpit (email testing) on port 8025
```

### **3. Setup Backend**
```bash
cd backend

# Create .env file
cat > .env << 'EOF'
DATABASE_URL=postgresql://user:password@localhost:5432/skill_connect
MINIO_ENDPOINT=localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_EMAIL=admin@skillconnect.com
ADMIN_PASSWORD=$2a$10$... # Use bcrypt hashed password
SENDPULSE_CLIENT_ID=your_sendpulse_client_id
SENDPULSE_CLIENT_SECRET=your_sendpulse_secret
NODE_ENV=development
EOF

# Initialize database
npm run init-db

# Start backend server
npm start
# Backend runs on http://localhost:5000
```

### **4. Setup Frontend**
```bash
cd frontend

# Create .env file
cat > .env << 'EOF'
REACT_APP_API_URL=http://localhost:5000
REACT_APP_MINIO_URL=http://localhost:9000
EOF

# Start development server
npm start
# Frontend runs on http://localhost:3000
```

### **5. Access the Application**
- **User App**: http://localhost:3000
- **Admin Dashboard**: http://localhost:3000/admin-login
- **MinIO Console**: http://localhost:9000 (access key: minioadmin)
- **Mailpit (Emails)**: http://localhost:8025

---

## 📝 Test Accounts

### **User Account**
```
Email: user@example.com
Password: password123
Status: employed
Company: Tech Corp
```

### **Admin Account**
```
Email: admin@skillconnect.com
Password: admin123
```

---

## 🎯 Core Features to Test

### **1. User Registration & Login**
```
✓ Go to Signup page
✓ Enter email, password, company name, status
✓ Create account
✓ Login with credentials
✓ Dashboard loads with profile
```

### **2. Resume Management**
```
✓ Go to User Dashboard
✓ Click "Upload Resume"
✓ Select PDF/DOC file
✓ File uploads to MinIO
✓ URL stored in database
✓ Resume appears in list
✓ Download/Delete options work
```

### **3. Messaging**
```
✓ In Dashboard, go to Messages tab
✓ Search and select another user
✓ Type message and send
✓ Message appears in conversation
✓ Other user sees notification
✓ 5-message limit enforced (for free users)
✓ Premium removes limit
```

### **4. Premium Subscription**
```
✓ Go to Premium page
✓ Select plan (₹100/month or ₹1000/year)
✓ Choose payment method
✓ Upload screenshot
✓ Admin verifies
✓ User becomes premium
✓ Conversation limit increases
```

### **5. Donations**
```
✓ Go to Orphans or Old Age Homes page
✓ Click "Donate Now" on an organization
✓ Enter amount and donor details
✓ Submit donation
✓ Donation recorded in database
✓ Can download QR code
```

### **6. Admin Dashboard**
```
✓ Login as admin
✓ View dashboard stats
✓ Search and filter users
✓ Send broadcast message to users
✓ View donation analytics
✓ Upload QR codes for organizations
```

---

## 🔧 Useful Commands

### **Backend**
```bash
cd backend

# Start server
npm start

# Run in development with nodemon
npm run dev

# Initialize database
npm run init-db

# Check database
psql postgresql://user:password@localhost:5432/skill_connect
```

### **Frontend**
```bash
cd frontend

# Start dev server
npm start

# Build for production
npm run build

# Run tests
npm test

# Eject (not recommended)
npm run eject
```

### **Docker**
```bash
# View services
docker-compose ps

# View logs
docker-compose logs -f postgres
docker-compose logs -f

# Stop services
docker-compose down

# Remove all data
docker-compose down -v
```

---

## 📊 Database Quick Reference

### **Connect to PostgreSQL**
```bash
# Local connection
psql postgresql://user:password@localhost:5432/skill_connect

# Or using Docker
docker-compose exec postgres psql -U user -d skill_connect
```

### **Common Queries**
```sql
-- Check users
SELECT id, email, fullname, company_name, is_premium FROM users LIMIT 5;

-- Check messages
SELECT * FROM user_messages ORDER BY created_at DESC LIMIT 10;

-- Check donations
SELECT * FROM transactions WHERE type = 'donation';

-- Check email logs
SELECT * FROM email_logs ORDER BY created_at DESC LIMIT 10;

-- Check resumes
SELECT u.email, r.minio_url FROM users u 
LEFT JOIN resumes r ON u.id = r.user_id;
```

---

## 🌐 API Testing

### **Using cURL**

**Signup**
```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "fullname": "Test User",
    "company_name": "Test Company",
    "status": "employed"
  }'
```

**Login**
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

**Get All Users**
```bash
curl http://localhost:5000/api/all-users
```

**Send Message**
```bash
curl -X POST http://localhost:5000/api/user-message/send \
  -H "Content-Type: application/json" \
  -d '{
    "senderId": "user-id-1",
    "receiverId": "user-id-2",
    "message": "Hello!"
  }'
```

---

## 🐛 Troubleshooting

### **Port Already in Use**
```bash
# Find process using port
lsof -i :3000
lsof -i :5000

# Kill process
kill -9 <PID>
```

### **Database Connection Failed**
```bash
# Check if PostgreSQL is running
docker-compose ps

# Check logs
docker-compose logs postgres

# Restart services
docker-compose restart postgres
```

### **MinIO Connection Failed**
```bash
# Restart MinIO
docker-compose restart minio

# Reset credentials (minioadmin / minioadmin)
# Visit http://localhost:9000
```

### **Frontend Can't Reach Backend**
```bash
# Check REACT_APP_API_URL in .env
cat frontend/.env

# Ensure backend is running
curl http://localhost:5000/api/users
```

### **Build Errors**
```bash
# Clear node_modules and reinstall
cd frontend
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📱 Mobile Testing

The application is fully responsive. To test:

### **Chrome DevTools**
1. Open Chrome DevTools (F12)
2. Click device toggle (Ctrl+Shift+M)
3. Select device (iPhone 12, Pixel 5, etc.)
4. Reload page

### **Viewport Sizes Tested**
- ✅ Desktop: 1920x1080
- ✅ Tablet: 768x1024
- ✅ Mobile: 375x667

---

## 📧 Email Testing (Mailpit)

1. Go to http://localhost:8025
2. When system sends emails, they appear in Mailpit
3. No actual SMTP server needed for development
4. For production, configure SendPulse credentials

---

## 🔐 Security Notes

### **Before Production**
- [ ] Change JWT_SECRET to a strong random string
- [ ] Change ADMIN_PASSWORD to bcrypt hash
- [ ] Update SENDPULSE credentials
- [ ] Enable HTTPS/SSL
- [ ] Setup CORS for production domain
- [ ] Use environment variables for secrets
- [ ] Enable database backups
- [ ] Setup monitoring and logging

### **File Upload Security**
- ✅ File type validation (images, PDFs, docs only)
- ✅ File size limits
- ✅ Virus scanning (optional)
- ✅ URL-safe filenames
- ✅ Separate storage bucket for each user

---

## 📈 Monitoring

### **Key Metrics to Monitor**
- API response times
- Database connection pool
- MinIO storage usage
- SendPulse email quota
- Frontend error rates
- User activity and engagement

### **Logging**
- Backend logs in `backend/logs/`
- Frontend console (browser DevTools)
- Database query logs
- MinIO access logs

---

## 🚀 Deployment Checklist

- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] SSL certificates installed
- [ ] CORS configured for production
- [ ] Rate limiting enabled
- [ ] Monitoring set up
- [ ] Error tracking (Sentry/similar)
- [ ] CDN for static assets
- [ ] Database migration tested
- [ ] Backup and restore tested

---

## 📞 Support

For issues or questions:
1. Check the logs
2. Review API_DOCUMENTATION.md
3. Check IMPLEMENTATION_GUIDE.md
4. Review code comments

---

**Happy Developing! 🎉**
