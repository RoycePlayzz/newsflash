from __future__ import annotations

from contextlib import asynccontextmanager
from typing import Any

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import desc

from .config import load_config, save_config
from .database import Article, SessionLocal, init_db

CATEGORIES = [
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
]

@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initialize the local database when the API application starts."""
    init_db()
    yield


app = FastAPI(
    title="NewsFlash API",
    version="1.0.0",
    description="Local REST API for the NewsFlash real-time news intelligence application.",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["*"],
)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/articles")
def get_articles(
    category: str | None = None,
    limit: int = Query(default=50, ge=1, le=200),
) -> list[dict[str, Any]]:
    db = SessionLocal()
    try:
        query = db.query(Article).order_by(
            desc(Article.score),
            desc(Article.fetched_at),
        )

        if category and category != "all":
            if category not in CATEGORIES:
                raise HTTPException(status_code=400, detail="Unknown category")
            query = query.filter(Article.category == category)

        articles = query.limit(limit).all()

        return [
            {
                "id": article.id,
                "title": article.title,
                "summary": article.summary,
                "url": article.url,
                "source": article.source,
                "category": article.category,
                "score": article.score,
                "published": str(article.published),
                "fetched_at": str(article.fetched_at),
            }
            for article in articles
        ]
    finally:
        db.close()


@app.get("/stats")
def get_stats() -> dict[str, Any]:
    db = SessionLocal()
    try:
        total = db.query(Article).count()
        categories = {
            category: db.query(Article)
            .filter(Article.category == category)
            .count()
            for category in CATEGORIES
        }
        return {"total": total, "categories": categories}
    finally:
        db.close()


@app.get("/config")
def get_config() -> dict[str, Any]:
    return load_config()


@app.post("/config")
def update_config(new_config: dict[str, Any]) -> dict[str, str]:
    save_config(new_config)
    return {"status": "saved"}
