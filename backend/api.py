import sys
import os

# إضافة مسار المشروع الأساسي لـ Python Path عشان يحل مشكلة Vercel نهائياً
current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
sys.path.append(parent_dir)
sys.path.append(current_dir)

import base64
import io
import os
# ده السطر اللي بيمنع تحميل الموديل على السي ويقراه من الإي مباشرة
os.environ["HF_HOME"] = "E:/huggingface_cache"

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
    file_base64: str | None = None  

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

def extract_text_from_base64_file(base64_str: str) -> str:
    try:
        if "," in base64_str:
            header, encoded = base64_str.split(",", 1)
        else:
            encoded = base64_str
            header = ""

        binary_data = base64.b64decode(encoded)

        if "application/pdf" in header or binary_data.startswith(b"%PDF"):
            reader = PdfReader(io.BytesIO(binary_data))
            text = ""
            for page in reader.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"
            return text
        else:
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

        if request.file_base64:
            if "image/" in request.file_base64 or request.file_base64.startswith("data:image/"):
                image_base64_param = request.file_base64
            else:
                extracted_text = extract_text_from_base64_file(request.file_base64)
                if extracted_text:
                    dynamic_chunks.append({
                        "metadata": {"section_name": "User Uploaded Document", "section_number": "Full Text"},
                        "text": extracted_text
                    })

        retrieved_chunks = metadata_aware_retrieve(request.message, k=3)
        all_chunks = dynamic_chunks + retrieved_chunks
        top_chunks = rerank_evidence(request.message, all_chunks, top_k=3)
        answer = generate_clinical_answer(request.message, top_chunks, image_base64=image_base64_param)
        
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