# test-animation-performance.ps1
# Script PowerShell pour exécuter les tests de performance des animations

# Vérifier si le serveur est en cours d'exécution
$serverProcess = Get-Process -Name "node" -ErrorAction SilentlyContinue | 
    Where-Object { $_.CommandLine -like "*server*.js*" -or $_.CommandLine -like "*next*.js*" }

if (-not $serverProcess) {
    Write-Host "Serveur Next.js non détecté. Démarrage du serveur..." -ForegroundColor Yellow
    Start-Process -FilePath "npm" -ArgumentList "run dev" -NoNewWindow -WorkingDirectory (Get-Location)
    
    # Attendre que le serveur soit prêt
    Write-Host "Attente du démarrage du serveur Next.js..."
    Start-Sleep -Seconds 10
}

# Exécuter le test de performance des animations
Write-Host "Exécution des tests de performance des animations..." -ForegroundColor Cyan
node test-animation-performance.js

# Vérifier si les tests ont réussi
if ($LASTEXITCODE -eq 0) {
    Write-Host "Tests de performance des animations terminés avec succès!" -ForegroundColor Green
    
    # Afficher le résumé des résultats
    $resultsFile = "./test-results-animation-performance.json"
    if (Test-Path $resultsFile) {
        $results = Get-Content $resultsFile | ConvertFrom-Json
        
        Write-Host "`nRésumé des performances d'animation:" -ForegroundColor Cyan
        Write-Host "=======================================" -ForegroundColor Cyan
        
        foreach ($device in $results.summary | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name) {
            Write-Host "`nAppareil: $device" -ForegroundColor Yellow
            
            $deviceData = $results.summary.$device
            foreach ($scenario in $deviceData | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name) {
                Write-Host "  Scénario: $scenario" -ForegroundColor White
                
                $scenarioData = $deviceData.$scenario
                foreach ($component in $scenarioData | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name) {
                    $fps = $scenarioData.$component.fps
                    $memory = $scenarioData.$component.memoryMB
                    
                    # Déterminer la couleur en fonction du FPS
                    $color = "Green"
                    if ($fps -lt 30) { $color = "Red" }
                    elseif ($fps -lt 45) { $color = "Yellow" }
                    
                    Write-Host "    $component : " -NoNewline
                    Write-Host "$fps FPS" -ForegroundColor $color -NoNewline
                    Write-Host ", $memory MB" -ForegroundColor Cyan
                }
            }
        }
        
        # Afficher l'évaluation globale et les recommandations
        Write-Host "`nÉvaluation globale:" -ForegroundColor Cyan
        Write-Host "===================" -ForegroundColor Cyan
        Write-Host $results.analysis.overallAssessment -ForegroundColor White
        
        if ($results.analysis.performanceIssues.Count -gt 0) {
            Write-Host "`nProblèmes de performance identifiés:" -ForegroundColor Yellow
            foreach ($issue in $results.analysis.performanceIssues) {
                Write-Host "- $issue" -ForegroundColor Yellow
            }
        }
        
        if ($results.analysis.optimizationSuggestions.Count -gt 0) {
            Write-Host "`nSuggestions d'optimisation:" -ForegroundColor Green
            foreach ($suggestion in $results.analysis.optimizationSuggestions) {
                Write-Host "- $suggestion" -ForegroundColor Green
            }
        }
        
        # Créer un rapport Markdown
        $reportFile = "./RAPPORT_PERFORMANCE_ANIMATIONS.md"
        Write-Host "`nCréation du rapport Markdown: $reportFile" -ForegroundColor Cyan
        
        $markdownContent = @"
# Rapport de Performance des Animations

## Résumé des Résultats

Date du test: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Évaluation globale: **$($results.analysis.overallAssessment)**

## Résultats par Appareil

"@
        
        foreach ($device in $results.summary | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name) {
            $markdownContent += @"
### $device

"@
            $deviceData = $results.summary.$device
            foreach ($scenario in $deviceData | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name) {
                $markdownContent += @"
#### $scenario

| Composant | FPS | Mémoire (MB) | Évaluation |
|-----------|-----|--------------|------------|
"@
                
                $scenarioData = $deviceData.$scenario
                foreach ($component in $scenarioData | Get-Member -MemberType NoteProperty | Select-Object -ExpandProperty Name) {
                    $fps = $scenarioData.$component.fps
                    $memory = $scenarioData.$component.memoryMB
                    
                    # Déterminer l'évaluation
                    $evaluation = "Excellent"
                    if ($fps -lt 30) { $evaluation = "Problématique" }
                    elseif ($fps -lt 45) { $evaluation = "Acceptable" }
                    elseif ($fps -lt 55) { $evaluation = "Bon" }
                    
                    $markdownContent += @"
| $component | $fps | $memory | $evaluation |
"@
                }
                
                $markdownContent += "`n"
            }
        }
        
        $markdownContent += @"

## Analyse des Performances

"@
        
        if ($results.analysis.performanceIssues.Count -gt 0) {
            $markdownContent += @"
### Problèmes Identifiés

"@
            foreach ($issue in $results.analysis.performanceIssues) {
                $markdownContent += @"
- $issue
"@
            }
            $markdownContent += "`n"
        }
        
        if ($results.analysis.optimizationSuggestions.Count -gt 0) {
            $markdownContent += @"
### Recommandations d'Optimisation

"@
            foreach ($suggestion in $results.analysis.optimizationSuggestions) {
                $markdownContent += @"
- $suggestion
"@
            }
            $markdownContent += "`n"
        }
        
        if ($results.analysis.recommendedFallbacks.Count -gt 0) {
            $markdownContent += @"
### Fallbacks Recommandés

"@
            foreach ($fallback in $results.analysis.recommendedFallbacks) {
                $markdownContent += @"
- $fallback
"@
            }
            $markdownContent += "`n"
        }
        
        $markdownContent += @"

## Recommandations Générales

1. Assurez-vous que l'option de mouvement réduit est respectée pour améliorer l'accessibilité
2. Utilisez des animations CSS plutôt que JS quand possible pour de meilleures performances
3. Appliquez des optimisations spécifiques pour les appareils mobiles (animations simplifiées)
4. Implémentez un système de détection automatique des performances pour adapter les animations

## Prochaines Étapes

1. Implémenter les optimisations recommandées
2. Refactoriser les animations problématiques identifiées
3. Ajouter des tests de régression pour les performances d'animation
4. Documenter les meilleures pratiques pour les futures animations

"@
        
        $markdownContent | Out-File -FilePath $reportFile -Encoding utf8
        Write-Host "Rapport Markdown créé avec succès: $reportFile" -ForegroundColor Green
    } else {
        Write-Host "Fichier de résultats non trouvé: $resultsFile" -ForegroundColor Red
    }
} else {
    Write-Host "Les tests de performance des animations ont échoué avec le code d'erreur $LASTEXITCODE" -ForegroundColor Red
}

# Mettre à jour le statut de la tâche
Write-Host "Voulez-vous mettre à jour le statut de la tâche 6.14 à 'done' si les tests sont réussis? (O/N)" -ForegroundColor Yellow
$updateTask = Read-Host

if ($updateTask -eq "O" -or $updateTask -eq "o") {
    # Supposons que nous sommes dans le répertoire du projet
    $projectRoot = Get-Location
    node task-master set-task-status --id 6.14 --status done --project-root $projectRoot
    Write-Host "Statut de la tâche 6.14 mis à jour à 'done'" -ForegroundColor Green
}
