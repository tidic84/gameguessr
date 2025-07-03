const fs = require('fs');
const path = require('path');

const METRICS_FILE = path.join(__dirname, 'results', 'performance-validation.json');
const REPORT_FILE = path.join(__dirname, 'results', 'performance-validation-report.md');
const THRESHOLD_FILE = path.join(__dirname, 'performance-thresholds.json');

// Seuils de performance attendus
const DEFAULT_THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  bestPractices: 95,
  seo: 95,
  metrics: {
    TTFB: 200,
    FCP: 1000,
    LCP: 2500,
    TBT: 200,
    CLS: 0.1,
    TTI: 3500
  },
  game: {
    chatRenderTime: 100,
    panoramaLoadTime: 1000
  }
};

function loadThresholds() {
  try {
    return require(THRESHOLD_FILE);
  } catch {
    return DEFAULT_THRESHOLDS;
  }
}

function formatMetric(value, threshold, unit = '') {
  const status = value <= threshold ? '✅' : '❌';
  return `${status} ${value}${unit} (seuil: ${threshold}${unit})`;
}

function generateReport(results, thresholds) {
  let report = `# Rapport de Validation des Performances - GameGuessr

## Date du test : ${new Date(results.timestamp).toLocaleString('fr-FR')}

## 1. Performance Globale

`;

  results.pages.forEach(page => {
    report += `### ${page.description}
    
| Métrique | Score | Statut |
|----------|--------|--------|
| Performance | ${page.metrics.performance}% | ${formatMetric(page.metrics.performance, thresholds.performance, '%')} |
| Accessibilité | ${page.metrics.accessibility}% | ${formatMetric(page.metrics.accessibility, thresholds.accessibility, '%')} |
| Bonnes Pratiques | ${page.metrics.bestPractices}% | ${formatMetric(page.metrics.bestPractices, thresholds.bestPractices, '%')} |
| SEO | ${page.metrics.seo}% | ${formatMetric(page.metrics.seo, thresholds.seo, '%')} |

#### Métriques Web Vitals :
- TTFB: ${formatMetric(page.customMetrics.TTFB, thresholds.metrics.TTFB, 'ms')}
- FCP: ${formatMetric(page.customMetrics.FCP, thresholds.metrics.FCP, 'ms')}
- LCP: ${formatMetric(page.customMetrics.LCP, thresholds.metrics.LCP, 'ms')}
- TBT: ${formatMetric(page.customMetrics.TBT, thresholds.metrics.TBT, 'ms')}
- CLS: ${formatMetric(page.customMetrics.CLS, thresholds.metrics.CLS)}
- TTI: ${formatMetric(page.customMetrics.TTI, thresholds.metrics.TTI, 'ms')}

`;
  });

  report += `## 2. Performances Spécifiques au Jeu

### Chat
- Temps de rendu pour 50 messages: ${formatMetric(results.gameSpecific.chatMetrics.chatRenderTime, thresholds.game.chatRenderTime, 'ms')}
- Utilisation mémoire: ${Math.round(results.gameSpecific.chatMetrics.memoryUsage / 1024 / 1024)}MB

### Panoramas
- Temps de chargement: ${formatMetric(results.gameSpecific.panoMetrics.panoramaLoadTime, thresholds.game.panoramaLoadTime, 'ms')}

## 3. Analyse des Résultats

${analyzeResults(results, thresholds)}

## 4. Recommandations

${generateRecommendations(results, thresholds)}
`;

  return report;
}

function analyzeResults(results, thresholds) {
  const issues = [];
  const successes = [];

  results.pages.forEach(page => {
    if (page.metrics.performance < thresholds.performance) {
      issues.push(`⚠️ Score de performance faible sur ${page.description}: ${page.metrics.performance}%`);
    } else {
      successes.push(`✨ Bonne performance sur ${page.description}: ${page.metrics.performance}%`);
    }

    // Analyser les Web Vitals
    for (const [key, value] of Object.entries(page.customMetrics)) {
      if (value > thresholds.metrics[key]) {
        issues.push(`⚠️ ${key} élevé sur ${page.description}: ${value}ms`);
      }
    }
  });

  // Analyser les performances spécifiques
  if (results.gameSpecific.chatMetrics.chatRenderTime > thresholds.game.chatRenderTime) {
    issues.push('⚠️ Temps de rendu du chat trop long');
  }
  if (results.gameSpecific.panoMetrics.panoramaLoadTime > thresholds.game.panoramaLoadTime) {
    issues.push('⚠️ Chargement des panoramas trop lent');
  }

  return `
### Points Forts
${successes.map(s => `- ${s}`).join('\n')}

### Points à Améliorer
${issues.map(i => `- ${i}`).join('\n')}
`;
}

function generateRecommendations(results, thresholds) {
  const recommendations = [];

  // Analyser les métriques et générer des recommandations
  results.pages.forEach(page => {
    if (page.metrics.performance < thresholds.performance) {
      recommendations.push('- Optimiser davantage le chargement initial et le bundle JavaScript');
    }
    if (page.customMetrics.LCP > thresholds.metrics.LCP) {
      recommendations.push('- Améliorer le chargement des images et le rendu initial');
    }
    if (page.customMetrics.TBT > thresholds.metrics.TBT) {
      recommendations.push('- Optimiser l\'exécution du JavaScript et réduire le blocage du thread principal');
    }
  });

  if (results.gameSpecific.chatMetrics.chatRenderTime > thresholds.game.chatRenderTime) {
    recommendations.push('- Optimiser le rendu du chat (virtualisation, pagination)');
  }

  if (results.gameSpecific.panoMetrics.panoramaLoadTime > thresholds.game.panoramaLoadTime) {
    recommendations.push('- Améliorer la stratégie de chargement des panoramas');
  }

  if (recommendations.length === 0) {
    return '✅ Toutes les métriques sont dans les seuils acceptables. Continuer la surveillance et maintenir les bonnes pratiques.';
  }

  return recommendations.join('\n');
}

// Générer le rapport
try {
  const results = require(METRICS_FILE);
  const thresholds = loadThresholds();
  const report = generateReport(results, thresholds);
  fs.writeFileSync(REPORT_FILE, report);
  console.log(`✅ Rapport généré avec succès: ${REPORT_FILE}`);
} catch (error) {
  console.error('❌ Erreur lors de la génération du rapport:', error);
  process.exit(1);
}
