import time
import asyncio
from collections import defaultdict
from fastapi import HTTPException, Request, Response
from backend.config import (
    AI_DAILY_REQUEST_QUOTA,
    AI_MAX_CONCURRENT_REQUESTS
)

# In-memory store for rate limiting
# Structure: { key: [timestamp1, timestamp2, ...] }
_request_history = defaultdict(list)
_daily_counts = defaultdict(int)
_last_reset = time.time()

# Per-route rate limit configuration
# Format: { scope: { "limit": int, "period": int } }
RATE_LIMIT_CONFIG = {
    "auth": {"limit": 10, "period": 60},           # 10 requests/minute for auth endpoints
    "ai_chat": {"limit": 20, "period": 60},        # 20 requests/minute for AI chat
    "feedback": {"limit": 30, "period": 60},       # 30 requests/minute for feedback
    "general": {"limit": 100, "period": 60},       # 100 requests/minute for general
    "health": {"limit": 1000, "period": 60},       # Higher limit for health checks
}

def route_scope(path: str, method: str) -> str:
    """
    Define the scope of a request for rate limiting.
    Returns a scope string (e.g., 'ai_chat', 'auth', 'health').
    """
    if "/api/chat" in path:
        return "ai_chat"
    if "/api/auth" in path:
        return "auth"
    if "/api/feedback" in path:
        return "feedback"
    if "/health" in path:
        return "health"
    return "general"

def client_ip(request: Request) -> str:
    """Extract client IP, handling potential proxies."""
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host

def account_dimension(request: Request) -> str:
    """
    Extract the user ID from the request for account-based limiting.
    Tries to get it from the authenticated user state.
    """
    if hasattr(request.state, "user"):
        return request.state.user.user_id
    
    # Fallback to cookie if user state isn't set yet
    token = request.cookies.get("care360_access_token")
    if token:
        # We don't decode here to avoid redundant JWT overhead in the limiter
        # We use the token hash as a proxy for the account ID
        import hashlib
        return hashlib.sha256(token.encode()).hexdigest()
        
    return "anonymous"

async def enforce(scope: str, identity: tuple, limit: int = None, period: int = None):
    """
    Enforce rate limiting based on scope and identity.
    
    Args:
        scope: The scope string (e.g., 'ai_chat')
        identity: Tuple of (account_id, ip, path)
        limit: Max requests allowed in the period (uses config if None)
        period: Time window in seconds (uses config if None)
    """
    if scope == "health":
        return  # Health endpoints are not rate limited

    # Get limits from config if not provided
    config = RATE_LIMIT_CONFIG.get(scope, {"limit": 100, "period": 60})
    if limit is None:
        limit = config["limit"]
    if period is None:
        period = config["period"]

    now = time.time()
    key = f"{scope}:{identity}"
    
    # Cleanup old requests
    _request_history[key] = [t for t in _request_history[key] if now - t < period]
    
    if len(_request_history[key]) >= limit:
        raise HTTPException(
            status_code=429, 
            detail="Too many requests. Please try again later.",
            headers={"Retry-After": str(period)}
        )
    
    _request_history[key].append(now)

# Special enforcement for AI Daily Quotas
async def enforce_daily_quota(user_id: str):
    """
    Enforce the AI_DAILY_REQUEST_QUOTA.
    """
    global _last_reset
    now = time.time()
    
    # Reset daily counts every 24 hours
    if now - _last_reset > 86400:
        _daily_counts.clear()
        _last_reset = now
        
    if _daily_counts[user_id] >= AI_DAILY_REQUEST_QUOTA:
        raise HTTPException(
            status_code=429, 
            detail=f"Daily AI request quota ({AI_DAILY_REQUEST_QUOTA}) exceeded. Please try again tomorrow."
        )
    
    _daily_counts[user_id] += 1
