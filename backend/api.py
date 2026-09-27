import os
import asyncio
import hashlib
# ده السطر اللي بيمنع تحميل الموديل على السي ويقراه من الإي مباشرة
os.environ["HF_HOME"] = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".hf_cache")

from fastapi import FastAPI, HTTPException, Request, Depends, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from pydantic import BaseModel, Field, ConfigDict
from uuid import UUID
import httpx
import uvicorn
import io

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
    if request.url.path == "/api/auth/session" and request.method == "POST":
        return await call_next(request)
        
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


from typing import Optional

class SessionRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    access_token: Optional[str] = Field(default=None)
    refresh_token: Optional[str] = Field(default=None)


@app.post("/api/auth/session")
async def establish_session(request: SessionRequest):
    if not request.access_token or not request.refresh_token:
        return JSONResponse({"authenticated": False})
    
    try:
        from backend.auth import _decode_token
        _decode_token(request.access_token)
    except Exception:
        return JSONResponse({"authenticated": False})
        
    response = JSONResponse({"authenticated": True})
    set_session_cookies(response, request.access_token, request.refresh_token)
    return response

def set_session_cookies(response: Response, access_token: str, refresh_token: str):
    """Set HTTP-only cookies for the session."""
    response.set_cookie(
        key="care360_access_token",
        value=access_token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
        max_age=3600 # 1 hour
    )
    response.set_cookie(
        key="care360_refresh_token",
        value=refresh_token,
        httponly=True,
        secure=False,
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
            resp = JSONResponse({"authenticated": False}, status_code=401)
            clear_session_cookies(resp)
            return resp
        tokens = token_response.json()
        from backend.auth import _decode_token
        _decode_token(tokens["access_token"])
        response = JSONResponse({"authenticated": True})
        set_session_cookies(response, tokens["access_token"], tokens["refresh_token"])
        return response
    except (httpx.HTTPError, KeyError, ValueError) as error:
        resp = JSONResponse({"authenticated": False}, status_code=401)
        clear_session_cookies(resp)
        return resp


@app.post("/api/auth/logout")
async def logout(response: Response):
    clear_session_cookies(response)
    return {"authenticated": False}

def clear_session_cookies(response: Response):
    response.delete_cookie(
        key="care360_access_token",
        path="/",
        secure=False,
        httponly=True,
        samesite="lax"
    )
    response.delete_cookie(
        key="care360_refresh_token",
        path="/",
        secure=False,
        httponly=True,
        samesite="lax"
    )


@app.get("/api/auth/session")
async def session(user: dict = Depends(get_verified_user)):
    return {"authenticated": True, "user": {"id": user.user_id, "email": user.email}}

from typing import Any

class MessageHistory(BaseModel):
    role: str
    content: str
    timestamp: str | None = None

class QueryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    message: str = Field(min_length=1, max_length=AI_MAX_QUERY_CHARS)
    conversation_id: UUID | None = None
    history: Any = None
    file_base64: str | None = None

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

class TTSRequest(BaseModel):
    text: str

TTS_CACHE = {}

@app.post("/api/tts")
async def generate_tts(request: TTSRequest, user: UserIdentity = Depends(get_verified_user)):
    text = request.text
    import re
    import hashlib
    from fastapi.responses import StreamingResponse
    from backend.config import GROQ_API_KEY
    from groq import AsyncGroq
    
    # Exclude references section from TTS
    if "المراجع الطبية الداعمة" in text:
        text = text.split("المراجع الطبية الداعمة")[0]
        
    # Fast initial cleanup
    text = re.sub(r'(\*\*|##|\*|__|_|~|`|\||-{3,})', '', text)
    text = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', text)
    # Remove structural headers and lists aggressively
    text = re.sub(r'^(التقييم الأولي|التحليل الطبي والأسباب المحتملة|الإرشادات|المراجع|Initial Assessment|Medical Analysis|Recommendations|References).*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^#{1,6}\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'^[\s]*[-*•◦▪▫]\s*', '', text, flags=re.MULTILINE)
    text = re.sub(r'https?:\/\/[^\s]+', '', text)
    text = re.sub(r'[\U00010000-\U0010ffff]', '', text)
    text = text.replace('🩺', '').replace('💡', '').replace('🚩', '').replace('📋', '').replace('👨‍⚕️', '').replace('📚', '')
    text = text.replace('\n', ' ').strip()
    
    if not text:
        return Response(content=b"", media_type="audio/mpeg")
    
    try:
        from langdetect import detect
        lang = detect(text)
    except Exception:
        lang = 'en'
        
    base_lang = lang.split('-')[0]
    
    # Groq Processing for Arabic (Diacritization and Conversational tone)
    if base_lang == 'ar' and GROQ_API_KEY:
        try:
            groq_client = AsyncGroq(api_key=GROQ_API_KEY)
            prompt = (
                "حول هذا النص الطبي إلى حديث طبيب بشري متصل بالعامية المصرية الراقية والمريحة. "
                "احذف أي بقايا عناوين رسمية، واضبط التشكيل الصوتي للكلمات العامية (مثل وَجَعَك، ضَهْرَك) ليقرأها محرك الصوت كنطق إنساني طبيعي 100%. "
                "استبدل النقاط الفاصلة بأدوات ربط طبيعية (مثل 'وكمان' أو 'عشان كده'). أخرج النص فقط دون أي تعليقات أو مقدمات:\n\n"
                f"{text}"
            )
            response = await groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.0,
                max_tokens=1024,
                timeout=10.0
            )
            text = response.choices[0].message.content.strip()
        except Exception as e:
            print(f"Groq TTS processing failed: {e}")

    voice_map = {
        'ar': 'ar-EG-SalmaNeural',
        'en': 'en-US-AriaNeural',
        'es': 'es-ES-ElviraNeural',
        'de': 'de-DE-KatjaNeural',
        'fr': 'fr-FR-DeniseNeural',
        'it': 'it-IT-ElsaNeural',
        'zh-cn': 'zh-CN-XiaoxiaoNeural',
        'ru': 'ru-RU-SvetlanaNeural'
    }
    
    voice = voice_map.get(base_lang, 'en-US-AriaNeural')
    rate = "+5%" if base_lang == 'ar' else "+0%"
    pitch = "-2Hz" if base_lang == 'ar' else "+0Hz"
    
    cache_key = hashlib.md5(f"{voice}:{rate}:{pitch}:{text}".encode()).hexdigest()
    if cache_key in TTS_CACHE:
        return Response(content=TTS_CACHE[cache_key], media_type="audio/mpeg")
    
    import edge_tts
    
    async def audio_stream():
        communicate = edge_tts.Communicate(text, voice, rate=rate, pitch=pitch)
        audio_data = b""
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
                yield chunk["data"]
                
        # Cache after completion
        if len(TTS_CACHE) > 1000:
            TTS_CACHE.clear()
        TTS_CACHE[cache_key] = audio_data

    return StreamingResponse(audio_stream(), media_type="audio/mpeg")



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
            # Handle file attachments (PDFs or Images)
            pdf_text = ""
            final_file_base64 = query_request.file_base64
            
            if final_file_base64:
                if final_file_base64.startswith("data:application/pdf;base64,"):
                    import base64
                    import pypdf
                    import io
                    
                    b64_data = final_file_base64.split(",", 1)[-1]
                    pdf_bytes = base64.b64decode(b64_data)
                    
                    try:
                        reader = pypdf.PdfReader(io.BytesIO(pdf_bytes))
                        extracted_text = []
                        for page in reader.pages:
                            text = page.extract_text()
                            if text:
                                extracted_text.append(text)
                        pdf_text = "\n".join(extracted_text)
                    except Exception as e:
                        print("Error extracting PDF:", e)
                    
                    # We extracted text, so we don't send the PDF as an image to Groq
                    final_file_base64 = None

            # Merge PDF text into the message
            final_message = query_request.message
            if pdf_text:
                final_message += f"\n\n[ATTACHED MEDICAL DOCUMENT (PDF)]:\n{pdf_text}"

            clean_history = []
            if query_request.history and isinstance(query_request.history, list):
                for msg in query_request.history:
                    try:
                        role = ""
                        content = ""
                        if hasattr(msg, "role"):
                            role = str(getattr(msg, "role", "")).lower()
                            content = str(getattr(msg, "content", "")).strip()
                        elif isinstance(msg, dict):
                            role = str(msg.get("role", "")).lower()
                            content = str(msg.get("content", "")).strip()
                        
                        if not content or "Welcome to Nuvira" in content:
                            continue
                        
                        if role not in ["user", "assistant"]:
                            role = "user"
                            
                        clean_history.append({"role": role, "content": content})
                    except Exception:
                        continue

            search_query_context = final_message
            if len(clean_history) >= 2:
                last_user = clean_history[-2]["content"]
                last_asst = clean_history[-1]["content"]
                search_query_context = f"Previous Context: {last_user} -> {last_asst}\n\nCurrent Complaint: {final_message}"

            from backend.generator import translate_to_english_medical_query
            english_query = await asyncio.to_thread(translate_to_english_medical_query, search_query_context)
            
            retrieved_chunks = await asyncio.wait_for(
                asyncio.to_thread(metadata_aware_retrieve, english_query, 3, user.user_id),
                timeout=AI_PROVIDER_TIMEOUT_SECONDS,
            )
            top_chunks = await asyncio.wait_for(
                asyncio.to_thread(rerank_evidence, english_query, retrieved_chunks, 3),
                timeout=AI_PROVIDER_TIMEOUT_SECONDS,
            )
            answer = await asyncio.wait_for(
                asyncio.to_thread(generate_clinical_answer, final_message, top_chunks, final_file_base64, clean_history),
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