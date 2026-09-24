from __future__ import annotations

from pathlib import Path
import tkinter as tk
from tkinter import messagebox
import winreg

from .config import set_background_enabled

STARTUP_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
APP_NAME = "NewsFlash"
BASE_DIR = Path(__file__).resolve().parents[1]
BAT_PATH = BASE_DIR / "start.bat"
FIRST_RUN_FILE = BASE_DIR / ".firstrun"


def startup_command() -> str:
    return f'"{BAT_PATH}"'


def is_registered() -> bool:
    try:
        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            STARTUP_KEY,
            0,
            winreg.KEY_READ,
        ) as key:
            winreg.QueryValueEx(key, APP_NAME)
        return True
    except OSError:
        return False


def register_startup() -> None:
    with winreg.OpenKey(
        winreg.HKEY_CURRENT_USER,
        STARTUP_KEY,
        0,
        winreg.KEY_SET_VALUE,
    ) as key:
        winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, startup_command())


def unregister_startup() -> None:
    try:
        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            STARTUP_KEY,
            0,
            winreg.KEY_SET_VALUE,
        ) as key:
            winreg.DeleteValue(key, APP_NAME)
    except OSError:
        pass


def is_first_run() -> bool:
    return not FIRST_RUN_FILE.exists()


def mark_first_run_done() -> None:
    FIRST_RUN_FILE.write_text("done", encoding="utf-8")


def ask_consent() -> bool | None:
    root = tk.Tk()
    root.withdraw()

    dialog = tk.Toplevel(root)
    dialog.title("NewsFlash — Welcome!")
    dialog.configure(bg="#07070f")
    dialog.resizable(False, False)
    dialog.attributes("-topmost", True)

    result: dict[str, bool | None] = {"value": None}

    # Build the dialog first, then size and center it so Windows DPI scaling
    # cannot clip the controls at the bottom of the window.
    content = tk.Frame(dialog, bg="#07070f")
    content.pack(fill="both", expand=True, padx=28, pady=24)

    tk.Label(
        content,
        text="⚡ NewsFlash",
        font=("Inter", 18, "bold"),
        bg="#07070f",
        fg="#a78bfa",
    ).pack(pady=(0, 4))

    tk.Label(
        content,
        text="Real-time News Intelligence System",
        font=("Inter", 10),
        bg="#07070f",
        fg="#6b7280",
    ).pack()

    tk.Label(
        content,
        text=(
            "Would you like NewsFlash to run in the\n"
            "background and send live news notifications\n"
            "automatically when your PC starts?"
        ),
        font=("Inter", 11),
        bg="#07070f",
        fg="#f0f0ff",
        justify="center",
    ).pack(pady=(22, 16))

    tk.Label(
        content,
        text="You can change this anytime from\n'NewsFlash Settings.bat'",
        font=("Inter", 9),
        bg="#07070f",
        fg="#6b7280",
        justify="center",
    ).pack()

    buttons = tk.Frame(content, bg="#07070f")
    buttons.pack(pady=(22, 0))

    def finish(value: bool) -> None:
        result["value"] = value
        dialog.destroy()
        root.destroy()

    def yes() -> None:
        finish(True)

    def no() -> None:
        finish(False)

    tk.Button(
        buttons,
        text="✅  Yes, run in background",
        font=("Inter", 10, "bold"),
        bg="#22d3ee",
        fg="#000000",
        relief="flat",
        padx=18,
        pady=8,
        width=23,
        cursor="hand2",
        command=yes,
    ).pack(side="left", padx=7)

    tk.Button(
        buttons,
        text="No thanks",
        font=("Inter", 10),
        bg="#2a2a3a",
        fg="#f0f0ff",
        relief="flat",
        padx=18,
        pady=8,
        width=12,
        cursor="hand2",
        command=no,
    ).pack(side="left", padx=7)

    # Closing the window is the same as choosing "No thanks".
    dialog.protocol("WM_DELETE_WINDOW", no)

    dialog.update_idletasks()

    # Explicitly give the content enough room for Windows DPI scaling.
    width, height = 590, 390
    screen_w = dialog.winfo_screenwidth()
    screen_h = dialog.winfo_screenheight()
    x = max((screen_w - width) // 2, 0)
    y = max((screen_h - height) // 2, 0)
    dialog.geometry(f"{width}x{height}+{x}+{y}")

    dialog.grab_set()
    dialog.focus_force()
    dialog.lift()
    dialog.attributes("-topmost", True)
    dialog.wait_window()
    return result["value"]


def run() -> None:
    if not is_first_run():
        return

    consent = ask_consent()

    if consent:
        register_startup()
        set_background_enabled(True)
        mark_first_run_done()
        messagebox.showinfo(
            "NewsFlash",
            "NewsFlash will now start automatically with Windows.",
        )
        return

    # Treat No thanks or closing the dialog as an explicit opt-out.
    unregister_startup()
    set_background_enabled(False)
    mark_first_run_done()
    messagebox.showinfo(
        "NewsFlash",
        "Background notifications are disabled. You can change this anytime from "
        "NewsFlash Settings.bat.",
    )


if __name__ == "__main__":
    run()
