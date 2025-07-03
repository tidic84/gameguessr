const puppeteer = require('puppeteer');
const lighthouse = require('lighthouse');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const TEST_URL = 'http://localhost:3000';
const GAME_ROOM_URL = 'http://localhost:3000/room/test';
const METRICS_FILE = path.join(__dirname, 'results', 'performance-validation.json');

// Configuration pour Lighthouse
const LIGHTHOUSE_OPTIONS = {
  logLevel: 'info',
  output: 'json',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  port: 9222,
};

// Métriques personnalisées à surveiller
const CUSTOM_METRICS = {
  TTFB: 'timeToFirstByte',
  FCP: 'firstContentfulPaint',
  LCP: 'largestContentfulPaint',
  TBT: 'totalBlockingTime',
  CLS: 'cumulativeLayoutShift',
  TTI: 'timeToInteractive',
};

async function setupTestEnvironment() {
  // Démarrer le serveur en mode production
  console.log('🚀 Démarrage du serveur de production...');
  execSync('npm run build', { stdio: 'inherit' });
  const serverProcess = require('child_process').spawn('npm', ['start'], {
    stdio: 'inherit',
    detached: true,
  });

  // Attendre que le serveur soit prêt
  await new Promise(resolve => setTimeout(resolve, 5000));
  return serverProcess;
}

async function measurePagePerformance(url, description) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disabled-setuid-sandbox'],
  });
  
  const page = await browser.newPage();
  await page.setCacheEnabled(false);

  // Collecter les métriques de performance
  const metrics = {};
  page.on('metrics', ({ metrics: perf }) => {
    metrics.JSHeapUsed = Math.round(perf.JSHeapUsedSize / 1024 / 1024);
    metrics.JSHeapTotal = Math.round(perf.JSHeapTotalSize / 1024 / 1024);
  });

  // Mesurer le temps de chargement initial
  const start = Date.now();
  await page.goto(url, { waitUntil: 'networkidle0' });
  metrics.pageLoadTime = Date.now() - start;

  // Exécuter Lighthouse
  const { lhr } = await lighthouse(url, LIGHTHOUSE_OPTIONS);
  
  const results = {
    description,
    timestamp: new Date().toISOString(),
    url,
    metrics: {
      ...metrics,
      performance: Math.round(lhr.categories.performance.score * 100),
      accessibility: Math.round(lhr.categories.accessibility.score * 100),
      bestPractices: Math.round(lhr.categories['best-practices'].score * 100),
      seo: Math.round(lhr.categories.seo.score * 100),
    },
    customMetrics: {},
  };

  // Ajouter les métriques personnalisées
  for (const [key, metric] of Object.entries(CUSTOM_METRICS)) {
    results.customMetrics[key] = lhr.audits[metric]?.numericValue || null;
  }

  await browser.close();
  return results;
}

async function measureGameRoomPerformance() {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  
  // Mesurer les performances du chat
  await page.goto(GAME_ROOM_URL);
  await page.waitForSelector('.chat-container');
  
  const chatMetrics = await page.evaluate(async () => {
    const messages = Array(50).fill(null).map((_, i) => ({
      id: `test_${i}`,
      message: `Test message ${i}`,
      userId: 'test-user',
      userName: 'Tester',
      timestamp: new Date(),
      type: 'user',
    }));
    
    const start = performance.now();
    // Simuler l'ajout de messages en batch
    window.dispatchEvent(new CustomEvent('test-chat-batch', { detail: messages }));
    await new Promise(r => setTimeout(r, 100));
    return {
      chatRenderTime: performance.now() - start,
      memoryUsage: performance.memory?.usedJSHeapSize || 0,
    };
  });

  // Mesurer les performances des panoramas
  const panoMetrics = await page.evaluate(async () => {
    const start = performance.now();
    // Simuler un changement de panorama
    window.dispatchEvent(new CustomEvent('change-panorama'));
    await new Promise(r => setTimeout(r, 1000));
    return {
      panoramaLoadTime: performance.now() - start,
    };
  });

  await browser.close();
  return { chatMetrics, panoMetrics };
}

async function validatePerformance() {
  try {
    // Créer le dossier results s'il n'existe pas
    if (!fs.existsSync(path.join(__dirname, 'results'))) {
      fs.mkdirSync(path.join(__dirname, 'results'));
    }

    // Démarrer l'environnement de test
    const serverProcess = await setupTestEnvironment();

    console.log('📊 Mesure des performances...');
    
    // Tester la page d'accueil
    const homeResults = await measurePagePerformance(TEST_URL, 'Page d\'accueil');
    
    // Tester une salle de jeu
    const gameResults = await measurePagePerformance(GAME_ROOM_URL, 'Salle de jeu');
    
    // Tester les performances spécifiques au jeu
    const gameSpecificResults = await measureGameRoomPerformance();

    // Compiler tous les résultats
    const results = {
      timestamp: new Date().toISOString(),
      pages: [homeResults, gameResults],
      gameSpecific: gameSpecificResults,
    };

    // Sauvegarder les résultats
    fs.writeFileSync(METRICS_FILE, JSON.stringify(results, null, 2));
    
    // Arrêter le serveur
    process.kill(-serverProcess.pid);
    
    console.log('✅ Tests de performance terminés');
    console.log(`📝 Résultats sauvegardés dans ${METRICS_FILE}`);
    
    return results;
  } catch (error) {
    console.error('❌ Erreur lors des tests de performance:', error);
    throw error;
  }
}

// Exécuter la validation
validatePerformance();
