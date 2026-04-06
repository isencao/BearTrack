@echo off
title BearTrack Baslatici
echo ==========================================
echo BEARTRACK SISTEMLERI BASLATILIYOR...
echo ==========================================

:: Backend'i ayri bir komut satirinda baslat
echo [1] Backend (FastAPI) ayaga kaldiriliyor...
start cmd /k "cd backend && call venv\Scripts\activate.bat && python -m uvicorn main:app --reload"

:: Frontend'i ayri bir komut satirinda baslat
echo [2] Frontend (Next.js) ayaga kaldiriliyor...
start cmd /k "cd frontend && npm run dev"

echo.
echo Islem tamam! 
echo Eger Docker (beardb) acik degilse once onu acmayi unutma.
echo Kapatmak istersen acilan siyah pencereleri carpilarindan kapatabilirsin.
pause