Write-Host "Starting Xebia LMS Backend Services..."
Write-Host "Make sure PostgreSQL is running on port 5432 and Redis on 6379"

$services = @("api-gateway", "user-service", "batch-service", "assessment-service")

foreach ($service in $services) {
    Write-Host "Starting $service..."
    Start-Process -FilePath "powershell" -ArgumentList "-NoExit -Command `"cd $service; .\mvnw spring-boot:run`"" -WindowStyle Normal
}

Write-Host "All services are spinning up in separate windows!"
