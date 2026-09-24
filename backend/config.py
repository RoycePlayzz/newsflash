from __future__ import annotations

import json
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parents[1]
CONFIG_PATH = BASE_DIR / "user_config.json"
BACKGROUND_FLAG = BASE_DIR / ".background_enabled"

DEFAULT_CONFIG: dict[str, Any] = {
    "notification_threshold": 6,
    "poll_interval_seconds": 60,
    "categories": {
        "current_affairs": {"enabled": True, "priority": 9},
        "ai_ml": {"enabled": True, "priority": 10},
        "tech": {"enabled": True, "priority": 8},
        "business": {"enabled": True, "priority": 7},
        "science": {"enabled": True, "priority": 7},
        "sports": {"enabled": False, "priority": 3},
        "entertainment": {"enabled": False, "priority": 3},
    },
    "custom_keywords": ["AI", "LLM", "software", "Python", "cloud"],
    "sound_enabled": True,
}


def load_config() -> dict[str, Any]:
    if not CONFIG_PATH.exists():
        save_config(DEFAULT_CONFIG)
        return DEFAULT_CONFIG.copy()

    with CONFIG_PATH.open("r", encoding="utf-8") as file:
        return json.load(file)


def save_config(config: dict[str, Any]) -> None:
    with CONFIG_PATH.open("w", encoding="utf-8") as file:
        json.dump(config, file, indent=2)


def is_background_enabled() -> bool:
    """Return whether desktop notification processing is enabled."""
    return BACKGROUND_FLAG.exists()


def set_background_enabled(enabled: bool) -> None:
    """Enable or disable background desktop notifications."""
    if enabled:
        BACKGROUND_FLAG.write_text("enabled", encoding="utf-8")
    elif BACKGROUND_FLAG.exists():
        BACKGROUND_FLAG.unlink()
