#!/usr/bin/env bash
# Compila o Lily Studio e gera o executável desktop (editor de arquivos local).
# Uso: ./scripts/build-desktop.sh [linux|win32|darwin|all]   (padrão: sistema atual)
# Requer apenas Node.js 18+ (o Electron é baixado automaticamente pelo empacotador).
set -euo pipefail
cd "$(dirname "$0")/.."

PLATFORM="${1:-current}"
ELECTRON_VERSION="33.2.1"

if [ ! -d node_modules ]; then
  echo "==> Instalando dependências do projeto..."
  npm install --legacy-peer-deps
fi

echo "==> Compilando o editor (modo SPA estático)..."
LILY_DESKTOP=1 npx vite build
test -f dist/client/_shell.html || { echo "Falha: dist/client/_shell.html não foi gerado"; exit 1; }

case "$PLATFORM" in
  current) ARGS="" ;;
  all) ARGS="--platform=linux,win32,darwin --arch=x64" ;;
  *) ARGS="--platform=$PLATFORM --arch=x64" ;;
esac

echo "==> Empacotando executável..."
npx --yes @electron/packager@18 . "Lily Studio" $ARGS \
  --electron-version="$ELECTRON_VERSION" \
  --out=desktop-release --overwrite \
  --ignore='^/node_modules' --ignore='^/src' --ignore='^/public' \
  --ignore='^/desktop-release' --ignore='^/\.lovable' --ignore='^/\.git' --ignore='^/scripts' \
  --ignore='^/dist/server' --ignore='^/\.output'

echo "==> Pronto! Executáveis em ./desktop-release"
