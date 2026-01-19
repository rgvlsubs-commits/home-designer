@echo off
echo ========================================
echo    Home Designer - Starting...
echo ========================================
echo.

cd /d "%~dp0frontend"
echo Starting development server...
echo.
echo Open http://localhost:5173 in your browser
echo Press Ctrl+C to stop the server
echo.
call npm run dev
