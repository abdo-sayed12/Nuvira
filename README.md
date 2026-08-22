# 🏥 CARE360 - Elite Clinical RAG System

**Care360** هو نظام ذكاء اصطناعي طبي متكامل وآمن (Privacy-first Clinical RAG System). يعمل بمثابة "استشاري طبي عالمي" يعتمد على بروتوكولات الرعاية الصحية (مثل مستندات منظمة الصحة العالمية WHO وغيرها). تم تصميم النظام للرد على الاستفسارات الطبية، تحليل الأشعة، وتقديم إرشادات رعاية منزلية دقيقة، مع الحفاظ على نبرة طبيب بشري متعاطف واحترافي.

---

## 🏗️ البنية التحتية والتقنيات (Architecture & Tech Stack)

* **Vector Database:** FAISS (CPU) - لتخزين واسترجاع البيانات بسرعة فائقة.
* **Embeddings Model:** `Qwen/Qwen3-Embedding-0.6B` - لتحويل النصوص لفهم دلالي عميق.
* **Reranker Model:** `BAAI/bge-reranker-base` - لإعادة ترتيب النتائج الطبية وضمان أعلى دقة.
* **LLM & Vision Engine:** 
  - السحابة (Groq API): استخدام نموذج `qwen/qwen3.6-27b` فائق السرعة لدعم الرؤية (تحليل الأشعة) والنصوص.
  - محلياً (Local Fallback): `Qwen/Qwen2.5-3B-Instruct`.
* **Backend Framework:** FastAPI / Python.
* **Frontend Framework:** React.js (Vite, TypeScript, Tailwind CSS).

---

## 📂 هيكل المشروع (Project Structure)

* `data/`: يحتوي على ملفات الـ PDFs الخام والمؤشرات المعالجة (FAISS indices & chunks).
* `backend/`: يحتوي على خادم FastAPI، منطق الاسترجاع (Retrieval Logic)، ومولد الإجابات (Generator).
* `frontend/`: يحتوي على واجهة المستخدم التفاعلية المبنية بـ React.

---

## ✨ المميزات الرئيسية للنظام (Key Features)

### 🧠 1. محرك الذكاء الاصطناعي (AI Engine)
* **المستشار الطبي النخبة (Elite Persona):** تمت هندسة الأوامر (Prompt Engineering) ليتقمص الذكاء الاصطناعي شخصية طبيب استشاري كبير (بلمسة تعاطف مثل: "ألف سلامة عليك")، مما يمنع النظام من التحدث كـ "روبوت".
* **نظام المصادر الذكي (Smart Global Sourcing):** يعتمد النظام على ذكاء الاستنتاج لربط الإجابة الطبية بكبرى المؤسسات الصحية العالمية (مثل: WHO, AHA, ADA) بدلاً من عرض أسماء ملفات خام، مما يعطي موثوقية عالمية.
* **تحليل الصور والأشعة الطبية (Multimodal Vision):** يدعم النظام رفع الصور (أشعة، طفح جلدي) وتحليلها برمجياً.
* **المعالجة الفورية للمستندات (On-the-fly Parsing):** قدرة فائقة على استلام ملفات الـ `PDF/TXT` وقراءتها ودمجها لحظياً في السياق الطبي.

### 💻 2. واجهة المستخدم التفاعلية (Frontend UI)
* **نظام الطوارئ الديناميكي (Geo-IP Emergency System):** ميزة أمان فائقة تقوم باكتشاف الموقع الجغرافي للمستخدم وتغيير رقم بطاقة الطوارئ والإسعاف تلقائياً ليتناسب مع دولته (مثل: 123 في مصر، 997 في السعودية).
* **إدارة الجلسات الذكية (Session Management):** حفظ سجل المحادثات تلقائياً مع عنونة كل جلسة (Title) بناءً على أول سؤال يطرحه المريض.
* **نظام القراءة الآلية (TTS):** زر ذكي ينطق بإجابة الطبيب بصوت واضح لسهولة الاستماع.
* **تجربة بصرية مريحة (UI/UX):** رسوم متحركة سلسة (Zipper & Cube-in)، دعم الوضعين الفاتح والمظلم، ومؤشر "CARE360 is thinking" أثناء المعالجة.

### 🛡️ 3. الأمان المعماري (Security)
* **عزل المفاتيح (Strict Gitignore):** منع رفع أي ملفات حساسة تحتوي على مفاتيح (API Keys) مثل `config.py` إلى GitHub.
* **فصل مسارات الكاش (Custom Cache Paths):** توجيه نماذج الـ HuggingFace للقراءة من مسارات مخصصة لتجنب أخطاء امتلاء قرص النظام (C: Drive).

---

## 🚀 كيفية التشغيل (Getting Started)

### 1. إعداد الخادم (Backend Setup)
```bash
# تثبيت الحزم المطلوبة
pip install -r requirements.txt

# افتح نافذة تيرمنال جديدة وانتقل لمجلد الواجهة
cd frontend

# تثبيت الحزم (أول مرة فقط)
npm install

# تشغيل خادم التطوير
npm run dev

# تأكد من وجود ملفات قاعدة البيانات (chunks.pkl و my_rag.index) في مسار data/processed/

# تشغيل خادم FastAPI
uvicorn backend.api:app --host 0.0.0.0 --port 8000 --reload

تم تطوير هذا النظام بهندسة برمجية دقيقة ليجمع بين كفاءة الأطباء وذكاء الآلة.

Developed by[CODEX Team] {Abdelrahman_Elsayed / sharl_Nabil / Abdelrahman_Hesham / Omar_Ehab / Saif_ELdeen }