import os
import jwt
from fastapi import HTTPException
from backend.auth_middleware import SupabaseConfig, UserIdentity

def _decode_token(token: str) -> UserIdentity:
    """
    Compatibility layer for token decoding. 
    Validates the JWT signature and returns a UserIdentity object.
    """
    config = SupabaseConfig()
    if not config.jwt_secret:
        raise HTTPException(
            status_code=500, 
            detail="Server authentication not configured. Contact administrator."
        )

    try:
        payload = jwt.decode(
            token, 
            config.jwt_secret, 
            algorithms=["HS256"], 
            options={"verify_exp": True}
        )

        user_id = payload.get("sub")
        email = payload.get("email")
        email_verified = payload.get("email_verified", False)

        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token: missing user ID")

        return UserIdentity(
            user_id=user_id,
            email=email,
            email_verified=email_verified
        )
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid authentication token")
