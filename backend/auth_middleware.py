"""
Supabase JWT validation middleware for FastAPI.

This module provides secure authentication verification for protected API endpoints.
It validates Supabase JWT tokens and extracts user identity from the authentication header.

CRITICAL SECURITY NOTES:
- Never trust user_id or email sent by the client in request body/params.
- Always derive identity from the validated JWT token.
- This middleware should be applied to all authenticated endpoints.
- Never expose service_role keys or internal tokens.
"""

import os
from functools import lru_cache
from typing import Optional
from datetime import datetime

import jwt
from fastapi import HTTPException, Depends, Request
from pydantic import BaseModel


class SupabaseConfig:
    """Cached Supabase configuration."""

    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance

    def __init__(self):
        if not self._initialized:
            self.url = os.getenv("SUPABASE_URL")
            self.anon_key = os.getenv("SUPABASE_ANON_KEY")
            self.jwt_secret = os.getenv("SUPABASE_JWT_SECRET", "")
            self._initialized = True

    def is_configured(self) -> bool:
        return bool(self.url and self.anon_key)


class UserIdentity(BaseModel):
    """Validated user identity from JWT token."""

    user_id: str
    email: Optional[str] = None
    email_verified: bool = False

    class Config:
        frozen = True


async def get_supabase_user(request: Request) -> UserIdentity:
    """
    Extract and validate Supabase user from JWT token in Authorization header.

    Raises:
        HTTPException: 401 if token is invalid, expired, or missing.
        HTTPException: 403 if token is not properly signed.

    Returns:
        UserIdentity: Validated user information from the JWT.
    """
    auth_header = request.headers.get("Authorization", "")
    token = ""

    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    else:
        # Fallback to HTTP-only cookie
        token = request.cookies.get("care360_access_token", "")

    if not token:
        raise HTTPException(status_code=401, detail="Missing or invalid authorization token")

    config = SupabaseConfig()

    # Supabase JWT tokens are signed with a secret key
    # For development/testing: can be found in Supabase dashboard → Project Settings → API
    # For production: must be obtained securely from environment
    if not config.jwt_secret:
        # Use the required_env helper to fail closed if the secret is missing
        from backend.api import required_env
        raise HTTPException(
            status_code=500, detail=f"Server authentication not configured: {required_env('SUPABASE_JWT_SECRET')}"
        )

    try:
        # Decode JWT token (verify signature and expiration)
        payload = jwt.decode(
            token, config.jwt_secret, algorithms=["HS256"], options={"verify_exp": True}
        )

        user_id = payload.get("sub")
        email = payload.get("email")
        email_verified = payload.get("email_verified", False)

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")

        return UserIdentity(
            user_id=user_id, email=email, email_verified=email_verified
        )

    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired. Please log in again.")
    except jwt.InvalidSignatureError:
        raise HTTPException(status_code=401, detail="Invalid token signature. Unauthorized.")
    except jwt.DecodeError:
        raise HTTPException(status_code=401, detail="Could not decode authentication token.")
    except Exception as e:
        # Never expose internal error details
        raise HTTPException(status_code=401, detail="Authentication failed. Please try again.")


async def get_verified_user(user: UserIdentity = Depends(get_supabase_user)) -> UserIdentity:
    """
    Get a verified user (email must be confirmed).

    Use this for endpoints that require confirmed email.
    """
    if not user.email_verified:
        raise HTTPException(status_code=403, detail="Email verification required. Please verify your email.")

    return user

async def get_current_user(user: UserIdentity = Depends(get_supabase_user)) -> dict:
    """
    Backward-compatible wrapper for get_supabase_user that returns a dict.
    This is used by api.py to maintain compatibility with existing user['sub'] access.
    """
    return {
        "sub": user.user_id,
        "email": user.email,
        "email_verified": user.email_verified
    }
