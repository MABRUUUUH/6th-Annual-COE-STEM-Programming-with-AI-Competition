@echo off
cd /d "%~dp0"
where php >nul 2>nul
if errorlevel 1 (
 echo PHP 8.2 or later is required. Install PHP and add it to PATH.
 pause
 exit /b 1
)
echo NEXUS is starting at http://127.0.0.1:8000
start "" "http://127.0.0.1:8000"
php -S 127.0.0.1:8000 -t "ADU Hackathon" "backend\router.php"
pause
