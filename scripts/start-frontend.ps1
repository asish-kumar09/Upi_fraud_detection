# Start UPI Fraud Detection React + Vite Frontend
Write-Host "=========================================================" -ForegroundColor Cyan
Write-Host "  Starting UPI Fraud Shield AI Frontend (React + Vite)  " -ForegroundColor Yellow
Write-Host "=========================================================" -ForegroundColor Cyan

$FrontendDir = Join-Path $PSScriptRoot "..\frontend"
Set-Location -Path $FrontendDir

Write-Host "Launching Vite development server on http://localhost:5173 ..." -ForegroundColor Green
npm run dev
