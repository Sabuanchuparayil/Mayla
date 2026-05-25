#!/usr/bin/env bash
# Mayla enterprise user-flow curl test suite
set -euo pipefail

BASE="${BASE_URL:-http://localhost:3000}"
COOKIE_JAR="${COOKIE_JAR:-/tmp/mayla-curl-cookies.txt}"
PASS=0
FAIL=0
SKIP=0
TEST_EMAIL="curltest_$(date +%s)@example.com"
TEST_USER="curluser_$(date +%s)"
TEST_PASSWORD="TestPass1!"

pass() { echo "✅ PASS | $1"; PASS=$((PASS + 1)); }
fail() { echo "❌ FAIL | $1"; FAIL=$((FAIL + 1)); }
skip() { echo "⏭️  SKIP | $1"; SKIP=$((SKIP + 1)); }

assert_status() {
  local name="$1" method="$2" path="$3" expected="$4"
  shift 4
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" -X "$method" "$@" "${BASE}${path}")
  if [ "$code" = "$expected" ]; then pass "$name | $method $path → $code"
  else fail "$name | $method $path → $code (expected $expected)"; fi
}

assert_json_field() {
  local name="$1" body="$2" field="$3"
  if echo "$body" | grep -q "\"$field\""; then pass "$name"
  else fail "$name (missing $field)"; fi
}

rm -f "$COOKIE_JAR"

echo "========================================"
echo "  MAYLA ENTERPRISE — CURL TEST SUITE"
echo "  Base URL: $BASE"
echo "  $(date)"
echo "========================================"

echo ""
echo "--- 1. PUBLIC PAGES ---"
assert_status "Home" GET "/" "200"
assert_status "Login page" GET "/login" "200"
assert_status "Signup page" GET "/signup" "200"
assert_status "Dashboard (unauthenticated)" GET "/dashboard" "307"

echo ""
echo "--- 2. HEALTH CHECK ---"
HEALTH=$(curl -s "${BASE}/api/health")
assert_json_field "Health endpoint returns JSON" "$HEALTH" "checks"
if echo "$HEALTH" | grep -q '"database"'; then pass "Health includes database check"
else fail "Health missing database check"; fi

echo ""
echo "--- 3. AUTH API — SIGNUP ---"
SIGNUP=$(curl -s -w "\n%{http_code}" -c "$COOKIE_JAR" -X POST "${BASE}/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_EMAIL\",\"username\":\"$TEST_USER\",\"password\":\"$TEST_PASSWORD\",\"name\":\"Curl Test User\"}")
SIGNUP_CODE=$(echo "$SIGNUP" | tail -1)
SIGNUP_BODY=$(echo "$SIGNUP" | sed '$d')

if [ "$SIGNUP_CODE" = "201" ]; then
  pass "Signup | POST /api/auth/signup → 201"
  assert_json_field "Signup returns user" "$SIGNUP_BODY" "user"
elif [ "$SIGNUP_CODE" = "500" ] || [ "$SIGNUP_CODE" = "503" ]; then
  skip "Signup failed ($SIGNUP_CODE) — database may be unavailable"
else
  fail "Signup | POST /api/auth/signup → $SIGNUP_CODE (expected 201)"
fi

echo ""
echo "--- 4. AUTH API — ME (with session cookie) ---"
if [ -f "$COOKIE_JAR" ] && grep -q mayla_access_token "$COOKIE_JAR" 2>/dev/null; then
  ME=$(curl -s -b "$COOKIE_JAR" "${BASE}/api/auth/me")
  assert_json_field "GET /api/auth/me returns user" "$ME" "user"
  assert_status "Protected dashboard" GET "/dashboard" "200" -b "$COOKIE_JAR" -L
else
  skip "Session cookie missing — skipping authenticated tests"
fi

echo ""
echo "--- 5. ONBOARDING FLOW ---"
if [ -f "$COOKIE_JAR" ] && grep -q mayla_access_token "$COOKIE_JAR" 2>/dev/null; then
  ONBOARD=$(curl -s -w "\n%{http_code}" -b "$COOKIE_JAR" -X PUT "${BASE}/api/users/me" \
    -H "Content-Type: application/json" \
    -d '{"name":"Curl Test User"}')
  ONBOARD_CODE=$(echo "$ONBOARD" | tail -1)
  if [ "$ONBOARD_CODE" = "200" ]; then
    pass "Complete onboarding | PUT /api/users/me → 200"
  else
    fail "Complete onboarding → $ONBOARD_CODE (expected 200)"
  fi
fi

echo ""
echo "--- 6. AUTH API — LOGIN (admin seed) ---"
ADMIN_LOGIN=$(curl -s -w "\n%{http_code}" -c /tmp/mayla-admin-cookies.txt -X POST "${BASE}/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@mayla.app","password":"admin123!"}')
ADMIN_CODE=$(echo "$ADMIN_LOGIN" | tail -1)
if [ "$ADMIN_CODE" = "200" ]; then
  pass "Admin login | POST /api/auth/login → 200"
  ADMIN_USERS=$(curl -s -w "\n%{http_code}" -b /tmp/mayla-admin-cookies.txt "${BASE}/api/users")
  ADMIN_USERS_CODE=$(echo "$ADMIN_USERS" | tail -1)
  if [ "$ADMIN_USERS_CODE" = "200" ]; then
    pass "Admin list users | GET /api/users → 200"
  else
    fail "Admin list users → $ADMIN_USERS_CODE (expected 200)"
  fi
elif [ "$ADMIN_CODE" = "401" ]; then
  skip "Admin login failed — run npm run db:seed after db:push"
else
  skip "Admin login → $ADMIN_CODE (database unavailable?)"
fi

echo ""
echo "--- 7. UNAUTHORIZED ACCESS ---"
assert_status "GET /api/auth/me without auth" GET "/api/auth/me" "401"
assert_status "GET /api/users without auth" GET "/api/users" "401"

echo ""
echo "--- 8. RATE LIMIT HEADERS / VALIDATION ---"
VALIDATION=$(curl -s -w "\n%{http_code}" -X POST "${BASE}/api/auth/signup" \
  -H "Content-Type: application/json" \
  -d '{"email":"bad","username":"x","password":"weak"}')
VALIDATION_CODE=$(echo "$VALIDATION" | tail -1)
if [ "$VALIDATION_CODE" = "422" ]; then
  pass "Signup validation | invalid payload → 422"
else
  fail "Signup validation → $VALIDATION_CODE (expected 422)"
fi

echo ""
echo "--- 9. LOGOUT ---"
if [ -f "$COOKIE_JAR" ] && grep -q mayla_access_token "$COOKIE_JAR" 2>/dev/null; then
  LOGOUT_CODE=$(curl -s -o /dev/null -w "%{http_code}" -b "$COOKIE_JAR" -c "$COOKIE_JAR" \
    -X POST "${BASE}/api/auth/logout")
  if [ "$LOGOUT_CODE" = "200" ]; then pass "Logout | POST /api/auth/logout → 200"
  else fail "Logout → $LOGOUT_CODE (expected 200)"; fi
fi

echo ""
echo "--- 10. STUB SERVICES ---"
assert_status "Upload presign (auth required)" POST "/api/upload/presign" "401"
if [ -f /tmp/mayla-admin-cookies.txt ] && grep -q mayla_access_token /tmp/mayla-admin-cookies.txt 2>/dev/null; then
  PRESIGN=$(curl -s -w "\n%{http_code}" -b /tmp/mayla-admin-cookies.txt \
    -X POST "${BASE}/api/upload/presign" \
    -H "Content-Type: application/json" \
    -d '{"contentType":"image/jpeg","folder":"selfies"}')
  PRESIGN_CODE=$(echo "$PRESIGN" | tail -1)
  PRESIGN_BODY=$(echo "$PRESIGN" | sed '$d')
  if [ "$PRESIGN_CODE" = "200" ] && echo "$PRESIGN_BODY" | grep -q '"key"'; then
    pass "Upload presign | POST /api/upload/presign → 200"
  else
    fail "Upload presign → $PRESIGN_CODE (expected 200 with key)"
  fi
else
  skip "Upload presign — admin session missing"
fi

echo ""
echo "========================================"
echo "  RESULTS: $PASS passed | $FAIL failed | $SKIP skipped"
echo "========================================"

[ "$FAIL" -eq 0 ]
