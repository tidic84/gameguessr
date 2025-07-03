# Script d'analyse de performance pour GameGuessr
# Ce script exécute des tests de performance avec Lighthouse et Puppeteer

# Vérifier si le serveur est en cours d'exécution
$serverRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $serverRunning = $true
    }
}
catch {
    Write-Host "Le serveur ne semble pas être en cours d'exécution." -ForegroundColor Yellow
}

# Démarrer le serveur si nécessaire
$serverProcess = $null
if (-not $serverRunning) {
    Write-Host "Démarrage du serveur GameGuessr..." -ForegroundColor Cyan
    # Utiliser Start-Process pour démarrer le serveur en arrière-plan
    $serverProcess = Start-Process -FilePath "npm" -ArgumentList "run dev-realtime" -PassThru -WindowStyle Hidden
    
    # Attendre que le serveur soit prêt
    $maxAttempts = 10
    $attempts = 0
    $serverReady = $false
    
    Write-Host "En attente que le serveur soit prêt..." -ForegroundColor Cyan
    while (-not $serverReady -and $attempts -lt $maxAttempts) {
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 5 -UseBasicParsing -ErrorAction SilentlyContinue
            if ($response.StatusCode -eq 200) {
                $serverReady = $true
                Write-Host "Serveur démarré avec succès!" -ForegroundColor Green
            }
        }
        catch {
            $attempts++
            Write-Host "Tentative $attempts/$maxAttempts - Serveur pas encore prêt..." -ForegroundColor Yellow
            Start-Sleep -Seconds 3
        }
    }
    
    if (-not $serverReady) {
        Write-Host "Impossible de démarrer le serveur. Arrêt des tests." -ForegroundColor Red
        if ($serverProcess -ne $null) {
            Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
        }
        exit 1
    }
}

# Créer le dossier de résultats s'il n'existe pas
$resultsFolder = Join-Path -Path (Get-Location) -ChildPath "performance\results"
if (-not (Test-Path -Path $resultsFolder)) {
    New-Item -Path $resultsFolder -ItemType Directory | Out-Null
}

# Exécuter les tests Lighthouse
Write-Host "`nExécution des tests Lighthouse..." -ForegroundColor Cyan
npm run lighthouse

# Exécuter les tests de performance personnalisés
Write-Host "`nExécution des tests de performance personnalisés..." -ForegroundColor Cyan
npm run perf:test

# Analyse du bundle
Write-Host "`nExécution de l'analyse du bundle..." -ForegroundColor Cyan
$env:ANALYZE = "true"
npm run build
$env:ANALYZE = $null

# Création du rapport combiné
Write-Host "`nCréation du rapport de performance combiné..." -ForegroundColor Cyan

# Trouver les rapports les plus récents
$lighthouseReport = Get-ChildItem -Path $resultsFolder -Filter "performance-report-*.md" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
$perfTestReport = Get-ChildItem -Path $resultsFolder -Filter "performance-test-report-*.md" | Sort-Object LastWriteTime -Descending | Select-Object -First 1

if ($lighthouseReport -and $perfTestReport) {
    $lighthouseContent = Get-Content -Path $lighthouseReport.FullName -Raw
    $perfTestContent = Get-Content -Path $perfTestReport.FullName -Raw
    
    $reportDate = Get-Date -Format "yyyy-MM-dd"
    $combinedReportPath = Join-Path -Path $resultsFolder -ChildPath "RAPPORT_PERFORMANCE_COMPLET_$reportDate.md"
    
    $combinedContent = @"
# Rapport d'Analyse des Performances GameGuessr - $reportDate

## Table des matières

1. [Analyse Lighthouse](#analyse-lighthouse)
2. [Tests de Performance](#tests-de-performance)
3. [Analyse du Bundle](#analyse-du-bundle)
4. [Recommandations](#recommandations)

## Analyse Lighthouse

$lighthouseContent

## Tests de Performance

$perfTestContent

## Analyse du Bundle

L'analyse du bundle a été effectuée et les résultats sont disponibles dans le dossier `.next/analyze/`.

## Recommandations

Basé sur les analyses ci-dessus, voici les recommandations prioritaires pour améliorer les performances :

1. Optimiser les images panoramiques 360° avec lazy loading progressif
2. Mettre en place le code splitting pour les composants lourds
3. Optimiser les re-renders React avec memoisation
4. Améliorer la compression des données Socket.io
5. Optimiser la taille du bundle JavaScript

"@
    
    Set-Content -Path $combinedReportPath -Value $combinedContent
    
    Write-Host "Rapport combiné créé: $combinedReportPath" -ForegroundColor Green
    
    # Créer une copie avec un nom standardisé pour la référence future
    $standardReportPath = Join-Path -Path (Get-Location) -ChildPath "RAPPORT_PERFORMANCE_INITIAL.md"
    Copy-Item -Path $combinedReportPath -Destination $standardReportPath -Force
    Write-Host "Copie standardisée créée: $standardReportPath" -ForegroundColor Green
}
else {
    Write-Host "Impossible de trouver les rapports de performance récents." -ForegroundColor Red
}

# Arrêter le serveur si nous l'avons démarré
if ($serverProcess -ne $null) {
    Write-Host "Arrêt du serveur..." -ForegroundColor Cyan
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "Serveur arrêté." -ForegroundColor Green
}

Write-Host "`nAnalyse de performance terminée! Les résultats sont disponibles dans le dossier 'performance/results'." -ForegroundColor Green
