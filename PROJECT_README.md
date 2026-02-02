# Skill Connect - Professional Networking Platform

A modern full-stack web application for professional networking, skill sharing, and collaboration. Built with React, Node.js, PostgreSQL, and containerized with Docker.

## Features

### User Features
- **Professional Profile Management**: Create and update detailed professional profiles
- **Resume Management**: Upload, store, and manage resumes via MinIO S3-compatible storage
- **User Search & Discovery**: Find professionals by name, company, or employment status
- **Real-Time Messaging**: Chat with other professionals (5 conversations free, unlimited premium)
- **Smart Notifications**: Stay updated with message and admin notifications
- **Premium Subscription**: Upgrade for unlimited messaging and premium features
- **Profile Photos**: Upload and manage profile photos
- **Job Status Tracking**: Track employment status (employed, graduated, pursuing)

### Admin Features
- **User Management**: View, search, and filter all users
- **Bulk Messaging**: Send targeted messages to user categories
- **Payment Verification**: Review and approve premium subscription payments
- **Resume Management**: View all user resumes for recruitment
- **Donation Management**: Manage donations for orphanages and old-age homes
- **System Monitoring**: Track system statistics and activity

### Platform Features
- **Professional Network**: Connect with like-minded professionals
- **Real-Time Chat**: Instant messaging without delays
- **File Storage**: Secure file storage with MinIO
- **Email Notifications**: Automated email alerts via Mailpit/SendPulse
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Security**: Password hashing, input validation, SQL injection prevention

## Technology Stack

### Frontend
- **React 18**: Modern UI library with hooks
- **React Router v6**: Client-side routing
- **Framer Motion**: Smooth animations
- **Axios**: HTTP client with interceptors
- **Lucide React**: Beautiful icons
- **CSS3**: Modern styling with media queries

### Backend
- **Express.js**: Lightweight web framework
- **Node.js 18**: JavaScript runtime
- **PostgreSQL 15**: Relational database
- **MinIO**: S3-compatible object storage
- **bcryptjs**: Secure password hashing
- **Validator.js**: Input validation

### Infrastructure
- **Docker**: Container runtime
- **Docker Compose**: Multi-container orchestration
- **PostgreSQL**: Data persistence
- **MinIO**: File storage
- **Mailpit**: Email testing (development)

## Project Structure

```
skill-connect/
├── frontend/                    # React application
│   ├── src/
│   │   ├── pages/              # Page components
│   │   ├── components/         # Reusable components
│   │   ├── services/           # API services
│   │   ├── styles/             # CSS files
│   │   ├── utils/              # Utility functions
│   │   └── App.js              # Main app component
│   ├── package.json            # Dependencies
│   ├── Dockerfile              # Docker image
│   └── .env                    # Environment config
│
├── backend/                     # Express application
│   ├── config/                 # Database configuration
│   ├── routes/                 # API endpoints
│   ├── utils/                  # Helper functions
│   ├── middleware/             # Express middleware
│   ├── scripts/                # Database scripts
│   ├── server.js               # Express app setup
│   ├── package.json            # Dependencies
│   ├── Dockerfile              # Docker image
│   └── .env                    # Environment config
│
├── docker-compose.yml          # Container orchestration
├── START_APP.sh               # Startup automation
├── VERIFY_SETUP.sh            # Verification script
├── QUICK_START.md             # Quick reference
├── CRITICAL_SETUP.md          # Setup guide
├── TESTING_GUIDE.md           # Testing procedures
├── IMPLEMENTATION_COMPLETE.md # Architecture guide
└── README.md                  # This file
```

## Quick Start

### Prerequisites
- Docker & Docker Compose
- Git
- 4GB RAM minimum
- 5GB disk space

### Startup (3 minutes)

```bash
# Clone repository
git clone [repository-url]
cd skill-connect

# Make scripts executable
chmod +x START_APP.sh VERIFY_SETUP.sh

# Start application
./START_APP.sh

# Wait for services (2-3 minutes)
# Open browser to http://localhost:3000
```

### Access Points

| Service | URL | Purpose |
|---------|-----|---------|
| **Frontend** | http://localhost:3000 | User interface |
| **Backend** | http://localhost:5000 | API server |
| **MinIO** | http://localhost:9001 | File storage console |
| **Mailpit** | http://localhost:8025 | Email testing |
| **Database** | localhost:5432 | PostgreSQL |

### Test Account

```
Email: test@example.com
Password: TestPass123
Status: Employed
```

## API Documentation

### Authentication Endpoints
```
POST   /api/signup               # Create new user account
POST   /api/login                # User login
POST   /api/forgot-password      # Request password reset
GET    /api/user/:email          # Get user profile
PUT    /api/user/:email          # Update user profile
```

### User Endpoints
```
GET    /api/users                # Get all users
GET    /api/user-stats           # Get user statistics
GET    /api/search               # Search users
```

### Messaging Endpoints
```
POST   /api/user-messages/send   # Send message to user
GET    /api/user-messages/:email # Get user messages
GET    /api/conversations/:email # Get conversations
```

### Resume Endpoints
```
POST   /api/upload-resume        # Upload resume
GET    /api/resumes/:email       # Get user resumes
DELETE /api/resume/:id           # Delete resume
```

### Admin Endpoints
```
POST   /api/admin/login          # Admin login
GET    /api/admin/users          # Get all users
POST   /api/admin/send-bulk-message # Send bulk message
```

### Subscription Endpoints
```
POST   /api/subscriptions/upload-payment  # Upload payment
GET    /api/subscriptions/plans           # Get plans
POST   /api/subscriptions/create          # Create subscription
```

## Database Schema

The application uses PostgreSQL with auto-initialization. Key tables include:

- **users**: User profiles and authentication
- **resumes**: Resume storage metadata
- **user_messages**: Real-time chat messages
- **user_conversations**: Conversation tracking
- **user_subscriptions**: Premium subscriptions
- **email_logs**: Email tracking
- **donations**: Donation records

See `IMPLEMENTATION_COMPLETE.md` for full schema details.

## Configuration

### Environment Variables

**Backend (.env)**
```
NODE_ENV=development
PORT=5000
DB_HOST=postgres
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres123
DB_NAME=skill_connect
MINIO_HOST=minio
MINIO_PORT=9000
JWT_SECRET=your-secret-key
```

**Frontend (.env)**
```
REACT_APP_API_URL=http://localhost:5000
REACT_APP_ENV=development
```

## Deployment

### Docker Compose (Recommended)
```bash
# Build and start
docker-compose up --build -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Setup
1. Install Node.js 18+
2. Install PostgreSQL 15
3. Install MinIO
4. Configure environment variables
5. Run `npm install` in backend and frontend
6. Run `npm start` in both directories

## Testing

### Automated Verification
```bash
./VERIFY_SETUP.sh
```

### Manual Testing
Follow the comprehensive testing guide in `TESTING_GUIDE.md`

### API Testing
```bash
# Test health
curl http://localhost:5000/health

# Test signup
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","fullName":"Test User","password":"Test123"}'
```

## Troubleshooting

### Application won't start
```bash
# Check containers
docker-compose ps

# View logs
docker-compose logs backend

# Restart
docker-compose restart
```

### Database errors
```bash
# Check database
docker exec skill_connect_postgres psql -U postgres -d skill_connect -c "SELECT 1"

# Initialize database
docker exec skill_connect_postgres psql -U postgres -d skill_connect \
  -f /docker-entrypoint-initdb.d/init.sql
```

### Frontend can't connect
- Verify REACT_APP_API_URL is `http://localhost:5000`
- Check backend is running: `curl http://localhost:5000/health`
- Check browser console for CORS errors

### Port conflicts
```bash
# Find process using port
lsof -i :3000

# Kill process or change port in docker-compose.yml
```

See `CRITICAL_SETUP.md` for more troubleshooting.

## Security Features

✓ **Password Security**: bcryptjs with 10 salt rounds
✓ **Input Validation**: Comprehensive validation and sanitization
✓ **SQL Injection Prevention**: Parameterized queries
✓ **XSS Protection**: Input escaping and output encoding
✓ **CORS Configuration**: Properly configured for frontend
✓ **Error Handling**: Safe error messages without information leakage
✓ **Database**: UUID primary keys
✓ **Environment Secrets**: No hardcoded sensitive data

## Performance Considerations

- **Database Indexing**: Optimized indexes on frequently queried columns
- **Connection Pooling**: PostgreSQL pool with 20 connections
- **File Storage**: MinIO for efficient file serving
- **Caching**: Session caching with localStorage
- **API Optimization**: Efficient queries with LIMIT clauses
- **Frontend Optimization**: Code splitting and lazy loading

## Development

### Local Development
```bash
# Backend
cd backend
npm install
npm start

# Frontend (different terminal)
cd frontend
npm install
npm start
```

### Adding Features
1. Create database migration if needed
2. Update backend routes
3. Update frontend pages/components
4. Add API calls through services/api.js
5. Test thoroughly

### Git Workflow
```bash
git checkout -b feature/feature-name
git commit -am "Add feature"
git push origin feature/feature-name
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## Deployment to Production

### Pre-Deployment Checklist
- [ ] Change JWT_SECRET to secure value
- [ ] Update database credentials
- [ ] Configure email service (SendPulse)
- [ ] Set up SSL certificates
- [ ] Configure MinIO backup
- [ ] Set up monitoring
- [ ] Test all features

### Production Deployment
```bash
# Build images
docker build -t skill-connect-frontend ./frontend
docker build -t skill-connect-backend ./backend

# Tag and push to registry
docker tag skill-connect-frontend myregistry/skill-connect:frontend
docker push myregistry/skill-connect:frontend

# Deploy with docker-compose or Kubernetes
docker-compose -f docker-compose.prod.yml up -d
```

## Monitoring & Maintenance

### Health Checks
```bash
# Backend health
curl http://localhost:5000/health

# Database connection
docker exec skill_connect_postgres pg_isready
```

### Log Files
```bash
# View all logs
docker-compose logs

# Follow logs
docker-compose logs -f backend

# Specific service
docker-compose logs frontend
```

### Database Backups
```bash
# Backup database
docker exec skill_connect_postgres pg_dump -U postgres skill_connect > backup.sql

# Restore database
docker exec -i skill_connect_postgres psql -U postgres skill_connect < backup.sql
```

## Support & Documentation

- **Quick Start**: See `QUICK_START.md` for 30-second setup
- **Setup Guide**: See `CRITICAL_SETUP.md` for detailed configuration
- **Testing**: See `TESTING_GUIDE.md` for step-by-step testing
- **Architecture**: See `IMPLEMENTATION_COMPLETE.md` for technical details
- **Code Documentation**: Inline comments in source files

## FAQ

**Q: How do I reset the database?**
A: Run `docker-compose down -v` to stop and remove volumes.

**Q: How do I upload a file larger than 2MB?**
A: Update `limits.fileSize` in backend/server.js fileUpload configuration.

**Q: Can I use this on Windows?**
A: Yes! Docker Desktop includes Docker Compose. Works the same way.

**Q: How do I add more admin users?**
A: Create an admin user table and update the admin login logic in routes/admin.js.

**Q: Can I use a different email service?**
A: Yes! Replace Mailpit configuration with your email service API.

## License

[Add your license here]

## Support

For issues and questions:
1. Check documentation files
2. Review GitHub issues
3. Contact development team

## Changelog

### Version 1.0.0 (Current)
- Initial release
- Complete user authentication
- User profile management
- Resume upload and storage
- Real-time messaging
- Admin dashboard
- Premium subscription system
- Email notifications
- Docker containerization

## Acknowledgments

- Built with React, Express.js, and PostgreSQL
- Icons from Lucide React
- Animations from Framer Motion
- File storage with MinIO

---

**Skill Connect** - Connecting Professionals, Sharing Skills, Growing Together

For more information, visit the documentation files or contact the development team.

