# ---------------------------------------------------------------
# run_all.ps1 – Jalankan Backend (.NET) dan Frontend (Vite) bersamaan
# ---------------------------------------------------------------

$beDir = "D:\Sistem informasi\SEMESTER 7\PABF\ProgramPABF\AbsensiAsrama-BE"
$feDir = "D:\Sistem informasi\SEMESTER 7\PABF\ProgramPABF\AbsensiAsrama-FE"

function Start-Backend {
    Write-Host "`n=== STARTING BACKEND (dotnet watch) ===`n" -ForegroundColor Cyan
    Push-Location $beDir
    $env:ASPNETCORE_ENVIRONMENT = "Development"
    $beJob = Start-Process -FilePath "dotnet" -ArgumentList "watch run" -NoNewWindow -PassThru
    Pop-Location
    return $beJob
}

function Start-Frontend {
    Write-Host "`n=== STARTING FRONTEND (npm run dev) ===`n" -ForegroundColor Cyan
    Push-Location $feDir
    if (-Not (Test-Path "node_modules")) {
        Write-Host "Installing npm dependencies..."
        npm install
    }
    $feJob = Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow -PassThru
    Pop-Location
    return $feJob
}

$beJob = Start-Backend
$feJob = Start-Frontend

Write-Host "`nBoth services are running. Press Ctrl+C to stop them.`n" -ForegroundColor Green

try {
    Wait-Process -Id $beJob.Id, $feJob.Id
} finally {
    Write-Host "`nStopping services...`n" -ForegroundColor Yellow
    Stop-Process -Id $beJob.Id -ErrorAction SilentlyContinue
    Stop-Process -Id $feJob.Id -ErrorAction SilentlyContinue
}
