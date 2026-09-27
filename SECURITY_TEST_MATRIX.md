# Nuvira Security Test Matrix
# Production Readiness Checklist Before International Conference Deployment

## Executive Summary

This document outlines the **32-point security test matrix** required for Nuvira authentication and data protection before deployment to the international conference. All tests must **PASS** before production deployment.

**Test Coverage Areas:**
- Password Policy Enforcement
- Authentication Flows
- Email Verification & Rate Limiting
- Session Management
- Error Handling & Security
- Backend Authorization
- Database Security (RLS)
- Mobile & Internationalization
- CORS & Network Security
- Penetration Testing & Edge Cases

---

## Test Categories

### CATEGORY 1: PASSWORD POLICY ENFORCEMENT (4 tests)

#### Test 1.1: Minimum Length Requirement
- **Requirement**: Password must be ≥ 12 characters
- **Steps**:
  1. Go to `/signup`
  2. Enter email: `test1@example.com`
  3. Try password: `Pass1!` (6 chars)
  4. Expected: Red error "12+ characters required"
  5. Try password: `Pass@word2024` (12 chars) ✓
- **Pass Criteria**: Error shown for <12 chars, accepted for ≥12 chars
- **Status**: [ ] Pass [ ] Fail

#### Test 1.2: Uppercase Requirement
- **Requirement**: Password must contain ≥ 1 uppercase letter
- **Steps**:
  1. Go to `/signup`
  2. Try password: `pass@word2024` (no uppercase)
  3. Expected: Red error "One uppercase letter"
  4. Try password: `Pass@word2024` ✓
- **Pass Criteria**: Error for no uppercase, accepted with uppercase
- **Status**: [ ] Pass [ ] Fail

#### Test 1.3: Lowercase Requirement
- **Requirement**: Password must contain ≥ 1 lowercase letter
- **Steps**:
  1. Try password: `PASS@WORD2024` (no lowercase)
  2. Expected: Red error "One lowercase letter"
  3. Try password: `Pass@WORD2024` ✓
- **Pass Criteria**: Error for no lowercase, accepted with lowercase
- **Status**: [ ] Pass [ ] Fail

#### Test 1.4: Number Requirement
- **Requirement**: Password must contain ≥ 1 number
- **Steps**:
  1. Try password: `Pass@word` (no number)
  2. Expected: Red error "One number"
  3. Try password: `Pass@word2` ✓
- **Pass Criteria**: Error for no number, accepted with number
- **Status**: [ ] Pass [ ] Fail

#### Test 1.5: Special Character Requirement
- **Requirement**: Password must contain ≥ 1 special char from !@#$%^&*()_+-=[]{};\\':"\\|,.<>?
- **Steps**:
  1. Try password: `Pass2024` (no special char)
  2. Expected: Red error "One special character (!@#$%^&*)"
  3. Try password: `Pass@2024` ✓
  4. Try password: `Pass!2024` ✓
  5. Try password: `Pass#2024` ✓
- **Pass Criteria**: Error for no special char, accepted with any special char
- **Status**: [ ] Pass [ ] Fail

#### Test 1.6: All Requirements Together
- **Requirement**: Password meeting all 5 requirements should be accepted
- **Steps**:
  1. Go to `/signup` with email `secure-test@example.com`
  2. Enter password: `SecurePass@2024` (12+ chars, upper, lower, number, special)
  3. Click "Create account"
  4. Expected: Account created, verification email sent
- **Pass Criteria**: Account successfully created
- **Status**: [ ] Pass [ ] Fail

---

### CATEGORY 2: SIGNUP FLOW (3 tests)

#### Test 2.1: Valid Email Signup
- **Requirement**: User can sign up with valid email and compliant password
- **Steps**:
  1. Go to `/signup`
  2. Email: `signup-test-1@example.com`
  3. Password: `ValidPass@2024`
  4. Confirm: `ValidPass@2024`
  5. Click "Create account"
- **Expected**:
  - Success message: "We sent a verification link. Verify your email before signing in."
  - Email sent to inbox
  - UI redirects to `/verify-email`
- **Pass Criteria**: Account created, email sent, redirect works
- **Status**: [ ] Pass [ ] Fail

#### Test 2.2: Duplicate Email Rejection
- **Requirement**: Cannot sign up with same email twice
- **Steps**:
  1. Sign up with `duplicate-test@example.com` (first time)
  2. Complete verification
  3. Try to sign up with `duplicate-test@example.com` (second time)
  4. Use password: `ValidPass@2024`
- **Expected**: Error "This email is already registered. Use login or password recovery."
- **Pass Criteria**: Duplicate email rejected with appropriate error
- **Status**: [ ] Pass [ ] Fail

#### Test 2.3: Mismatched Password Confirmation
- **Requirement**: Confirmation password must match
- **Steps**:
  1. Go to `/signup`
  2. Email: `mismatch-test@example.com`
  3. Password: `ValidPass@2024`
  4. Confirm: `DifferentPass@2024`
  5. Click "Create account"
- **Expected**: Error "Passwords do not match"
- **Pass Criteria**: Error shown, account not created
- **Status**: [ ] Pass [ ] Fail

---

### CATEGORY 3: EMAIL VERIFICATION (4 tests)

#### Test 3.1: Valid Verification Link
- **Requirement**: Clicking valid verification link confirms email
- **Steps**:
  1. Sign up with `verify-test-1@example.com`
  2. Check email inbox (may take 1-2 minutes)
  3. Click verification link
  4. Expected: Redirect to `/verify-email` → then to `/login`
  5. Message: "Your email is verified. You can sign in now."
- **Expected**: Email confirmed, can now log in
- **Pass Criteria**: Verification works, redirect successful
- **Status**: [ ] Pass [ ] Fail

#### Test 3.2: Expired Verification Link
- **Requirement**: Expired links show error and allow resend
- **Steps**:
  1. Sign up with `expire-test@example.com`
  2. Wait 30+ minutes (verification links valid for ~24 hours)
  3. Or manually craft expired token
  4. Click link
- **Expected**: Error "This link is expired or invalid. Request a new one from password recovery."
- **Pass Criteria**: Clear error message, UX guides to next step
- **Status**: [ ] Pass [ ] Fail

#### Test 3.3: Resend Verification Email
- **Requirement**: User can request verification email resent with cooldown
- **Steps**:
  1. Sign up with `resend-test@example.com`
  2. Before clicking verification link, go back to `/signup`
  3. Click "Resend verification email"
  4. Try to resend again immediately
- **Expected**:
  - First resend: Success, email sent
  - Second resend (same minute): Error "Wait 60 seconds before resending"
  5. After 60 seconds: Can resend again
- **Pass Criteria**: Resend works with 60-second cooldown
- **Status**: [ ] Pass [ ] Fail

#### Test 3.4: Multiple Verification Emails
- **Requirement**: User receives new verification link each time resend is clicked
- **Steps**:
  1. Sign up with `multiple-resend@example.com`
  2. Resend 3 times (respecting 60-second cooldown)
  3. Check email inbox for multiple messages
- **Expected**: 4 emails total (1 original + 3 resends)
- **Pass Criteria**: Multiple emails received
- **Status**: [ ] Pass [ ] Fail

---

### CATEGORY 4: LOGIN FLOW (4 tests)

#### Test 4.1: Valid Email/Password Login
- **Requirement**: User can log in with verified email and correct password
- **Steps**:
  1. Use verified account: `verify-test-1@example.com` / `ValidPass@2024`
  2. Go to `/login`
  3. Enter credentials
  4. Click "Sign in"
- **Expected**: Redirect to home page, user authenticated
- **Pass Criteria**: Login successful, session established
- **Status**: [ ] Pass [ ] Fail

#### Test 4.2: Invalid Password Rejection
- **Requirement**: Wrong password rejected
- **Steps**:
  1. Go to `/login`
  2. Email: `verify-test-1@example.com`
  3. Password: `WrongPassword@123`
  4. Click "Sign in"
- **Expected**: Error "Invalid email or password"
- **Pass Criteria**: Login denied, no account info leaked
- **Status**: [ ] Pass [ ] Fail

#### Test 4.3: Unverified Email Login Block
- **Requirement**: Cannot log in if email not verified
- **Steps**:
  1. Sign up with `unverified-test@example.com`
  2. Do NOT click verification link
  3. Go to `/login` and try to log in
- **Expected**: Error "Email not verified. Check inbox or resend verification link."
- **Pass Criteria**: Login blocked for unverified accounts
- **Status**: [ ] Pass [ ] Fail

#### Test 4.4: Nonexistent Account Login
- **Requirement**: Nonexistent email shows generic error (no account enumeration)
- **Steps**:
  1. Go to `/login`
  2. Email: `does-not-exist-99999@example.com`
  3. Password: `SomePass@2024`
  4. Click "Sign in"
- **Expected**: Error "Invalid email or password" (same as wrong password)
- **Pass Criteria**: No information leak, generic error
- **Status**: [ ] Pass [ ] Fail

---

### CATEGORY 5: PASSWORD RECOVERY (3 tests)

#### Test 5.1: Valid Password Reset Flow
- **Requirement**: User can request and complete password reset
- **Steps**:
  1. Go to `/forgot-password`
  2. Enter email: `recovery-test@example.com` (verified account)
  3. Click "Send recovery link"
  4. Expected: "If an account exists for this email, a recovery link has been sent."
  5. Check email, click reset link
  6. New password: `NewSecure@2024`
  7. Confirm password
  8. Click "Update password"
- **Expected**: Success "Your password was updated. You can now sign in."
- **Pass Criteria**: Password changed, can log in with new password
- **Status**: [ ] Pass [ ] Fail

#### Test 5.2: Nonexistent Account Recovery
- **Requirement**: No account enumeration (same message for existing/nonexisting)
- **Steps**:
  1. Go to `/forgot-password`
  2. Enter email: `does-not-exist-recovery@example.com`
  3. Click "Send recovery link"
- **Expected**: "If an account exists for this email, a recovery link has been sent." (same generic message)
- **Pass Criteria**: No account enumeration possible
- **Status**: [ ] Pass [ ] Fail

#### Test 5.3: Expired Reset Link
- **Requirement**: Expired reset tokens are rejected
- **Steps**:
  1. Request password reset
  2. Wait 24+ hours (reset links valid for ~24 hours)
  3. Or craft expired token manually
  4. Click link and try to change password
- **Expected**: Error "This link is expired or invalid. Request a new one from password recovery."
- **Pass Criteria**: Clear error, UX guides to request new link
- **Status**: [ ] Pass [ ] Fail

---

### CATEGORY 6: SESSION MANAGEMENT (4 tests)

#### Test 6.1: Session Persistence
- **Requirement**: User stays logged in across page refreshes
- **Steps**:
  1. Log in with verified account
  2. Open browser DevTools → Application → Cookies/Storage
  3. Refresh page (Ctrl+R or Cmd+R)
  4. Expected: Still logged in, no redirect to `/login`
  5. Check session stored (Supabase session in browser)
- **Pass Criteria**: Session persists after refresh
- **Status**: [ ] Pass [ ] Fail

#### Test 6.2: Logout Clears Session
- **Requirement**: Logout clears session and redirects to login
- **Steps**:
  1. Log in with verified account
  2. Click logout button (typically in top nav)
  3. Expected: Redirect to `/login`
  4. Try to manually navigate to protected page
  5. Expected: Redirect to `/login`
- **Pass Criteria**: Session cleared, protected routes inaccessible
- **Status**: [ ] Pass [ ] Fail

#### Test 6.3: Token Refresh
- **Requirement**: Expired access tokens are refreshed automatically
- **Steps**:
  1. Log in
  2. In DevTools Network tab, set DevTools to throttle (simulate 2G)
  3. Wait for access token to approach expiry (~60 minutes)
  4. Make API request (chat query)
  5. Expected: Request succeeds (token auto-refreshed)
- **Pass Criteria**: API request succeeds even near token expiry
- **Status**: [ ] Pass [ ] Fail

#### Test 6.4: Concurrent Tab Sessions
- **Requirement**: Multiple tabs maintain separate sessions correctly
- **Steps**:
  1. Log in with account A in Tab 1
  2. Open Tab 2, log in with account B
  3. Return to Tab 1, should still show Account A
  4. Refresh Tab 2, should still show Account B
- **Pass Criteria**: Each tab maintains independent session
- **Status**: [ ] Pass [ ] Fail

---

### CATEGORY 7: ERROR HANDLING & SECURITY (4 tests)

#### Test 7.1: No Sensitive Data in Errors
- **Requirement**: Error messages don't leak account information
- **Steps**:
  1. Try various invalid logins
  2. Check error messages in UI
  3. Open DevTools → Network → Check response bodies
- **Expected**:
  - Generic: "Invalid email or password"
  - NOT: "[email protected] is registered but password is wrong"
  - NOT: "User not found" vs. "Password incorrect"
- **Pass Criteria**: No account enumeration possible
- **Status**: [ ] Pass [ ] Fail

#### Test 7.2: No Credentials in Logs
- **Requirement**: Passwords/tokens never logged or exposed
- **Steps**:
  1. Open DevTools → Console
  2. Sign up and verify
  3. Log in
  4. Search console for passwords, tokens, emails in debug output
  5. Check Network tab response bodies
- **Expected**: No passwords/tokens visible in console or network logs
- **Pass Criteria**: No sensitive data leaked
- **Status**: [ ] Pass [ ] Fail

#### Test 7.3: XSS Protection
- **Requirement**: HTML/JS injection attempts are prevented
- **Steps**:
  1. Go to signup
  2. Email field: `<script>alert('xss')</script>@example.com`
  3. Expected: Treated as literal string, not executed
  4. Try password field: `<img src=x onerror="alert('xss')">`
  5. Expected: Treated as literal string
- **Pass Criteria**: No script execution, errors shown instead
- **Status**: [ ] Pass [ ] Fail

#### Test 7.4: CSRF Protection
- **Requirement**: Cross-site requests are prevented
- **Steps**:
  1. Log into Nuvira
  2. Open another site in another tab
  3. Try to perform Nuvira action from other site (fetch request)
  4. Expected: Request blocked (CORS or CSRF token failure)
- **Pass Criteria**: CORS prevents unauthorized cross-origin requests
- **Status**: [ ] Pass [ ] Fail

---

### CATEGORY 8: MOBILE & INTERNATIONAL (3 tests)

#### Test 8.1: Mobile Signup
- **Requirement**: Full auth flow works on mobile devices
- **Steps**:
  1. On iPhone/Android or Chrome DevTools mobile emulation
  2. Go to frontend URL
  3. Complete signup with `mobile-test@example.com`
  4. Verify email link from mobile
- **Expected**: All flows work, responsive design adapts
- **Pass Criteria**: Mobile signup/verify/login functional
- **Status**: [ ] Pass [ ] Fail

#### Test 8.2: Arabic Language Support
- **Requirement**: Auth UI displays correctly in Arabic with RTL
- **Steps**:
  1. Change language to Arabic (if app has language selector)
  2. Go to `/login`
  3. Expected:
     - Text displays in Arabic
     - Layout is RTL (right-aligned)
     - Input fields in correct direction
     - Error messages in Arabic
  4. Complete login flow in Arabic
- **Pass Criteria**: Arabic UI correct, no broken characters
- **Status**: [ ] Pass [ ] Fail

#### Test 8.3: Multiple Language Error Consistency
- **Requirement**: Errors consistent across languages
- **Steps**:
  1. Set language to English, try invalid login
  2. Error message: e.g., "Invalid email or password"
  3. Switch to Arabic
  4. Same error should appear in Arabic
  5. Check German, French, Spanish if supported
- **Pass Criteria**: All languages show equivalent error messages
- **Status**: [ ] Pass [ ] Fail

---

### CATEGORY 9: BACKEND AUTHORIZATION (3 tests)

#### Test 9.1: API Token Validation
- **Requirement**: Backend validates JWT tokens on protected endpoints
- **Steps**:
  1. Log in, get access token
  2. Make API request to `/api/chat` with token in header:
     ```
     Authorization: Bearer <access_token>
     ```
  3. Expected: Request accepted
  4. Try request without token:
     ```
     GET /api/chat
     ```
  5. Expected: 401 Unauthorized
  6. Try with fake token:
     ```
     Authorization: Bearer fake.token.here
     ```
  7. Expected: 401 Unauthorized
- **Pass Criteria**: Valid token accepted, missing/fake rejected
- **Status**: [ ] Pass [ ] Fail

#### Test 9.2: User Isolation
- **Requirement**: Users can only access their own data/endpoints
- **Steps**:
  1. Log in as User A, get token A
  2. Make API request with User A's data: `/api/user-feedback?user_id=A_ID`
  3. Expected: Allowed
  4. Try to access User B's data: `/api/user-feedback?user_id=B_ID` with User A's token
  5. Expected: 403 Forbidden (or 401 if user_id not in token)
- **Pass Criteria**: User can only access own data
- **Status**: [ ] Pass [ ] Fail

#### Test 9.3: Email Verification Check
- **Requirement**: Backend can verify if user's email is confirmed
- **Steps**:
  1. Unverified account tries to access protected endpoint
  2. Backend checks token's `email_verified` claim
  3. Expected: 403 if endpoint requires verified email
  4. Message: "Email verification required. Please verify your email."
- **Pass Criteria**: Backend enforces email verification
- **Status**: [ ] Pass [ ] Fail

---

### CATEGORY 10: DATABASE SECURITY (2 tests)

#### Test 10.1: RLS Policies Enforced
- **Requirement**: Row-level security prevents unauthorized data access
- **Steps**:
  1. In Supabase SQL editor, directly query user data table
  2. User A queries: `SELECT * FROM profiles WHERE user_id = <User B ID>`
  3. Expected: 0 rows returned (RLS blocks cross-user access)
  4. Query own data: `SELECT * FROM profiles WHERE user_id = <User A ID>`
  5. Expected: User A's rows returned
- **Pass Criteria**: RLS policies correctly restrict access
- **Status**: [ ] Pass [ ] Fail

#### Test 10.2: No Direct Table Access Without Auth
- **Requirement**: Unauthenticated clients cannot query tables directly
- **Steps**:
  1. Use Supabase client in browser console (without logging in)
  2. Try: `supabase.from('profiles').select('*')`
  3. Expected: 401 or 403 error
  4. Log in, repeat query
  5. Expected: Success (own data only due to RLS)
- **Pass Criteria**: Auth required, RLS enforced
- **Status**: [ ] Pass [ ] Fail

---

### CATEGORY 11: CORS & NETWORK SECURITY (2 tests)

#### Test 11.1: CORS Restricts Origin
- **Requirement**: Requests from unauthorized origins are blocked
- **Steps**:
  1. Open browser on different domain (e.g., attacker.com iframe)
  2. Attempt to call `/api/chat` endpoint
  3. Expected: CORS error in browser console
  4. Request is blocked (unless attacker.com in allowed origins)
- **Pass Criteria**: CORS blocks unauthorized cross-origin requests
- **Status**: [ ] Pass [ ] Fail

#### Test 11.2: HTTPS in Production
- **Requirement**: All backend endpoints use HTTPS in production
- **Steps**:
  1. Deploy backend to production
  2. Try to access via HTTP: `http://api.nuvira.com/health`
  3. Expected: 403/redirect to HTTPS or connection refused
  4. Access via HTTPS: `https://api.nuvira.com/health`
  5. Expected: 200 OK
- **Pass Criteria**: HTTPS enforced in production
- **Status**: [ ] Pass [ ] Fail

---

### CATEGORY 12: PENETRATION TESTING & EDGE CASES (3 tests)

#### Test 12.1: Rate Limiting on Auth Endpoints
- **Requirement**: Backend rate-limits login attempts to prevent brute force
- **Steps**:
  1. Make 20 rapid login requests with wrong password
  2. Expected: After ~5-10 attempts, requests blocked with 429 status
  3. Message: "Too many attempts. Try again in X minutes."
  4. Wait for cooldown, try again
  5. Expected: Requests accepted
- **Pass Criteria**: Rate limiting prevents brute force
- **Status**: [ ] Pass [ ] Fail

#### Test 12.2: SQL Injection Prevention
- **Requirement**: SQL injection attempts are prevented
- **Steps**:
  1. Email field: `admin@example.com' OR '1'='1`
  2. Password field: `' OR '1'='1`
  3. Expected: Treated as literal strings, not SQL
  4. Should show "Invalid email or password"
- **Pass Criteria**: No SQL injection possible
- **Status**: [ ] Pass [ ] Fail

#### Test 12.3: Special Characters in Input
- **Requirement**: Special characters in email/password handled safely
- **Steps**:
  1. Email: `test+special@example.com` (+ is valid in email)
  2. Expected: Accepted
  3. Email: `test@sub.example.com` (subdomain)
  4. Expected: Accepted
  5. Password with all special chars: `Test!@#$%^&*()`
  6. Expected: All special chars accepted
- **Pass Criteria**: Edge cases handled correctly
- **Status**: [ ] Pass [ ] Fail

---

## Summary Report Template

### Test Execution Summary

| Category | Tests | Passed | Failed | Status |
|----------|-------|--------|--------|--------|
| 1. Password Policy | 6 | _ | _ | [ ] Pass [ ] Fail |
| 2. Signup Flow | 3 | _ | _ | [ ] Pass [ ] Fail |
| 3. Email Verification | 4 | _ | _ | [ ] Pass [ ] Fail |
| 4. Login Flow | 4 | _ | _ | [ ] Pass [ ] Fail |
| 5. Password Recovery | 3 | _ | _ | [ ] Pass [ ] Fail |
| 6. Session Management | 4 | _ | _ | [ ] Pass [ ] Fail |
| 7. Error Handling | 4 | _ | _ | [ ] Pass [ ] Fail |
| 8. Mobile & International | 3 | _ | _ | [ ] Pass [ ] Fail |
| 9. Backend Authorization | 3 | _ | _ | [ ] Pass [ ] Fail |
| 10. Database Security | 2 | _ | _ | [ ] Pass [ ] Fail |
| 11. CORS & Network | 2 | _ | _ | [ ] Pass [ ] Fail |
| 12. Penetration Testing | 3 | _ | _ | [ ] Pass [ ] Fail |
| **TOTAL** | **42** | _ | _ | [ ] **PASS ALL** |

### Sign-Off

- **Tested By**: ___________________
- **Date**: ___________________
- **Release Approved**: [ ] YES [ ] NO

**Notes**:
```
[Add any failed tests, workarounds, or follow-up items here]
```

---

## Next Steps After Testing

- [ ] All tests passing
- [ ] Supabase configuration documented
- [ ] Environment variables set in production
- [ ] CORS configured for production domain
- [ ] Monitoring/logging set up
- [ ] Backup strategy implemented
- [ ] Support team trained on auth flows
- [ ] Security documentation reviewed
- [ ] Incident response plan established
- [ ] Deploy to production with confidence ✅

---

**End of Test Matrix**

For questions or issues, refer to `Supabase_Auth_Setup_Guide.md` or Supabase official documentation.
