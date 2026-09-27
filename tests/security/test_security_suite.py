"""
Security test suite for Nuvira - Rate Limiting Tests
These tests use mocked dependencies to avoid loading heavy AI models.
"""

import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

# We need to mock the heavy modules BEFORE they are imported
# Create a mock module for the heavy dependencies
import sys
from types import ModuleType

# Mock the retriever module
mock_retriever = ModuleType('backend.retriever')
mock_retriever.metadata_aware_retrieve = MagicMock(return_value=[])
mock_retriever.rerank_evidence = MagicMock(return_value=[])
mock_retriever.vectorstore = MagicMock()
sys.modules['backend.retriever'] = mock_retriever

# Mock the generator module
mock_generator = ModuleType('backend.generator')
mock_generator.generate_clinical_answer = MagicMock(return_value="Test answer")
sys.modules['backend.generator'] = mock_generator

# Mock the config module
mock_config = ModuleType('backend.config')
mock_config.AI_MAX_CONCURRENT_REQUESTS = 10
mock_config.AI_MAX_QUERY_CHARS = 1000
mock_config.AI_PROVIDER_TIMEOUT_SECONDS = 30
mock_config.AI_QUEUE_TIMEOUT_SECONDS = 10
mock_config.AI_DAILY_REQUEST_QUOTA = 100
mock_config.SUPABASE_URL = 'https://test.supabase.co'
mock_config.SUPABASE_ANON_KEY = 'test-anon-key'
mock_config.EMBEDDING_MODEL_NAME = 'test-model'
mock_config.RERANKER_MODEL_NAME = 'test-reranker'
mock_config.PROCESSED_DATA_DIR = '/tmp/test'
sys.modules['backend.config'] = mock_config

# Mock the auth_middleware module
mock_auth_middleware = ModuleType('backend.auth_middleware')
mock_auth_middleware.get_current_user = MagicMock()
mock_auth_middleware.get_verified_user = MagicMock()
mock_auth_middleware.UserIdentity = MagicMock
sys.modules['backend.auth_middleware'] = mock_auth_middleware

# Mock the auth module
mock_auth = ModuleType('backend.auth')
mock_auth._decode_token = MagicMock()
sys.modules['backend.auth'] = mock_auth

# Mock the authorization module
mock_authorization = ModuleType('backend.authorization')
mock_authorization.require_conversation_owner = AsyncMock()
sys.modules['backend.authorization'] = mock_authorization

# Mock the rate_limit module
mock_rate_limit = ModuleType('backend.rate_limit')
mock_rate_limit.enforce = AsyncMock()
mock_rate_limit.enforce_daily_quota = AsyncMock()
mock_rate_limit.RATE_LIMIT_CONFIG = {
    "auth": {"limit": 10, "period": 60},
    "ai_chat": {"limit": 20, "period": 60},
    "feedback": {"limit": 30, "period": 60},
    "general": {"limit": 100, "period": 60},
    "health": {"limit": 1000, "period": 60},
}
sys.modules['backend.rate_limit'] = mock_rate_limit

# Mock the api module for route_scope
mock_api = ModuleType('backend.api')
mock_api.route_scope = MagicMock(side_effect=lambda path, method: (
    "ai_chat" if "/api/chat" in path else
    "auth" if "/api/auth" in path else
    "feedback" if "/api/feedback" in path else
    "health" if "/health" in path else
    "general"
))
sys.modules['backend.api'] = mock_api

# Now import the app
from backend.api import app

client = TestClient(app)


class TestRateLimiting:
    """Test rate limiting behavior for different endpoint scopes."""
    
    def test_health_endpoint_not_rate_limited(self):
        """Health endpoints should not be rate limited."""
        for i in range(100):
            response = client.get("/health/live")
            assert response.status_code == 200
    
    def test_auth_endpoint_rate_limit(self):
        """Auth endpoints should have strict rate limiting (10/min)."""
        # Make 10 requests - should succeed
        for i in range(10):
            response = client.post("/api/auth/session", json={
                "access_token": "dummy_token_" + "a" * 20,
                "refresh_token": "dummy_refresh_" + "a" * 20
            })
            # Should not be 429 for first 10
            assert response.status_code != 429, f"Request {i+1} should not be rate limited"
        
        # 11th request should be rate limited
        response = client.post("/api/auth/session", json={
            "access_token": "dummy_token_" + "a" * 20,
            "refresh_token": "dummy_refresh_" + "a" * 20
        })
        assert response.status_code == 429, "11th request should be rate limited"
        assert "Retry-After" in response.headers
    
    def test_ai_chat_rate_limit(self):
        """AI chat endpoints should have moderate rate limiting (20/min)."""
        # Need to mock authentication for this test
        with patch('backend.auth_middleware.get_verified_user') as mock_auth:
            mock_auth.return_value = MagicMock(user_id="test_user", email="test@test.com")
            
            # Make 20 requests - should succeed
            for i in range(20):
                response = client.post("/api/chat", json={"message": f"test message {i}"})
                assert response.status_code != 429, f"Request {i+1} should not be rate limited"
            
            # 21st request should be rate limited
            response = client.post("/api/chat", json={"message": "test message 21"})
            assert response.status_code == 429, "21st request should be rate limited"
            assert "Retry-After" in response.headers
    
    def test_feedback_rate_limit(self):
        """Feedback endpoints should have moderate rate limiting (30/min)."""
        with patch('backend.auth_middleware.get_verified_user') as mock_auth:
            mock_auth.return_value = MagicMock(user_id="test_user", email="test@test.com")
            
            # Make 30 requests - should succeed
            for i in range(30):
                response = client.post("/api/feedback", json={
                    "message_id": "550e8400-e29b-41d4-a716-446655440000",
                    "feedback": "up"
                })
                assert response.status_code != 429, f"Request {i+1} should not be rate limited"
            
            # 31st request should be rate limited
            response = client.post("/api/feedback", json={
                "message_id": "550e8400-e29b-41d4-a716-446655440000",
                "feedback": "up"
            })
            assert response.status_code == 429, "31st request should be rate limited"
            assert "Retry-After" in response.headers


class TestAuthenticationBoundary:
    """Test authentication boundary conditions."""
    
    def test_no_authorization_header(self):
        """Requests without auth should be rejected."""
        response = client.get("/api/auth/session")
        assert response.status_code == 401
    
    def test_malformed_bearer_token(self):
        """Malformed bearer tokens should be rejected."""
        response = client.get("/api/auth/session", headers={"Authorization": "Bearer not.a.jwt"})
        assert response.status_code == 401
    
    def test_alg_none_attack(self):
        """alg:none JWT attacks should be rejected."""
        # Header: {"alg":"none"}, Payload: {"sub":"123"}
        token = "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0."
        response = client.get("/api/auth/session", headers={"Authorization": f"Bearer {token}"})
        assert response.status_code == 401
    
    def test_empty_bearer_token(self):
        """Empty bearer tokens should be rejected."""
        response = client.get("/api/auth/session", headers={"Authorization": "Bearer"})
        assert response.status_code == 401


class TestInputValidation:
    """Test server-side input validation."""
    
    def test_empty_message_rejected(self):
        """Empty messages should be rejected with 422."""
        with patch('backend.auth_middleware.get_verified_user') as mock_auth:
            mock_auth.return_value = MagicMock(user_id="test_user", email="test@test.com")
            response = client.post("/api/chat", json={"message": ""})
            assert response.status_code == 422
    
    def test_oversized_message_rejected(self):
        """Oversized messages should be rejected with 422."""
        with patch('backend.auth_middleware.get_verified_user') as mock_auth:
            mock_auth.return_value = MagicMock(user_id="test_user", email="test@test.com")
            response = client.post("/api/chat", json={"message": "a" * 10000})
            assert response.status_code == 422
    
    def test_invalid_type_rejected(self):
        """Wrong data types should be rejected with 422."""
        with patch('backend.auth_middleware.get_verified_user') as mock_auth:
            mock_auth.return_value = MagicMock(user_id="test_user", email="test@test.com")
            response = client.post("/api/chat", json={"message": 123})
            assert response.status_code == 422
    
    def test_unexpected_fields_rejected(self):
        """Unexpected fields should be rejected with 422 (extra=forbid)."""
        with patch('backend.auth_middleware.get_verified_user') as mock_auth:
            mock_auth.return_value = MagicMock(user_id="test_user", email="test@test.com")
            response = client.post("/api/chat", json={"message": "hi", "extra": "vuln"})
            assert response.status_code == 422
    
    def test_null_field_rejected(self):
        """Null values should be rejected with 422."""
        with patch('backend.auth_middleware.get_verified_user') as mock_auth:
            mock_auth.return_value = MagicMock(user_id="test_user", email="test@test.com")
            response = client.post("/api/chat", json={"message": None})
            assert response.status_code == 422
    
    def test_invalid_uuid_rejected(self):
        """Invalid UUIDs should be rejected with 422."""
        with patch('backend.auth_middleware.get_verified_user') as mock_auth:
            mock_auth.return_value = MagicMock(user_id="test_user", email="test@test.com")
            response = client.post("/api/feedback", json={
                "message_id": "not-a-uuid",
                "feedback": "up"
            })
            assert response.status_code == 422
    
    def test_invalid_enum_rejected(self):
        """Invalid enum values should be rejected with 422."""
        with patch('backend.auth_middleware.get_verified_user') as mock_auth:
            mock_auth.return_value = MagicMock(user_id="test_user", email="test@test.com")
            response = client.post("/api/feedback", json={
                "message_id": "550e8400-e29b-41d4-a716-446655440000",
                "feedback": "sideways"
            })
            assert response.status_code == 422


class TestAuthorization:
    """Test authorization/IDOR protection."""
    
    def test_conversation_id_triggers_ownership_check(self):
        """Providing conversation_id should trigger ownership verification."""
        with patch('backend.auth_middleware.get_verified_user') as mock_auth:
            mock_auth.return_value = MagicMock(user_id="test_user", email="test@test.com")
            
            # Without conversation_id - should proceed to AI (mocked)
            response = client.post("/api/chat", json={"message": "hello"})
            # Should not be 501 (that's only when conversation_id is provided)
            assert response.status_code != 501
            
            # With conversation_id - should trigger 501 (fail-closed)
            response = client.post("/api/chat", json={
                "message": "hello",
                "conversation_id": "550e8400-e29b-41d4-a716-446655440000"
            })
            assert response.status_code == 501
            assert "not yet implemented" in response.json()["detail"]


class TestSecurityHeaders:
    """Test security headers are present."""
    
    def test_security_headers_present(self):
        """Responses should have security headers."""
        response = client.get("/health/live")
        assert response.headers.get("X-Content-Type-Options") == "nosniff"
        assert response.headers.get("X-Frame-Options") == "DENY"
        assert response.headers.get("Referrer-Policy") == "strict-origin-when-cross-origin"


class TestCORS:
    """Test CORS configuration."""
    
    def test_allowed_origin(self):
        """Trusted frontend origin should be allowed."""
        response = client.options("/api/chat", headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST"
        })
        assert response.status_code == 200
        assert "http://localhost:5173" in response.headers.get("Access-Control-Allow-Origin", "")
    
    def test_malicious_origin_rejected(self):
        """Malicious origins should be rejected."""
        response = client.options("/api/chat", headers={
            "Origin": "http://evil.example",
            "Access-Control-Request-Method": "POST"
        })
        # Should not have the malicious origin in allow-origin
        assert "evil.example" not in response.headers.get("Access-Control-Allow-Origin", "")


class TestSessionCookies:
    """Test session cookie security."""
    
    def test_cookies_httponly_secure(self):
        """Session cookies should be HttpOnly and Secure."""
        # This tests the cookie setting logic
        from backend.api import set_session_cookies
        from fastapi.responses import Response
        
        response = Response()
        set_session_cookies(response, "test_access", "test_refresh")
        
        cookies = response.headers.get("set-cookie", "")
        assert "HttpOnly" in cookies
        assert "Secure" in cookies
        assert "SameSite=lax" in cookies


if __name__ == "__main__":
    pytest.main([__file__, "-v"])