$ErrorActionPreference = "Stop"

Write-Host "Démarrage du serveur en arrière-plan..." -ForegroundColor Green
Start-Process -FilePath "node" -ArgumentList "server-realtime.js" -WorkingDirectory "$PSScriptRoot" -NoNewWindow -PassThru

Write-Host "Attente de 5 secondes pour permettre au serveur de démarrer..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "Exécution des tests de modération du chat..." -ForegroundColor Green
try {
    & node test-chat-moderation.js
    if ($LASTEXITCODE -eq 0) {
        Write-Host "Tests de modération réussis!" -ForegroundColor Green
    } else {
        Write-Host "Échec des tests de modération!" -ForegroundColor Red
    }
} catch {
    Write-Host "Erreur lors de l'exécution des tests: $_" -ForegroundColor Red
}

Write-Host "Recherche du processus node pour l'arrêter..."
$nodeProcesses = Get-Process -Name "node" -ErrorAction SilentlyContinue
foreach ($process in $nodeProcesses) {
    Write-Host "Arrêt du processus node (PID: $($process.Id))" -ForegroundColor Yellow
    Stop-Process -Id $process.Id -Force
}

Write-Host "Tests terminés!" -ForegroundColor Green
