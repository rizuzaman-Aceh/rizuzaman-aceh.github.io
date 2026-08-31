#!/bin/bash

#############################################
# Rizu Zaman Portfolio - Vercel Setup Script
# Automates Vercel environment variables configuration
# Usage: bash scripts/setup-env-vars.sh
#############################################

set -e

echo "🚀 Rizu Zaman Portfolio - Vercel Environment Setup"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI not found!${NC}"
    echo "Please install it first:"
    echo "  npm install -g vercel"
    exit 1
fi

echo -e "${BLUE}📋 Prerequisites Check${NC}"
echo ""

# Validate inputs
read -p "Enter Vercel Token (or press Enter to use VERCEL_TOKEN env): " vercel_token
if [ -z "$vercel_token" ] && [ -z "$VERCEL_TOKEN" ]; then
    echo -e "${RED}❌ Vercel token not provided${NC}"
    exit 1
fi
vercel_token="${vercel_token:-$VERCEL_TOKEN}"

read -p "Enter Supabase URL (e.g., https://xxxx.supabase.co): " supabase_url
if [ -z "$supabase_url" ]; then
    echo -e "${RED}❌ Supabase URL is required${NC}"
    exit 1
fi

read -s -p "Enter Supabase Service Role Key (hidden): " supabase_key
echo ""
if [ -z "$supabase_key" ]; then
    echo -e "${RED}❌ Supabase Service Role Key is required${NC}"
    exit 1
fi

read -p "Enter Allowed Origin (default: https://rizuzaman-aceh.github.io): " allowed_origin
allowed_origin="${allowed_origin:-https://rizuzaman-aceh.github.io}"

echo ""
echo -e "${BLUE}🔍 Validating Credentials${NC}"
echo ""

# Test Vercel token
echo "Testing Vercel connection..."
vercel_response=$(curl -s -X GET "https://api.vercel.com/v9/projects/rizuzaman-aceh.github.io" \
  -H "Authorization: Bearer $vercel_token" \
  -H "Content-Type: application/json")

if echo "$vercel_response" | grep -q '"id"'; then
    echo -e "${GREEN}✅ Vercel connection successful${NC}"
    project_id=$(echo "$vercel_response" | grep -o '"id":"[^"]*' | head -1 | cut -d'"' -f4)
    echo "   Project ID: $project_id"
else
    echo -e "${RED}❌ Vercel connection failed${NC}"
    echo "Response: $vercel_response"
    exit 1
fi

# Test Supabase connection
echo ""
echo "Testing Supabase connection..."
supabase_response=$(curl -s -X GET "${supabase_url}/rest/v1/portfolio_messages?limit=1" \
  -H "Authorization: Bearer $supabase_key" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" 2>&1)

if echo "$supabase_response" | grep -qE '(\[\]|\[\{)'; then
    echo -e "${GREEN}✅ Supabase connection successful${NC}"
else
    echo -e "${YELLOW}⚠️  Supabase response: ${supabase_response}${NC}"
    read -p "Continue anyway? (y/N): " continue_flag
    if [ "$continue_flag" != "y" ]; then
        exit 1
    fi
fi

echo ""
echo -e "${BLUE}📝 Adding Environment Variables to Vercel${NC}"
echo ""

# Function to add env var
add_env_var() {
    local key=$1
    local value=$2
    local type=${3:-encrypted}
    
    echo "Adding $key..."
    response=$(curl -s -X POST "https://api.vercel.com/v10/projects/rizuzaman-aceh.github.io/env" \
      -H "Authorization: Bearer $vercel_token" \
      -H "Content-Type: application/json" \
      -d "{
        \"key\": \"$key\",
        \"value\": \"$value\",
        \"target\": [\"production\", \"preview\", \"development\"],
        \"type\": \"$type\"
      }")
    
    if echo "$response" | grep -q '"key"'; then
        echo -e "${GREEN}✅ $key added${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to add $key${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Add environment variables
echo ""
add_env_var "SUPABASE_URL" "$supabase_url" "encrypted"
add_env_var "SUPABASE_SERVICE_ROLE_KEY" "$supabase_key" "encrypted"
add_env_var "ALLOWED_ORIGIN" "$allowed_origin" "plain"

echo ""
echo -e "${BLUE}🔄 Triggering Vercel Redeploy${NC}"
echo ""

# Get latest deployment
latest_deployment=$(curl -s -X GET "https://api.vercel.com/v12/deployments?projectId=$project_id&limit=1" \
  -H "Authorization: Bearer $vercel_token" \
  -H "Content-Type: application/json" | grep -o '"uid":"[^"]*' | head -1 | cut -d'"' -f4)

if [ -n "$latest_deployment" ]; then
    echo "Triggering redeploy of deployment: $latest_deployment"
    redeploy_response=$(curl -s -X POST "https://api.vercel.com/v13/deployments" \
      -H "Authorization: Bearer $vercel_token" \
      -H "Content-Type: application/json" \
      -d "{\"projectId\": \"$project_id\"}")
    
    if echo "$redeploy_response" | grep -q '"uid"'; then
        new_uid=$(echo "$redeploy_response" | grep -o '"uid":"[^"]*' | head -1 | cut -d'"' -f4)
        echo -e "${GREEN}✅ Redeploy triggered${NC}"
        echo "   New Deployment UID: $new_uid"
        echo ""
        echo "Monitor deployment at:"
        echo "   https://vercel.com/rizuzaman-aceh/rizuzaman-aceh-github-io/deployments"
    else
        echo -e "${YELLOW}⚠️  Redeploy response: ${redeploy_response}${NC}"
    fi
else
    echo -e "${YELLOW}⚠️  Could not find latest deployment${NC}"
    echo "Please manually redeploy from Vercel dashboard"
fi

echo ""
echo -e "${BLUE}✨ Setup Complete!${NC}"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Wait for Vercel deployment to complete (usually 30-60 seconds)"
echo "2. Test the contact form on your website"
echo "3. Check Supabase dashboard > Table Editor > portfolio_messages"
echo "4. Run: bash scripts/verify-integration.sh"
echo ""
echo "Documentation: README.md"
echo ""
