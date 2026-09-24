import os

os.environ["NEWSFLASH_DATABASE_URL"] = "sqlite:///:memory:"

from fastapi.testclient import TestClient

from backend.main import app


def test_health():
    with TestClient(app) as client:
        response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_empty_articles_and_stats():
    with TestClient(app) as client:
        articles = client.get("/articles")
        stats = client.get("/stats")

    assert articles.status_code == 200
    assert articles.json() == []

    assert stats.status_code == 200
    payload = stats.json()
    assert payload["total"] == 0
    assert set(payload["categories"]) == {
        "current_affairs",
        "ai_ml",
        "tech",
        "business",
        "science",
        "sports",
        "entertainment",
        "world",
        "politics",
        "war",
        "health",
        "crypto",
        "space",
        "environment",
    }


def test_invalid_category_is_rejected():
    with TestClient(app) as client:
        response = client.get("/articles?category=not-a-category")

    assert response.status_code == 400
