@echo off
title BearTrack Vanguard Launcher v4.0
color 0E
echo ==================================================
echo       BEARTRACK VANGUARD SISTEMLERI BASLATILIYOR
echo ==================================================
echo.

:: [1] Backend (FastAPI) - Dış erişime açık (0.0.0.0)
echo [!] [1/2] Backend (FastAPI) ayaga kaldiriliyor...
echo [!] Dinlenen Adres: http://0.0.0.0:8000
start cmd /k "title BEAR-BACKEND && cd backend && call venv\Scripts\activate.bat && python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000"

:: [2] Frontend (Next.js) - Dış erişime açık (-H 0.0.0.0)
echo [!] [2/2] Frontend (Next.js) ayaga kaldiriliyor...
echo [!] Dinlenen Adres: http://0.0.0.0:3000
start cmd /k "title BEAR-FRONTEND && cd frontend && npm run dev -- -H 0.0.0.0"

echo.
echo --------------------------------------------------
echo [OK] Vanguard sistemleri arka planda calisiyor.
echo.
echo [DIKKAT] Tarayiciya asagidaki adreslerden birini yaz:
echo.
echo   1. Kendi bilgisayarin icin: http://localhost:3000
echo   2. Telefonun/Diger cihazlar: http://172.20.10.9:3000
echo.
echo [!] NOT: 0.0.0.0 adresini tarayiciya YAZMA, hata verir!
echo --------------------------------------------------
echo.
pause