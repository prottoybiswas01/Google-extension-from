@echo off
title TTC Form Auto-Fill Local Python Engine
echo =========================================================
echo TTC Form Auto-Fill - Local Python Engine Launcher
echo Completely Free, Offline & Independent of Cloud API Keys!
echo =========================================================
echo.

python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.9+ from https://www.python.org/
    pause
    exit /b 1
)

echo Installing required Python packages (if not already installed)...
pip install -r python_server/requirements.txt --quiet

echo.
echo Starting Python OCR Server on http://127.0.0.1:5000 ...
python python_server/server.py

pause
