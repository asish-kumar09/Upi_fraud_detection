# Start UPI Fraud Detection FastAPI Backend
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  Starting UPI Fraud Shield AI Backend (FastAPI + ML)   " -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan

$BackendDir = Join-Path $PSScriptRoot "..\backend"
Set-Location -Path $BackendDir

Write-Host "Checking trained models..." -ForegroundColor Gray
if (-not (Test-Path "$BackendDir\saved_models\upi_ensemble_model.pkl")) {
    Write-Host "Training initial ML ensemble model..." -ForegroundColor Yellow
    python ml\train_model.py
}

Write-Host "Launching uvicorn server on http://127.0.0.1:8000 ..." -ForegroundColor Green
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
