@echo off
setlocal
title NewsFlash

set "ROOT=%~dp0"
set "PYTHON=%ROOT%venv\Scripts\python.exe"

if not exist "%PYTHON%" (
    echo.
    echo [ERROR] Python virtual environment not found.
    echo Run: py -3.13 -m venv venv
    echo Then: python -m pip install -r requirements.txt
    echo.
    pause
    exit /b 1
)

if not exist "%ROOT%frontend\node_modules" (
    echo.
    echo [ERROR] Frontend dependencies not found.
    echo Run: cd frontend ^&^& npm install
    echo.
    pause
    exit /b 1
)

echo.
echo =========================================
echo  NewsFlash
echo =========================================
echo.

echo Starting NewsFlash first-run setup...
echo Please complete the NewsFlash welcome dialog before continuing.
"%PYTHON%" -m backend.startup
if errorlevel 1 (
    echo.
    echo [ERROR] NewsFlash startup setup failed.
    pause
    exit /b 1
)


start "NewsFlash API" cmd /k "cd /d ""%ROOT%"" && ""%PYTHON%"" -m uvicorn backend.main:app --port 8000"

timeout /t 3 /nobreak > nul

start "NewsFlash Dashboard" cmd /k "cd /d ""%ROOT%frontend"" && npm run dev"

timeout /t 5 /nobreak > nul

start "NewsFlash Scheduler" cmd /k "cd /d ""%ROOT%"" && ""%PYTHON%"" -m backend.scheduler"

echo NewsFlash is running.
echo API:       http://127.0.0.1:8000
echo Dashboard: http://localhost:5173
echo.
endlocal
