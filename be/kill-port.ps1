# Script pour libérer le port 5001
Get-NetTCPConnection -LocalPort 5001 -ErrorAction SilentlyContinue | ForEach-Object {
  $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue
  Write-Host "🔪 Killing PID $($_.OwningProcess) - $($proc.ProcessName)" -ForegroundColor Yellow
  Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
}
Start-Sleep -Seconds 2
Write-Host "✅ Port 5001 libéré" -ForegroundColor Green
