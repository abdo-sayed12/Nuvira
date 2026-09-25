import os
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from backend.config import (
    AI_MAX_RETRIEVAL_CHUNKS,
    AI_MAX_CONTEXT_CHARS,
    CONDITION_MAP,
    EMBEDDING_MODEL_NAME,
    PROCESSED_DATA_DIR,
    RERANKER_MODEL_NAME
)

# تثبيت المسار بشكل صريح وقاطع عشان الكود ميتوهش
DB_DIR = os.path.join(PROCESSED_DATA_DIR, "my_rag")

print("\n" + "="*50)
print(f"🔍 السيرفر بيبحث عن قاعدة البيانات (العقل) في المسار ده:")
print(f"👉 {DB_DIR}")
print("="*50 + "\n")

# تجهيز الموديل
embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)

# تحميل قاعدة البيانات
if os.path.exists(os.path.join(DB_DIR, "index.faiss")):
    print("✅ ممتاز! تم العثور على ملفات قاعدة البيانات... جاري التحميل.")
    vectorstore = FAISS.load_local(DB_DIR, embeddings, allow_dangerous_deserialization=True)
    print(f"✅ تم تحميل العقل بنجاح! جاهز لاستقبال أسئلة المرضى.")
else:
    vectorstore = None
    print("❌ مصيبة! السيرفر مش لاقي ملف index.faiss في المسار ده.")

tokenizer_rerank = AutoTokenizer.from_pretrained(RERANKER_MODEL_NAME)
model_rerank = AutoModelForSequenceClassification.from_pretrained(RERANKER_MODEL_NAME)
model_rerank.eval()

def extract_condition_from_query(query: str) -> str:
    query_lower = query.lower()
    for condition in CONDITION_MAP.keys():
        if condition in query_lower:
            return condition
    return None

def metadata_aware_retrieve(query: str, k: int = AI_MAX_RETRIEVAL_CHUNKS, authorized_user_id: str | None = None):
    if not isinstance(query, str) or not query.strip():
        return []
    k = max(1, min(int(k), AI_MAX_RETRIEVAL_CHUNKS))
    print(f"\n[1] المريض سأل: {query}")
    if vectorstore is None:
        print("[!] خطأ: لا توجد قاعدة بيانات للبحث فيها!")
        return []
        
    docs = vectorstore.similarity_search(query, k=k)
    print(f"[2] تم سحب {len(docs)} فقرة من قاعدة البيانات مبدئياً.")
    
    retrieved_chunks = []
    for doc in docs:
        metadata = doc.metadata if isinstance(doc.metadata, dict) else {}
        owner_id = metadata.get("owner_id")
        allowed_users = metadata.get("allowed_user_ids")
        if owner_id and str(owner_id) != str(authorized_user_id):
            continue
        if allowed_users is not None:
            if not isinstance(allowed_users, (list, tuple, set)) or str(authorized_user_id) not in {str(value) for value in allowed_users}:
                continue
        if metadata.get("visibility") == "private" and not owner_id and allowed_users is None:
            continue
        retrieved_chunks.append({"text": str(doc.page_content)[:AI_MAX_CONTEXT_CHARS], "metadata": metadata})
    
    condition = extract_condition_from_query(query)
    if not condition:
        print("[3] مفيش قسم طبي معين في السؤال، هيتم إرسال كل الفقرات.")
        return retrieved_chunks
        
    section_num = CONDITION_MAP[condition]
    filtered_chunks = []
    
    for chunk in retrieved_chunks:
        chunk_section = chunk.get("metadata", {}).get("section_number")
        if not chunk_section: 
            filtered_chunks.append(chunk)
        elif str(chunk_section).startswith(section_num) or "general" in str(chunk_section).lower():
            filtered_chunks.append(chunk)
            
    print(f"[3] بعد الفلترة الذكية، اتبقى {len(filtered_chunks)} فقرة.")
    return filtered_chunks

def rerank_evidence(query: str, retrieved_chunks: list, top_k: int = 3):
    if not retrieved_chunks:
        return []
        
    top_k = max(1, min(int(top_k), 5))
    retrieved_chunks = retrieved_chunks[:AI_MAX_RETRIEVAL_CHUNKS]
    pairs = [[query[:10000], str(chunk.get("text", ""))[:100000]] for chunk in retrieved_chunks]
    inputs = tokenizer_rerank(pairs, padding=True, truncation=True, return_tensors='pt', max_length=512)
    
    with torch.no_grad():
        scores = model_rerank(**inputs).logits.view(-1).float()
        
    ranked_indices = torch.argsort(scores, descending=True).tolist()
    reranked_chunks = [retrieved_chunks[i] for i in ranked_indices[:top_k]]
    print(f"[4] الرانكر اختار أدق {len(reranked_chunks)} فقرات وبعتهم يترد بيهم.")
    return reranked_chunks