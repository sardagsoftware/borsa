#!/bin/bash
# Sync Supabase Environment Variables to Vercel Production

set -e

echo "🚀 Syncing Supabase Environment Variables to Vercel Production"
echo ""

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found!"
    echo "   Install: npm install -g vercel"
    exit 1
fi

echo "✅ Vercel CLI found"
echo ""

# Supabase credentials
SUPABASE_URL="https://ceipxudbpixhfsnrfjvv.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlaXB4dWRicGl4aGZzbnJmanZ2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwMzEzNjEsImV4cCI6MjA2OTYwNzM2MX0.FCRAgcQwAlnr_4mOBiEvCozi-Msgm6BMop2GwtKzfxI"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNlaXB4dWRicGl4aGZzbnJmanZ2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDAzMTM2MSwiZXhwIjoyMDY5NjA3MzYxfQ.PGkYl2WlTktREJHIQGNnZNSdHJSoSGXjNbNU-jziZd0"

echo "📋 Environment Variables to Sync:"
echo "   • NEXT_PUBLIC_SUPABASE_URL"
echo "   • NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "   • SUPABASE_SERVICE_ROLE_KEY"
echo ""

# Function to add/update environment variable
add_env() {
    local key=$1
    local value=$2
    local env_type=$3

    echo "🔧 Setting $key for $env_type..."

    # Remove existing value first (ignore errors)
    vercel env rm "$key" "$env_type" --yes 2>/dev/null || true

    # Add new value
    echo "$value" | vercel env add "$key" "$env_type"

    if [ $? -eq 0 ]; then
        echo "   ✅ $key set successfully"
    else
        echo "   ❌ Failed to set $key"
        return 1
    fi
}

# Sync to production
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PRODUCTION Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

add_env "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "production"
add_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "production"
add_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "production"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "PREVIEW Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

add_env "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "preview"
add_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "preview"
add_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "preview"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "DEVELOPMENT Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

add_env "NEXT_PUBLIC_SUPABASE_URL" "$SUPABASE_URL" "development"
add_env "NEXT_PUBLIC_SUPABASE_ANON_KEY" "$SUPABASE_ANON_KEY" "development"
add_env "SUPABASE_SERVICE_ROLE_KEY" "$SUPABASE_SERVICE_ROLE_KEY" "development"

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ Environment Variables Synced Successfully!"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "📌 Next Steps:"
echo "   1. Redeploy: vercel --prod"
echo "   2. Or push to git for automatic deployment"
echo ""
echo "🔍 Verify:"
echo "   vercel env ls"
echo ""
