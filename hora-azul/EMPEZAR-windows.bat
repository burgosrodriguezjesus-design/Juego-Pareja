@echo off
REM Doble clic aqui y se abre el juego. Para cerrarlo, cierra esta ventana.
cd /d "%~dp0"
where node >nul 2>nul || (
  echo Falta Node. Instalalo desde https://nodejs.org y vuelve a hacer doble clic.
  pause & exit /b 1
)
start "" "http://127.0.0.1:4173/"
node SERVIR.mjs
pause
