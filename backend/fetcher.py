from __future__ import annotations

import os
import re
from datetime import datetime
from email.utils import parsedate

import feedparser
import requests
from dotenv import load_dotenv
from sqlalchemy.exc import IntegrityError

from .config import load_config
from .database import Article, SessionLocal, init_db

load_dotenv()
NEWSDATA_API_KEY = os.getenv("NEWSDATA_API_KEY", "")

RSS_FEEDS = {
    "current_affairs": [
        "https://feeds.feedburner.com/ndtvnews-top-stories",
        "https://timesofindia.indiatimes.com/rssfeedstopstories.cms",
        "https://www.thehindu.com/news/feeder/default.rss",
    ],
    "ai_ml": [
        "https://techcrunch.com/feed/",
        "https://news.google.com/rss/search?q=artificial+intelligence+machine+learning&hl=en-IN&gl=IN",
    ],
    "tech": [
        "https://www.wired.com/feed/rss",
        "https://news.google.com/rss/search?q=technology+software&hl=en-IN&gl=IN",
    ],
    "business": [
        "https://economictimes.indiatimes.com/rssfeedsdefault.cms",
        "https://news.google.com/rss/search?q=business+economy+market&hl=en-IN&gl=IN",
    ],
    "science": [
        "https://news.google.com/rss/search?q=science+research&hl=en-IN&gl=IN",
    ],
    "sports": [
        "https://news.google.com/rss/search?q=sports+cricket+football&hl=en-IN&gl=IN",
    ],
    "entertainment": [
        "https://news.google.com/rss/search?q=entertainment+bollywood+movies&hl=en-IN&gl=IN",
    ],
    "world": [
        "https://feeds.bbci.co.uk/news/world/rss.xml",
        "https://news.google.com/rss/search?q=world+news+international&hl=en-IN&gl=IN",
    ],
    "politics": [
        "https://news.google.com/rss/search?q=india+politics+parliament&hl=en-IN&gl=IN",
    ],
    "war": [
        "https://news.google.com/rss/search?q=war+conflict+military+geopolitics&hl=en-IN&gl=IN",
    ],
    "health": [
        "https://news.google.com/rss/search?q=health+medicine+disease&hl=en-IN&gl=IN",
    ],
    "crypto": [
        "https://news.google.com/rss/search?q=cryptocurrency+bitcoin+blockchain&hl=en-IN&gl=IN",
    ],
    "space": [
        "https://news.google.com/rss/search?q=space+nasa+isro+rocket&hl=en-IN&gl=IN",
    ],
    "environment": [
        "https://news.google.com/rss/search?q=climate+environment+nature&hl=en-IN&gl=IN",
    ],
}

NEWSDATA_URL = "https://newsdata.io/api/1/news"

CATEGORY_MAP = {
    "current_affairs": "top",
    "ai_ml": "technology",
    "tech": "technology",
    "business": "business",
    "science": "science",
    "sports": "sports",
    "entertainment": "entertainment",
    "world": "world",
    "politics": "politics",
    "war": "politics",
    "health": "health",
    "crypto": "technology",
    "space": "science",
    "environment": "environment",
}

REQUEST_HEADERS = {"User-Agent": "NewsFlash/1.0 (+local portfolio application)"}


def parse_date(date_str: str | None) -> datetime:
    if not date_str:
        return datetime.now()

    try:
        parsed = parsedate(date_str)
        if parsed:
            return datetime(*parsed[:6])
    except (TypeError, ValueError):
        pass

    return datetime.now()


def clean_html(value: str | None, limit: int = 500) -> str:
    text = re.sub(r"<[^>]+>", "", value or "")
    text = (
        text.replace("&nbsp;", " ")
        .replace("&amp;", "&")
        .replace("&lt;", "<")
        .replace("&gt;", ">")
    )
    return " ".join(text.split())[:limit]


def save_article(
    title: str,
    summary: str,
    url: str,
    source: str,
    category: str,
    score: float = 0.0,
    published: datetime | None = None,
) -> bool:
    db = SessionLocal()
    try:
        article = Article(
            title=title,
            summary=clean_html(summary),
            url=url,
            source=source,
            category=category,
            score=score,
            published=published or datetime.now(),
        )
        db.add(article)
        db.commit()
        return True
    except IntegrityError:
        db.rollback()
        return False
    except Exception as exc:
        db.rollback()
        print(f"  DB error: {exc}")
        return False
    finally:
        db.close()


def fetch_rss(category: str, urls: list[str]) -> int:
    count = 0

    for url in urls:
        try:
            response = requests.get(url, headers=REQUEST_HEADERS, timeout=10)
            response.raise_for_status()
            feed = feedparser.parse(response.content)

            for entry in feed.entries[:10]:
                title = entry.get("title", "").strip()
                link = entry.get("link", "").strip()
                if not title or not link:
                    continue

                raw_summary = entry.get("summary", entry.get("description", ""))
                published = parse_date(entry.get("published"))
                source = feed.feed.get("title", url)

                if save_article(
                    title,
                    raw_summary,
                    link,
                    source,
                    category,
                    published=published,
                ):
                    count += 1

        except requests.RequestException as exc:
            print(f"  RSS request error ({url}): {exc}")
        except Exception as exc:
            print(f"  RSS parse error ({url}): {exc}")

    return count


def fetch_newsdata(category: str) -> int:
    if not NEWSDATA_API_KEY:
        return 0

    try:
        response = requests.get(
            NEWSDATA_URL,
            params={
                "apikey": NEWSDATA_API_KEY,
                "category": CATEGORY_MAP.get(category, "top"),
                "language": "en",
                "country": "in",
            },
            headers=REQUEST_HEADERS,
            timeout=10,
        )
        response.raise_for_status()
        data = response.json()

        count = 0
        for item in data.get("results", []):
            title = (item.get("title") or "").strip()
            url = (item.get("link") or "").strip()
            if not title or not url:
                continue

            if save_article(
                title,
                item.get("description", "") or "",
                url,
                item.get("source_id", "NewsData"),
                category,
            ):
                count += 1

        return count

    except requests.RequestException as exc:
        print(f"  NewsData request error ({category}): {exc}")
        return 0
    except (ValueError, TypeError) as exc:
        print(f"  NewsData response error ({category}): {exc}")
        return 0


def fetch_all() -> int:
    config = load_config()
    total = 0

    print(f"\n🔄 Fetching news — {datetime.now():%H:%M:%S}")

    for category, settings in config.get("categories", {}).items():
        if not settings.get("enabled", False):
            continue

        rss_count = fetch_rss(category, RSS_FEEDS.get(category, []))
        api_count = fetch_newsdata(category)
        cat_total = rss_count + api_count
        total += cat_total
        print(f"  📰 {category}: {cat_total} new articles")

    print(f"  ✅ Total new: {total} articles")
    return total


if __name__ == "__main__":
    init_db()
    fetch_all()
