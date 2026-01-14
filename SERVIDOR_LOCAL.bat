@echo off
echo ========================================
echo   Servidor Local - Blog Vida 360
echo ========================================
echo.

cd /d "%~dp0"

echo Iniciando servidor local na porta 8000...
echo.
echo Acesse: http://localhost:8000
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

REM Tentar Python primeiro
python -m http.server 8000 2>nul
if %errorlevel% neq 0 (
    echo Python nao encontrado. Tentando Node.js...
    npx http-server -p 8000
    if %errorlevel% neq 0 (
        echo.
        echo Erro: Python ou Node.js nao encontrados.
        echo.
        echo Instale um dos seguintes:
        echo - Python: https://www.python.org/downloads/
        echo - Node.js: https://nodejs.org/
        echo.
        pause
    )
)
