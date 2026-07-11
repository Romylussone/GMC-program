@echo off
cd /d "%~dp0"
"C:\Program Files\nodejs\npm.cmd" run dev -- --host 127.0.0.1 --port 5173 > vite-dev-server.log 2> vite-dev-server.err.log
