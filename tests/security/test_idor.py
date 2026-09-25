import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from unittest.mock import MagicMock, AsyncMock
from types import ModuleType
import pytest
from fastapi.testclient import TestClient

# Mock heavy modules
mock_retriever = ModuleType('backend.retriever')
mock_retriever.metadata_aware_retrieve = MagicMock(return_value=[])
mock_retriever.rerank_evidence = MagicMock(return_value=[])
mock_retriever.vectorstore = MagicMock()
sys.modules['backend.retriever'] = mock_retriever

mock_generator = ModuleType('backend.generator')
mock_generator.generate_clinical_answer = MagicMock(return_value="Test answer")
sys.modules['backend.generator'] = mock_generator

mock_config = ModuleType('backend.config')
mock_config.AI_MAX_CONCURRENT_REQUESTS = 10
mock_config.AI_MAX_QUERY_CHARS = 1000
mock_config.AI_PROVIDER_TIMEOUT_SECONDS = 30
mock_config.AI_QUEUE_TIMEOUT_SECONDS = 10
mock_config.AI_DAILY_REQUEST_QUOTA = 100
mock_config.SUPABASE_URL = 'https://test.supabase.co'
mock_config.SUPABASE_ANON_KEY = 'test-anon-key'
sys.modules['backend.config'] = mock_config

mock_auth_middleware = ModuleType('backend.auth_middleware')
mock_auth_middleware.get_current_user = MagicMock()
mock_auth_middleware.get_verified_user = MagicMock()
mock_auth_middleware.UserIdentity = MagicMock
sys.modules['backend.auth_middleware'] = mock_auth_middleware

mock_auth = ModuleType('backend.auth')
mock_auth._decode_token = MagicMock()
sys.modules['backend.auth'] = mock_auth

mock_authorization = ModuleType('backend.authorization')
mock_authorization.require_conversation_owner = AsyncMock(return_value=MagicMock(user_id="test_user"))
sys.modules['backend.authorization'] = mock_authorization

mock_rate_limit = ModuleType('backend.rate_limit')
mock_rate_limit.enforce = AsyncMock()
mock_rate_limit.enforce_daily_quota = AsyncMock()
mock_rate_limit.route_scope = MagicMock(side_effect=lambda path, method: (
    "ai_chat" if "/api/chat" in path else
    "auth" if "/api/auth" in path else
    "feedback" if "/api/feedback" in path else
    "health" if "/health" in path else
    "general"
))
mock_rate_limit.client_ip = MagicMock(return_value="127.0.0.1")
mock_rate_limit.account_dimension = MagicMock(return_value="anonymous")
sys.modules['backend.rate_limit'] = mock_rate_limit

from backend.api import app

client = TestClient(app)


@pytest.mark.asyncio
async def test_idor_conversation_id_triggers_501():
    """Providing conversation_id should trigger ownership verification (501 fail-closed)."""
    # Mock the auth dependency to return a user
    from backend.auth_middleware import get_verified_user, UserIdentity
    import backend.api
    # Override the dependency in the app
    app.dependency_overrides[get_verified_user] = lambda: UserIdentity(user_id="test_user", email="test@test.com")
    
    # Without conversation_id - should proceed (we mock the AI so it returns 200)
    response = client.post("/api/chat", json={"message": "hello"})
    # Should not be 501 (that's only when conversation_id is provided)
    assert response.status_code != 501, f"Expected non-501 when no conversation_id, got {response.status_code}"
    
    # With conversation_id - should trigger 501 (fail-closed)
    response = client.post("/api/chat", json={
        "message": "hello",
        "conversation_id": "550e8400-e29b-41d4-a716-446655440000"
    })
    assert response.status_code == 501, f"Expected 501 when conversation_id provided, got {response.status_code}"
    assert "not yet implemented" in response.json()["detail"]
    
    # Clean up
    app.dependency_overrides.clear()