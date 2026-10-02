@echo off
REM Compila o Lily Studio e gera o executavel desktop para Windows.
cd /d "%~dp0\.."
call npm install --no-save electron @electron/packager || exit /b 1
set LILY_DESKTOP=1
call npx vite build || exit /b 1
call npx @electron/packager . "Lily Studio" --out=desktop-release --overwrite --ignore="^/node_modules" --ignore="^/src" --ignore="^/public" --ignore="^/desktop-release" --ignore="^/scripts" --ignore="^/dist/server" --ignore="^/\.output"
echo Pronto! Executavel em desktop-release
