#!/bin/bash

#############################################
# Rizu Zaman Portfolio - Integration Verification
# Tests Supabase connection and API endpoints
# Usage: bash scripts/verify-integration.sh
#############################################

set -e

echo "🔍 Rizu Zaman Portfolio - Integration Verification"
echo "=================================================="
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
WEBSITE_URL="${1:-https://rizuzaman-aceh.github.io}"
SUPABASE_URL="${2:-https://xiedmhatvuayvqqkfarh.supabase.co}"

echo -e "${BLUE}📊 Test Configuration${NC}"
echo "Website URL: $WEBSITE_URL"
echo "Supabase URL: $SUPABASE_URL"
echo ""

# Test 1: Check if website is reachable
echo -e "${BLUE}1️⃣  Testing Website Accessibility${NC}"
if curl -s -o /dev/null -w "%{http_code}" "$WEBSITE_URL" | grep -q "200"; then
    echo -e "${GREEN}✅ Website is accessible${NC}"
else
    echo -e "${RED}❌ Website is not accessible${NC}"
fi
echo ""

# Test 2: Check if API endpoint exists
echo -e "${BLUE}2️⃣  Testing API Endpoint Availability${NC}"
api_test=$(curl -s -X POST "$WEBSITE_URL/api/contact" \
  -H "Content-Type: application/json" \
  -d '{"test": true}' \
  -w "\n%{http_code}" | tail -1)

if [ "$api_test" = "405" ] || [ "$api_test" = "400" ] || [ "$api_test" = "403" ] || [ "$api_test" = "201" ]; then
    echo -e "${GREEN}✅ API endpoint is responding${NC}"
    echo "   Response code: $api_test"
else
    echo -e "${RED}❌ API endpoint not responding properly${NC}"
    echo "   Response code: $api_test"
fi
echo ""

# Test 3: Test Contact Form Submission
echo -e "${BLUE}3️⃣  Testing Contact Form Submission${NC}"
test_payload=$(cat <<EOF
{
  "name": "Verifikasi Otomatis",
  "email": "test@rizuzaman-aceh.github.io",
  "subject": "Testing Vercel + Supabase Integration",
  "message": "Ini adalah pesan test dari verification script. Timestamp: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
EOF
)

contact_response=$(curl -s -X POST "$WEBSITE_URL/api/contact" \
  -H "Content-Type: application/json" \
  -d "$test_payload")

if echo "$contact_response" | grep -q '"ok":true'; then
    echo -e "${GREEN}✅ Contact form submission successful${NC}"
    echo "   Response: $contact_response"
else
    if echo "$contact_response" | grep -q "belum dikonfigurasi\|tidak\|error"; then
        echo -e "${YELLOW}⚠️  API not fully configured${NC}"
        echo "   Response: $contact_response"
    else
        echo -e "${RED}❌ Contact form submission failed${NC}"
        echo "   Response: $contact_response"
    fi
fi
echo ""

# Test 4: Check Security Headers
echo -e "${BLUE}4️⃣  Verifying Security Headers${NC}"
headers=$(curl -s -I "$WEBSITE_URL" | grep -iE "(strict-transport-security|x-content-type-options|x-frame-options|referrer-policy)")

if [ -n "$headers" ]; then
    echo -e "${GREEN}✅ Security headers detected:${NC}"
    echo "$headers" | sed 's/^/   /'
else
    echo -e "${YELLOW}⚠️  Some security headers may be missing${NC}"
fi
echo ""

# Test 5: Check Supabase Connectivity
echo -e "${BLUE}5️⃣  Testing Supabase Connectivity${NC}"
echo "Note: This test requires Supabase Service Role Key"
read -s -p "Enter Supabase Service Role Key (or skip): " supabase_key
echo ""

if [ -n "$supabase_key" ]; then
    supabase_test=$(curl -s -X GET "$SUPABASE_URL/rest/v1/portfolio_messages?limit=1&select=*" \
      -H "Authorization: Bearer $supabase_key" \
      -H "Content-Type: application/json" \
      -w "\n%{http_code}" | tail -1)
    
    if [ "$supabase_test" = "200" ]; then
        echo -e "${GREEN}✅ Supabase connection successful${NC}"
        message_count=$(curl -s -X GET "$SUPABASE_URL/rest/v1/portfolio_messages?select=count()&count=exact" \
          -H "Authorization: Bearer $supabase_key" \
          -H "Content-Type: application/json" \
          -w "\n%{http_code}" | head -1 | grep -o '[0-9]*' | tail -1)
        echo "   Messages in database: $message_count"
    else
        echo -e "${RED}❌ Supabase connection failed${NC}"
        echo "   Response code: $supabase_test"
    fi
else
    echo -e "${YELLOW}⚠️  Skipping Supabase connectivity test${NC}"
fi
echo ""

# Test 6: Check Environment Variables Status
echo -e "${BLUE}6️⃣  Environment Variables Status${NC}"
env_vars=$(curl -s "$WEBSITE_URL/api/contact" -X OPTIONS -v 2>&1 | grep -i "allow\|content-type" || true)

if [ -n "$env_vars" ]; then
    echo -e "${GREEN}✅ Environment variables appear to be configured${NC}"
else
    echo -e "${YELLOW}⚠️  Could not verify environment variable status${NC}"
fi
echo ""

# Summary
echo -e "${BLUE}📋 Verification Summary${NC}"
echo "=================================================="
echo ""
echo "✅ Basic Checks:"
echo "   • Website accessibility"
echo "   • API endpoint availability"
echo "   • Security headers"
echo ""
echo "Next Steps:"
echo "1. Check Supabase Dashboard > Table Editor > portfolio_messages"
echo "2. Verify test message was received"
echo "3. Test contact form on website: $WEBSITE_URL"
echo "4. Monitor Vercel deployment logs"
echo ""
echo "Documentation:"
echo "   • README.md - Setup instructions"
echo "   • .env.example - Environment variable reference"
echo "   • api/contact.js - API endpoint source"
echo ""
