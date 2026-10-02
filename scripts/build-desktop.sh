#!/usr/bin/env bash
# Compila o Lily Studio e gera o executável desktop (editor de arquivos local).
# Uso: ./scripts/build-desktop.sh [linux|win32|darwin|all]   (padrão: sistema atual)
set -euo pipefail
cd "$(dirname "$0")/.."

PLATFORM="${1:-current}"
echo "==> Instalando ferramentas do desktop (Electron)..."
npm install --no-save electron @electron/packager

echo "==> Compilando o editor (modo SPA estático)..."
LILY_DESKTOP=1 npx vite build

if [ "$PLATFORM" = "current" ]; then
  ARGS=""
elif [ "$PLATFORM" = "all" ]; then
  ARGS="--platform=linux,win32,darwin --arch=x64"
else
  ARGS="--platform=$PLATFORM --arch=x64"
fi

echo "==> Empacotando executável..."
npx @electron/packager . "Lily Studio" $ARGS \
  --out=desktop-release --overwrite \
  --ignore='^/node_modules' --ignore='^/src' --ignore='^/public' \
  --ignore='^/desktop-release' --ignore='^/\.lovable' --ignore='^/scripts' \
  --ignore='^/dist/server' --ignore='^/\.output'

echo "==> Pronto! Executáveis em ./desktop-release"
