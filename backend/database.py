from __future__ import annotations

import os
from datetime import datetime
from pathlib import Path

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, Text, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from sqlalchemy.pool import StaticPool


BASE_DIR = Path(__file__).resolve().parents[1]
DEFAULT_DB_URL = f"sqlite:///{BASE_DIR / 'newsflash.db'}"
DATABASE_URL = os.getenv("NEWSFLASH_DATABASE_URL", DEFAULT_DB_URL)

engine_kwargs = {"connect_args": {"check_same_thread": False}}
if DATABASE_URL == "sqlite:///:memory:":
    engine_kwargs["poolclass"] = StaticPool

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Article(Base):
    __tablename__ = "articles"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String, nullable=False)
    summary = Column(Text, nullable=True)
    url = Column(String, unique=True, nullable=False)
    source = Column(String, nullable=True)
    category = Column(String, nullable=True)
    score = Column(Float, default=0.0, nullable=False)
    published = Column(DateTime, nullable=True)
    fetched_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    notified = Column(Boolean, default=False, nullable=False)


def init_db() -> None:
    """Create application tables when they do not already exist."""
    Base.metadata.create_all(bind=engine)


def get_db():
    """Yield a database session for callers that need explicit dependency injection."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
