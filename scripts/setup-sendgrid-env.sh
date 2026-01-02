#!/bin/bash

# SendGrid Environment Variables Setup
# Adds SendGrid API key to Vercel environment variables
# Date: 2026-01-02

set -e

echo "🔐 SendGrid Environment Variables Setup"
echo "========================================"
echo ""

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI not found. Installing..."
    npm install -g vercel
fi

# Check if logged in to Vercel
echo "🔐 Checking Vercel authentication..."
vercel whoami || {
    echo "⚠️  Not logged in to Vercel. Please login:"
    vercel login
}

echo ""
echo "📝 Adding SendGrid environment variables to Vercel..."
echo ""

# Project selection (you may need to adjust this)
# If you have multiple projects, Vercel will prompt you to select

# Function to add environment variable
add_env_var() {
    local name=$1
    local value=$2
    local env=$3
    local description=$4

    echo "Adding: $description"
    echo "  Variable: $name"
    echo "  Environment: $env"

    # Add to Vercel (will prompt for project if not in project directory)
    if echo "$value" | vercel env add "$name" "$env" 2>/dev/null; then
        echo "  ✅ Added successfully"
    else
        echo "  ⚠️  Variable may already exist. You can update it manually:"
        echo "     vercel env rm $name $env"
        echo "     Then re-run this script"
    fi
    echo ""
}

# SendGrid API Key
SENDGRID_API_KEY="YOUR_SENDGRID_API_KEY_HERE"

echo "1️⃣ Adding SENDGRID_API_KEY..."
# Add to all environments (production, preview, development)
add_env_var \
    "SENDGRID_API_KEY" \
    "$SENDGRID_API_KEY" \
    "production,preview,development" \
    "SendGrid API Key (all environments)"

echo "2️⃣ Adding SENDGRID_FROM_EMAIL..."
# Default from email (can be changed later)
add_env_var \
    "SENDGRID_FROM_EMAIL" \
    "noreply@www.ailydian.com" \
    "production,preview,development" \
    "SendGrid From Email Address"

echo "3️⃣ Adding SENDGRID_FROM_NAME..."
# Default from name (can be changed later)
add_env_var \
    "SENDGRID_FROM_NAME" \
    "AILYDIAN" \
    "production,preview,development" \
    "SendGrid From Name"

echo "========================================"
echo "✅ Environment Variables Setup Complete!"
echo ""
echo "📊 Variables Added:"
echo "  - SENDGRID_API_KEY (production, preview, development)"
echo "  - SENDGRID_FROM_EMAIL (noreply@www.ailydian.com)"
echo "  - SENDGRID_FROM_NAME (AILYDIAN)"
echo ""
echo "🔒 Security:"
echo "  - API key is stored securely in Vercel"
echo "  - Never commit API keys to git"
echo "  - Rotate keys regularly for security"
echo ""
echo "📧 Usage in your application:"
echo ""
echo "  // Node.js example"
echo "  const sgMail = require('@sendgrid/mail');"
echo "  sgMail.setApiKey(process.env.SENDGRID_API_KEY);"
echo ""
echo "  const msg = {"
echo "    to: 'user@example.com',"
echo "    from: process.env.SENDGRID_FROM_EMAIL,"
echo "    subject: 'Hello from AILYDIAN',"
echo "    text: 'Email sent via SendGrid',"
echo "    html: '<strong>Email sent via SendGrid</strong>'"
echo "  };"
echo ""
echo "  await sgMail.send(msg);"
echo ""
echo "🔄 Next Steps:"
echo "  1. Redeploy your Vercel project to use new env variables"
echo "  2. Test email sending functionality"
echo "  3. Monitor SendGrid dashboard for email stats"
echo ""
echo "📖 Full documentation: docs/SENDGRID-DNS-SETUP.md"
echo ""
