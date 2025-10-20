# 💾 PHASE 3: DATABASE & PERSISTENCE - IMPLEMENTATION PLAN

**Project:** LyDian IQ - Database & User Management
**Start Date:** 2025-10-07
**Estimated Duration:** 1-2 weeks
**Status:** 🚀 Ready to Start

---

## 🎯 PHASE 3 OVERVIEW

**Goal:** Implement full database persistence, user authentication, conversation history, and file storage to transform LyDian IQ into a production-ready multi-user platform.

**Dependencies:**
- ✅ Phase 1 Complete (Security + Redis Cache)
- ✅ Phase 2 Complete (Multimodal AI)

---

## 📋 TASKS BREAKDOWN (7 Tasks)

### Task 1: Database Schema Design 🗄️

**Status:** ⏳ Pending

**Objective:** Design and implement PostgreSQL/Supabase database schema

**Subtasks:**
1. Choose database provider (PostgreSQL on Vercel vs Supabase)
2. Design database schema (ERD)
3. Create tables:
   - `users` - User accounts
   - `conversations` - Conversation metadata
   - `messages` - Individual messages with multimodal content
   - `files` - Uploaded files (metadata, S3 references)
   - `preferences` - User preferences
   - `usage_logs` - Analytics data
4. Set up migrations
5. Create database indexes for performance
6. Implement database connection pooling

**Schema Preview:**

```sql
-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Conversations table
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(500),
  domain VARCHAR(50),
  language VARCHAR(10),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  last_message_at TIMESTAMP
);

-- Messages table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL, -- 'user' or 'assistant'
  content TEXT NOT NULL,
  metadata JSONB, -- AI model, response time, etc.
  file_references JSONB, -- Array of file IDs
  created_at TIMESTAMP DEFAULT NOW()
);

-- Files table
CREATE TABLE files (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  filename VARCHAR(500),
  file_type VARCHAR(100),
  file_size INTEGER,
  storage_url TEXT, -- S3/Azure Blob URL
  analysis_result JSONB, -- Vision/PDF analysis results
  created_at TIMESTAMP DEFAULT NOW()
);

-- User preferences table
CREATE TABLE preferences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  default_language VARCHAR(10) DEFAULT 'tr-TR',
  default_domain VARCHAR(50) DEFAULT 'mathematics',
  preferred_ai_provider VARCHAR(50), -- 'groq', 'openai', 'claude'
  theme VARCHAR(20) DEFAULT 'light',
  settings JSONB, -- Additional custom settings
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Usage logs table (for analytics)
CREATE TABLE usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  endpoint VARCHAR(200),
  request_data JSONB,
  response_time INTEGER, -- milliseconds
  ai_provider VARCHAR(50),
  ai_model VARCHAR(100),
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Estimated Time:** 2-3 days

---

### Task 2: User Authentication System 🔐

**Status:** ⏳ Pending

**Objective:** Implement NextAuth.js for user authentication

**Subtasks:**
1. Install and configure NextAuth.js
2. Set up OAuth providers:
   - Google OAuth
   - GitHub OAuth
   - (Optional) Email/Password
3. Create authentication API routes
4. Implement JWT token handling
5. Create session management
6. Build login/logout UI components
7. Add authentication middleware to protected routes

**Files to Create:**
- `/api/auth/[...nextauth].js` - NextAuth.js configuration
- `/lib/auth/next-auth-config.js` - Auth configuration
- `/middleware/auth-middleware.js` - Protected route middleware
- `/public/login.html` - Login page
- `/public/js/auth-client.js` - Frontend auth handling

**NextAuth.js Configuration:**

```javascript
// /api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { SupabaseAdapter } from '@next-auth/supabase-adapter';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],
  adapter: SupabaseAdapter({
    url: process.env.SUPABASE_URL,
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }),
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.userId = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.userId;
      }
      return session;
    },
  },
});
```

**Estimated Time:** 2-3 days

---

### Task 3: Conversation History Storage 💬

**Status:** ⏳ Pending

**Objective:** Implement conversation saving, loading, and search

**Subtasks:**
1. Create API endpoint: `/api/conversations/list` (get all conversations)
2. Create API endpoint: `/api/conversations/create` (new conversation)
3. Create API endpoint: `/api/conversations/[id]` (get specific conversation)
4. Create API endpoint: `/api/conversations/[id]/messages` (get messages)
5. Create API endpoint: `/api/messages/create` (save new message)
6. Implement conversation search functionality
7. Build conversation history UI component
8. Add pagination for large conversation lists

**API Endpoints:**

```javascript
// GET /api/conversations/list
{
  "userId": "uuid",
  "limit": 20,
  "offset": 0
}

// Response
{
  "success": true,
  "conversations": [
    {
      "id": "uuid",
      "title": "Matematik problemi çözümü",
      "domain": "mathematics",
      "language": "tr-TR",
      "lastMessageAt": "2025-10-07T15:30:00Z",
      "messageCount": 5
    }
  ],
  "total": 42
}

// POST /api/conversations/create
{
  "userId": "uuid",
  "title": "Yeni sohbet",
  "domain": "mathematics",
  "language": "tr-TR"
}

// GET /api/conversations/[id]/messages
{
  "conversationId": "uuid",
  "limit": 50,
  "offset": 0
}

// Response
{
  "success": true,
  "messages": [
    {
      "id": "uuid",
      "role": "user",
      "content": "2+2 kaç eder?",
      "createdAt": "2025-10-07T15:25:00Z",
      "files": []
    },
    {
      "id": "uuid",
      "role": "assistant",
      "content": "2+2 = 4",
      "metadata": {
        "model": "LLaMA 3.3 70B",
        "provider": "Groq",
        "responseTime": "0.8"
      },
      "createdAt": "2025-10-07T15:25:01Z"
    }
  ]
}
```

**Frontend Components:**
- Conversation sidebar (list of conversations)
- Conversation header (title, settings)
- Message list (scrollable, paginated)
- "New Conversation" button

**Estimated Time:** 3-4 days

---

### Task 4: File Storage System 📁

**Status:** ⏳ Pending

**Objective:** Implement S3/Azure Blob storage for uploaded files

**Subtasks:**
1. Choose storage provider (AWS S3 vs Azure Blob vs Vercel Blob)
2. Set up storage bucket and access credentials
3. Create file upload API endpoint
4. Implement file storage logic:
   - Upload to S3/Azure
   - Save metadata to database
   - Generate signed URLs for download
5. Create file download/retrieval API
6. Implement file deletion (with cascade)
7. Add file versioning support
8. Build file history UI

**Storage Strategy:**

```
User uploads file (image/PDF) →
Frontend: Convert to Base64 →
Backend:
  1. Upload original file to S3/Azure
  2. Process file (vision/PDF analysis)
  3. Save metadata + analysis to database
  4. Return file ID + storage URL to user
  5. Associate file with conversation/message
```

**API Endpoints:**

```javascript
// POST /api/files/upload
{
  "userId": "uuid",
  "conversationId": "uuid",
  "filename": "document.pdf",
  "fileType": "application/pdf",
  "fileData": "base64..." // or multipart/form-data
}

// Response
{
  "success": true,
  "file": {
    "id": "uuid",
    "filename": "document.pdf",
    "storageUrl": "https://bucket.s3.amazonaws.com/files/uuid/document.pdf",
    "analysisResult": {
      "pageCount": 5,
      "hasTable": true,
      "textLength": 3421
    }
  }
}

// GET /api/files/[id]
// Returns signed URL for file download

// DELETE /api/files/[id]
// Deletes file from storage + database
```

**File Storage Options:**

| Provider | Pros | Cons |
|----------|------|------|
| **AWS S3** | Industry standard, reliable, cheap | Requires AWS account setup |
| **Azure Blob** | Good Azure integration | More expensive |
| **Vercel Blob** | Easy Vercel integration | Limited free tier |

**Recommendation:** AWS S3 (most cost-effective)

**Estimated Time:** 2-3 days

---

### Task 5: Session Management 🔄

**Status:** ⏳ Pending

**Objective:** Implement user sessions with Redis

**Subtasks:**
1. Create session creation/validation logic
2. Store active sessions in Redis (fast access)
3. Implement session expiration (30 days)
4. Track active conversations per user
5. Implement "Continue Conversation" feature
6. Add session refresh on activity
7. Build session management UI

**Session Structure:**

```javascript
// Redis Key: session:{userId}
{
  "userId": "uuid",
  "activeConversationId": "uuid",
  "lastActivity": "2025-10-07T15:30:00Z",
  "preferences": {
    "language": "tr-TR",
    "domain": "mathematics"
  },
  "expiresAt": "2025-11-06T15:30:00Z"
}
```

**Session API:**

```javascript
// GET /api/session/current
// Returns current session + active conversation

// POST /api/session/refresh
// Extends session expiration

// POST /api/session/set-conversation
{
  "conversationId": "uuid"
}
// Sets active conversation
```

**Estimated Time:** 1-2 days

---

### Task 6: User Preferences System ⚙️

**Status:** ⏳ Pending

**Objective:** Allow users to customize their experience

**Subtasks:**
1. Create preferences API endpoints
2. Implement preference storage in database
3. Build settings page UI
4. Add preference options:
   - Default language (tr-TR, en-US, etc.)
   - Default domain (mathematics, coding, etc.)
   - Preferred AI provider (Groq, OpenAI, Claude)
   - Theme (light, dark)
   - Notification settings
5. Apply user preferences to AI requests
6. Add preference sync across devices

**Preferences API:**

```javascript
// GET /api/preferences
{
  "userId": "uuid"
}

// Response
{
  "success": true,
  "preferences": {
    "defaultLanguage": "tr-TR",
    "defaultDomain": "mathematics",
    "preferredAiProvider": "groq",
    "theme": "dark",
    "notifications": {
      "email": true,
      "push": false
    }
  }
}

// PUT /api/preferences
{
  "userId": "uuid",
  "preferences": {
    "defaultLanguage": "en-US",
    "preferredAiProvider": "claude"
  }
}
```

**Settings UI:**
- Language selector
- Domain preference dropdown
- AI provider selector (with descriptions)
- Theme toggle (light/dark)
- Notification preferences

**Estimated Time:** 2 days

---

### Task 7: Analytics Dashboard 📊

**Status:** ⏳ Pending

**Objective:** Track usage, costs, and provide admin insights

**Subtasks:**
1. Create usage logging system
2. Track metrics:
   - Total conversations
   - Total messages
   - AI provider usage distribution
   - Average response time
   - Token usage per provider
   - Estimated costs
3. Build analytics API endpoints
4. Create admin dashboard UI
5. Add charts/graphs (Chart.js or similar)
6. Implement user-level analytics
7. Add cost estimation per user

**Analytics API:**

```javascript
// GET /api/analytics/overview
{
  "userId": "uuid", // or null for admin (all users)
  "startDate": "2025-10-01",
  "endDate": "2025-10-07"
}

// Response
{
  "success": true,
  "analytics": {
    "totalConversations": 142,
    "totalMessages": 856,
    "totalFiles": 64,
    "providerUsage": {
      "groq": 512,
      "openai": 201,
      "claude": 143
    },
    "avgResponseTime": 1.8, // seconds
    "totalTokensUsed": 1234567,
    "estimatedCost": 12.45 // USD
  }
}
```

**Dashboard UI Components:**
- Overview cards (total conversations, messages, files)
- Provider usage pie chart
- Response time trend line chart
- Cost estimation
- Recent activity log
- Top users (admin only)

**Estimated Time:** 3-4 days

---

## 🏗️ TECHNICAL ARCHITECTURE

### Tech Stack:

| Component | Technology | Reason |
|-----------|-----------|--------|
| **Database** | PostgreSQL (Supabase) | Managed, scalable, free tier |
| **Authentication** | NextAuth.js | Industry standard, OAuth support |
| **File Storage** | AWS S3 | Cost-effective, reliable |
| **Session Store** | Redis (Upstash) | Already integrated, fast |
| **ORM** | Prisma or Raw SQL | Type-safe queries |
| **Analytics** | Custom + Chart.js | Flexibility |

### Database Provider Options:

#### Option 1: Supabase ✅ RECOMMENDED
- **Pros:**
  - Managed PostgreSQL
  - Free tier: 500 MB database, 1 GB file storage
  - Built-in Auth (can replace NextAuth.js)
  - Realtime subscriptions
  - Auto-generated REST API
  - Dashboard for admin
- **Cons:**
  - Vendor lock-in
  - Limited customization

#### Option 2: Vercel Postgres
- **Pros:**
  - Native Vercel integration
  - Free tier: 256 MB database
  - Simple setup
- **Cons:**
  - Smaller free tier
  - Less features than Supabase

**Recommendation:** **Supabase** (best value, most features)

---

## 📦 DEPENDENCIES TO INSTALL

```bash
npm install --save \
  next-auth \
  @supabase/supabase-js \
  @next-auth/supabase-adapter \
  aws-sdk \
  prisma \
  @prisma/client \
  chart.js \
  react-chartjs-2
```

**Environment Variables Needed:**

```bash
# Database
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
SUPABASE_ANON_KEY=eyJhbGc...

# NextAuth.js
NEXTAUTH_URL=https://www.ailydian.com
NEXTAUTH_SECRET=random_secret_string

# OAuth Providers
GOOGLE_CLIENT_ID=xxxxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxxxx
GITHUB_CLIENT_ID=xxxxx
GITHUB_CLIENT_SECRET=xxxxx

# AWS S3
AWS_ACCESS_KEY_ID=xxxxx
AWS_SECRET_ACCESS_KEY=xxxxx
AWS_S3_BUCKET_NAME=ailydian-files
AWS_REGION=eu-west-1
```

---

## 🧪 TESTING PLAN

### Database Tests:
- ✅ User creation/retrieval
- ✅ Conversation CRUD operations
- ✅ Message insertion/retrieval
- ✅ File metadata storage
- ✅ Cascade deletes (user → conversations → messages)

### Authentication Tests:
- ✅ Google OAuth login
- ✅ GitHub OAuth login
- ✅ JWT token generation
- ✅ Session persistence
- ✅ Logout functionality

### File Storage Tests:
- ✅ File upload to S3
- ✅ File download with signed URLs
- ✅ File deletion (S3 + database)
- ✅ Large file handling (>10 MB)

### Integration Tests:
- ✅ End-to-end conversation flow (auth → create → message → save)
- ✅ Multimodal file upload + storage + analysis
- ✅ Preference changes reflected in AI requests
- ✅ Analytics data accuracy

---

## 📊 SUCCESS METRICS

### Phase 3 Complete When:

1. ✅ Database schema deployed and operational
2. ✅ User authentication working (Google + GitHub OAuth)
3. ✅ Conversations can be saved/loaded/searched
4. ✅ Files can be uploaded to S3 and retrieved
5. ✅ User sessions managed with Redis
6. ✅ User preferences functional
7. ✅ Analytics dashboard showing real data

### Performance Targets:

| Metric | Target | Reason |
|--------|--------|--------|
| Database query time | < 100ms | User experience |
| File upload time | < 5s | For 10 MB files |
| Conversation load time | < 500ms | Smooth UX |
| Authentication time | < 2s | OAuth roundtrip |

---

## 🚀 IMPLEMENTATION TIMELINE

### Week 1:
- **Days 1-2:** Database schema + Supabase setup
- **Days 3-4:** User authentication (NextAuth.js)
- **Days 5-7:** Conversation history storage

### Week 2:
- **Days 1-3:** File storage system (S3)
- **Days 4-5:** Session management
- **Days 6-7:** User preferences + Analytics dashboard

**Total Estimated Time:** 10-14 days

---

## 🎓 MIGRATION STRATEGY

### From Stateless to Stateful:

**Current State:**
- No user accounts
- No conversation history
- Multimodal files processed but not saved
- Redis cache only (temporary)

**After Phase 3:**
- User accounts with OAuth
- Persistent conversation history
- Multimodal files stored in S3
- Redis cache + PostgreSQL database

**Migration Plan:**
1. Deploy database schema (backward compatible)
2. Deploy authentication (optional at first)
3. Make conversation saving optional
4. Gradually encourage users to sign up
5. Eventually require authentication for advanced features

---

## 📋 PHASE 3 CHECKLIST

```
Phase 3: Database & Persistence
├── [ ] Task 1: Database Schema Design
│   ├── [ ] Choose database provider (Supabase)
│   ├── [ ] Design ERD
│   ├── [ ] Create tables (users, conversations, messages, files, preferences, usage_logs)
│   ├── [ ] Set up migrations
│   └── [ ] Deploy database
├── [ ] Task 2: User Authentication System
│   ├── [ ] Install NextAuth.js
│   ├── [ ] Configure OAuth providers (Google, GitHub)
│   ├── [ ] Create auth API routes
│   ├── [ ] Build login/logout UI
│   └── [ ] Test authentication flow
├── [ ] Task 3: Conversation History Storage
│   ├── [ ] Create conversation API endpoints
│   ├── [ ] Implement message storage
│   ├── [ ] Build conversation history UI
│   ├── [ ] Add search functionality
│   └── [ ] Test conversation persistence
├── [ ] Task 4: File Storage System
│   ├── [ ] Set up AWS S3 bucket
│   ├── [ ] Create file upload API
│   ├── [ ] Implement file storage logic
│   ├── [ ] Build file history UI
│   └── [ ] Test file upload/download
├── [ ] Task 5: Session Management
│   ├── [ ] Implement session creation/validation
│   ├── [ ] Store sessions in Redis
│   ├── [ ] Track active conversations
│   └── [ ] Build session management UI
├── [ ] Task 6: User Preferences System
│   ├── [ ] Create preferences API
│   ├── [ ] Build settings page UI
│   ├── [ ] Apply preferences to AI requests
│   └── [ ] Test preference sync
└── [ ] Task 7: Analytics Dashboard
    ├── [ ] Create usage logging system
    ├── [ ] Build analytics API
    ├── [ ] Create dashboard UI with charts
    └── [ ] Test analytics accuracy
```

---

## 🎯 PHASE 3 SUCCESS CRITERIA

**Phase 3 is complete when:**

1. ✅ Users can sign up/login with Google or GitHub
2. ✅ Conversations are automatically saved to database
3. ✅ Users can view conversation history
4. ✅ Uploaded files are stored in S3 and retrievable
5. ✅ User preferences persist across sessions
6. ✅ Analytics dashboard shows usage metrics
7. ✅ All tests passing
8. ✅ Documentation complete

---

**Plan Created:** 2025-10-07
**Author:** Claude Code
**Project:** LyDian IQ - Database & Persistence
**Status:** 🚀 Ready to Start Phase 3!
