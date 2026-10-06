@echo off
REM Compila o Lily Studio e gera o executavel desktop para Windows. Requer Node.js 18+.
cd /d "%~dp0\.."
if not exist node_modules (call npm install --legacy-peer-deps || exit /b 1)
set LILY_DESKTOP=1
call npx vite build || exit /b 1
if not exist dist\client\_shell.html (echo Falha: dist\client\_shell.html nao foi gerado & exit /b 1)
call npx --yes @electron/packager@18 . "Lily Studio" --platform=win32 --arch=x64 --electron-version=33.2.1 --out=desktop-release --overwrite --ignore="^/node_modules" --ignore="^/src" --ignore="^/public" --ignore="^/desktop-release" --ignore="^/\.lovable" --ignore="^/\.git" --ignore="^/scripts" --ignore="^/dist/server" --ignore="^/\.output" || exit /b 1
echo Pronto! Executavel em desktop-release\Lily Studio-win32-x64\Lily Studio.exe
