# PHASE 3: Supabase Row Level Security (RLS) AUDIT — IMPLEMENTATION GUIDE

**Status**: ⏳ AUDIT & DOCUMENTATION PHASE  
**Target**: Document RLS requirements and implementation  
**Scope**: Database-level user isolation enforcement  

---

## RLS AUDIT CHECKLIST

Use this checklist to verify RLS implementation in your Supabase project.

### Access Your Supabase Dashboard
1. Go to https://app.supabase.com
2. Select your Nuvira project
3. Navigate to: **SQL Editor** or **Table Editor**

---

## TABLE AUDIT & RLS POLICIES

### TABLE: `auth.users` (Supabase Built-in)
- **Status**: Already protected by Supabase
- **RLS**: ✅ Automatically enforced
- **Action**: No changes needed

### TABLE: `conversations` (TO CREATE)

**Purpose**: Store user chat conversations

**Create Table**:
```sql
CREATE TABLE conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    
    -- Indexes for performance
    CONSTRAINT conversations_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at DESC);

-- Enable Row Level Security
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT their own conversations
CREATE POLICY conversations_select_own ON conversations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users can only INSERT their own conversations  
CREATE POLICY conversations_insert_own ON conversations
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only UPDATE their own conversations
CREATE POLICY conversations_update_own ON conversations
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Policy: Users can only DELETE their own conversations
CREATE POLICY conversations_delete_own ON conversations
    FOR DELETE
    USING (auth.uid() = user_id);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
```

**Verification**:
- [ ] Table created in Supabase
- [ ] RLS is ENABLED (check table security settings)
- [ ] 4 policies created (SELECT, INSERT, UPDATE, DELETE)
- [ ] All policies use `auth.uid() = user_id`

---

### TABLE: `messages` (TO CREATE)

**Purpose**: Store conversation messages (user questions and AI responses)

**Create Table**:
```sql
CREATE TABLE messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Foreign keys and indexes
    CONSTRAINT messages_conversation_fk FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    CONSTRAINT messages_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_user_id ON messages(user_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- Enable Row Level Security
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT messages from their own conversations
CREATE POLICY messages_select_own ON messages
    FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can only INSERT messages to their own conversations
CREATE POLICY messages_insert_own ON messages
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        conversation_id IN (
            SELECT id FROM conversations WHERE user_id = auth.uid()
        )
    );

-- Policy: Users can UPDATE their own messages
CREATE POLICY messages_update_own ON messages
    FOR UPDATE
    USING (user_id = auth.uid() AND conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid()))
    WITH CHECK (user_id = auth.uid() AND conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid()));

-- Policy: Users can DELETE their own messages
CREATE POLICY messages_delete_own ON messages
    FOR DELETE
    USING (user_id = auth.uid() AND conversation_id IN (SELECT id FROM conversations WHERE user_id = auth.uid()));

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
```

**Verification**:
- [ ] Table created in Supabase
- [ ] RLS is ENABLED
- [ ] 4 policies created (SELECT, INSERT, UPDATE, DELETE)
- [ ] Policies check both conversation ownership AND user_id
- [ ] Subqueries reference conversations table correctly

---

### TABLE: `feedback` (TO CREATE)

**Purpose**: Store user feedback on AI responses

**Create Table**:
```sql
CREATE TABLE feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
    feedback VARCHAR(10) NOT NULL CHECK (feedback IN ('up', 'down')),
    created_at TIMESTAMP DEFAULT NOW(),
    
    -- Prevent duplicate votes
    UNIQUE(user_id, message_id),
    
    -- Foreign keys
    CONSTRAINT feedback_user_fk FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE,
    CONSTRAINT feedback_message_fk FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_message_id ON feedback(message_id);

-- Enable Row Level Security
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only SELECT feedback from their own conversations
CREATE POLICY feedback_select_own ON feedback
    FOR SELECT
    USING (
        user_id = auth.uid() OR
        message_id IN (
            SELECT m.id FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

-- Policy: Users can only INSERT their own feedback
CREATE POLICY feedback_insert_own ON feedback
    FOR INSERT
    WITH CHECK (
        user_id = auth.uid() AND
        message_id IN (
            SELECT m.id FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE c.user_id = auth.uid()
        )
    );

-- Policy: Users can only UPDATE their own feedback
CREATE POLICY feedback_update_own ON feedback
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Policy: Users can only DELETE their own feedback
CREATE POLICY feedback_delete_own ON feedback
    FOR DELETE
    USING (user_id = auth.uid());

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON feedback TO authenticated;
```

**Verification**:
- [ ] Table created in Supabase
- [ ] RLS is ENABLED
- [ ] UNIQUE constraint on (user_id, message_id)
- [ ] 4 policies created
- [ ] Policies enforce user ownership

---

### TABLE: `user_profiles` (OPTIONAL)

**Purpose**: Store additional user information (name, avatar, preferences)

```sql
CREATE TABLE user_profiles (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    display_name VARCHAR(255),
    avatar_url VARCHAR(2048),
    language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can only SELECT their own profile
CREATE POLICY user_profiles_select_own ON user_profiles
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only UPDATE their own profile
CREATE POLICY user_profiles_update_own ON user_profiles
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

GRANT SELECT, UPDATE ON user_profiles TO authenticated;
```

---

## RLS TESTING CHECKLIST

### Test User Isolation

**Scenario**: User A should NOT see User B's data

**Manual Test Steps**:

1. **Create Test Users**:
   - User A: test-a@example.com / ValidPass@2024
   - User B: test-b@example.com / ValidPass@2024

2. **User A Actions**:
   - Log in as User A
   - Create conversation "Medical Question 1"
   - Add message "What is hypertension?"
   - Submit feedback "up"
   - Note conversation ID (e.g., conv-uuid-1234)

3. **User B Attempts to Access User A's Data**:
   - Log in as User B (in different browser/incognito)
   - Try to load conversation conv-uuid-1234
   - **Expected**: 403 Forbidden or empty result (RLS blocks)

4. **User B Creates Own Data**:
   - Create conversation "My Health Question"
   - Add message "Different topic"
   - Submit feedback
   - **Verify**: User B's data is isolated from User A

5. **Direct Database Query Test** (Admin only):
   ```sql
   -- Run as service_role (admin - not authenticated user)
   SELECT * FROM conversations;  -- Should see all conversations
   
   -- Run as authenticated user (in frontend)
   SELECT * FROM conversations;  -- Should only see own
   ```

---

## VERIFYING RLS IN SUPABASE DASHBOARD

### Step 1: Check RLS Status
1. Go to: **Table Editor** in Supabase
2. Click on table (e.g., `conversations`)
3. Click **Security** tab
4. Verify: **Row Level Security** toggle is **ON** (blue)

### Step 2: View Policies
1. Click **RLS** button (next to table name)
2. Should show all 4 policies:
   - `conversations_select_own` (SELECT)
   - `conversations_insert_own` (INSERT)
   - `conversations_update_own` (UPDATE)
   - `conversations_delete_own` (DELETE)

### Step 3: Test Policy
1. Click on policy name
2. Click **Test Policy** or **Preview**
3. Should show policy details and test options

---

## BACKEND INTEGRATION

### Update FastAPI Endpoints

**Before** (No RLS):
```python
@app.get("/api/conversations")
async def list_conversations(user: UserIdentity = Depends(get_verified_user)):
    # Must manually filter by user_id
    conversations = db.query(Conversation).filter(
        Conversation.user_id == user.user_id
    ).all()
    return conversations
```

**After** (With RLS):
```python
@app.get("/api/conversations")
async def list_conversations(user: UserIdentity = Depends(get_verified_user)):
    # RLS automatically filters - no manual filter needed
    # Supabase client uses auth token to enforce RLS
    conversations = db.query(Conversation).all()
    # RLS automatically filters to only user's conversations
    return conversations
```

**Why This Works**:
- Supabase client authenticates requests using JWT
- RLS policies check `auth.uid()` from JWT
- Database returns only user's data automatically
- No trust needed in application logic

---

## DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All tables created in Supabase
- [ ] RLS enabled on all tables
- [ ] All policies created correctly
- [ ] Indexes created for performance
- [ ] Foreign key constraints verified
- [ ] Permissions granted to authenticated role

### Testing
- [ ] User isolation verified manually
- [ ] Cross-user access blocked
- [ ] Data owned by user is accessible
- [ ] Policies enforce correctly
- [ ] No unexpected 401/403 errors

### Production
- [ ] Database backups automated
- [ ] Monitoring configured for RLS violations
- [ ] Audit logs enabled (Supabase Logs)
- [ ] Performance tested under load
- [ ] Disaster recovery plan documented

---

## TROUBLESHOOTING

### Issue: "Rows are not visible"
**Cause**: RLS is too restrictive  
**Solution**: 
- Verify policies use correct auth.uid()
- Check user is authenticated (JWT valid)
- Review policy logic for bugs

### Issue: "403 Forbidden on SELECT"
**Cause**: User doesn't own the data  
**Solution**:
- This is CORRECT behavior - means RLS is working
- Verify user is trying to access own data
- Check user_id in database matches auth.uid()

### Issue: "Performance is slow"
**Cause**: RLS policies have inefficient queries  
**Solution**:
- Add indexes to user_id and foreign keys
- Avoid complex subqueries in policies
- Monitor query performance

### Issue: "Admin needs to see all data"
**Solution**: Create separate admin policies
```sql
-- Admins bypass RLS (only use for admin operations)
-- Don't expose this in regular application
```

---

## MONITORING & AUDITING

### Enable Audit Logs
1. Supabase Dashboard → **Logs**
2. Filter by table name
3. Monitor RLS policy violations (401/403)

### Sample Queries for Monitoring
```sql
-- Count feedback by user
SELECT user_id, COUNT(*) as feedback_count 
FROM feedback 
GROUP BY user_id;

-- Find users with most conversations
SELECT user_id, COUNT(*) as conversation_count
FROM conversations
GROUP BY user_id
ORDER BY conversation_count DESC;

-- Audit: Recent feedback
SELECT user_id, message_id, feedback, created_at
FROM feedback
WHERE created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;
```

---

## REFERENCES

- [Supabase RLS Documentation](https://supabase.io/docs/guides/auth/row-level-security)
- [PostgreSQL RLS](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [Supabase Security Best Practices](https://supabase.io/docs/guides/platform/security-checklist)

---

**Next Step**: Apply these SQL scripts to your Supabase database and verify all checks pass.
