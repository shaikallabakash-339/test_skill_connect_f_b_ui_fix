# Skill Connect - Complete API Documentation

## Base URL
```
http://localhost:5000/api
```

## Authentication Endpoints

### Sign Up
**POST** `/signup`

```json
{
  "email": "user@example.com",
  "fullName": "John Doe",
  "password": "SecurePass123",
  "company_name": "Tech Company",  // Optional
  "phone": "+1234567890",
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "dob": "1990-01-01",
  "status": "employed",  // employed, pursuing, graduated
  "qualification": "B.Tech",
  "branch": "Computer Science",
  "passoutYear": "2015"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "status": "employed",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### Login
**POST** `/login`

```json
{
  "email": "user@example.com",
  "password": "SecurePass123"
}
```

**Response (200)**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullName": "John Doe",
    "status": "employed",
    "is_premium": false,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "token": "jwt_token_here"
}
```

---

## User Routes

### Get All Users (Browse)
**GET** `/all-users`

**Query Parameters**:
- `search` - Search by name or company
- `status` - Filter by status (employed, pursuing, graduated)
- `company` - Filter by company name

**Response (200)**:
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullname": "John Doe",
      "company_name": "Tech Corp",
      "city": "New York",
      "status": "employed",
      "profile_image_url": "http://minio:9000/...",
      "bio": "Software Engineer",
      "is_premium": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 10
}
```

### Get User Profile
**GET** `/user/:email`

**Response (200)**:
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "fullname": "John Doe",
    "company_name": "Tech Corp",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "phone": "+1234567890",
    "status": "employed",
    "qualification": "B.Tech",
    "branch": "CS",
    "passoutyear": "2015",
    "profile_image_url": "http://minio:9000/...",
    "bio": "Software Engineer",
    "is_premium": false,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Update User Profile
**PUT** `/user/:userId/update`

```json
{
  "fullname": "Jane Doe",
  "company_name": "New Company",
  "bio": "Updated bio",
  "city": "San Francisco",
  "state": "CA",
  "country": "USA",
  "phone": "+1234567890",
  "qualification": "M.Tech",
  "branch": "AI",
  "passoutyear": "2020",
  "status": "employed"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

### Upload Profile Image
**POST** `/user/:userId/upload-profile-image`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `image` - Image file (JPEG, PNG, GIF, WebP, max 2MB)

**Response (200)**:
```json
{
  "success": true,
  "message": "Profile image uploaded successfully",
  "profileImageUrl": "http://minio:9000/bucket/profile-xxx.jpg"
}
```

---

## Resume Routes

### Upload Resume
**POST** `/upload-resume`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `email` - User email (required)
- `resume` - Resume file (PDF, DOCX, DOC, max 5MB)

**Response (200)**:
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "resume": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "resume.pdf",
    "file_name": "resume.pdf",
    "file_type": "application/pdf",
    "minio_url": "http://minio:9000/bucket/resume-xxx.pdf",
    "file_size": 102400,
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Get User's Resumes
**GET** `/resumes/:email`

**Response (200)**:
```json
{
  "success": true,
  "resumes": [
    {
      "id": "uuid",
      "name": "resume.pdf",
      "file_name": "resume.pdf",
      "file_type": "application/pdf",
      "minio_url": "http://minio:9000/...",
      "file_size": 102400,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

### Delete Resume
**DELETE** `/resume/:resumeId`

**Response (200)**:
```json
{
  "success": true,
  "message": "Resume deleted successfully"
}
```

---

## Messaging Routes

### Send User-to-User Message
**POST** `/user-message/send`

```json
{
  "senderId": "uuid",
  "receiverId": "uuid",
  "message": "Hey! How are you?"
}
```

**Response (201)**:
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageId": "uuid",
  "createdAt": "2024-01-01T12:00:00Z"
}
```

**Error (403)** - Free user limit reached:
```json
{
  "success": false,
  "message": "You have reached the maximum number of chats (5). Upgrade to premium to chat with more users.",
  "currentChats": 5,
  "limit": 5
}
```

### Get Chat History
**GET** `/user-message/:senderId/:receiverId`

**Response (200)**:
```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "sender_id": "uuid",
      "receiver_id": "uuid",
      "message": "Hey!",
      "is_read": true,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Get All Conversations
**GET** `/conversations/:userId`

**Response (200)**:
```json
{
  "success": true,
  "conversations": [
    {
      "id": "uuid",
      "contact_id": "uuid",
      "fullname": "Jane Doe",
      "profile_image_url": "http://minio:9000/...",
      "company_name": "Tech Corp",
      "last_message": "Nice to meet you!",
      "last_message_time": "2024-01-01T12:00:00Z",
      "is_active": true
    }
  ],
  "count": 3
}
```

---

## Notifications Routes

### Get Notifications
**GET** `/notifications/:userId`

**Query Parameters**:
- `unreadOnly` - Set to "true" to get only unread notifications

**Response (200)**:
```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "title": "New Message",
      "message": "Jane Doe sent you a message",
      "is_read": false,
      "created_at": "2024-01-01T12:00:00Z"
    }
  ],
  "unreadCount": 3
}
```

### Mark Notification as Read
**PUT** `/notifications/:notificationId/read`

**Response (200)**:
```json
{
  "success": true,
  "notification": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "New Message",
    "message": "Jane Doe sent you a message",
    "is_read": true,
    "created_at": "2024-01-01T12:00:00Z"
  }
}
```

---

## Admin Message Routes

### Send Message by Status
**POST** `/send-message`

```json
{
  "category": "employed",  // employed, pursuing, graduated
  "message": "Important announcement for all employed users!",
  "adminId": "uuid"
}
```

**Response (200)**:
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageId": "uuid",
  "recipientCount": 150,
  "emailStatus": {
    "success": true,
    "remaining": 11850
  }
}
```

### Get Messages by Category
**GET** `/messages`

**Query Parameters**:
- `category` - Filter by category (employed, pursuing, graduated)

**Response (200)**:
```json
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "category": "employed",
      "message": "Important announcement",
      "timestamp": "2024-01-01T12:00:00Z"
    }
  ]
}
```

### Get Message Statistics
**GET** `/message-stats`

**Response (200)**:
```json
{
  "success": true,
  "totalMessages": 45,
  "categoryCount": {
    "employed": 20,
    "pursuing": 15,
    "graduated": 10
  }
}
```

---

## Admin Routes

### Upload/Create Orphan
**POST** `/orphans`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `name` - Orphan name (required)
- `orphanId` - ID if updating (optional)
- `qrImage` - QR code image (required)
- `homeImage` - Home image (optional)

**Response (201)**:
```json
{
  "success": true,
  "message": "Orphan created successfully",
  "orphan": {
    "id": "uuid",
    "name": "Children Home XYZ",
    "qr_url": "http://minio:9000/...",
    "home_image_url": "http://minio:9000/...",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Get All Orphans
**GET** `/orphans`

**Response (200)**:
```json
{
  "success": true,
  "orphans": [
    {
      "id": "uuid",
      "name": "Children Home XYZ",
      "qr_url": "http://minio:9000/...",
      "home_image_url": "http://minio:9000/...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 5
}
```

### Delete Orphan
**DELETE** `/orphans/:orphanId`

**Response (200)**:
```json
{
  "success": true,
  "message": "Orphan deleted successfully"
}
```

### Upload/Create Old Age Home
**POST** `/old-age-homes`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `name` - Home name (required)
- `homeId` - ID if updating (optional)
- `qrImage` - QR code image (required)
- `homeImage` - Home image (optional)

**Response (201)**: Similar to orphans

### Get All Old Age Homes
**GET** `/old-age-homes`

**Response (200)**: Similar to orphans

### Delete Old Age Home
**DELETE** `/old-age-homes/:homeId`

**Response (200)**: Similar to orphans

### Record Donation
**POST** `/donations`

**Content-Type**: `multipart/form-data`

**Form Data**:
- `type` - "orphan" or "old-age" (required)
- `itemId` - ID of orphan/home (required)
- `itemName` - Name (required)
- `amount` - Donation amount (required)
- `name` - Donor name (required)
- `email` - Donor email (required)
- `phone` - Donor phone (required)
- `screenshot` - Payment screenshot (optional)

**Response (201)**:
```json
{
  "success": true,
  "message": "Donation recorded successfully",
  "transaction": {
    "id": "uuid",
    "type": "orphan",
    "item_name": "Children Home",
    "amount": "500",
    "name": "John Donor",
    "created_at": "2024-01-01T00:00:00Z"
  }
}
```

### Get Donations
**GET** `/donations`

**Query Parameters**:
- `type` - Filter by type (orphan, old-age)

**Response (200)**:
```json
{
  "success": true,
  "transactions": [
    {
      "id": "uuid",
      "type": "orphan",
      "item_name": "Children Home",
      "amount": "500",
      "name": "John Donor",
      "email": "john@example.com",
      "phone": "+1234567890",
      "screenshot_url": "http://minio:9000/...",
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 20
}
```

### Get Dashboard Stats
**GET** `/dashboard-stats`

**Response (200)**:
```json
{
  "success": true,
  "stats": {
    "totalUsers": 150,
    "totalMessages": 45,
    "totalDonations": "25000.00",
    "usersByStatus": [
      { "status": "employed", "count": 80 },
      { "status": "pursuing", "count": 50 },
      { "status": "graduated", "count": 20 }
    ],
    "premiumUsers": 25
  }
}
```

### Get All Users (Admin)
**GET** `/users`

**Query Parameters**:
- `status` - Filter by status
- `search` - Search by name/email

**Response (200)**:
```json
{
  "success": true,
  "users": [
    {
      "id": "uuid",
      "email": "user@example.com",
      "fullname": "John Doe",
      "company_name": "Tech Corp",
      "status": "employed",
      "is_premium": false,
      "created_at": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 150
}
```

---

## Error Responses

### 400 - Bad Request
```json
{
  "success": false,
  "message": "Email and name are required"
}
```

### 401 - Unauthorized
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

### 403 - Forbidden
```json
{
  "success": false,
  "message": "You have reached the maximum number of chats (5)"
}
```

### 404 - Not Found
```json
{
  "success": false,
  "message": "User not found"
}
```

### 500 - Internal Server Error
```json
{
  "success": false,
  "message": "Error processing request",
  "error": "Detailed error message"
}
```

---

## Rate Limiting (SendPulse)

- **Max Recipients**: 300 per batch
- **Max Emails/Month**: 12,000
- **Current Usage**: Check `/api/email-stats`

---

## File Size Limits

- **Resume**: 5MB max (PDF, DOCX, DOC)
- **Profile Image**: 2MB max (JPEG, PNG, GIF, WebP)
- **QR Code**: 2MB max (JPEG, PNG)
- **Home Image**: 2MB max (JPEG, PNG)
- **Payment Screenshot**: 5MB max (JPEG, PNG)

---

## Common Response Codes

- **200** - Success
- **201** - Created
- **400** - Bad Request
- **401** - Unauthorized
- **403** - Forbidden (limit reached)
- **404** - Not Found
- **500** - Internal Server Error
- **503** - Service Unavailable (database not ready)

---

## Testing with cURL

### Login
```bash
curl -X POST http://localhost:5000/api/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@example.com","password":"password123"}'
```

### Upload Resume
```bash
curl -X POST http://localhost:5000/api/upload-resume \
  -F "email=user@example.com" \
  -F "resume=@resume.pdf"
```

### Send Message
```bash
curl -X POST http://localhost:5000/api/user-message/send \
  -H "Content-Type: application/json" \
  -d '{"senderId":"uuid1","receiverId":"uuid2","message":"Hello!"}'
```

---

## WebSocket / Real-Time (Not Yet Implemented)

Currently using polling (3-second intervals). For true real-time, consider:
- Socket.io
- WebSockets
- Firebase Realtime Database

---

**Last Updated**: January 2024
**API Version**: 1.0
**Status**: Production Ready (except Frontend UI)
