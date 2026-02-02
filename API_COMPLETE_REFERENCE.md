# 📚 Complete API Documentation - Skill Connect Platform

## Base URL
```
http://localhost:5000/api
```

---

## 🔐 Authentication Endpoints

### POST /signup
Create a new user account

**Request**:
```json
{
  "fullname": "John Doe",
  "email": "john@example.com",
  "password": "securepassword",
  "status": "pursuing|employed|graduated",
  "company_name": "Optional Company", // Optional field
  "city": "New York",
  "state": "NY",
  "country": "USA",
  "phone": "+1234567890"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Registration successful",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "fullname": "John Doe",
    "status": "pursuing",
    "company_name": "Optional Company"
  }
}
```

### POST /login
Authenticate user

**Request**:
```json
{
  "email": "john@example.com",
  "password": "securepassword"
}
```

**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "john@example.com",
    "fullname": "John Doe",
    "status": "pursuing",
    "is_premium": false,
    "profile_image_url": "http://minio:9000/profile-photos/...",
    "company_name": "Tech Corp"
  }
}
```

---

## 👥 User Endpoints

### GET /all-users
Get all users (for browsing)

**Query Parameters**: None

**Response**:
```json
[
  {
    "id": 1,
    "fullname": "John Doe",
    "email": "john@example.com",
    "status": "pursuing",
    "company_name": "Tech Corp",
    "profile_image_url": "http://minio:9000/...",
    "city": "New York",
    "state": "NY",
    "country": "USA"
  },
  ...
]
```

### GET /user/:email
Get user details by email

**Parameters**:
- `email` (string, required) - User's email address

**Response**:
```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "john@example.com",
    "fullname": "John Doe",
    "status": "pursuing",
    "company_name": "Tech Corp",
    "profile_image_url": "http://minio:9000/...",
    "phone": "+1234567890",
    "city": "New York",
    "state": "NY",
    "country": "USA",
    "bio": "Software Engineer",
    "is_premium": false,
    "created_at": "2025-02-02T..."
  }
}
```

### PUT /user/:userId/update
Update user profile

**Parameters**:
- `userId` (int, required) - User ID

**Request Body**:
```json
{
  "fullname": "John Doe",
  "company_name": "New Company",
  "phone": "+1234567890",
  "city": "San Francisco",
  "state": "CA",
  "country": "USA",
  "bio": "Updated bio",
  "status": "employed"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "user": { /* updated user object */ }
}
```

---

## 📁 File Upload Endpoints

### POST /upload-profile-photo
Upload user profile photo to MinIO

**Content-Type**: `multipart/form-data`

**Request Body**:
```
- file: File (image only, max 2MB)
- email: string (user email)
```

**Response**:
```json
{
  "success": true,
  "message": "Profile photo uploaded successfully",
  "photoUrl": "http://minio:9000/profile-photos/email@example.com/1234567890-photo.jpg"
}
```

### POST /upload-resume
Upload resume document to MinIO

**Content-Type**: `multipart/form-data`

**Request Body**:
```
- file: File (PDF, DOC, DOCX; max 5MB)
- email: string (user email)
```

**Response**:
```json
{
  "success": true,
  "message": "Resume uploaded successfully",
  "resumeUrl": "http://minio:9000/resumes/email@example.com/1234567890-resume.pdf",
  "resumeId": 42,
  "fileName": "resume.pdf",
  "fileSize": 256000
}
```

### GET /resumes/:email
Get all resumes for a user

**Parameters**:
- `email` (string, required) - User email

**Response**:
```json
{
  "success": true,
  "resumes": [
    {
      "id": 1,
      "name": "resume.pdf",
      "minio_url": "http://minio:9000/resumes/email@example.com/...",
      "file_size": 256000,
      "created_at": "2025-02-02T..."
    },
    ...
  ]
}
```

### DELETE /resume/:resumeId
Delete a resume

**Parameters**:
- `resumeId` (int, required) - Resume ID

**Response**:
```json
{
  "success": true,
  "message": "Resume deleted successfully"
}
```

### POST /upload-payment-screenshot
Upload payment screenshot for verification

**Content-Type**: `multipart/form-data`

**Request Body**:
```
- file: File (image only, max 2MB)
- email: string (user email)
- paymentId: int (optional - payment record ID)
```

**Response**:
```json
{
  "success": true,
  "message": "Payment screenshot uploaded successfully",
  "screenshotUrl": "http://minio:9000/payment-screenshots/email@example.com/...",
  "fileName": "1234567890-payment.jpg"
}
```

### POST /upload-qr-code
Upload QR code image for payment method

**Content-Type**: `multipart/form-data`

**Request Body**:
```
- file: File (image only, max 2MB)
- paymentId: int (optional - payment record ID)
```

**Response**:
```json
{
  "success": true,
  "message": "QR code uploaded successfully",
  "qrUrl": "http://minio:9000/qr-codes/1234567890-qr.jpg",
  "fileName": "1234567890-qr.jpg"
}
```

---

## 💬 Messaging Endpoints

### POST /send-message
Send message to another user

**Request Body**:
```json
{
  "sender_email": "john@example.com",
  "receiver_email": "jane@example.com",
  "message": "Hello! How are you?",
  "timestamp": "2025-02-02T12:00:00Z"
}
```

**Response** (Success):
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageId": 123,
  "createdAt": "2025-02-02T12:00:00Z"
}
```

**Response** (Free user exceeded limit):
```json
{
  "success": false,
  "message": "You have reached the maximum number of chats (5). Upgrade to premium to chat with more users.",
  "currentChats": 5,
  "limit": 5
}
```

### GET /messages/:sender_email/:receiver_email
Get conversation history between two users

**Parameters**:
- `sender_email` (string, required) - Sender's email
- `receiver_email` (string, required) - Receiver's email

**Response**:
```json
{
  "success": true,
  "messages": [
    {
      "id": 1,
      "sender_id": 1,
      "receiver_id": 2,
      "sender_email": "john@example.com",
      "receiver_email": "jane@example.com",
      "message": "Hello!",
      "is_read": true,
      "timestamp": "2025-02-02T12:00:00Z"
    },
    ...
  ]
}
```

### GET /conversations/:user_email
Get all conversations for a user

**Parameters**:
- `user_email` (string, required) - User's email

**Response**:
```json
{
  "success": true,
  "conversations": [
    {
      "id": 1,
      "other_user_id": 2,
      "other_user": {
        "id": 2,
        "fullname": "Jane Doe",
        "email": "jane@example.com",
        "profile_image_url": "http://minio:9000/...",
        "company_name": "Tech Corp"
      },
      "last_message": "See you later!",
      "last_message_time": "2025-02-02T12:00:00Z",
      "is_active": true
    },
    ...
  ],
  "count": 3
}
```

---

## 🔔 Notification Endpoints

### GET /notifications/:userId
Get all notifications for a user

**Parameters**:
- `userId` (int, required) - User ID

**Query Parameters**:
- `unreadOnly` (boolean, optional) - Filter unread only (true/false)

**Response**:
```json
{
  "success": true,
  "notifications": [
    {
      "id": 1,
      "user_id": 1,
      "title": "New Message",
      "message": "John sent you a message",
      "is_read": false,
      "created_at": "2025-02-02T12:00:00Z"
    },
    ...
  ],
  "unreadCount": 5
}
```

### PUT /notifications/:notificationId/read
Mark notification as read

**Parameters**:
- `notificationId` (int, required) - Notification ID

**Response**:
```json
{
  "success": true,
  "notification": {
    "id": 1,
    "user_id": 1,
    "title": "New Message",
    "message": "John sent you a message",
    "is_read": true,
    "created_at": "2025-02-02T12:00:00Z"
  }
}
```

---

## 📨 Admin Message Endpoints

### POST /send-message (Admin)
Send message to users by category (admin only)

**Request Body**:
```json
{
  "category": "pursuing|employed|graduated",
  "message": "Important announcement",
  "adminId": 1
}
```

**Response**:
```json
{
  "success": true,
  "message": "Message sent successfully",
  "messageId": 123,
  "recipientCount": 50,
  "emailStatus": { /* SendPulse response */ }
}
```

### GET /messages
Get admin messages (by category)

**Query Parameters**:
- `category` (string, optional) - Filter by status category

**Response**:
```json
{
  "success": true,
  "messages": [
    {
      "id": 1,
      "category": "pursuing",
      "message": "Join our webinar",
      "timestamp": "2025-02-02T12:00:00Z"
    },
    ...
  ]
}
```

### GET /message-stats
Get statistics for messages

**Response**:
```json
{
  "success": true,
  "totalMessages": 150,
  "categoryCount": {
    "employed": 50,
    "pursuing": 75,
    "graduated": 25
  },
  "messages": [
    {
      "category": "pursuing",
      "count": 75,
      "latest": "2025-02-02T12:00:00Z"
    },
    ...
  ]
}
```

---

## 🎁 Donation Endpoints

### GET /donations
Get all donations

**Query Parameters**:
- `limit` (int, optional) - Limit results (default: 100)
- `offset` (int, optional) - Pagination offset

**Response**:
```json
{
  "success": true,
  "donations": [
    {
      "id": 1,
      "donor_name": "John Doe",
      "donor_email": "john@example.com",
      "amount": 5000,
      "category": "orphans",
      "message": "For orphans fund",
      "qr_code_url": "http://minio:9000/qr-codes/...",
      "created_at": "2025-02-02T12:00:00Z"
    },
    ...
  ]
}
```

---

## 🎟️ Subscription Endpoints

### GET /subscriptions/plans
Get all subscription plans

**Response**:
```json
{
  "success": true,
  "plans": [
    {
      "id": 1,
      "name": "Monthly",
      "price": 100,
      "currency": "INR",
      "period": "month",
      "features": ["Unlimited chats", "Priority support"]
    },
    {
      "id": 2,
      "name": "Yearly",
      "price": 1000,
      "currency": "INR",
      "period": "year",
      "features": ["Unlimited chats", "Priority support"]
    }
  ]
}
```

### POST /subscriptions/subscribe
Subscribe to a plan

**Request Body**:
```json
{
  "user_id": 1,
  "plan_id": 1,
  "payment_screenshot": "http://minio:9000/..."
}
```

**Response**:
```json
{
  "success": true,
  "message": "Subscription created successfully",
  "subscription": {
    "id": 1,
    "user_id": 1,
    "plan_id": 1,
    "status": "pending",
    "start_date": "2025-02-02T12:00:00Z",
    "end_date": "2025-03-02T12:00:00Z"
  }
}
```

### GET /subscriptions/user/:userId
Get user's subscription

**Parameters**:
- `userId` (int, required) - User ID

**Response**:
```json
{
  "success": true,
  "subscription": {
    "id": 1,
    "user_id": 1,
    "plan_id": 1,
    "status": "active",
    "start_date": "2025-02-02T12:00:00Z",
    "end_date": "2025-03-02T12:00:00Z",
    "is_premium": true
  }
}
```

---

## 🏥 Health Check Endpoints

### GET /health
Backend health check

**Response**:
```json
{
  "status": "OK",
  "database": "connected",
  "timestamp": "2025-02-02T12:00:00Z"
}
```

### GET /api/ready
Check if API is ready (DB initialized)

**Response**:
```json
{
  "status": "ready",
  "database": "available",
  "tables": "initialized"
}
```

---

## Error Handling

All endpoints return error responses in this format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error (development only)"
}
```

### Common HTTP Status Codes

- `200 OK` - Success
- `201 Created` - Resource created
- `400 Bad Request` - Invalid parameters
- `403 Forbidden` - Permission denied
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - Server error

---

## Rate Limiting

Currently not implemented. Add based on production requirements.

---

## Authentication

Most endpoints require user context (email). Some admin endpoints require admin verification (to be implemented).

---

## File Size Limits

- Profile photos: 2MB max
- Resumes: 5MB max
- Payment screenshots: 2MB max
- QR codes: 2MB max

---

## Testing with cURL

```bash
# Get all users
curl http://localhost:5000/api/all-users

# Get user details
curl http://localhost:5000/api/user/john@example.com

# Send message
curl -X POST http://localhost:5000/api/send-message \
  -H "Content-Type: application/json" \
  -d '{
    "sender_email": "john@example.com",
    "receiver_email": "jane@example.com",
    "message": "Hello!"
  }'

# Get resumes
curl http://localhost:5000/api/resumes/john@example.com

# Get conversations
curl http://localhost:5000/api/conversations/john@example.com

# Get notifications
curl http://localhost:5000/api/notifications/1
```

---

## WebSocket (Planned)

Real-time messaging via WebSocket endpoint (not yet implemented):
```
ws://localhost:5000/messages
```

---

## Version

Current API Version: **v1.0** (2025-02-02)

---

This API documentation is current as of the latest session. For updates, refer to route files.

