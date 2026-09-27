Supabase_Auth_Setup_Guide.md

# Nuvira — Supabase Authentication Setup Guide

## Overview

This guide walks through setting up production-ready Supabase authentication for Nuvira, a medical AI platform requiring secure, HIPAA-aware authentication and session management.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Supabase Project Setup](#supabase-project-setup)
3. [Environment Configuration](#environment-configuration)
4. [Frontend Setup](#frontend-setup)
5. [Backend Setup](#backend-setup)
6. [Email Verification Flow](#email-verification-flow)
7. [Security Checklist](#security-checklist)
8. [Deployment Steps](#deployment-steps)
9. [Troubleshooting](#troubleshooting)

---

## Prerequisites

- Supabase account (free tier available at https://supabase.com)
- Node.js 18+ installed (frontend)
- Python 3.9+ installed (backend)
- Git configured
- A text editor or IDE

---

## Supabase Project Setup

### Step 1: Create Supabase Project

1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Enter project name: `Nuvira`
4. Set a strong database password
5. Choose region (select closest to your target users)
6. Click "Create New Project" and wait ~5 minutes

### Step 2: Enable Email Authentication

1. Navigate to **Authentication** → **Providers**
2. Find **Email** provider
3. Toggle **Email Provider** ON
4. Ensure "Confirm email" is enabled (required for medical app)
5. Click "Save"

### Step 3: Configure Redirect URLs

1. Navigate to **Authentication** → **URL Configuration**
2. Under "Redirect URLs", add:

```
http://localhost:5173/verify-email
http://localhost:5173/reset-password
http://127.0.0.1:5173/verify-email
http://127.0.0.1:5173/reset-password
```

(Note: The localhost entries are for development. Add production URLs after deployment.)

3. Set "Site URL" to: `http://localhost:5173` (development)
4. Click "Save"

### Step 4: Configure Email Templates

1. Navigate to **Authentication** → **Email Templates**
2. Review the confirmation and reset password templates
3. Optionally customize them to match Nuvira branding
4. Ensure templates redirect to the correct URLs (already configured above)

### Step 5: Get Your API Keys

1. Navigate to **Project Settings** → **API**
2. Copy and save:
   - **Project URL** (looks like `https://xxxxx.supabase.co`)
   - **anon/publishable key** (starts with `eyJ...`)
3. ⚠️ **IMPORTANT**: Do NOT copy the **service_role key** to frontend

### Step 6: Enable Database Row-Level Security (RLS)

For now, skip this (the app doesn't have user data tables yet). Once you add user-specific medical data:

1. Navigate to **SQL Editor**
2. For each user-owned table, enable RLS
3. Create policies:

```sql
-- Allow users to read only their own records
CREATE POLICY "Users can read own data"
ON your_table
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own records
CREATE POLICY "Users can create own records"
ON your_table
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own records
CREATE POLICY "Users can update own records"
ON your_table
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own records
CREATE POLICY "Users can delete own records"
ON your_table
FOR DELETE
USING (auth.uid() = user_id);
```

---

## Environment Configuration

### Frontend Setup

1. In `frontend/` directory, create `.env.local`:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
VITE_API_BASE_URL=http://127.0.0.1:8000/api
```

Replace values with your actual Supabase credentials.

### Backend Setup

1. In `backend/` directory, create `.env`:

```bash
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_JWT_SECRET=your-jwt-secret-here
```

**Where to get JWT Secret:**
- Go to Supabase Dashboard → **Project Settings** → **JWT Settings**
- Copy the **JWT Secret**
- This is used ONLY for token validation, not for frontend

---

## Frontend Setup

### Step 1: Install Dependencies

```bash
cd frontend
npm install
```

### Step 2: Verify Auth Module Structure

The auth module is at `frontend/src/auth/`:

```
auth/
├── components/       # UI components (LoginForm, ProtectedRoute, etc.)
├── context/          # AuthProvider for state management
├── hooks/            # useAuth() hook
├── lib/              # Supabase client
├── pages/            # Auth pages (Login, Signup, Reset, etc.)
├── services/         # auth.service (business logic)
├── types/            # TypeScript types
├── validation/       # Password & email validation
└── index.ts          # Exports
```

### Step 3: Test Frontend Development

```bash
npm run dev
```

Open http://localhost:5173 and:

1. Click "Sign Up" (top navigation)
2. Enter email: `test@example.com`
3. Enter password (must be 12+ chars, uppercase, lowercase, number, special char)
4. Confirm password
5. Click "Create account"

Expected behavior:
- "We sent a verification link. Verify your email before signing in."
- Check your email for verification link
- Click verification link (opens `/verify-email`)
- Redirects to login
- Sign in with credentials

### Step 4: Test Email Verification

The Supabase default email service will send a real email. If testing:

1. Use a real email address
2. Check spam folder if email doesn't arrive
3. Free tier has rate limits (~5-10 emails/hour)

**For faster testing without real emails:**
- Use a test account service like MailSlurp or Mailtrap
- Configure Resend (see below)
- Or use Supabase CLI locally

---

## Backend Setup

### Step 1: Install Python Dependencies

```bash
pip install python-jwt
```

(The `backend/auth_middleware.py` file is already created and provides authentication validation.)

### Step 2: Using Auth Middleware (Optional for Now)

Currently, the RAG endpoints (`/api/chat`, `/api/feedback`) don't require authentication. To add auth in the future:

```python
from backend.auth_middleware import get_supabase_user, get_verified_user, UserIdentity
from fastapi import Depends

@app.post("/api/chat", response_model=QueryResponse)
async def chat_endpoint(
    request: QueryRequest,
    user: UserIdentity = Depends(get_verified_user),  # ← Add this
):
    # Now you can access:
    # - user.user_id  (unique user identifier)
    # - user.email (user's email)
    # - user.email_verified (if email is confirmed)
    
    # Never trust user_id from request body; use from JWT token above
    retrieved_chunks = metadata_aware_retrieve(request.message, k=3)
    # ... rest of logic
```

### Step 3: CORS Configuration for Production

When ready for production, update `backend/api.py`:

```python
# Replace:
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # ⚠️ Not safe for authenticated endpoints
    # ...
)

# With:
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # development
        "https://nuvira.yourdomain.com",  # production
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)
```

---

## Email Verification Flow

### How It Works

1. **Signup**
   - User enters email & password
   - Frontend calls `supabase.auth.signUp()`
   - Supabase stores unverified user account
   - Email sent with confirmation link

2. **Verification Link**
   - User receives email
   - Clicks link → browser opens `https://localhost:5173/verify-email?token=...`
   - Supabase SDK detects callback and verifies account
   - Frontend shows "Email verified" status

3. **Login**
   - User can now sign in with credentials
   - Supabase creates session + access token
   - Frontend stores in browser (not localStorage)
   - Sent in `Authorization: Bearer <token>` for API requests

### Handling Verification Errors

The app correctly handles:

- **Expired Link**: "This link has expired or is no longer valid"
- **Invalid Link**: "Invalid verification link"
- **Already Verified**: "Your email is already verified"
- **Network Error**: "Could not reach the authentication service"

### Rate Limiting

Supabase free tier limits verification emails:
- ~5-10 emails per hour per project
- Resend button has 60-second cooldown
- After cooldown expires, can request new email

**This is expected behavior, not a bug.** To avoid limits in production:
- Use Resend, SendGrid, or custom SMTP (requires verified domain)
- Increase limits on paid Supabase tier

---

## Security Checklist

### Frontend Security

- ✅ Password policy: 12+ chars, uppercase, lowercase, number, special char
- ✅ Email validation: Proper regex pattern
- ✅ No passwords in localStorage
- ✅ No secrets in console.log
- ✅ Only Supabase anon key (safe for browser)
- ✅ Protected routes redirect unauthenticated users to `/login`
- ✅ Auth state loading handled (no redirect loops)
- ✅ RTL/LTR support for Arabic + English
- ✅ Error messages don't leak account info

### Backend Security

- ⚠️ CORS: Currently `allow_origins=["*"]` — needs restricting for production
- ⚠️ Auth Middleware: Created but not yet required on endpoints
- ⚠️ Token Validation: Backend can validate JWT using `auth_middleware.py`
- ⚠️ User Identity: Never trust user_id from request; extract from JWT

### Database Security

- ⚠️ RLS Not Yet Enabled: Will need RLS policies once user data tables exist

### Environment Security

- ✅ `.env` in `.gitignore`
- ✅ `.env.example` has placeholders (no real secrets)
- ✅ No service_role key in frontend
- ✅ Supabase JWT secret is server-only

---

## Deployment Steps

### Pre-Deployment Checklist

- [ ] Supabase project created and configured
- [ ] `.env` files created and filled with production values
- [ ] Frontend build succeeds: `npm run build`
- [ ] Backend verified: Can import and run without errors
- [ ] Testing complete: Signup, verify, login, logout all work
- [ ] Password policy communicated to users
- [ ] Email templates customized (optional)
- [ ] CORS configured for production domain
- [ ] Database RLS enabled (once user data tables exist)
- [ ] Monitoring/logging set up
- [ ] Backup strategy documented

### Deployment to Production

#### Frontend Deployment (Example: Vercel)

1. Push code to GitHub
2. Connect GitHub repo to Vercel
3. Add environment variables in Vercel dashboard:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_API_BASE_URL` (production API URL)
4. Deploy
5. Update Supabase **URL Configuration → Redirect URLs**:
   ```
   https://yourdomain.com/verify-email
   https://yourdomain.com/reset-password
   ```

#### Backend Deployment (Example: Railway or Heroku)

1. Create account on deployment platform
2. Set environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_JWT_SECRET`
   - `HF_HOME` (for Huggingface cache)
3. Deploy
4. Update CORS in `api.py` with production domain
5. Monitor logs for errors

#### Update Supabase Site URL

1. Go to Supabase Dashboard → **Project Settings** → **URL Configuration**
2. Change "Site URL" to production domain:
   ```
   https://yourdomain.com
   ```

---

## Troubleshooting

### "Missing VITE_SUPABASE_URL" Error

**Cause**: Environment variables not loaded.

**Fix**:
1. Create `frontend/.env.local` (not `.env`)
2. Fill in values from Supabase dashboard
3. Restart dev server: `npm run dev`

### "Cannot access domain" on Mobile Verification

**Cause**: Verification link points to `http://localhost:5173`, not accessible from phone.

**Solution**:
1. Use ngrok to tunnel local dev to public URL:
   ```bash
   ngrok http 5173
   ```
2. Update Supabase redirect URLs with ngrok URL:
   ```
   https://abc123.ngrok.io/verify-email
   https://abc123.ngrok.io/reset-password
   ```
3. Visit https://abc123.ngrok.io on phone

### "Too many requests" on Verification Resend

**Cause**: Supabase free tier rate limiting.

**Fix**: Expected behavior. Wait 60 seconds and resend. Or:
- Upgrade Supabase plan
- Use Resend/SendGrid with verified domain (requires setup)
- Use Supabase CLI for local testing

### "Email not received"

**Causes**:
- Email in spam folder
- Domain/sender reputation issues (free tier)
- Email address typo

**Fixes**:
- Check spam/promotions folder
- Use a different email provider (Resend, SendGrid)
- Test with different email address

### JWT Secret Not Found on Backend

**Cause**: `SUPABASE_JWT_SECRET` not in environment.

**Fix**:
1. Get JWT secret from Supabase Dashboard → **Project Settings** → **JWT Settings**
2. Add to `backend/.env` or deployment platform environment variables
3. Restart backend server

### "service_role key was found in VITE_ variables"

**Cause**: Accidentally committed service_role to frontend.

**Fix**:
1. Rotate the key in Supabase dashboard
2. Only use anon key in frontend
3. Use service_role only server-side (if ever needed)

---

## Next Steps

### Optional: Add Resend for Custom Email

If Supabase default email service is too rate-limited:

1. Create Resend account: https://resend.com
2. Verify sender domain/email
3. Get API key
4. In Supabase → Authentication → Email Templates → Custom SMTP:
   - Configure Resend SMTP settings
5. Add to backend `.env`:
   ```
   RESEND_API_KEY=your-key-here
   ```
6. Implement in FastAPI if needed (for transactional emails beyond auth)

### Optional: Enable Passwordless Auth

Supabase also supports:
- Magic links (email-only, no password)
- OAuth (Google, GitHub, etc.)
- Phone/SMS
- Multi-factor authentication (MFA)

Add these in **Authentication → Providers** as needed.

### Required: User Profile Tables

Once app needs to store user medical history:

1. Create `public.profiles` table
2. Enable RLS with policies
3. Store user_id foreign key
4. Use auth middleware on new endpoints

---

## References

- Supabase Docs: https://supabase.com/docs
- Supabase Auth: https://supabase.com/docs/guides/auth
- JWT Validation: https://supabase.com/docs/guides/auth/jwt
- Environment Variables: https://vitejs.dev/guide/env-and-modes.html

---

## Support

For issues:
1. Check Supabase Status: https://status.supabase.com
2. Review Supabase Auth Docs: https://supabase.com/docs/guides/auth
3. Check app logs for detailed errors
4. Verify environment variables are correct

---

**End of Guide**

Last updated: 2026-09-08
Nuvira Team
