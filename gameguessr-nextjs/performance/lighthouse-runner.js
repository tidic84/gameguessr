const fs = require('fs');
const path = require('path');
const lighthouse = require('lighthouse');
const puppeteer = require('puppeteer');
const { URL } = require('url');

// Configuration
const BASE_URL = 'http://localhost:3000';
const ROUTES = [
  '/',                        // Page d'accueil
  '/create-room',             // Création de salle
  '/animations',              // Page d'animations (pour référence)
];

// Options Lighthouse
const LIGHTHOUSE_OPTIONS = {
  logLevel: 'info',
  output: 'html',
  onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
  disableStorageReset: false,
  formFactor: 'desktop',
  throttling: {
    rttMs: 40,
    throughputKbps: 10240,
    cpuSlowdownMultiplier: 1
  }
};

// Options Lighthouse Mobile
const LIGHTHOUSE_MOBILE_OPTIONS = {
  ...LIGHTHOUSE_OPTIONS,
  formFactor: 'mobile',
  screenEmulation: {
    mobile: true,
    width: 375,
    height: 667,
    deviceScaleFactor: 2,
    disabled: false,
  },
  throttling: {
    rttMs: 150,
    throughputKbps: 1638,
    cpuSlowdownMultiplier: 4
  }
};

// Vérifier/créer le dossier de résultats
const RESULTS_DIR = path.join(__dirname, 'results');
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Fonction pour générer un rapport Lighthouse
async function runLighthouse(url, options, port) {
  const results = await lighthouse(url, { port }, options);
  return results;
}

// Fonction pour sauvegarder les résultats
function saveResults(results, name, device) {
  const dateStr = new Date().toISOString().replace(/:/g, '-').substring(0, 19);
  const htmlPath = path.join(RESULTS_DIR, `${name}-${device}-${dateStr}.html`);
  const jsonPath = path.join(RESULTS_DIR, `${name}-${device}-${dateStr}.json`);
  
  fs.writeFileSync(htmlPath, results.report[0]);
  fs.writeFileSync(jsonPath, JSON.stringify(results.lhr, null, 2));
  
  return {
    html: htmlPath,
    json: jsonPath
  };
}

// Fonction pour extraire et sauvegarder un résumé des métriques
function saveMetricsSummary(results, allResults) {
  const metrics = {
    date: new Date().toISOString(),
    routes: {}
  };
  
  for (const result of allResults) {
    const { url, device, lhr } = result;
    const route = new URL(url).pathname || '/';
    const routeName = route === '/' ? 'home' : route.substring(1).replace(/\//g, '-');
    
    if (!metrics.routes[routeName]) {
      metrics.routes[routeName] = {};
    }
    
    metrics.routes[routeName][device] = {
      performance: lhr.categories.performance.score * 100,
      accessibility: lhr.categories.accessibility.score * 100,
      bestPractices: lhr.categories['best-practices'].score * 100,
      seo: lhr.categories.seo.score * 100,
      fcp: lhr.audits['first-contentful-paint'].numericValue,
      lcp: lhr.audits['largest-contentful-paint'].numericValue,
      tbt: lhr.audits['total-blocking-time'].numericValue,
      cls: lhr.audits['cumulative-layout-shift'].numericValue,
      tti: lhr.audits['interactive'].numericValue,
      speedIndex: lhr.audits['speed-index'].numericValue,
      totalByteWeight: lhr.audits['total-byte-weight'].numericValue,
      mainThreadWork: lhr.audits['mainthread-work-breakdown'].numericValue,
    };
  }
  
  const summaryPath = path.join(RESULTS_DIR, 'metrics-summary.json');
  let existingMetrics = [];
  
  if (fs.existsSync(summaryPath)) {
    try {
      existingMetrics = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));
      if (!Array.isArray(existingMetrics)) {
        existingMetrics = [];
      }
    } catch (e) {
      console.error('Error reading existing metrics:', e);
      existingMetrics = [];
    }
  }
  
  existingMetrics.push(metrics);
  fs.writeFileSync(summaryPath, JSON.stringify(existingMetrics, null, 2));
  
  // Générer un rapport Markdown
  generateMarkdownReport(metrics);
  
  return summaryPath;
}

// Fonction pour générer un rapport Markdown
function generateMarkdownReport(metrics) {
  let markdown = `# Rapport de Performance - ${new Date().toLocaleDateString()}\n\n`;
  
  markdown += `## Résumé des Métriques\n\n`;
  
  for (const [routeName, devices] of Object.entries(metrics.routes)) {
    markdown += `### Route: /${routeName === 'home' ? '' : routeName}\n\n`;
    
    markdown += `| Métrique | Desktop | Mobile |\n`;
    markdown += `|----------|---------|--------|\n`;
    
    if (devices.desktop && devices.mobile) {
      markdown += `| Performance | ${devices.desktop.performance.toFixed(1)}% | ${devices.mobile.performance.toFixed(1)}% |\n`;
      markdown += `| Accessibilité | ${devices.desktop.accessibility.toFixed(1)}% | ${devices.mobile.accessibility.toFixed(1)}% |\n`;
      markdown += `| Bonnes pratiques | ${devices.desktop.bestPractices.toFixed(1)}% | ${devices.mobile.bestPractices.toFixed(1)}% |\n`;
      markdown += `| SEO | ${devices.desktop.seo.toFixed(1)}% | ${devices.mobile.seo.toFixed(1)}% |\n`;
      markdown += `| FCP | ${(devices.desktop.fcp / 1000).toFixed(2)}s | ${(devices.mobile.fcp / 1000).toFixed(2)}s |\n`;
      markdown += `| LCP | ${(devices.desktop.lcp / 1000).toFixed(2)}s | ${(devices.mobile.lcp / 1000).toFixed(2)}s |\n`;
      markdown += `| TBT | ${devices.desktop.tbt.toFixed(0)}ms | ${devices.mobile.tbt.toFixed(0)}ms |\n`;
      markdown += `| CLS | ${devices.desktop.cls.toFixed(3)} | ${devices.mobile.cls.toFixed(3)} |\n`;
      markdown += `| TTI | ${(devices.desktop.tti / 1000).toFixed(2)}s | ${(devices.mobile.tti / 1000).toFixed(2)}s |\n`;
      markdown += `| Speed Index | ${(devices.desktop.speedIndex / 1000).toFixed(2)}s | ${(devices.mobile.speedIndex / 1000).toFixed(2)}s |\n`;
      markdown += `| Taille totale | ${(devices.desktop.totalByteWeight / 1024 / 1024).toFixed(2)}MB | ${(devices.mobile.totalByteWeight / 1024 / 1024).toFixed(2)}MB |\n`;
    }
    
    markdown += `\n`;
  }
  
  markdown += `## Explications des métriques\n\n`;
  markdown += `- **FCP (First Contentful Paint)** : temps jusqu'au premier rendu de contenu visible\n`;
  markdown += `- **LCP (Largest Contentful Paint)** : temps jusqu'au rendu du plus grand élément visible\n`;
  markdown += `- **TBT (Total Blocking Time)** : temps total pendant lequel le thread principal est bloqué\n`;
  markdown += `- **CLS (Cumulative Layout Shift)** : mesure des changements de mise en page inattendus\n`;
  markdown += `- **TTI (Time to Interactive)** : temps jusqu'à ce que la page soit pleinement interactive\n`;
  markdown += `- **Speed Index** : vitesse à laquelle le contenu est visuellement affiché\n\n`;
  
  markdown += `## Recommandations basées sur les résultats\n\n`;
  markdown += `À compléter après analyse des résultats.\n\n`;
  
  const reportPath = path.join(RESULTS_DIR, `performance-report-${new Date().toISOString().substring(0, 10)}.md`);
  fs.writeFileSync(reportPath, markdown);
  
  return reportPath;
}

// Fonction principale
async function main() {
  // Démarrer le serveur de l'application si nécessaire
  console.log('Assurez-vous que votre application est en cours d\'exécution sur http://localhost:3000');
  
  // Lancer le navigateur
  const browser = await puppeteer.launch({
    headless: 'new',
    defaultViewport: null,
  });
  
  const allResults = [];
  
  try {
    const { port } = new URL(browser.wsEndpoint());
    
    // Tester chaque route en desktop et mobile
    for (const route of ROUTES) {
      const url = `${BASE_URL}${route}`;
      console.log(`\nTesting ${url} (Desktop)...`);
      
      // Test Desktop
      const desktopResults = await runLighthouse(url, LIGHTHOUSE_OPTIONS, port);
      const desktopFiles = saveResults(desktopResults, route === '/' ? 'home' : route.substring(1), 'desktop');
      console.log(`  Desktop report saved to: ${desktopFiles.html}`);
      
      allResults.push({
        url,
        device: 'desktop',
        lhr: desktopResults.lhr
      });
      
      // Test Mobile
      console.log(`Testing ${url} (Mobile)...`);
      const mobileResults = await runLighthouse(url, LIGHTHOUSE_MOBILE_OPTIONS, port);
      const mobileFiles = saveResults(mobileResults, route === '/' ? 'home' : route.substring(1), 'mobile');
      console.log(`  Mobile report saved to: ${mobileFiles.html}`);
      
      allResults.push({
        url,
        device: 'mobile',
        lhr: mobileResults.lhr
      });
    }
    
    // Sauvegarder le résumé des métriques
    const summaryPath = saveMetricsSummary(null, allResults);
    console.log(`\nMetrics summary saved to: ${summaryPath}`);
    
  } finally {
    await browser.close();
  }
}

// Exécuter le script
main().catch(error => {
  console.error('Error running Lighthouse:', error);
  process.exit(1);
});
