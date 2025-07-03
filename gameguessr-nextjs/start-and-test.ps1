# Script pour démarrer le serveur et lancer les tests
Write-Host "🚀 Démarrage du serveur temps réel..."
Start-Process -NoNewWindow -FilePath "node" -ArgumentList "server-realtime.js"

# Attendre que le serveur démarre
Start-Sleep 5

Write-Host "✅ Serveur démarré. Lancement des tests..."
node test-gamecontrols.js

Write-Host "📋 Tests terminés. Arrêt du serveur..."
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

Write-Host "✅ Processus terminé."
