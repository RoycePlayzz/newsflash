from __future__ import annotations

from pathlib import Path
import tkinter as tk
from tkinter import messagebox
import winreg

from backend.config import is_background_enabled, set_background_enabled

APP_NAME = "NewsFlash"
STARTUP_KEY = r"Software\Microsoft\Windows\CurrentVersion\Run"
BASE_DIR = Path(__file__).resolve().parent
BAT_PATH = BASE_DIR / "start.bat"
def startup_command() -> str:
    return f'"{BAT_PATH}"'


def is_startup_registered() -> bool:
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


def enable_startup() -> None:
    with winreg.OpenKey(
        winreg.HKEY_CURRENT_USER,
        STARTUP_KEY,
        0,
        winreg.KEY_SET_VALUE,
    ) as key:
        winreg.SetValueEx(key, APP_NAME, 0, winreg.REG_SZ, startup_command())


def disable_startup() -> None:
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


class SettingsApp:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("NewsFlash Settings")
        self.root.geometry("460x400")
        self.root.configure(bg="#07070f")
        self.root.resizable(False, False)

        self.startup_var = tk.BooleanVar(value=is_startup_registered())
        self.background_var = tk.BooleanVar(value=is_background_enabled())

        tk.Label(
            root,
            text="⚡ NewsFlash",
            font=("Segoe UI", 22, "bold"),
            bg="#07070f",
            fg="#a78bfa",
        ).pack(pady=(28, 4))

        tk.Label(
            root,
            text="Real-time News Intelligence System",
            font=("Segoe UI", 10),
            bg="#07070f",
            fg="#6b7280",
        ).pack(pady=(0, 20))

        tk.Frame(root, bg="#1e1e2e", height=1).pack(fill="x", padx=30)

        self._make_setting(
            root,
            "🚀",
            "Boot with Windows",
            "Auto-start NewsFlash when your PC turns on",
            self.startup_var,
            self.toggle_startup,
        )

        tk.Frame(root, bg="#1e1e2e", height=1).pack(fill="x", padx=30)

        self._make_setting(
            root,
            "🔔",
            "Background Notifications",
            "Get live news popups with sound in background",
            self.background_var,
            self.toggle_background,
        )

        tk.Frame(root, bg="#1e1e2e", height=1).pack(fill="x", padx=30)

        tk.Label(
            root,
            text="Changes are saved automatically",
            font=("Segoe UI", 9),
            bg="#07070f",
            fg="#333355",
        ).pack(pady=18)

    def _make_setting(self, parent, icon, title, desc, var, on_toggle):
        frame = tk.Frame(parent, bg="#07070f")
        frame.pack(fill="x", padx=30, pady=16)

        left = tk.Frame(frame, bg="#07070f")
        left.pack(side="left", fill="x", expand=True)

        tk.Label(
            left,
            text=f"{icon}  {title}",
            font=("Segoe UI", 12, "bold"),
            bg="#07070f",
            fg="#f0f0ff",
        ).pack(anchor="w")

        tk.Label(
            left,
            text=desc,
            font=("Segoe UI", 9),
            bg="#07070f",
            fg="#6b7280",
        ).pack(anchor="w", pady=(2, 0))

        button = tk.Button(
            frame,
            font=("Segoe UI", 9, "bold"),
            relief="flat",
            bd=0,
            padx=14,
            pady=6,
            cursor="hand2",
            command=lambda: on_toggle(button, var),
        )
        button.pack(side="right", padx=(16, 0))
        self._style_toggle(button, var.get())

    @staticmethod
    def _style_toggle(button, enabled: bool) -> None:
        button.config(
            text="ENABLED" if enabled else "DISABLED",
            bg="#22d3ee" if enabled else "#1a1a2e",
            fg="#000000" if enabled else "#6b7280",
        )

    def toggle_startup(self, button, var) -> None:
        if var.get():
            disable_startup()
            var.set(False)
            messagebox.showinfo("NewsFlash", "Auto-startup disabled.")
        else:
            enable_startup()
            var.set(True)
            messagebox.showinfo("NewsFlash", "Auto-startup enabled.")

        self._style_toggle(button, var.get())

    def toggle_background(self, button, var) -> None:
        if var.get():
            set_background_enabled(False)
            var.set(False)
            messagebox.showinfo("NewsFlash", "Background notifications disabled.")
        else:
            set_background_enabled(True)
            var.set(True)
            messagebox.showinfo("NewsFlash", "Background notifications enabled.")

        self._style_toggle(button, var.get())


if __name__ == "__main__":
    root = tk.Tk()
    SettingsApp(root)
    root.mainloop()
