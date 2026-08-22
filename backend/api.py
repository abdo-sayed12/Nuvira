import base64
import io
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn
from pypdf import PdfReader

from backend.retriever import metadata_aware_retrieve, rerank_evidence
from backend.generator import generate_clinical_answer

app = FastAPI(title="Care360 Clinical RAG API")

# Setup CORS for the frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class QueryRequest(BaseModel):
    message: str
    file_base64: str | None = None  # استلام الملف المرفوع (صورة أو PDF أو نص) كـ Base64

class SourceItem(BaseModel):
    section_name: str
    section_number: str
    text: str

class QueryResponse(BaseModel):
    answer: str
    sources: list[SourceItem]

class FeedbackRequest(BaseModel):
    message_id: str
    feedback: str 

# 🛠️ دالة استخراج النصوص من ملفات الـ PDF أو النصوص المرفوعة من المستخدم لحظياً
def extract_text_from_base64_file(base64_str: str) -> str:
    try:
        if "," in base64_str:
            header, encoded = base64_str.split(",", 1)
        else:
            encoded = base64_str
            header = ""

        binary_data = base64.b64decode(encoded)

        # لو الملف PDF، نقرأ محتواه بالكامل باستخدام pypdf
        if "application/pdf" in header or binary_data.startswith(b"%PDF"):
            reader = PdfReader(io.BytesIO(binary_data))
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return text
        else:
            # محاولة قراءته كملف نصي عادي
            try:
                return binary_data.decode("utf-8")
            except:
                return ""
    except Exception as e:
        print(f"Error parsing uploaded file: {e}")
        return ""

@app.post("/api/chat", response_model=QueryResponse)
async def chat_endpoint(request: QueryRequest):
    try:
        image_base64_param = None
        dynamic_chunks = []

        # معالجة الملف لو المستخدم رفعه في الشات
        if request.file_base64:
            # لو الملف صورة (أشعة أو تقرير مصور)
            if "image/" in request.file_base64 or request.file_base64.startswith("data:image/"):
                image_base64_param = request.file_base64
            else:
                # لو الملف PDF أو مستند نصي، يتم قراءته وجعله جزءاً من الـ Context (يتثقف منه فوريًا)
                extracted_text = extract_text_from_base64_file(request.file_base64)
                if extracted_text:
                    dynamic_chunks.append({
                        "metadata": {"section_name": "User Uploaded Document", "section_number": "Full Text"},
                        "text": extracted_text
                    })

        # Step 1: Retrieve from static vector database
        retrieved_chunks = metadata_aware_retrieve(request.message, k=3)
        
        # دمج ملفات المستخدم المرفوعة مع النتائج المسترجعة
        all_chunks = dynamic_chunks + retrieved_chunks
        
        # Step 2: Rerank
        top_chunks = rerank_evidence(request.message, all_chunks, top_k=3)
        
        # Step 3: Generate Answer (مع تمرير الصورة لو وجدت للنموذج البصري)
        answer = generate_clinical_answer(request.message, top_chunks, image_base64=image_base64_param)
        
        # Format sources
        sources = []
        for chunk in top_chunks:
            meta = chunk.get("metadata", {})
            sources.append(SourceItem(
                section_name=meta.get("section_name", "Unknown"),
                section_number=meta.get("section_number", "Unknown"),
                text=chunk.get("text", "")
            ))
            
        return QueryResponse(answer=answer, sources=sources)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/feedback")
async def submit_feedback(request: FeedbackRequest):
    try:
        print(f"✅ Feedback Received! Message ID: {request.message_id} | Type: {request.feedback}")
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run("backend.api:app", host="0.0.0.0", port=8000, reload=True)