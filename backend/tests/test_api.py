import os

os.environ.setdefault("APP_ENV", "test")
os.environ.setdefault("API_KEY", "")

from fastapi.testclient import TestClient

from app import app


client = TestClient(app)


def test_health_is_public():
    response = client.get("/api/health")
    assert response.status_code == 200
    assert response.json()["status"] == "HEALTHY"


def test_invalid_transaction_is_rejected():
    response = client.post(
        "/api/transactions/evaluate",
        json={"amount": -1, "sender_vpa": "a@b", "receiver_vpa": "c@d"},
    )
    assert response.status_code == 422
