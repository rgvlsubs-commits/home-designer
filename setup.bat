@echo off
echo ========================================
echo    Home Designer - Setup
echo ========================================
echo.

cd /d "%~dp0frontend"
echo Installing frontend dependencies...
call npm install

if %ERRORLEVEL% NEQ 0 (
    echo.
    echo ERROR: npm install failed
    echo Make sure Node.js is installed: https://nodejs.org/
    pause
    exit /b 1
)

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo To start the app, run: start.bat
echo.
pause
