@echo off
echo ========================================
echo   Abrindo Blog Vida 360 no Navegador
echo ========================================
echo.

cd /d "%~dp0"

echo Abrindo index.html no navegador padrão...
start index.html

echo.
echo Blog aberto! 
echo.
echo Para visualizar com servidor local, execute:
echo   python -m http.server 8000
echo   ou
echo   npx http-server -p 8000
echo.
pause
