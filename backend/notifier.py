from __future__ import annotations

import os
import threading

import pygame
from plyer import notification

from .config import load_config
from .database import Article, SessionLocal

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def play_sound() -> None:
    try:
        config = load_config()
        if not config.get("sound_enabled", True):
            return

        sound_path = os.path.join(BASE_DIR, "assets", "alert.wav")
        if not os.path.exists(sound_path):
            return

        if not pygame.mixer.get_init():
            pygame.mixer.init(frequency=44100)

        pygame.mixer.music.load(sound_path)
        pygame.mixer.music.play()
    except Exception as exc:
        print(f"  Sound error: {exc}")


def notify(title: str, message: str) -> None:
    def _notify() -> None:
        try:
            play_sound()
            notification.notify(
                title=f"📰 NewsFlash: {title[:50]}",
                message=(message or title)[:150],
                app_name="NewsFlash",
                timeout=8,
            )
        except Exception as exc:
            print(f"  Notification error: {exc}")

    thread = threading.Thread(target=_notify, daemon=True)
    thread.start()


def check_and_notify() -> int:
    config = load_config()
    threshold = float(config.get("notification_threshold", 6))

    db = SessionLocal()
    try:
        pending = (
            db.query(Article)
            .filter(Article.notified.is_(False), Article.score >= threshold)
            .order_by(Article.score.desc())
            .limit(3)
            .all()
        )

        for article in pending:
            notify(article.title, article.summary or article.title)
            article.notified = True

        db.commit()
        return len(pending)
    finally:
        db.close()


if __name__ == "__main__":
    sent = check_and_notify()
    print(f"🔔 Sent {sent} notifications")
