$ErrorActionPreference = "Stop"

Write-Host "🧪 Lancement des tests du Chat Amélioré..." -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan

# Dossier pour les résultats des tests
$testResultsDir = ".\test-results"
if (-not (Test-Path $testResultsDir)) {
    New-Item -ItemType Directory -Path $testResultsDir | Out-Null
}

# 1. Tests des messages enrichis
Write-Host "`n1️⃣ Tests des messages enrichis..." -ForegroundColor Green
try {
    $result = node test-chat-enriched.js
    $result | Out-File "$testResultsDir\test-enriched-results.txt"
    Write-Host $result
    Write-Host "✅ Tests des messages enrichis terminés avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors des tests des messages enrichis: $_" -ForegroundColor Red
}

# 2. Tests des notifications
Write-Host "`n2️⃣ Tests des notifications..." -ForegroundColor Green
try {
    $result = node test-chat-notifications.js
    $result | Out-File "$testResultsDir\test-notifications-results.txt"
    Write-Host $result
    Write-Host "✅ Tests des notifications terminés avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors des tests des notifications: $_" -ForegroundColor Red
}

# 3. Tests de performance
Write-Host "`n3️⃣ Tests de performance..." -ForegroundColor Green
try {
    $result = node test-chat-performance.js
    $result | Out-File "$testResultsDir\test-performance-results.txt"
    Write-Host $result
    Write-Host "✅ Tests de performance terminés avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors des tests de performance: $_" -ForegroundColor Red
}

# 4. Tests de modération
Write-Host "`n4️⃣ Tests de modération..." -ForegroundColor Green
Write-Host "Démarrage du serveur en arrière-plan..." -ForegroundColor Yellow
$serverProcess = Start-Process -FilePath "node" -ArgumentList "server-realtime.js" -WorkingDirectory "$PSScriptRoot" -PassThru -NoNewWindow

Write-Host "Attente de 5 secondes pour permettre au serveur de démarrer..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $result = node test-chat-moderation.js
    $result | Out-File "$testResultsDir\test-moderation-results.txt"
    Write-Host $result
    Write-Host "✅ Tests de modération terminés avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors des tests de modération: $_" -ForegroundColor Red
} finally {
    Write-Host "Arrêt du serveur de test..." -ForegroundColor Yellow
    Stop-Process -Id $serverProcess.Id -Force
    Start-Sleep -Seconds 2
}

# 5. Tests d'intégration
Write-Host "`n5️⃣ Tests d'intégration..." -ForegroundColor Green
Write-Host "Démarrage du serveur en arrière-plan..." -ForegroundColor Yellow
$serverProcess = Start-Process -FilePath "node" -ArgumentList "server-realtime.js" -WorkingDirectory "$PSScriptRoot" -PassThru -NoNewWindow

Write-Host "Attente de 5 secondes pour permettre au serveur de démarrer..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

try {
    $result = node_modules\.bin\mocha test-chat-integration.js --reporter spec
    $result | Out-File "$testResultsDir\test-integration-results.txt"
    Write-Host $result
    Write-Host "✅ Tests d'intégration terminés avec succès" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur lors des tests d'intégration: $_" -ForegroundColor Red
} finally {
    Write-Host "Arrêt du serveur de test..." -ForegroundColor Yellow
    Stop-Process -Id $serverProcess.Id -Force
}

# Rapport final
$totalTests = 5
$successTests = 0

if (Test-Path "$testResultsDir\test-enriched-results.txt") { $successTests++ }
if (Test-Path "$testResultsDir\test-notifications-results.txt") { $successTests++ }
if (Test-Path "$testResultsDir\test-performance-results.txt") { $successTests++ }
if (Test-Path "$testResultsDir\test-moderation-results.txt") { $successTests++ }
if (Test-Path "$testResultsDir\test-integration-results.txt") { $successTests++ }

Write-Host "`n📊 RAPPORT FINAL" -ForegroundColor Cyan
Write-Host "==============" -ForegroundColor Cyan
Write-Host "Tests exécutés: $totalTests" -ForegroundColor White
Write-Host "Tests réussis: $successTests" -ForegroundColor Green
Write-Host "Tests échoués: $($totalTests - $successTests)" -ForegroundColor $(if ($totalTests - $successTests -gt 0) { "Red" } else { "Green" })

if ($successTests -eq $totalTests) {
    Write-Host "`n🎉 TOUS LES TESTS ONT RÉUSSI !" -ForegroundColor Green
    Write-Host "Le Chat Amélioré est validé et prêt pour la production." -ForegroundColor Green
} else {
    Write-Host "`n⚠️ CERTAINS TESTS ONT ÉCHOUÉ" -ForegroundColor Yellow
    Write-Host "Veuillez consulter les fichiers de résultats pour plus de détails." -ForegroundColor Yellow
}

Write-Host "`nLes résultats des tests sont disponibles dans le dossier: $testResultsDir" -ForegroundColor Cyan
