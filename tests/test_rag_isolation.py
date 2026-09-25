
import sys
import os

# Fix HF cache path BEFORE importing anything else
os.environ["HF_HOME"] = "E:/huggingface_cache"

# Add the project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from backend.retriever import metadata_aware_retrieve, vectorstore
# ...existing code...
from langchain_community.vectorstores import FAISS
from langchain_community.embeddings import HuggingFaceEmbeddings
from backend.config import EMBEDDING_MODEL_NAME, PROCESSED_DATA_DIR

def test_rag_isolation():
    print("🚀 Starting RAG Isolation Runtime Tests...")
    
    if vectorstore is None:
        print("❌ ERROR: Vectorstore not loaded. Cannot perform tests.")
        return

    # Use the existing embedding model
    embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL_NAME)
    
    # 1. Setup: Create a temporary isolated index for testing
    # We do this because we shouldn't modify the production index.
    test_docs = [
        {"text": "This is a secret document for User A", "metadata": {"owner_id": "user_a", "visibility": "private"}},
        {"text": "This is a secret document for User B", "metadata": {"owner_id": "user_b", "visibility": "private"}},
        {"text": "This is a shared document for A and B", "metadata": {"allowed_user_ids": ["user_a", "user_b"], "visibility": "private"}},
        {"text": "This is a public clinical document", "metadata": {"visibility": "public"}},
        {"text": "This is a private document with no owner (fail-closed test)", "metadata": {"visibility": "private"}},
    ]
    
    # Create a temporary FAISS index from test docs
    from langchain_core.documents import Document
    docs = [Document(page_content=d["text"], metadata=d["metadata"]) for d in test_docs]
    test_vectorstore = FAISS.from_documents(docs, embeddings)

    # Monkey-patch the global vectorstore for the duration of the test
    import backend.retriever as retriever
    original_vectorstore = retriever.vectorstore
    retriever.vectorstore = test_vectorstore

    try:
        # Test Case 1: User A retrieves User A's doc -> ALLOWED
        res = metadata_aware_retrieve("secret document for User A", authorized_user_id="user_a")
        assert any("User A" in d["text"] for d in res), "User A should see their own doc"
        print("✅ Test 1: User A -> User A Doc [PASS]")

        # Test Case 2: User B retrieves User A's doc -> DENIED
        res = metadata_aware_retrieve("secret document for User A", authorized_user_id="user_b")
        assert not any("User A" in d["text"] for d in res), "User B MUST NOT see User A's doc"
        print("✅ Test 2: User B -> User A Doc [PASS]")

        # Test Case 3: User A retrieves shared doc -> ALLOWED
        res = metadata_aware_retrieve("shared document", authorized_user_id="user_a")
        assert any("shared document" in d["text"] for d in res), "User A should see shared doc"
        print("✅ Test 3: User A -> Shared Doc [PASS]")

        # Test Case 4: User C (unauthorized) retrieves shared doc -> DENIED
        res = metadata_aware_retrieve("shared document", authorized_user_id="user_c")
        assert not any("shared document" in d["text"] for d in res), "User C MUST NOT see shared doc"
        print("✅ Test 4: User C -> Shared Doc [PASS]")

        # Test Case 5: Public document retrieval -> ALLOWED for anyone
        res = metadata_aware_retrieve("public clinical document", authorized_user_id="user_any")
        assert any("public clinical document" in d["text"] for d in res), "Public doc should be visible"
        print("✅ Test 5: Public Doc [PASS]")

        # Test Case 6: Private doc with no owner/allowed list -> DENIED (Fail-Closed)
        res = metadata_aware_retrieve("private document with no owner", authorized_user_id="user_a")
        assert not any("private document with no owner" in d["text"] for d in res), "Ownerless private doc must be denied"
        print("✅ Test 6: Ownerless Private Doc [PASS]")

        # Test Case 7: Mismatched owner_id -> DENIED
        res = metadata_aware_retrieve("secret document for User B", authorized_user_id="user_a")
        assert not any("User B" in d["text"] for d in res), "User A MUST NOT see User B's doc"
        print("✅ Test 7: Mismatched Owner [PASS]")

    finally:
        # Restore original vectorstore
        retriever.vectorstore = original_vectorstore

    print("\n🎉 ALL RAG ISOLATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_rag_isolation()
