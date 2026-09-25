import os
import asyncio
import hashlib
# ده السطر اللي بيمنع تحميل الموديل على السي ويقراه من الإي مباشرة
os.environ["HF_HOME"] = "E:/huggingface_cache"

from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
import httpx
import uvicorn

from backend.retriever import metadata_aware_retrieve, rerank_evidence
from backend.generator import generate_clinical_answer
from backend.auth_middleware import get_current_user, get_verified_user, UserIdentity
from backend.config import AI_MAX_CONCURRENT_REQUESTS, AI_MAX_QUERY_CHARS, AI_PROVIDER_TIMEOUT_SECONDS, AI_QUEUE_TIMEOUT_SECONDS, SUPABASE_ANON_KEY, SUPABASE_URL
from backend.rate_limit import enforce, route_scope, client_ip, account_dimension, enforce_daily_quota

def required_env(key: str) -> str:
    """Ensures a mandatory environment variable is set, otherwise fails closed."""
    val = os.getenv(key)
    if not val:
        raise RuntimeError(f"CRITICAL ERROR: Mandatory environment secret {key} is missing. Application cannot start safely.")
    return val

app = FastAPI(title="Care360 Clinical RAG API")

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    """Add production-grade security headers to every response."""
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    # CSP is omitted by default to avoid breaking frontend, but can be added for production
    return response

ai_slots = asyncio.Semaphore(AI_MAX_CONCURRENT_REQUESTS)
inflight_requests: set[str] = set()
inflight_lock = asyncio.Lock()

FRONTEND_ORIGIN = os.getenv("FRONTEND_ORIGIN", "http://localhost:5173")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_ORIGIN],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Request-ID"],
)


@app.get("/health/live")
async def liveness():
    return {"status": "ok"}


@app.get("/health/ready")
async def readiness():
    from backend.retriever import vectorstore

    if vectorstore is None or not SUPABASE_URL:
        raise HTTPException(status_code=503, detail="Service is not ready")
    return {"status": "ready"}


@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    scope = route_scope(request.url.path, request.method)
    ip = client_ip(request)
    try:
        # The middleware key is deliberately independent of client-supplied account headers.
        # Use per-route limits from RATE_LIMIT_CONFIG
        await enforce(scope, (ip, request.method, request.url.path))
        if not request.cookies.get("care360_access_token") and not request.headers.get("authorization"):
            await enforce("anonymous", (ip, request.method, request.url.path))
    except HTTPException as error:
        return JSONResponse({"detail": error.detail}, status_code=error.status_code, headers=error.headers)
    response = await call_next(request)
    return response


class SessionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    access_token: str = Field(min_length=20, max_length=8192)
    refresh_token: str = Field(min_length=20, max_length=8192)


@app.post("/api/auth/session")
async def establish_session(request: SessionRequest):
    response = JSONResponse({"authenticated": True})
    # set_session_cookies validates the access token through the same dependency used by API routes.
    from backend.auth import _decode_token
    _decode_token(request.access_token)
    set_session_cookies(response, request.access_token, request.refresh_token)
    return response

def set_session_cookies(response: Response, access_token: str, refresh_token: str):
    """Set secure HTTP-only cookies for the session."""
    response.set_cookie(
        key="care360_access_token",
        value=access_token,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
        max_age=3600 # 1 hour
    )
    response.set_cookie(
        key="care360_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=True,
        samesite="lax",
        path="/",
        max_age=60 * 60 * 24 * 7 # 7 days
    )

@app.post("/api/auth/refresh")
async def refresh_session(request: Request):
    refresh_token = request.cookies.get("care360_refresh_token")
    if not refresh_token or not SUPABASE_URL or not SUPABASE_ANON_KEY:
        raise HTTPException(status_code=401, detail="Authentication required")
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            token_response = await client.post(
                f"{SUPABASE_URL}/auth/v1/token?grant_type=refresh_token",
                headers={"apikey": SUPABASE_ANON_KEY},
                json={"refresh_token": refresh_token},
            )
        if token_response.status_code >= 400:
            raise HTTPException(status_code=401, detail="Session expired")
        tokens = token_response.json()
        from backend.auth import _decode_token
        _decode_token(tokens["access_token"])
        response = JSONResponse({"authenticated": True})
        set_session_cookies(response, tokens["access_token"], tokens["refresh_token"])
        return response
    except (httpx.HTTPError, KeyError, ValueError) as error:
        raise HTTPException(status_code=401, detail="Session refresh failed") from error


@app.post("/api/auth/logout")
async def logout(response: Response):
    clear_session_cookies(response)
    return {"authenticated": False}

def clear_session_cookies(response: Response):
    response.delete_cookie(
        key="care360_access_token",
        path="/",
        secure=True,
        httponly=True,
        samesite="lax"
    )
    response.delete_cookie(
        key="care360_refresh_token",
        path="/",
        secure=True,
        httponly=True,
        samesite="lax"
    )


@app.get("/api/auth/session")
async def session(user: dict = Depends(get_verified_user)):
    return {"authenticated": True, "user": {"id": user.user_id, "email": user.email}}

class QueryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: str = Field(min_length=1, max_length=AI_MAX_QUERY_CHARS)
    conversation_id: UUID | None = None

class SourceItem(BaseModel):
    section_name: str
    section_number: str
    text: str

class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceItem]

class FeedbackRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message_id: UUID
    feedback: str = Field(pattern="^(up|down)$")

@app.post("/api/chat", response_model=QueryResponse)
async def chat_endpoint(
    query_request: QueryRequest, 
    http_request: Request, 
    user: UserIdentity = Depends(get_verified_user)
):
    # IDOR Prevention: If conversation_id is provided, verify ownership.
    if query_request.conversation_id:
        from backend.authorization import require_conversation_owner
        await require_conversation_owner(str(query_request.conversation_id), user)

    http_request.state.user = user
    await enforce("ai_chat", (account_dimension(http_request), client_ip(http_request), http_request.url.path))
    await enforce_daily_quota(user.user_id)
    await enforce("rag_retrieval", (user.user_id, http_request.url.path))
    request_key = hashlib.sha256(f"{user.user_id}|{query_request.message}".encode("utf-8")).hexdigest()
    async with inflight_lock:
        if request_key in inflight_requests:
            raise HTTPException(status_code=409, detail="A matching request is already being processed")
        inflight_requests.add(request_key)
    acquired = False
    try:
        try:
            await asyncio.wait_for(ai_slots.acquire(), timeout=AI_QUEUE_TIMEOUT_SECONDS)
            acquired = True
        except asyncio.TimeoutError:
            raise HTTPException(status_code=429, detail="The clinical assistant is busy. Please try again shortly.")

        try:
            retrieved_chunks = await asyncio.wait_for(
                asyncio.to_thread(metadata_aware_retrieve, query_request.message, 3, user.user_id),
                timeout=AI_PROVIDER_TIMEOUT_SECONDS,
            )
            top_chunks = await asyncio.wait_for(
                asyncio.to_thread(rerank_evidence, query_request.message, retrieved_chunks, 3),
                timeout=AI_PROVIDER_TIMEOUT_SECONDS,
            )
            answer = await asyncio.wait_for(
                asyncio.to_thread(generate_clinical_answer, query_request.message, top_chunks),
                timeout=AI_PROVIDER_TIMEOUT_SECONDS,
            )
        finally:
            if acquired:
                ai_slots.release()
        
        sources = []
        for chunk in top_chunks:
            meta = chunk.get("metadata", {})
            sources.append(SourceItem(
                section_name=meta.get("section_name", "Unknown"),
                section_number=meta.get("section_number", "Unknown"),
                text=chunk.get("text", "")
            ))
            
        # Optional: Save chat history to database
        conv_id = query_request.conversation_id
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if SUPABASE_URL and service_key:
            try:
                async with httpx.AsyncClient(timeout=5) as client:
                    headers = {
                        "apikey": service_key,
                        "Authorization": f"Bearer {service_key}",
                        "Prefer": "return=representation"
                    }
                    # Create conversation if not exists
                    if not conv_id:
                        resp = await client.post(
                            f"{SUPABASE_URL}/rest/v1/conversations",
                            json={"user_id": user.user_id, "title": query_request.message[:50]},
                            headers=headers
                        )
                        if resp.status_code in (200, 201):
                            conv_id = resp.json()[0]["id"]
                            
                    # Save messages
                    if conv_id:
                        await client.post(
                            f"{SUPABASE_URL}/rest/v1/messages",
                            json={"conversation_id": str(conv_id), "user_id": user.user_id, "role": "user", "content": query_request.message},
                            headers=headers
                        )
                        await client.post(
                            f"{SUPABASE_URL}/rest/v1/messages",
                            json={"conversation_id": str(conv_id), "user_id": user.user_id, "role": "assistant", "content": answer},
                            headers=headers
                        )
            except Exception as e:
                print("Warning: Failed to persist chat history:", e)
            
        return QueryResponse(answer=answer, sources=sources)
        
    except asyncio.TimeoutError:
        raise HTTPException(status_code=504, detail="The clinical assistant timed out. Please try again.")
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid clinical request")
    except Exception:
        raise HTTPException(status_code=503, detail="The clinical assistant is temporarily unavailable")
    finally:
        async with inflight_lock:
            inflight_requests.discard(request_key)

@app.post("/api/feedback")
async def submit_feedback(request: FeedbackRequest, user: UserIdentity = Depends(get_verified_user)):
    try:
        service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
        if SUPABASE_URL and service_key:
            async with httpx.AsyncClient(timeout=5) as client:
                await client.post(
                    f"{SUPABASE_URL}/rest/v1/feedback",
                    json={
                        "user_id": user.user_id,
                        "message_id": str(request.message_id),
                        "feedback": request.feedback
                    },
                    headers={
                        "apikey": service_key,
                        "Authorization": f"Bearer {service_key}",
                        "Prefer": "resolution=merge-duplicates"
                    }
                )
        print(f"✅ Feedback Received! Message ID: {request.message_id} | Type: {request.feedback}")
        return {"success": True}
    except Exception as e:
        print("Feedback error:", e)
        raise HTTPException(status_code=503, detail="Feedback is temporarily unavailable")

if __name__ == "__main__":
    uvicorn.run("backend.api:app", host="0.0.0.0", port=8000, reload=True)