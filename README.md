<<<<<<< HEAD
# Care360 Clinical RAG

Care360 is a local, privacy-first Clinical Retrieval-Augmented Generation (RAG) system based on the WHO "Package of interventions for rehabilitation" document.

## Architecture & Tech Stack

*   **Vector Database:** FAISS (CPU)
*   **Embeddings:** `Qwen/Qwen3-Embedding-0.6B`
*   **Reranker:** `BAAI/bge-reranker-base`
*   **Local LLM:** `Qwen/Qwen2.5-3B-Instruct`
*   **Backend Framework:** FastAPI

## Project Structure

* `data/`: Contains raw PDFs and processed FAISS indices / chunks.
* `backend/`: FastAPI application, retrieval logic, and generator.
* `frontend/`: Vanilla HTML, CSS, and JS.

## Getting Started

1. **Install Requirements**
   ```bash
   pip install -r requirements.txt
   ```

2. **Prepare Data**
   Ensure that `chunks.pkl` and `my_rag.index` exist in the `data/processed/` directory.

3. **Run the Backend API**
   ```bash
   uvicorn backend.api:app --host 0.0.0.0 --port 8000 --reload
   ```

4. **Run the Frontend**
   Open `frontend/index.html` in your browser. Or serve using Python:
   ```bash
   python -m http.server 8080 --directory frontend/
   ```
=======
# clinic-care360
>>>>>>> eb11e30e3504f5c0cc8160e4b7c3cb71f1b1004d
