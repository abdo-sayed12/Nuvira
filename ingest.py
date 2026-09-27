import os
from langchain_community.document_loaders import PyPDFDirectoryLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from backend.config import PROCESSED_DATA_DIR

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PDF_FOLDER = os.path.join(BASE_DIR, "data", "pdfs")
DB_PATH = os.path.join(PROCESSED_DATA_DIR, "my_rag")

print("1. بدأ تحميل ملفات الـ PDF...")
loader = PyPDFDirectoryLoader(PDF_FOLDER)
docs = loader.load()
print(f"-> تم قراءة {len(docs)} صفحة.")

print("\n2. جاري التقطيع (Chunking)...")
text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=700,
    chunk_overlap=150,
    separators=["\n\n", "\n", ".", " ", ""]
)
chunks = text_splitter.split_documents(docs)
print(f"-> تم تقطيع الملفات إلى {len(chunks)} فقرة (Chunk).")

print("\n3. جاري التحويل الرقمي (Embedding) - معالجة تدريجية...")
# استخدام الموديل مع تحديد خصائص المعالجة عشان ميخنقش اللاب توب
encode_kwargs = {'batch_size': 8} # هيعالج 8 فقرات بس في المرة بدل ما يحاول يعالجهم كلهم
embeddings = HuggingFaceEmbeddings(
    model_name="Qwen/Qwen3-Embedding-0.6B",
    encode_kwargs=encode_kwargs
)

print("\n4. جاري بناء قاعدة البيانات (Vector Database)...")
# هنبني قاعدة البيانات على دفعات صغيرة عشان الرامات ماتتمليش
BATCH_SIZE = 100
vectorstore = None

for i in range(0, len(chunks), BATCH_SIZE):
    batch_chunks = chunks[i : i + BATCH_SIZE]
    print(f"-> جاري معالجة وحفظ الفقرات من {i} إلى {i + len(batch_chunks)}...")
    
    if vectorstore is None:
        vectorstore = FAISS.from_documents(batch_chunks, embeddings)
    else:
        # إضافة الفقرات الجديدة لقاعدة البيانات الحالية
        batch_vectorstore = FAISS.from_documents(batch_chunks, embeddings)
        vectorstore.merge_from(batch_vectorstore)
    
    # حفظ مؤقت بعد كل دفعة عشان لو فصل مانخسرش الشغل
    vectorstore.save_local(DB_PATH)

print("\n✅ تم بنجاح! قاعدة البيانات my_rag تم تحديثها بالكامل.")