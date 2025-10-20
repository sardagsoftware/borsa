# Ailydian Ultra Pro - User Management System

## Complete Authentication & User Management System Documentation

### System Overview

This is a production-ready user authentication and management system with the following features:

- User Registration & Login
- JWT-based Authentication
- Two-Factor Authentication (2FA)
- Password Hashing with bcrypt
- Session Management
- Activity Logging
- Usage Statistics Tracking
- SQLite Database
- RESTful API
- Modern Frontend UI

---

## Files Created

### Backend

#### 1. Database (`/database/init-db.js`)
- SQLite database initialization
- Creates 7 tables:
  - `users` - User accounts
  - `sessions` - Active login sessions
  - `activity_log` - User activity tracking
  - `usage_stats` - Usage statistics
  - `api_keys` - API key management
  - `email_verification` - Email verification tokens
  - `password_reset` - Password reset tokens

#### 2. User Model (`/backend/models/User.js`)
- Complete user management class
- Methods:
  - `createUser()` - Register new user
  - `login()` - Authenticate user
  - `verifyTwoFactor()` - Verify 2FA code
  - `enableTwoFactor()` - Enable 2FA
  - `confirmTwoFactor()` - Activate 2FA
  - `findByEmail()` - Find user by email
  - `findById()` - Find user by ID
  - `getUserWithStats()` - Get user with statistics
  - `updateProfile()` - Update user profile
  - `logout()` - Invalidate session
  - `generateToken()` - Create JWT token
  - `verifyToken()` - Verify JWT token
  - `logActivity()` - Log user activity
  - `updateUsage()` - Update usage statistics

#### 3. Auth Middleware (`/backend/middleware/auth.js`)
- Authentication middleware functions:
  - `authenticateToken()` - Verify JWT and attach user
  - `requireAuth()` - Redirect if not authenticated
  - `checkSubscription()` - Check subscription level
  - `checkCredits()` - Ensure sufficient credits
  - `rateLimitByUser()` - Rate limiting
  - `requireAdmin()` - Admin-only access
  - `optionalAuth()` - Optional authentication

#### 4. Auth API Routes (`/api/auth/index.js`)
- RESTful API endpoints:
  - `POST /api/auth/register` - Register new user
  - `POST /api/auth/login` - Login user
  - `POST /api/auth/verify-2fa` - Verify 2FA code
  - `POST /api/auth/enable-2fa` - Enable 2FA
  - `POST /api/auth/confirm-2fa` - Confirm 2FA setup
  - `GET /api/auth/me` - Get current user
  - `PUT /api/auth/profile` - Update profile
  - `POST /api/auth/logout` - Logout user
  - `POST /api/auth/refresh` - Refresh token
  - `GET /api/auth/activity` - Get activity log

#### 5. Server (`/server-auth.js`)
- Express server with authentication
- Middleware setup
- Route configuration
- Error handling
- Graceful shutdown

### Frontend

#### 1. Login Page (`/public/login.html`)
- Modern gradient design
- Email & password login
- 2FA code input (conditional)
- Remember me option
- Forgot password link
- Error/success messages
- Auto-redirect if logged in
- Floating particle animations

#### 2. Register Page (`/public/register.html`)
- User registration form
- Fields: name, email, phone, password
- Password strength indicator
- Password confirmation
- Terms of service checkbox
- Client-side validation
- Error handling
- Auto-redirect after registration

#### 3. Dashboard (`/public/dashboard.html`)
- Modern dark theme
- Sidebar navigation
- User info display
- Stats cards:
  - Total credits
  - Chat messages
  - Images generated
  - Voice minutes
- Quick action buttons
- Recent activity list
- Logout functionality

---

## Database Schema

### Users Table
```sql
id                 INTEGER PRIMARY KEY
email              TEXT UNIQUE NOT NULL
passwordHash       TEXT NOT NULL
name               TEXT NOT NULL
phone              TEXT
twoFactorSecret    TEXT
twoFactorEnabled   INTEGER (0/1)
emailVerified      INTEGER (0/1)
createdAt          DATETIME
lastLogin          DATETIME
subscription       TEXT (free/basic/pro/enterprise)
credits            INTEGER (default 100)
usageLimit         INTEGER (default 1000)
currentUsage       INTEGER (default 0)
resetDate          DATETIME
avatar             TEXT
bio                TEXT
status             TEXT (default 'active')
```

### Sessions Table
```sql
id              INTEGER PRIMARY KEY
userId          INTEGER (FK to users)
token           TEXT UNIQUE
refreshToken    TEXT
ipAddress       TEXT
userAgent       TEXT
createdAt       DATETIME
expiresAt       DATETIME
lastActivity    DATETIME
```

### Activity Log Table
```sql
id          INTEGER PRIMARY KEY
userId      INTEGER (FK to users)
action      TEXT
description TEXT
ipAddress   TEXT
userAgent   TEXT
metadata    TEXT (JSON)
createdAt   DATETIME
```

### Usage Stats Table
```sql
id               INTEGER PRIMARY KEY
userId           INTEGER (FK to users)
chatMessages     INTEGER
imagesGenerated  INTEGER
voiceMinutes     INTEGER
creditsUsed      INTEGER
date             DATE
```

---

## Installation & Setup

### 1. Install Dependencies
```bash
npm install
```

Required packages (already installed):
- express
- bcrypt
- jsonwebtoken
- speakeasy
- better-sqlite3
- helmet
- cors
- cookie-parser

### 2. Initialize Database
```bash
node database/init-db.js
```

This creates `/database/ailydian.db` with all tables.

### 3. Set Environment Variables (Optional)
Create `.env` file:
```env
JWT_SECRET=your-super-secret-jwt-key-change-in-production
PORT=3100
NODE_ENV=production
```

### 4. Start Server
```bash
# Development
npm run dev

# Production
npm start

# Or directly
node server-auth.js
```

---

## API Usage

### Register User
```bash
curl -X POST http://localhost:3100/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "password": "SecurePass123!",
    "confirmPassword": "SecurePass123!"
  }'
```

### Login
```bash
curl -X POST http://localhost:3100/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "SecurePass123!"
  }'
```

Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "email": "john@example.com",
    "name": "John Doe",
    "subscription": "free",
    "credits": 100
  }
}
```

### Get Current User
```bash
curl http://localhost:3100/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Enable 2FA
```bash
curl -X POST http://localhost:3100/api/auth/enable-2fa \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Response:
```json
{
  "success": true,
  "secret": "JBSWY3DPEHPK3PXP",
  "qrCode": "otpauth://totp/Ailydian%20Ultra%20Pro%20(1)?secret=JBSWY3DPEHPK3PXP"
}
```

### Logout
```bash
curl -X POST http://localhost:3100/api/auth/logout \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Frontend Integration

### Storing Token
After successful login:
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password })
});

const data = await response.json();

if (data.success) {
  // Store token
  localStorage.setItem('auth_token', data.token);
  localStorage.setItem('user', JSON.stringify(data.user));

  // Redirect to dashboard
  window.location.href = '/dashboard.html';
}
```

### Making Authenticated Requests
```javascript
const token = localStorage.getItem('auth_token');

const response = await fetch('/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});

const data = await response.json();
```

### Protecting Routes
```javascript
// Check if user is logged in
const token = localStorage.getItem('auth_token');
if (!token) {
  window.location.href = '/login.html';
}

// Verify token is valid
fetch('/api/auth/me', {
  headers: { 'Authorization': `Bearer ${token}` }
})
.then(response => {
  if (!response.ok) {
    // Token expired or invalid
    localStorage.removeItem('auth_token');
    window.location.href = '/login.html';
  }
});
```

---

## Security Features

### 1. Password Security
- Passwords hashed with bcrypt (12 rounds)
- Minimum 8 characters required
- Strength indicator on registration

### 2. JWT Authentication
- Secure token generation
- 7-day expiration
- Refresh token support (30 days)

### 3. Two-Factor Authentication
- TOTP-based (Time-based One-Time Password)
- QR code for easy setup
- 6-digit codes
- 2-step time window for verification

### 4. Session Management
- Session tracking in database
- IP address logging
- User agent tracking
- Automatic session expiration
- Activity timestamp updates

### 5. Input Validation
- Email format validation
- Password strength requirements
- XSS protection
- SQL injection prevention (parameterized queries)

### 6. Rate Limiting
- User-based rate limiting
- Configurable limits
- Automatic reset windows

### 7. HTTPS/CORS
- Helmet middleware for security headers
- CORS configuration
- Cookie security (httpOnly, secure)

---

## Usage Tracking

The system automatically tracks:
- Chat messages sent
- Images generated
- Voice minutes used
- Credits consumed
- All user activity

### Update Usage Example
```javascript
User.updateUsage(userId, {
  chatMessages: 1,
  imagesGenerated: 0,
  voiceMinutes: 0,
  creditsUsed: 1
});
```

### Get User Stats
```javascript
const userWithStats = User.getUserWithStats(userId);
// Returns user data + stats + recent activity
```

---

## Activity Logging

Every significant action is logged:
- User registration
- Login attempts
- 2FA enabled/disabled
- Profile updates
- Password changes
- API key generation

### Log Activity Example
```javascript
User.logActivity({
  userId: 1,
  action: 'profile_updated',
  description: 'User updated their profile information',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  metadata: { fields: ['name', 'bio'] }
});
```

---

## Subscription Levels

The system supports 4 subscription tiers:
- **free** - Basic access
- **basic** - Enhanced features
- **pro** - Professional features
- **enterprise** - Full access + admin

### Protecting Routes by Subscription
```javascript
const { authenticateToken, checkSubscription } = require('./backend/middleware/auth');

// Requires pro or higher
app.get('/api/premium-feature',
  authenticateToken,
  checkSubscription('pro'),
  (req, res) => {
    // Handle request
  }
);
```

---

## Testing

### Test Database Connection
```bash
curl http://localhost:3100/api/db-status
```

### Test Health Endpoint
```bash
curl http://localhost:3100/api/health
```

### Create Test User
```bash
node -e "
const User = require('./backend/models/User');
User.createUser({
  email: 'test@example.com',
  password: 'TestPass123!',
  name: 'Test User'
}).then(console.log).catch(console.error);
"
```

---

## Production Deployment

### Environment Variables
Set these in production:
```env
JWT_SECRET=your-ultra-secure-production-secret-min-32-chars
NODE_ENV=production
PORT=3100
```

### Security Checklist
- [ ] Change JWT_SECRET to random 32+ character string
- [ ] Enable HTTPS
- [ ] Set secure cookie flags
- [ ] Configure CORS whitelist
- [ ] Set up database backups
- [ ] Enable rate limiting
- [ ] Configure logging
- [ ] Set up monitoring
- [ ] Use environment variables for secrets
- [ ] Enable helmet security headers

### Database Backup
```bash
# Backup database
cp database/ailydian.db database/ailydian.db.backup

# Restore database
cp database/ailydian.db.backup database/ailydian.db
```

---

## Troubleshooting

### Database Issues
```bash
# Reinitialize database
rm database/ailydian.db
node database/init-db.js
```

### Token Expired
Clear local storage and login again:
```javascript
localStorage.clear();
window.location.href = '/login.html';
```

### Port Already in Use
```bash
# Kill process on port 3100
lsof -ti:3100 | xargs kill -9

# Or use different port
PORT=3101 node server-auth.js
```

---

## File Structure

```
ailydian-ultra-pro/
├── database/
│   ├── init-db.js           # Database initialization
│   └── ailydian.db           # SQLite database (created)
├── backend/
│   ├── models/
│   │   └── User.js           # User model & methods
│   └── middleware/
│       └── auth.js           # Authentication middleware
├── api/
│   └── auth/
│       └── index.js          # Auth API routes
├── public/
│   ├── login.html            # Login page
│   ├── register.html         # Registration page
│   └── dashboard.html        # User dashboard
├── server-auth.js            # Main server file
├── package.json              # Dependencies
└── USER-MANAGEMENT-README.md # This file
```

---

## Next Steps

### Recommended Enhancements
1. Email verification system
2. Password reset functionality
3. OAuth social login (Google, GitHub)
4. User profile picture upload
5. Account settings page
6. API key management UI
7. Usage analytics dashboard
8. Notification system
9. Audit logs viewer
10. Admin panel

---

## Support & Documentation

### Key Technologies
- **Express.js** - Web framework
- **SQLite** - Database
- **bcrypt** - Password hashing
- **jsonwebtoken** - JWT authentication
- **speakeasy** - 2FA/TOTP
- **better-sqlite3** - SQLite driver

### Additional Resources
- JWT: https://jwt.io
- bcrypt: https://github.com/kelektiv/node.bcrypt.js
- speakeasy: https://github.com/speakeasyjs/speakeasy
- Express: https://expressjs.com

---

## License

This authentication system is part of Ailydian Ultra Pro.

---

## Author

Created for Ailydian Ultra Pro
Date: 2025-10-02

---

**System is ready to use!**

Start the server:
```bash
node server-auth.js
```

Then visit:
- http://localhost:3100/login.html
- http://localhost:3100/register.html
- http://localhost:3100/dashboard.html
