@echo off
echo Starting Kumpas...

start "Kumpas Backend" cmd /k "cd backend && fastapi dev app/main.py"
start "Kumpas Frontend" cmd /k "cd frontend && npm run dev"

timeout /t 5 /nobreak > nul
start http://localhost:5173
