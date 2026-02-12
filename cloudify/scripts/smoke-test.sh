#!/bin/bash
# Smoke test for Cloudify
# Usage: ./scripts/smoke-test.sh [BASE_URL]
set -e

BASE_URL="${1:-http://localhost:3000}"
PASS=0
FAIL=0

echo "============================================"
echo "  Cloudify Smoke Tests"
echo "  Target: $BASE_URL"
echo "============================================"
echo ""

# Helper function
check() {
  local description="$1"
  local expected="$2"
  local actual="$3"

  if [ "$actual" = "$expected" ]; then
    echo "  PASS: $description (got $actual)"
    PASS=$((PASS + 1))
  else
    echo "  FAIL: $description (expected $expected, got $actual)"
    FAIL=$((FAIL + 1))
  fi
}

echo "1. Testing health endpoint..."
HEALTH_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$BASE_URL/api/health" 2>/dev/null || echo "000")
check "GET /api/health returns 200" "200" "$HEALTH_CODE"

echo ""
echo "2. Testing login page..."
LOGIN_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$BASE_URL/login" 2>/dev/null || echo "000")
check "GET /login returns 200" "200" "$LOGIN_CODE"

echo ""
echo "3. Testing signup page..."
SIGNUP_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "$BASE_URL/signup" 2>/dev/null || echo "000")
check "GET /signup returns 200" "200" "$SIGNUP_CODE"

echo ""
echo "4. Testing unauthenticated API access..."
PROJECTS_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/projects" 2>/dev/null || echo "000")
check "GET /api/projects without auth returns 401" "401" "$PROJECTS_CODE"

echo ""
echo "5. Testing unauthenticated deployments API..."
DEPLOY_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/api/deployments" 2>/dev/null || echo "000")
check "GET /api/deployments without auth returns 401" "401" "$DEPLOY_CODE"

echo ""
echo "============================================"
echo "  Results: $PASS passed, $FAIL failed"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  echo ""
  echo "Some smoke tests failed!"
  exit 1
else
  echo ""
  echo "All smoke tests passed!"
  exit 0
fi
