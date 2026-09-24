# NewsFlash Architecture Notes

## Processing pipeline

```text
RSS / NewsData.io
       │
       ▼
   Fetcher
       │
       ├── HTML cleanup
       ├── source/category tagging
       └── URL-based deduplication
       │
       ▼
    SQLite
       │
       ▼
     Scorer
       │
       ├── category keyword signal
       ├── custom keyword signal
       └── spaCy entity signal
       │
       ▼
    SQLite
       │
       ├───────────────┐
       ▼               ▼
 FastAPI API      Notifier
       │               │
       ▼               ▼
 React UI       Windows toast/audio
```

## Main components

### `backend/fetcher.py`

Responsible for network ingestion. RSS feeds are fetched with bounded request timeouts before being parsed. The optional NewsData.io source is only queried when `NEWSDATA_API_KEY` is configured.

### `backend/scorer.py`

Keeps the relevance logic explicit:

- up to 5 points for category keyword matches
- up to 3 points for custom keyword matches
- up to 2 points for named-entity signals from spaCy

The final score is capped at 10.

### `backend/database.py`

Defines the SQLAlchemy model and SQLite engine. The URL can be overridden with `NEWSFLASH_DATABASE_URL`, which also makes isolated test databases possible.

### `backend/main.py`

Exposes read-oriented article/stat endpoints plus configuration endpoints. FastAPI generates the OpenAPI/Swagger documentation automatically.

### `backend/scheduler.py`

Coordinates the periodic pipeline. `max_instances=1` prevents overlapping pipeline runs and `coalesce=True` avoids building a backlog when the process is delayed.

### `backend/notifier.py`

Selects high-score articles that have not been notified, emits up to three desktop notifications, and marks those records as notified.

### `frontend/src/App.jsx`

Presents the local intelligence feed with category filtering, search, sorting, live counters, ticker content, and animated cards. The API base URL can be overridden through `VITE_API_URL`.

## Current trade-offs

This is deliberately a desktop/local architecture. The simplest reliable path for a single-user portfolio application is:

**FastAPI + SQLite + in-process scheduler + React**

At larger scale, the next architectural steps would be a server database, external job queue, user authentication, structured observability, and event-driven client updates.

## Operational behavior

The scheduler runs the full pipeline immediately at startup and then at the configured interval.

The React client separately refreshes its API view to reflect new records without requiring a full page reload.
