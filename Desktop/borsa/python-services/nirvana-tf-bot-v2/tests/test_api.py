"""
Nirvana TF Bot v2 - API Tests
Test FastAPI endpoints
"""

import pytest
from fastapi.testclient import TestClient
from src.serving.app import app

client = TestClient(app)


def test_health_check():
    """Test /healthz endpoint"""
    response = client.get("/healthz")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "version" in data


def test_root():
    """Test root endpoint"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Nirvana TF Bot v2 API"
    assert "endpoints" in data


def test_signal_endpoint():
    """Test /signal endpoint"""
    response = client.get("/signal?symbol=BTCUSDT&timeframe=15m")
    assert response.status_code == 200
    data = response.json()

    # Check response structure
    assert "symbol" in data
    assert "timeframe" in data
    assert "prob_buy" in data
    assert "decision" in data
    assert "explain" in data

    # Check values
    assert data["symbol"] == "BTCUSDT"
    assert data["timeframe"] == "15m"
    assert 0 <= data["prob_buy"] <= 1
    assert data["decision"] in ["BUY", "PASS"]


def test_signal_missing_symbol():
    """Test /signal without symbol parameter"""
    response = client.get("/signal")
    assert response.status_code == 422  # Validation error


def test_metrics_endpoint():
    """Test /metrics endpoint"""
    response = client.get("/metrics")
    assert response.status_code == 200
    data = response.json()

    assert "requests" in data
    assert "cache_hits" in data
    assert "uptime_seconds" in data
    assert data["requests"] >= 0