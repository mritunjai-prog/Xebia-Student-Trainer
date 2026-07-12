Write-Host "Killing existing backend services..." -ForegroundColor Yellow

$ports = @(8080, 8081, 8082, 8083)
foreach ($port in $ports) {
    $conn = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($conn) {
        $processId = $conn.OwningProcess
        Write-Host "Killing process $processId occupying port $port..." -ForegroundColor Red
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
    }
}

Write-Host "Relaunching backend services..." -ForegroundColor Green
Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd backend; .\start_backend.ps1`"" -WindowStyle Normal
Write-Host "Backend services are starting in a new window!" -ForegroundColor Green
