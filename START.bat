@echo off
REM PriorInBox - Complete Startup Script
REM This script starts both the backend API and frontend server

echo.
echo ╔═══════════════════════════════════════════════╗
echo ║        PriorInBox - Full Stack Server         ║
echo ║  Node.js + Express + MySQL + HTML/CSS/JS      ║
echo ╚═══════════════════════════════════════════════╝
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo ✅ Node.js found
echo.

REM Check if MySQL is running
echo Checking MySQL connection... (Note: This is a placeholder message. Actual MySQL check logic is not implemented here.)

REM Start the backend server
echo.
echo ╔═══════════════════════════════════════════════╗
echo ║      Starting PriorInBox Backend Server       ║
echo ╚═══════════════════════════════════════════════╝
echo.

cd /d F:\PriorInboX\Backend
start "PriorInBox Backend" cmd /k npm start

REM Wait a moment for backend to start
timeout /t 3 /nobreak

REM Start the frontend server
echo.
echo ╔═══════════════════════════════════════════════╗
echo ║      Starting PriorInBox Frontend Server      ║
echo ╚═══════════════════════════════════════════════╝
echo.

cd /d F:\PriorInboX\Frontend
start "PriorInBox Frontend" cmd /k node server.js

echo.
echo ✅ Both servers are starting...
echo Backend: http://localhost:5000 (requires npm install)
echo Frontend: http://localhost:8000
echo.

pause
