import os
# ده السطر اللي بيمنع تحميل الموديل على السي ويقراه من الإي مباشرة
os.environ["HF_HOME"] = "E:/huggingface_cache"

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

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

@app.post("/api/chat", response_model=QueryResponse)
async def chat_endpoint(request: QueryRequest):
    try:
        retrieved_chunks = metadata_aware_retrieve(request.message, k=3)
        top_chunks = rerank_evidence(request.message, retrieved_chunks, top_k=3)
        answer = generate_clinical_answer(request.message, top_chunks)
        
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