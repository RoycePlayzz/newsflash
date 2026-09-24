from __future__ import annotations

import spacy

from .config import load_config

_NLP = None

CATEGORY_KEYWORDS = {
    "current_affairs": ["india", "government", "election", "minister", "policy", "economy", "rupee", "parliament"],
    "ai_ml": ["ai", "artificial intelligence", "machine learning", "llm", "gpt", "neural", "deep learning", "openai", "gemini", "claude", "model"],
    "tech": ["technology", "software", "startup", "app", "silicon", "chip", "cyber", "cloud", "microsoft", "google", "apple"],
    "business": ["market", "stock", "profit", "revenue", "company", "investor", "startup", "funding", "ipo", "acquisition"],
    "science": ["research", "discovery", "space", "nasa", "isro", "climate", "biology", "physics", "study", "experiment"],
    "sports": ["cricket", "ipl", "football", "match", "tournament", "player", "team", "score", "championship"],
    "entertainment": ["movie", "film", "bollywood", "actor", "music", "series", "netflix", "amazon", "release"],
}


def _get_nlp():
    global _NLP
    if _NLP is None:
        try:
            _NLP = spacy.load("en_core_web_sm")
        except OSError as exc:
            raise RuntimeError(
                "spaCy model 'en_core_web_sm' is missing. "
                "Run: python -m spacy download en_core_web_sm"
            ) from exc
    return _NLP


def score_article(title: str, summary: str, category: str) -> float:
    config = load_config()
    custom_keywords = [str(kw).lower() for kw in config.get("custom_keywords", [])]
    text = f"{title} {summary}".lower()

    score = 0.0

    category_matches = sum(
        1 for keyword in CATEGORY_KEYWORDS.get(category, []) if keyword in text
    )
    score += min(category_matches * 1.0, 5.0)

    custom_matches = sum(1 for keyword in custom_keywords if keyword in text)
    score += min(custom_matches * 1.5, 3.0)

    doc = _get_nlp()(title)
    entity_types = {ent.label_ for ent in doc.ents}
    score += min(
        len(entity_types & {"ORG", "GPE", "PERSON", "PRODUCT", "EVENT"}) * 0.5,
        2.0,
    )

    return round(min(score, 10.0), 2)


def score_and_update_articles() -> int:
    from .database import Article, SessionLocal

    db = SessionLocal()
    try:
        unscored = db.query(Article).filter(Article.score == 0.0).all()
        for article in unscored:
            article.score = score_article(
                article.title,
                article.summary or "",
                article.category or "",
            )
        db.commit()
        print(f"🧠 Scored {len(unscored)} articles")
        return len(unscored)
    finally:
        db.close()


if __name__ == "__main__":
    score_and_update_articles()
