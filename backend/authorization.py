"""
Authorization and access control for CARE360 API endpoints.

This module implements IDOR/BOLA (Broken Object Level Authorization) prevention:
- Validates that authenticated users can only access their own data
- Enforces server-side ownership checks
- Never trusts client-provided user IDs

CRITICAL: Every endpoint that accesses user data MUST apply appropriate authorization checks.
"""

from fastapi import HTTPException, Depends
import os
import httpx
from backend.auth_middleware import UserIdentity, get_verified_user


# ============================================================================
# Authorization Dependencies
# ============================================================================
# These are FastAPI Depends() callables that enforce access control.
# Add to endpoint signatures to enforce ownership checks.
# ============================================================================


async def require_conversation_owner(
    conversation_id: str,
    user: UserIdentity = Depends(get_verified_user),
    # db: Session = Depends(get_db),  # Uncomment when database available
) -> UserIdentity:
    """
    Verify that authenticated user owns the requested conversation.
    
    Prevents IDOR (Insecure Direct Object Reference) attacks where:
    - User A tries to access User B's conversation by passing their ID
    - Backend must validate User A owns this conversation before proceeding
    
    Usage in endpoint:
    ```python
    @app.get("/api/conversations/{conversation_id}")
    async def get_conversation(
        conversation_id: str,
        user: UserIdentity = Depends(require_conversation_owner),
    ):
        # At this point, user is verified to own conversation_id
        # Safe to access database
    ```
    
    Args:
        conversation_id: Client-provided conversation ID to verify
        user: Authenticated user identity from JWT
        db: Database session (for future use)
    
    Returns:
        UserIdentity: Same user (if ownership verified)
    
    Raises:
        HTTPException: 403 Forbidden if user doesn't own conversation
        HTTPException: 404 Not Found if conversation doesn't exist
    """
    
    # Implementation using httpx to call Supabase REST API securely
    supabase_url = os.getenv("SUPABASE_URL", "").rstrip("/")
    service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not service_key:
        raise HTTPException(
            status_code=500,
            detail="Database credentials missing. Cannot verify authorization."
        )

    try:
        async with httpx.AsyncClient(timeout=5) as client:
            response = await client.get(
                f"{supabase_url}/rest/v1/conversations",
                params={"id": f"eq.{conversation_id}", "select": "user_id"},
                headers={
                    "apikey": service_key,
                    "Authorization": f"Bearer {service_key}"
                }
            )
            
            if response.status_code != 200:
                raise HTTPException(status_code=500, detail="Database authorization error")
                
            data = response.json()
            if not data:
                raise HTTPException(status_code=404, detail="Resource not found")
                
            owner_id = data[0].get("user_id")
            if str(owner_id) != str(user.user_id):
                raise HTTPException(status_code=403, detail="You do not have access to this resource")
                
    except httpx.HTTPError:
        raise HTTPException(status_code=503, detail="Service temporarily unavailable")

    return user


async def require_admin(
    user: UserIdentity = Depends(get_verified_user),
) -> UserIdentity:
    """
    Verify that authenticated user is an admin.
    
    Usage in endpoint:
    ```python
    @app.get("/api/admin/users")
    async def list_all_users(user: UserIdentity = Depends(require_admin)):
        # Only admin users reach here
    ```
    
    Raises:
        HTTPException: 403 Forbidden if user is not admin
    """
    
    # NOTE: Admin flag should come from Supabase custom claims or database.
    # Placeholder implementation:
    # 
    # if user.user_id not in ADMIN_USER_IDS:
    #     raise HTTPException(
    #         status_code=403,
    #         detail="Admin access required"
    #     )
    # 
    # return user
    
    raise HTTPException(
        status_code=403,
        detail="This operation requires admin privileges"
    )


# ============================================================================
# Authorization Helpers
# ============================================================================


def verify_user_owns_message(user_id: str, message_user_id: str) -> bool:
    """
    Verify that user owns a specific message.
    
    Args:
        user_id: Authenticated user's ID from JWT
        message_user_id: User ID of message owner (from database)
    
    Returns:
        True if user owns message, False otherwise
    """
    return user_id == message_user_id


def verify_user_owns_feedback(user_id: str, feedback_user_id: str) -> bool:
    """
    Verify that user owns a specific feedback record.
    
    Args:
        user_id: Authenticated user's ID from JWT
        feedback_user_id: User ID of feedback owner (from database)
    
    Returns:
        True if user owns feedback, False otherwise
    """
    return user_id == feedback_user_id


# ============================================================================
# Error Responses for Authorization Failures
# ============================================================================
# These should be returned when authorization checks fail.
# IMPORTANT: Never reveal the exact reason (e.g., "user doesn't own this")
# because it could lead to user enumeration attacks.
# ============================================================================

UNAUTHORIZED_MESSAGE = "You do not have access to this resource"
NOT_FOUND_MESSAGE = "Resource not found"  # Same for 403 as for 404 (prevents user enumeration)
