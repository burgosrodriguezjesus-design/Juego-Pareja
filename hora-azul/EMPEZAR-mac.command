#!/bin/bash
# Doble clic aquí y se abre el juego. Para cerrarlo, cierra esta ventana.
cd "$(dirname "$0")" || exit 1
if ! command -v node >/dev/null 2>&1; then
  echo "Falta Node. Instálalo desde https://nodejs.org y vuelve a hacer doble clic."
  read -r -p "Pulsa Intro para cerrar." _; exit 1
fi
(sleep 1.5; open "http://127.0.0.1:${GAME_PORT:-4173}/") &
node SERVIR.mjs
