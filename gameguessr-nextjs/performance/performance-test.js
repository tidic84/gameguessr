const fs = require('fs');
const path = require('path');
const puppeteer = require('puppeteer');

// Configuration
const BASE_URL = 'http://localhost:3000';
const ROUTES = [
  { path: '/', name: 'Accueil' },
  { path: '/create-room', name: 'Création de salle' },
  // Ajouter d'autres routes à tester
];

// Scénarios de test
const SCENARIOS = [
  {
    name: 'Chargement initial',
    action: async (page) => {
      // Simplement charger la page
    }
  },
  {
    name: 'Interaction avec panorama',
    action: async (page) => {
      // Simuler des interactions avec le panorama 360°
      await page.waitForSelector('.panorama-viewer', { timeout: 10000 });
      
      // Simuler des déplacements de souris pour faire tourner le panorama
      const viewer = await page.$('.panorama-viewer');
      if (viewer) {
        const box = await viewer.boundingBox();
        const centerX = box.x + box.width / 2;
        const centerY = box.y + box.height / 2;
        
        await page.mouse.move(centerX, centerY);
        await page.mouse.down();
        
        // Mouvement horizontal
        for (let i = 0; i < 10; i++) {
          await page.mouse.move(centerX - (i * 20), centerY, { steps: 5 });
          await page.waitForTimeout(100);
        }
        
        await page.mouse.up();
        await page.waitForTimeout(500);
      }
    }
  },
  {
    name: 'Interaction avec chat',
    action: async (page) => {
      // Simuler l'envoi de messages dans le chat
      await page.waitForSelector('input[placeholder*="message"], textarea[placeholder*="message"]', { timeout: 10000 });
      
      // Entrer un message et l'envoyer
      await page.type('input[placeholder*="message"], textarea[placeholder*="message"]', 'Test de performance du chat');
      await page.keyboard.press('Enter');
      
      // Attendre un peu pour voir l'affichage du message
      await page.waitForTimeout(1000);
    }
  }
];

// Configurations de test
const TEST_CONFIGS = [
  { 
    name: 'desktop',
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/117.0.0.0 Safari/537.36'
  },
  { 
    name: 'mobile',
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  }
];

// Fonction pour collecter les métriques de performance
async function collectPerformanceMetrics(page) {
  // Collecter les métriques de base de Puppeteer
  const metrics = await page.metrics();
  
  // Collecter les métriques de performance Web
  const performanceEntries = await page.evaluate(() => {
    return JSON.parse(JSON.stringify(performance.getEntriesByType('navigation')));
  });
  
  // Collecter les métriques FPS (Frames Per Second)
  const fpsSamples = [];
  let prevTimestamp = 0;
  
  for (let i = 0; i < 10; i++) {
    const fpsInfo = await page.evaluate(() => {
      return new Promise(resolve => {
        requestAnimationFrame(timestamp => {
          resolve(timestamp);
        });
      });
    });
    
    if (prevTimestamp) {
      const fps = Math.round(1000 / (fpsInfo - prevTimestamp));
      fpsSamples.push(fps);
    }
    
    prevTimestamp = fpsInfo;
    await page.waitForTimeout(100);
  }
  
  const averageFps = fpsSamples.length > 0 
    ? fpsSamples.reduce((sum, fps) => sum + fps, 0) / fpsSamples.length 
    : 0;
  
  return {
    jsHeapUsed: Math.round(metrics.JSHeapUsedSize / (1024 * 1024) * 100) / 100, // MB
    jsHeapTotal: Math.round(metrics.JSHeapTotalSize / (1024 * 1024) * 100) / 100, // MB
    nodes: metrics.Nodes,
    domNodes: await page.evaluate(() => document.querySelectorAll('*').length),
    renderTime: performanceEntries.length > 0 ? performanceEntries[0].domContentLoadedEventEnd : null,
    loadTime: performanceEntries.length > 0 ? performanceEntries[0].loadEventEnd : null,
    fps: Math.round(averageFps),
    fpsSamples,
    timeToFirstByte: performanceEntries.length > 0 ? performanceEntries[0].responseStart : null,
    firstPaint: await page.evaluate(() => {
      const paint = performance.getEntriesByType('paint').find(entry => entry.name === 'first-paint');
      return paint ? paint.startTime : null;
    }),
    firstContentfulPaint: await page.evaluate(() => {
      const paint = performance.getEntriesByType('paint').find(entry => entry.name === 'first-contentful-paint');
      return paint ? paint.startTime : null;
    }),
  };
}

// Fonction pour exécuter un test de performance
async function runPerformanceTest(browser, route, config, scenario) {
  console.log(`Testing ${route.name} (${config.name}) - ${scenario.name}...`);
  
  const page = await browser.newPage();
  await page.setViewport(config.viewport);
  await page.setUserAgent(config.userAgent);
  
  // Activer les métriques de performance
  const client = await page.target().createCDPSession();
  await client.send('Performance.enable');
  
  // Démarrer le suivi des performances
  let results = {};
  
  try {
    // Naviguer vers la page
    const url = `${BASE_URL}${route.path}`;
    
    // Vider le cache et les cookies
    await page._client.send('Network.clearBrowserCache');
    await page._client.send('Network.clearBrowserCookies');
    
    // Charger la page
    const start = Date.now();
    await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });
    const loadTime = Date.now() - start;
    
    // Attendre un peu pour que la page se stabilise
    await page.waitForTimeout(1000);
    
    // Exécuter le scénario
    await scenario.action(page);
    
    // Collecter les métriques
    results = await collectPerformanceMetrics(page);
    results.loadTime = loadTime;
    
    // Faire une capture d'écran
    const screenshotDir = path.join(__dirname, 'results', 'screenshots');
    if (!fs.existsSync(screenshotDir)) {
      fs.mkdirSync(screenshotDir, { recursive: true });
    }
    
    const screenshotPath = path.join(
      screenshotDir, 
      `${route.path.replace(/\//g, '-') || 'home'}-${config.name}-${scenario.name.replace(/\s+/g, '-')}.png`
    );
    
    await page.screenshot({ path: screenshotPath, fullPage: true });
    
  } catch (error) {
    console.error(`Error testing ${route.name} (${config.name}) - ${scenario.name}:`, error);
    results.error = error.message;
  } finally {
    await page.close();
  }
  
  return {
    route: route.name,
    path: route.path,
    device: config.name,
    scenario: scenario.name,
    timestamp: new Date().toISOString(),
    ...results
  };
}

// Fonction principale pour exécuter tous les tests
async function main() {
  console.log('Démarrage des tests de performance...');
  
  // Vérifier/créer le dossier de résultats
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  // Lancer le navigateur
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--disable-gpu', '--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  const allResults = [];
  
  try {
    // Exécuter tous les tests
    for (const route of ROUTES) {
      for (const config of TEST_CONFIGS) {
        for (const scenario of SCENARIOS) {
          const result = await runPerformanceTest(browser, route, config, scenario);
          allResults.push(result);
          
          // Attendre un peu entre les tests pour éviter les interférences
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    // Sauvegarder les résultats
    const resultsPath = path.join(resultsDir, `performance-results-${new Date().toISOString().replace(/:/g, '-').substring(0, 19)}.json`);
    fs.writeFileSync(resultsPath, JSON.stringify(allResults, null, 2));
    console.log(`Résultats sauvegardés dans: ${resultsPath}`);
    
    // Générer un rapport Markdown
    const reportPath = generateMarkdownReport(allResults);
    console.log(`Rapport généré dans: ${reportPath}`);
    
  } finally {
    await browser.close();
  }
}

// Fonction pour générer un rapport Markdown
function generateMarkdownReport(results) {
  let markdown = `# Rapport de Tests de Performance - ${new Date().toLocaleDateString()}\n\n`;
  
  markdown += `## Résumé\n\n`;
  
  // Regrouper par route
  const routeGroups = {};
  for (const result of results) {
    const routeKey = result.path || '/';
    if (!routeGroups[routeKey]) {
      routeGroups[routeKey] = [];
    }
    routeGroups[routeKey].push(result);
  }
  
  // Créer un tableau pour chaque route
  for (const [routePath, routeResults] of Object.entries(routeGroups)) {
    const routeName = routeResults[0].route;
    markdown += `### ${routeName} (${routePath})\n\n`;
    
    markdown += `| Scénario | Device | Temps chargement | FPS | Mémoire JS | DOM Nodes | First Paint | First Contentful Paint |\n`;
    markdown += `|----------|--------|-----------------|-----|------------|-----------|-------------|------------------------|\n`;
    
    for (const result of routeResults) {
      markdown += `| ${result.scenario} | ${result.device} | ${result.loadTime}ms | ${result.fps || 'N/A'} | ${result.jsHeapUsed}MB | ${result.domNodes} | ${result.firstPaint ? Math.round(result.firstPaint) + 'ms' : 'N/A'} | ${result.firstContentfulPaint ? Math.round(result.firstContentfulPaint) + 'ms' : 'N/A'} |\n`;
    }
    
    markdown += `\n`;
  }
  
  markdown += `## Analyse et Recommandations\n\n`;
  
  // Détecter les problèmes potentiels
  let hasLowFps = false;
  let hasHighMemory = false;
  let hasSlowLoading = false;
  
  for (const result of results) {
    if (result.fps && result.fps < 30) hasLowFps = true;
    if (result.jsHeapUsed > 100) hasHighMemory = true;
    if (result.loadTime > 3000) hasSlowLoading = true;
  }
  
  if (hasLowFps) {
    markdown += `- **Problème de FPS détecté**: Certains scénarios ont un taux de rafraîchissement inférieur à 30 FPS, ce qui peut indiquer des problèmes de performance dans le rendu ou les animations.\n\n`;
  }
  
  if (hasHighMemory) {
    markdown += `- **Utilisation élevée de mémoire**: Certains scénarios utilisent plus de 100MB de mémoire JavaScript, ce qui peut indiquer des fuites de mémoire ou une gestion inefficace des ressources.\n\n`;
  }
  
  if (hasSlowLoading) {
    markdown += `- **Temps de chargement lent**: Certaines pages prennent plus de 3 secondes à charger, ce qui peut nuire à l'expérience utilisateur.\n\n`;
  }
  
  markdown += `### Recommandations générales\n\n`;
  markdown += `1. Optimiser les images et les assets statiques\n`;
  markdown += `2. Mettre en place le lazy loading pour les contenus hors écran\n`;
  markdown += `3. Implémenter une stratégie de mise en cache efficace\n`;
  markdown += `4. Optimiser les dépendances et réduire la taille du bundle JavaScript\n`;
  markdown += `5. Mettre en place le code splitting pour charger uniquement le code nécessaire\n`;
  
  const reportPath = path.join(__dirname, 'results', `performance-test-report-${new Date().toISOString().substring(0, 10)}.md`);
  fs.writeFileSync(reportPath, markdown);
  
  return reportPath;
}

// Exécuter le script
main().catch(error => {
  console.error('Error running performance tests:', error);
  process.exit(1);
});
