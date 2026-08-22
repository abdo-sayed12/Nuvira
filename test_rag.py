import os
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS

# 1. إجبار البايثون على قراءة المسار الحقيقي للكمبيوتر بتاعك
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_DIR = os.path.join(BASE_DIR, "data", "process", "my_rag")

print("\n" + "="*50)
print(f"📁 أنا ككود بايثون، بدور على الملفات في المسار ده بالظبط:")
print(f"👉 {DB_DIR}")
print("="*50 + "\n")

# 2. التأكد من وجود الملفات فعلياً
faiss_file = os.path.join(DB_DIR, "index.faiss")
pkl_file = os.path.join(DB_DIR, "index.pkl")

if not os.path.exists(faiss_file):
    print("❌ مصيبة! أنا مش لاقي ملف index.faiss في المسار ده!")
    exit()
if not os.path.exists(pkl_file):
    print("❌ مصيبة! أنا مش لاقي ملف index.pkl في المسار ده!")
    exit()

print("✅ عظيم! أنا لقيت الملفين.. جاري تحميل الموديل وقاعدة البيانات...")

# 3. التحميل والتجربة
try:
    embeddings = HuggingFaceEmbeddings(model_name="Qwen/Qwen3-Embedding-0.6B")
    vectorstore = FAISS.load_local(DB_DIR, embeddings, allow_dangerous_deserialization=True)
    print("\n✅ تم فتح قاعدة البيانات بنجاح!")
    
    docs = vectorstore.similarity_search("عظام", k=1)
    if len(docs) > 0:
        print("\n🎉 نجاح! الداتا بتتقرأ اهي:")
        print("-" * 50)
        print(docs[0].page_content)
        print("-" * 50)
    else:
        print("❌ الداتا فاضية!")
except Exception as e:
    print(f"\n❌ حصل خطأ أثناء التحميل: {e}")