'use strict';

/**
 * Test de performance des animations
 * 
 * Ce script mesure les performances des animations dans GameGuessr
 * et génère un rapport détaillé.
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

// Configuration
const config = {
  url: 'http://localhost:3000/animations', // Page d'exemple d'animations
  iterations: 5, // Nombre d'itérations pour chaque test
  scenarios: [
    { name: 'Sans animation (reducedMotion)', reducedMotion: true },
    { name: 'Animation standard', reducedMotion: false }
  ],
  components: [
    'modal',
    'notification',
    'chat',
    'scoreboard',
    'panorama',
    'navigation'
  ],
  devices: [
    { name: 'Desktop', width: 1920, height: 1080 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Mobile', width: 375, height: 667 }
  ],
  outputFile: './test-results-animation-performance.json'
};

// Fonction principale
async function runAnimationPerformanceTests() {
  console.log('🧪 Démarrage des tests de performance des animations...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = {
    timestamp: new Date().toISOString(),
    summary: {},
    detailedResults: []
  };
  
  try {
    // Parcourir tous les scénarios et appareils
    for (const device of config.devices) {
      console.log(`\n📱 Test sur appareil: ${device.name} (${device.width}x${device.height})`);
      
      for (const scenario of config.scenarios) {
        console.log(`\n🔍 Scénario: ${scenario.name}`);
        
        // Créer une nouvelle page pour chaque scénario
        const page = await browser.newPage();
        await page.setViewport({ width: device.width, height: device.height });
        
        // Activer les performances devtools pour mesurer les FPS et le CPU
        await page.evaluateOnNewDocument(() => {
          window.performanceData = [];
          window.logPerformance = (data) => {
            window.performanceData.push(data);
          };
        });
        
        // Configurer le mode reducedMotion si nécessaire
        if (scenario.reducedMotion) {
          await page.evaluateOnNewDocument(() => {
            // Simuler le media query prefers-reduced-motion
            Object.defineProperty(window, 'matchMedia', {
              writable: true,
              value: jest.fn().mockImplementation(query => ({
                matches: query.includes('reduced-motion'),
                media: query,
                onchange: null,
                addListener: jest.fn(),
                removeListener: jest.fn(),
                addEventListener: jest.fn(),
                removeEventListener: jest.fn(),
                dispatchEvent: jest.fn(),
              })),
            });
          });
        }
        
        // Naviguer vers la page de test
        await page.goto(config.url, { waitUntil: 'networkidle2' });
        
        // Attendre que la page soit complètement chargée
        await page.waitForSelector('[data-testid="animation-examples-loaded"]');
        
        // Pour chaque composant, tester les performances
        for (const component of config.components) {
          console.log(`  🧩 Test du composant: ${component}`);
          
          const componentResults = [];
          
          // Effectuer plusieurs itérations
          for (let i = 0; i < config.iterations; i++) {
            try {
              // Cliquer sur le bouton pour déclencher l'animation
              const buttonSelector = `[data-testid="trigger-${component}"]`;
              await page.waitForSelector(buttonSelector);
              
              // Mettre en place les métriques de performance
              await page.evaluate(() => {
                window.animationPerformance = {
                  frames: 0,
                  startTime: performance.now(),
                  endTime: 0,
                  jsHeapUsed: 0
                };
                
                // Utiliser requestAnimationFrame pour compter les frames
                function countFrame() {
                  window.animationPerformance.frames++;
                  if (performance.now() - window.animationPerformance.startTime < 2000) {
                    requestAnimationFrame(countFrame);
                  } else {
                    window.animationPerformance.endTime = performance.now();
                    window.animationPerformance.jsHeapUsed = 
                      performance.memory ? performance.memory.usedJSHeapSize : 0;
                  }
                }
                requestAnimationFrame(countFrame);
              });
              
              // Cliquer pour déclencher l'animation
              await page.click(buttonSelector);
              
              // Attendre que l'animation soit terminée (2 secondes)
              await page.waitForTimeout(2000);
              
              // Récupérer les résultats de performance
              const performanceData = await page.evaluate(() => {
                const duration = window.animationPerformance.endTime - window.animationPerformance.startTime;
                const fps = window.animationPerformance.frames / (duration / 1000);
                
                return {
                  fps,
                  duration,
                  frameCount: window.animationPerformance.frames,
                  jsHeapUsed: window.animationPerformance.jsHeapUsed,
                  timestamp: new Date().toISOString()
                };
              });
              
              componentResults.push(performanceData);
              console.log(`    ✅ Itération ${i+1}/${config.iterations}: ${Math.round(performanceData.fps)} FPS`);
              
              // Petite pause entre les tests
              await page.waitForTimeout(500);
              
            } catch (error) {
              console.error(`    ❌ Erreur lors de l'itération ${i+1} pour ${component}:`, error.message);
              componentResults.push({ error: error.message });
            }
          }
          
          // Calculer les moyennes
          const validResults = componentResults.filter(r => !r.error);
          const avgFps = validResults.reduce((sum, r) => sum + r.fps, 0) / validResults.length;
          const avgJsHeapUsed = validResults.reduce((sum, r) => sum + r.jsHeapUsed, 0) / validResults.length;
          
          // Ajouter aux résultats détaillés
          results.detailedResults.push({
            device: device.name,
            scenario: scenario.name,
            component,
            averageFps: Math.round(avgFps * 100) / 100,
            averageJsHeapUsed: Math.round(avgJsHeapUsed / (1024 * 1024) * 100) / 100, // En MB
            iterations: componentResults
          });
          
          // Ajouter au résumé
          if (!results.summary[device.name]) {
            results.summary[device.name] = {};
          }
          if (!results.summary[device.name][scenario.name]) {
            results.summary[device.name][scenario.name] = {};
          }
          
          results.summary[device.name][scenario.name][component] = {
            fps: Math.round(avgFps * 100) / 100,
            memoryMB: Math.round(avgJsHeapUsed / (1024 * 1024) * 100) / 100
          };
          
          console.log(`    📊 Moyenne: ${Math.round(avgFps)} FPS, Mémoire: ${Math.round(avgJsHeapUsed / (1024 * 1024) * 100) / 100} MB`);
        }
        
        await page.close();
      }
    }
    
    // Ajouter une analyse des résultats
    results.analysis = analyzeResults(results);
    
    // Enregistrer les résultats dans un fichier
    fs.writeFileSync(
      config.outputFile,
      JSON.stringify(results, null, 2)
    );
    
    console.log(`\n✅ Tests terminés. Résultats enregistrés dans ${config.outputFile}`);
    
  } catch (error) {
    console.error('❌ Erreur lors des tests:', error);
  } finally {
    await browser.close();
  }
  
  return results;
}

// Analyser les résultats pour faire des recommandations
function analyzeResults(results) {
  const analysis = {
    recommendedFallbacks: [],
    performanceIssues: [],
    overallAssessment: '',
    optimizationSuggestions: []
  };
  
  // Parcourir les résultats pour identifier les problèmes
  for (const device in results.summary) {
    const deviceResults = results.summary[device];
    
    // Comparer les scénarios avec et sans animation
    const withAnimation = deviceResults['Animation standard'] || {};
    const withoutAnimation = deviceResults['Sans animation (reducedMotion)'] || {};
    
    for (const component in withAnimation) {
      const animationFps = withAnimation[component]?.fps || 0;
      const noAnimationFps = withoutAnimation[component]?.fps || 0;
      
      // Si les FPS avec animation sont inférieurs à 30 sur mobile, c'est problématique
      if (device === 'Mobile' && animationFps < 30) {
        analysis.performanceIssues.push(
          `Problème de performance critique pour le composant "${component}" sur ${device}: ${animationFps} FPS`
        );
        analysis.recommendedFallbacks.push(
          `Utiliser une version simplifiée de l'animation pour "${component}" sur ${device}`
        );
      }
      
      // Si la différence entre avec/sans animation est très grande (plus de 40%)
      if (noAnimationFps > 0 && (noAnimationFps - animationFps) / noAnimationFps > 0.4) {
        analysis.performanceIssues.push(
          `L'animation du composant "${component}" sur ${device} réduit les performances de plus de 40%`
        );
        analysis.optimizationSuggestions.push(
          `Optimiser l'animation du composant "${component}" pour ${device}`
        );
      }
    }
  }
  
  // Évaluation globale
  const allComponentsAllDevices = results.detailedResults.filter(r => r.scenario === 'Animation standard');
  const avgFpsAllTests = allComponentsAllDevices.reduce((sum, r) => sum + r.averageFps, 0) / allComponentsAllDevices.length;
  
  if (avgFpsAllTests >= 55) {
    analysis.overallAssessment = 'Excellent - Les animations sont très fluides sur la plupart des appareils';
  } else if (avgFpsAllTests >= 45) {
    analysis.overallAssessment = 'Bon - Les animations sont généralement fluides, avec quelques optimisations possibles';
  } else if (avgFpsAllTests >= 30) {
    analysis.overallAssessment = 'Acceptable - Les animations fonctionnent, mais des optimisations sont nécessaires';
  } else {
    analysis.overallAssessment = 'Problématique - Des problèmes significatifs de performance nécessitent une refonte des animations';
  }
  
  // Ajouter des suggestions générales
  if (analysis.performanceIssues.length > 0) {
    analysis.optimizationSuggestions.push(
      'Utiliser des techniques CSS plutôt que JS quand possible pour les animations'
    );
    analysis.optimizationSuggestions.push(
      'Réduire la complexité des animations sur les appareils mobiles'
    );
    analysis.optimizationSuggestions.push(
      'Implémenter des fallbacks automatiques pour les appareils à faible puissance'
    );
  }
  
  return analysis;
}

// Exécuter le test si le script est appelé directement
if (require.main === module) {
  runAnimationPerformanceTests()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Erreur fatale:', err);
      process.exit(1);
    });
}

module.exports = { runAnimationPerformanceTests };
