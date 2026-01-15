@echo off
echo ========================================
echo   PAINEL ADMINISTRATIVO - VIDA 360
echo ========================================
echo.
echo Iniciando servidor local...
echo.

cd /d "%~dp0"

:: Iniciar servidor HTTP
start /B python -m http.server 8000

:: Aguardar 2 segundos
timeout /t 2 /nobreak >nul

:: Abrir painel admin no navegador
start http://localhost:8000/admin-login.html

echo.
echo ========================================
echo   PAINEL ADMIN ABERTO!
echo ========================================
echo.
echo Acesse: http://localhost:8000/admin-login.html
echo.
echo Faca login com suas credenciais do Supabase
echo.
echo Para parar o servidor, feche esta janela
echo ou pressione Ctrl+C
echo.
echo ========================================
pause
