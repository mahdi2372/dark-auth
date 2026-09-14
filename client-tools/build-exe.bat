@echo off
echo.
echo ========================================
echo   DARK-AUTH EXE Builder
echo ========================================
echo.

echo [1/3] Installing dependencies...
pip install requests pyinstaller

echo.
echo [2/3] Building EXE...
pyinstaller --onefile --name DarkAuth --console --clean darkauth_client.py

echo.
echo [3/3] Done!
echo.
echo EXE located at: dist\DarkAuth.exe
echo.
echo ========================================
echo   Distribution:
echo   1. Share dist\DarkAuth.exe
echo   2. User runs get-sid.ps1 to get SID
echo   3. User pastes SID on client portal
echo   4. User runs DarkAuth.exe with license key
echo ========================================
pause
