from __future__ import annotations

import time

from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

from .config import is_background_enabled, load_config
from .fetcher import fetch_all
from .database import init_db
from .notifier import check_and_notify
from .scorer import score_and_update_articles


def run_pipeline() -> None:
    init_db()
    print("\n⚡ Pipeline starting...")
    fetch_all()
    score_and_update_articles()
    if is_background_enabled():
        check_and_notify()
    else:
        print("🔕 Background notifications disabled")
    print("⚡ Pipeline complete\n")


def start_scheduler() -> None:
    interval = int(load_config().get("poll_interval_seconds", 60))

    scheduler = BackgroundScheduler()
    scheduler.add_job(
        run_pipeline,
        trigger=IntervalTrigger(seconds=interval),
        id="news_pipeline",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
    )
    scheduler.start()

    print(f"✅ Scheduler started — running every {interval} seconds")
    print("📰 NewsFlash is live! Press Ctrl+C to stop.\n")

    run_pipeline()

    try:
        while True:
            time.sleep(1)
    except (KeyboardInterrupt, SystemExit):
        scheduler.shutdown(wait=False)
        print("\n🛑 NewsFlash stopped.")


if __name__ == "__main__":
    start_scheduler()
