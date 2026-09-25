
import sys
import os
import httpx
import asyncio
import pytest

# Add project root to sys.path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..")))

from backend.config import SUPABASE_URL, SUPABASE_ANON_KEY


@pytest.mark.asyncio
async def test_no_auth():
    url = 'http://127.0.0.1:8000/api/auth/session'
    async with httpx.AsyncClient() as client:
        resp = await client.get(url)
        assert resp.status_code == 401, f"Expected 401 for no auth, got {resp.status_code}"


@pytest.mark.asyncio
async def test_empty_bearer():
    url = 'http://127.0.0.1:8000/api/auth/session'
    async with httpx.AsyncClient() as client:
        # Using 'Bearer' without a space or a placeholder to avoid httpx illegal header error
        # but still testing the backend's token extraction logic
        resp = await client.get(url, headers={'Authorization': 'Bearer a'})
        assert resp.status_code == 401, f"Expected 401 for invalid bearer, got {resp.status_code}"


@pytest.mark.asyncio
async def test_malformed_jwt():
    url = 'http://127.0.0.1:8000/api/auth/session'
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers={'Authorization': 'Bearer not.a.jwt'})
        assert resp.status_code == 401, f"Expected 401 for malformed JWT, got {resp.status_code}"


@pytest.mark.asyncio
async def test_alg_none():
    url = 'http://127.0.0.1:8000/api/auth/session'
    # Header: {"alg":"none"}, Payload: {"sub":"123"}
    token = "eyJhbGciOiJub25lIn0.eyJzdWIiOiIxMjM0NTY3ODkwIn0."
    async with httpx.AsyncClient() as client:
        resp = await client.get(url, headers={'Authorization': f'Bearer {token}'})
        assert resp.status_code == 401, f"Expected 401 for alg:none, got {resp.status_code}"

async def main():
    print("🚀 Starting Authentication Red Team Tests...")
    try:
        await test_no_auth()
        print("✅ test_no_auth: PASS")
        await test_empty_bearer()
        print("✅ test_empty_bearer: PASS")
        await test_malformed_jwt()
        print("✅ test_malformed_jwt: PASS")
        await test_alg_none()
        print("✅ test_alg_none: PASS")
        print("\n🎉 All Authentication Red Team tests passed!")
    except AssertionError as e:
        print(f"❌ Test failed: {e}")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")

if __name__ == '__main__':
    asyncio.run(main())
