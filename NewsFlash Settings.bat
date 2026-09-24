@echo off
setlocal
cd /d "%~dp0"

if not exist "venv\Scripts\python.exe" (
    echo.
    echo [ERROR] Python virtual environment not found.
    echo Run: py -3.13 -m venv venv
    echo.
    pause
    exit /b 1
)

"venv\Scripts\python.exe" settings.py
endlocal
