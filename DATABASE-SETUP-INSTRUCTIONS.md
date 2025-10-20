# 🗄️ Database Setup Instructions

## ⚠️ Problem: Supabase Database Paused

Both Supabase databases are currently **paused**. Free tier databases pause after 7 days of inactivity.

---

## ✅ Solution: Manual SQL Setup (2 dakika)

### Step 1: Resume Database

1. **Go to Supabase Dashboard:**
   - https://supabase.com/dashboard/project/cmxkfqyaqpivcvwdiyul

2. **Click "Resume Project"** button

3. **Wait 2-3 minutes** for database to start

---

### Step 2: Run SQL Script

1. **Open SQL Editor:**
   - https://supabase.com/dashboard/project/cmxkfqyaqpivcvwdiyul/sql/new

2. **Copy & Paste** the content of `prisma/schema.sql` file

3. **Click "Run" button**

4. **Verify** - You should see 6 tables created:
   - ✅ users
   - ✅ conversations
   - ✅ messages
   - ✅ files
   - ✅ preferences
   - ✅ usage_logs

---

### Step 3: Verify Setup

Run this command:

\`\`\`bash
npx prisma db pull
\`\`\`

This will pull the schema from database and confirm it's working.

---

## 🔑 Current Configuration

**.env file is already configured with:**

\`\`\`env
DATABASE_URL="postgresql://postgres:LCx3iR4$jLEA!3X@db.cmxkfqyaqpivcvwdiyul.supabase.co:5432/postgres?pgbouncer=true&connection_limit=1"
NEXT_PUBLIC_SUPABASE_URL=https://cmxkfqyaqpivcvwdiyul.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
\`\`\`

---

## 🚀 After Setup

Once database is active and schema is created, run:

\`\`\`bash
# Generate Prisma client
npx prisma generate

# Test connection
node test-supabase-connection.js
\`\`\`

Then you can continue with Phase 3 implementation!

---

## 📝 Notes

- **Free Tier Limits:** 500 MB database, auto-pauses after 7 days inactivity
- **Production:** Consider upgrading to Pro tier ($25/month) for always-on database
- **Alternative:** Use Vercel Postgres (256 MB free) or Railway (5 GB free)
