import os
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from backend.config import (
    CONDITION_MAP,
    EMBEDDING_MODEL_NAME,
    RERANKER_MODEL_NAME
)

# تثبيت المسار بشكل صريح وقاطع عشان الكود ميتوهش
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_DIR = os.path.join(BASE_DIR, "data", "processed", "my_rag")

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

def metadata_aware_retrieve(query: str, k: int = 15):
    print(f"\n[1] المريض سأل: {query}")
    if vectorstore is None:
        print("[!] خطأ: لا توجد قاعدة بيانات للبحث فيها!")
        return []
        
    docs = vectorstore.similarity_search(query, k=k)
    print(f"[2] تم سحب {len(docs)} فقرة من قاعدة البيانات مبدئياً.")
    
    retrieved_chunks = [{"text": doc.page_content, "metadata": doc.metadata} for doc in docs]
    
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
        
    pairs = [[query, chunk["text"]] for chunk in retrieved_chunks]
    inputs = tokenizer_rerank(pairs, padding=True, truncation=True, return_tensors='pt', max_length=512)
    
    with torch.no_grad():
        scores = model_rerank(**inputs).logits.view(-1).float()
        
    ranked_indices = torch.argsort(scores, descending=True).tolist()
    reranked_chunks = [retrieved_chunks[i] for i in ranked_indices[:top_k]]
    print(f"[4] الرانكر اختار أدق {len(reranked_chunks)} فقرات وبعتهم يترد بيهم.")
    return reranked_chunks