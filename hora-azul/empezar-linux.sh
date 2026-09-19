#!/bin/bash
# Ejecuta:  ./empezar-linux.sh     (para el móvil:  RED=1 ./empezar-linux.sh)
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Falta Node. Instálalo desde https://nodejs.org"; exit 1
fi
(sleep 1.5; xdg-open "http://127.0.0.1:${GAME_PORT:-4173}/" >/dev/null 2>&1) &
node SERVIR.mjs
