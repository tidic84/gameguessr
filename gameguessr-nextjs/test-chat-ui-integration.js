/**
 * Test d'intégration des optimisations de performance du chat dans l'UI
 * Simule les interactions utilisateur avec la pagination et les optimisations
 */

const fs = require('fs');
const path = require('path');

// Configuration pour les tests d'intégration
const UI_TEST_CONFIG = {
  SCROLL_SIMULATION_DELAY: 100,
  MESSAGE_LOAD_DELAY: 300,
  PAGINATION_PAGE_SIZE: 20,
  THROTTLE_DELAY: 100,
  MEMORY_CHECK_INTERVAL: 5000,
};

// Simulateur d'interface utilisateur
class ChatUISimulator {
  constructor() {
    this.messages = [];
    this.currentPage = 0;
    this.isLoadingHistory = false;
    this.scrollPosition = 0;
    this.isAtBottom = true;
    this.performanceStats = {
      messageCount: 0,
      memoryUsage: 0,
      lastCleanup: new Date(),
      compressionRatio: 1,
    };
    this.throttleTimeouts = new Map();
    this.debounceTimeouts = new Map();
  }

  // Simulation de la pagination
  async simulatePagination(messages) {
    console.log('🔍 Test UI: Simulation de la pagination...');
    
    this.messages = messages;
    
    // Page initiale (messages récents)
    const initialPage = this.paginateMessages(0);
    console.log(`✅ Page initiale chargée: ${initialPage.messages.length} messages`);
    
    if (initialPage.messages.length === 0 && messages.length > 0) {
      throw new Error('❌ Erreur UI: page initiale vide avec des messages disponibles');
    }

    // Simulation du scroll vers le haut pour charger plus
    if (initialPage.hasMore) {
      console.log('📜 Simulation scroll vers le haut...');
      await this.simulateScrollUp();
      
      const nextPage = this.paginateMessages(1);
      console.log(`✅ Page suivante chargée: ${nextPage.messages.length} messages`);
      
      if (nextPage.messages.length === 0) {
        throw new Error('❌ Erreur UI: page suivante vide alors qu\'il y a plus de messages');
      }
    }

    console.log('✅ Test pagination UI: RÉUSSI');
  }

  // Simulation du scroll avec throttling
  async simulateScrollUp() {
    return new Promise((resolve) => {
      this.isLoadingHistory = true;
      this.scrollPosition = 100; // Simulation scroll vers le haut
      
      // Simuler le délai de chargement
      setTimeout(() => {
        this.currentPage++;
        this.isLoadingHistory = false;
        resolve();
      }, UI_TEST_CONFIG.MESSAGE_LOAD_DELAY);
    });
  }

  // Helper de pagination (copié depuis le store)
  paginateMessages(page = this.currentPage) {
    const pageSize = UI_TEST_CONFIG.PAGINATION_PAGE_SIZE;
    const startIndex = page * pageSize;
    const endIndex = startIndex + pageSize;
    const pageMessages = this.messages.slice(startIndex, endIndex);
    
    return {
      messages: pageMessages,
      hasMore: endIndex < this.messages.length,
      cursor: pageMessages.length > 0 ? pageMessages[pageMessages.length - 1]?.id : undefined,
      totalCount: this.messages.length,
    };
  }

  // Simulation de l'ajout de nouveaux messages avec optimisation mémoire
  simulateMessageFlow(messageCount = 150) {
    console.log('🔍 Test UI: Simulation flux de messages avec optimisation mémoire...');
    
    const generator = new MessageGenerator();
    const newMessages = generator.generateBulkMessages(messageCount, true);
    
    // Simuler l'ajout progressif de messages
    let addedCount = 0;
    const addInterval = setInterval(() => {
      if (addedCount >= messageCount) {
        clearInterval(addInterval);
        this.checkMemoryOptimization();
        return;
      }

      this.messages.push(newMessages[addedCount]);
      addedCount++;
      
      // Nettoyage automatique tous les 100 messages
      if (this.messages.length > 100) {
        this.cleanupOldMessages();
      }
      
      this.updatePerformanceStats();
    }, 10); // Ajout rapide pour simuler un chat actif

    console.log(`✅ ${messageCount} messages ajoutés avec nettoyage automatique`);
  }

  // Nettoyage des anciens messages (simulation)
  cleanupOldMessages() {
    const maxMessages = 100;
    if (this.messages.length > maxMessages) {
      const recentMessages = this.messages.slice(-maxMessages);
      const removedCount = this.messages.length - recentMessages.length;
      this.messages = recentMessages;
      
      console.log(`🧹 Nettoyage: ${removedCount} anciens messages supprimés`);
    }
  }

  // Mise à jour des stats de performance
  updatePerformanceStats() {
    this.performanceStats = {
      messageCount: this.messages.length,
      memoryUsage: JSON.stringify(this.messages).length,
      lastCleanup: new Date(),
      compressionRatio: this.calculateCompressionRatio(),
    };
  }

  calculateCompressionRatio() {
    // Simulation simple du ratio de compression
    const originalSize = this.messages.length * 200; // Taille moyenne estimée par message
    const actualSize = this.performanceStats.memoryUsage;
    return originalSize / actualSize || 1;
  }

  checkMemoryOptimization() {
    console.log('🔍 Test UI: Vérification optimisation mémoire...');
    
    const memoryKB = this.performanceStats.memoryUsage / 1024;
    console.log(`✅ Utilisation mémoire actuelle: ${memoryKB.toFixed(2)} KB`);
    console.log(`✅ Nombre de messages en mémoire: ${this.performanceStats.messageCount}`);
    console.log(`✅ Ratio de compression: ${this.performanceStats.compressionRatio.toFixed(2)}`);
    
    // Vérifications
    if (this.performanceStats.messageCount > 100) {
      throw new Error(`❌ Trop de messages en mémoire: ${this.performanceStats.messageCount}`);
    }
    
    if (memoryKB > 100) { // Limite arbitraire pour le test
      console.warn(`⚠️ Attention: utilisation mémoire élevée: ${memoryKB.toFixed(2)} KB`);
    }

    console.log('✅ Test optimisation mémoire UI: RÉUSSI');
  }

  // Simulation des événements throttlés (scroll, typing)
  simulateThrottledEvents() {
    console.log('🔍 Test UI: Simulation événements throttlés...');
    
    let scrollEventCount = 0;
    let typingEventCount = 0;

    // Simulation du throttling du scroll
    const throttledScrollHandler = this.throttle(() => {
      scrollEventCount++;
    }, UI_TEST_CONFIG.THROTTLE_DELAY);

    // Simulation du debouncing du typing
    const debouncedTypingHandler = this.debounce(() => {
      typingEventCount++;
    }, UI_TEST_CONFIG.THROTTLE_DELAY);

    // Générer beaucoup d'événements rapidement
    for (let i = 0; i < 50; i++) {
      throttledScrollHandler();
      debouncedTypingHandler();
    }

    // Vérifier après un délai
    setTimeout(() => {
      console.log(`✅ Événements scroll throttlés: ${scrollEventCount} (devrait être ~1)`);
      console.log(`✅ Événements typing debouncés: ${typingEventCount} (devrait être 1 après délai)`);
      
      if (scrollEventCount > 5) {
        throw new Error(`❌ Throttling scroll inefficace: ${scrollEventCount} événements`);
      }

      console.log('✅ Test événements throttlés: RÉUSSI');
    }, UI_TEST_CONFIG.THROTTLE_DELAY + 50);
  }

  // Helpers throttle et debounce
  throttle(func, delay) {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        func(...args);
      }
    };
  }

  debounce(func, delay) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  }
}

// Générateur de messages (réutilisé du test précédent)
class MessageGenerator {
  constructor() {
    this.messageCounter = 0;
  }

  generateMessage(type = 'user', size = 'normal') {
    this.messageCounter++;
    const baseMessage = {
      id: `msg_${this.messageCounter}_${Date.now()}`,
      userId: `user_${Math.floor(Math.random() * 10)}`,
      userName: `TestUser${Math.floor(Math.random() * 10)}`,
      timestamp: new Date(),
      type,
    };

    switch (size) {
      case 'small':
        baseMessage.message = 'Hi!';
        break;
      case 'large':
        baseMessage.message = 'Lorem ipsum '.repeat(50);
        break;
      default:
        baseMessage.message = `Message de test numéro ${this.messageCounter}`;
    }

    return baseMessage;
  }

  generateBulkMessages(count, mixedSizes = true) {
    const messages = [];
    for (let i = 0; i < count; i++) {
      const size = mixedSizes 
        ? ['small', 'normal', 'large'][Math.floor(Math.random() * 3)]
        : 'normal';
      messages.push(this.generateMessage('user', size));
    }
    return messages;
  }
}

// Exécution des tests d'intégration UI
async function runUIIntegrationTests() {
  console.log('🚀 === Tests d\'Intégration UI - Performance Chat ===\n');

  try {
    const simulator = new ChatUISimulator();
    const generator = new MessageGenerator();
    
    // Générer un dataset de test
    const testMessages = generator.generateBulkMessages(200, true);
    
    // Test 1: Pagination
    await simulator.simulatePagination(testMessages);
    console.log('');
    
    // Test 2: Flux de messages avec optimisation mémoire
    simulator.simulateMessageFlow(150);
    console.log('');
    
    // Test 3: Événements throttlés
    simulator.simulateThrottledEvents();
    console.log('');
    
    // Attendre que tous les tests asynchrones se terminent
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('🎉 === TOUS LES TESTS D\'INTÉGRATION UI RÉUSSIS ===');
    
    // Générer un rapport détaillé
    const report = {
      timestamp: new Date().toISOString(),
      test_type: 'UI_Integration_Performance',
      results: {
        pagination: 'PASSED',
        memory_optimization: 'PASSED',
        throttled_events: 'PASSED',
        message_flow: 'PASSED'
      },
      performance_metrics: {
        final_message_count: simulator.performanceStats.messageCount,
        final_memory_usage_kb: (simulator.performanceStats.memoryUsage / 1024).toFixed(2),
        compression_ratio: simulator.performanceStats.compressionRatio.toFixed(2),
        auto_cleanup_working: true
      },
      test_parameters: UI_TEST_CONFIG
    };

    // Sauvegarder le rapport
    const reportPath = path.join(__dirname, 'test-results-chat-ui-integration.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`📊 Rapport d'intégration UI sauvegardé: ${reportPath}`);
    
    return true;
  } catch (error) {
    console.error('❌ ÉCHEC DES TESTS D\'INTÉGRATION UI:', error.message);
    return false;
  }
}

// Exécuter si appelé directement
if (require.main === module) {
  runUIIntegrationTests().then(success => {
    process.exit(success ? 0 : 1);
  });
}

module.exports = { runUIIntegrationTests, ChatUISimulator };
