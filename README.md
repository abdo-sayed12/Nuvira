<div align="center">
  <h1>🏥 Nuvira - Elite Clinical AI System</h1>
  <p><strong>A Next-Generation, Privacy-First Medical AI Platform</strong></p>
</div>

---

**Nuvira** (formerly Nuvira) is an elite, fully-integrated, and highly secure AI medical ecosystem. Acting as a "World-Class Medical Consultant," Nuvira is built on robust healthcare protocols (like WHO guidelines). It analyzes medical imaging, provides pinpoint accurate home-care guidance, and diagnoses complex cases—all while maintaining the warm, deeply empathetic, and natural tone of a senior human physician.

## 🏗️ Architecture & Tech Stack

- **Authentication & Security:** Supabase (JWT validation, RLS, IDOR-protected endpoints).
- **Vector Database (RAG):** FAISS (CPU) - Ultra-fast vector retrieval.
- **Embeddings Model:** Qwen/Qwen3-Embedding-0.6B - For deep semantic document understanding.
- **Reranker Model:** BAAI/bge-reranker-base - Guaranteeing the highest precision in medical context retrieval.
- **LLM & Vision Engine:** Powered by **Groq API** (`openai/gpt-oss-120b` or Qwen 3.6 Vision equivalents) for lightning-fast multimodal reasoning and natural language generation.
- **Backend Framework:** FastAPI (Python) - Asynchronous, rate-limited, and highly scalable.
- **Frontend Framework:** React.js (Vite, TypeScript, Tailwind CSS) - Glassmorphism UI with smooth animations.

## 📂 Project Structure

- `data/`: Contains raw PDFs and processed vector indices (FAISS & chunk data).
- `backend/`: FastAPI server, Supabase Auth middleware, RAG retrieval logic, and the intelligent LLM generator pipeline.
- `frontend/`: The interactive, multi-lingual React application.
- `tests/`: Comprehensive security test suites (IDOR, Auth Boundary).

## ✨ Key Features

### 🧠 1. The "Genius" AI Engine (Clinical Persona)
- **Chameleon Linguistic Mirroring:** The AI dynamically detects the user's dialect (e.g., Egyptian Colloquial vs. Modern Standard Arabic) and mirrors it flawlessly, removing all robotic stiffness and speaking like a highly empathetic, senior consultant doctor.
- **Global Medical Sourcing:** Instead of quoting raw filenames, Nuvira elegantly attributes clinical evidence to world-renowned institutions (WHO, AHA, ADA) in a structured, professional `### 📚 المراجع الطبية الداعمة` section.
- **Multimodal Medical Vision:** Seamlessly upload X-rays, lab results, or skin condition images for instant, deep programmatic analysis.

### 💻 2. Immersive Frontend UI/UX
- **Instant Progressive TTS:** Click the speaker icon to hear the doctor's response spoken aloud. Nuvira uses streaming chunking to start audio playback instantly.
- **11 Global Languages:** Instant dynamic translation of the entire UI with automatic RTL/LTR direction switching and user preference persistence.
- **Geo-IP Emergency System:** Detects the patient's country and automatically displays the correct local emergency hotline (e.g., 997 for Saudi Arabia, 123 for Egypt).
- **Inline Message Editing:** Users can edit their previous messages inline (like ChatGPT), instantly truncating the conversation history and generating a new accurate response.

### 🛡️ 3. Enterprise-Grade Security
- **Supabase Authentication:** Complete JWT validation middleware strictly verifying every API request.
- **IDOR & Boundary Protection:** Users can only access their own sessions and data. Robust defensive programming ensures complete isolation.
- **Strict Gitignore:** Total protection of `.env`, `backend/config.py`, `.hf_cache`, and `node_modules` to prevent secret leaks and repository bloat.

### 💼 4. Business Model & Monetization
Nuvira is not just a chatbot; it's a **Ready-to-Launch Startup**:
- **Medical Marketplace:** A dedicated services screen allowing patients to browse top labs, scan centers, and clinics, and book them directly.
- **Concierge MVP Model:** Minimal operational cost startup model where booking requests are routed via WhatsApp for human confirmation and payment.
- **Dynamic Markup Commission:** An intelligent algorithm automatically reads the base medical service price, adds the platform's commission (`APP_COMMISSION`), and displays the final transparent price to the patient.
- **Investor Pitch Simulation:** A specialized interactive window built for investors and judges. Clicking "Book" triggers a breakdown of the "Capital Cycle" and profit distribution (Platform % vs. Provider %), proving the immediate readiness of the commercial model.

## 🚀 Getting Started

### 1. Environment Variables
Create a `.env` file in the root directory (never committed) with your keys:
```env
GROQ_API_KEY=gsk_...
SUPABASE_URL=https://...
SUPABASE_ANON_KEY=...
SUPABASE_JWT_SECRET=...
```

### 2. Backend Setup
```bash
# Install Python dependencies
pip install -r requirements.txt

# Run the FastAPI server
uvicorn backend.api:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Frontend Setup
```bash
cd frontend

# Install Node modules (first time only)
npm install

# Run the Vite development server
npm run dev
```

---
### 👨‍💻 Developed By

**Abdelrahman Sayed Mohamed**  
*Full-Stack AI Engineer & Software Architect*

*Engineered with precision to unite the brilliance of human physicians with the power of artificial intelligence.*

Nuvira is a solo-developed ecosystem, architected from the ground up to revolutionize digital healthcare through cutting-edge Generative AI, robust security, and deeply empathetic user experiences.