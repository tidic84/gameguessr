/**
 * Test d'intégration complet du Chat Amélioré
 * Ce test vérifie que toutes les fonctionnalités du chat amélioré
 * fonctionnent correctement ensemble en condition réelle.
 */

const { io } = require('socket.io-client');
const { expect } = require('chai');
const { spawn } = require('child_process');
const { faker } = require('@faker-js/faker');

// Configuration
const TEST_URL = 'http://localhost:3000';
const ROOM_CODE = 'test-integration-' + Date.now().toString().slice(-6);
const USERS = {
  ADMIN: { id: 'admin1', name: 'Admin Test', isAdmin: true },
  USER1: { id: 'user1', name: 'User Test 1', isAdmin: false },
  USER2: { id: 'user2', name: 'User Test 2', isAdmin: false },
  USER3: { id: 'user3', name: 'User Test 3', isAdmin: false }
};

// Options pour Socket.io
const socketOptions = {
  transports: ['websocket'],
  autoConnect: true,
  forceNew: true
};

// Fonctions utilitaires
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
const createUser = (socket, user, roomCode) => {
  return new Promise((resolve) => {
    socket.emit('join_room', { 
      roomCode, 
      userId: user.id, 
      userName: user.name,
      isAdmin: user.isAdmin 
    }, () => {
      console.log(`${user.name} a rejoint la salle ${roomCode}`);
      resolve();
    });
  });
};

const sendMessage = (socket, roomCode, userId, message) => {
  return new Promise((resolve) => {
    socket.emit('chat_message', { roomCode, userId, message }, () => {
      resolve();
    });
  });
};

// Messages pour tester différentes fonctionnalités
const testMessages = {
  normal: "Bonjour tout le monde, comment ça va ?",
  emoji: "😀😂🎮",
  mention: "@User Test 2 Pouvez-vous m'aider ?",
  moderated: "Ce jeu est vraiment stupide, j'en ai marre",
  long: faker.lorem.paragraphs(3),
  command: "/help"
};

// Fonction pour générer un rapport de test
const generateTestReport = (results) => {
  const report = {
    summary: {
      total: results.length,
      passed: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length
    },
    tests: results
  };

  console.log("\n📋 RAPPORT DE TEST");
  console.log("=================");
  console.log(`Tests totaux : ${report.summary.total}`);
  console.log(`Tests réussis : ${report.summary.passed}`);
  console.log(`Tests échoués : ${report.summary.failed}`);
  console.log("\nDétails des tests :");
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.name}: ${result.success ? '✅ OK' : '❌ ÉCHEC'}`);
    if (!result.success) {
      console.log(`   Erreur: ${result.error}`);
    }
  });

  return report;
};

// Tests d'intégration
describe('Test d\'intégration du Chat Amélioré', function() {
  this.timeout(30000);
  
  let serverProcess;
  let adminSocket;
  let user1Socket;
  let user2Socket;
  let user3Socket;
  
  let messagesReceived = [];
  let typingEvents = [];
  let reactionEvents = [];
  let results = [];
  
  // Démarrer le serveur temps réel
  before(async function() {
    console.log("Démarrage du serveur temps réel...");
    
    serverProcess = spawn('node', ['server-realtime.js'], {
      stdio: 'pipe',
      detached: true
    });
    
    serverProcess.stdout.on('data', (data) => {
      console.log(`Serveur: ${data}`);
    });
    
    serverProcess.stderr.on('data', (data) => {
      console.error(`Erreur serveur: ${data}`);
    });
    
    // Attendre que le serveur démarre
    await wait(3000);
    
    // Initialiser les sockets
    adminSocket = io(TEST_URL, socketOptions);
    user1Socket = io(TEST_URL, socketOptions);
    user2Socket = io(TEST_URL, socketOptions);
    user3Socket = io(TEST_URL, socketOptions);
    
    // Attendre les connexions
    await Promise.all([
      new Promise(resolve => adminSocket.on('connect', resolve)),
      new Promise(resolve => user1Socket.on('connect', resolve)),
      new Promise(resolve => user2Socket.on('connect', resolve)),
      new Promise(resolve => user3Socket.on('connect', resolve))
    ]);
    
    console.log('Tous les clients sont connectés');
    
    // Rejoindre la salle de test
    await createUser(adminSocket, USERS.ADMIN, ROOM_CODE);
    await createUser(user1Socket, USERS.USER1, ROOM_CODE);
    await createUser(user2Socket, USERS.USER2, ROOM_CODE);
    
    // Configurer les écouteurs d'événements
    adminSocket.on('chat_message', (data) => {
      messagesReceived.push({
        socket: 'admin',
        data: data
      });
    });
    
    user1Socket.on('chat_message', (data) => {
      messagesReceived.push({
        socket: 'user1',
        data: data
      });
    });
    
    user2Socket.on('chat_message', (data) => {
      messagesReceived.push({
        socket: 'user2',
        data: data
      });
    });
    
    user1Socket.on('user_typing', (data) => {
      typingEvents.push(data);
    });
    
    user1Socket.on('message_reaction', (data) => {
      reactionEvents.push(data);
    });
    
    // Attendre que tout soit prêt
    await wait(1000);
  });
  
  after(function() {
    // Arrêter le serveur et fermer les connexions
    if (serverProcess) {
      process.kill(-serverProcess.pid);
    }
    
    adminSocket.close();
    user1Socket.close();
    user2Socket.close();
    if (user3Socket.connected) user3Socket.close();
    
    // Générer le rapport final
    generateTestReport(results);
  });
  
  beforeEach(function() {
    // Réinitialiser les tableaux d'événements
    messagesReceived = [];
    typingEvents = [];
    reactionEvents = [];
  });
  
  it('Devrait envoyer et recevoir des messages normaux', async function() {
    try {
      // Envoyer un message normal
      await sendMessage(user1Socket, ROOM_CODE, USERS.USER1.id, testMessages.normal);
      await wait(500);
      
      // Vérifier que le message a été reçu par tous
      const normalMessages = messagesReceived.filter(m => 
        m.data.message === testMessages.normal && 
        m.data.userId === USERS.USER1.id
      );
      
      expect(normalMessages.length).to.be.at.least(3); // Admin, User1, User2
      
      results.push({
        name: "Envoi et réception de messages normaux",
        success: true
      });
    } catch (error) {
      results.push({
        name: "Envoi et réception de messages normaux",
        success: false,
        error: error.message
      });
      throw error;
    }
  });
  
  it('Devrait gérer correctement les messages avec emojis', async function() {
    try {
      // Envoyer un message avec emojis
      await sendMessage(user2Socket, ROOM_CODE, USERS.USER2.id, testMessages.emoji);
      await wait(500);
      
      // Vérifier que le message a été reçu et marqué comme emoji
      const emojiMessages = messagesReceived.filter(m => 
        m.data.message === testMessages.emoji && 
        m.data.userId === USERS.USER2.id
      );
      
      expect(emojiMessages.length).to.be.at.least(3);
      
      // Vérifier la propriété isEmoji (si disponible)
      const hasEmojiFlag = emojiMessages.some(m => 
        m.data.metadata && m.data.metadata.isEmoji === true
      );
      
      results.push({
        name: "Gestion des messages avec emojis",
        success: true,
        details: { hasEmojiFlag }
      });
    } catch (error) {
      results.push({
        name: "Gestion des messages avec emojis",
        success: false,
        error: error.message
      });
      throw error;
    }
  });
  
  it('Devrait filtrer les messages inappropriés', async function() {
    try {
      // Envoyer un message inapproprié
      await sendMessage(user1Socket, ROOM_CODE, USERS.USER1.id, testMessages.moderated);
      await wait(500);
      
      // Vérifier que le message a été filtré
      const moderatedMessages = messagesReceived.filter(m => 
        m.data.userId === USERS.USER1.id && 
        m.data.message.includes('***')
      );
      
      const warningMessages = messagesReceived.filter(m => 
        m.data.type === 'system' && 
        m.data.message.toLowerCase().includes('inappropri')
      );
      
      expect(moderatedMessages.length).to.be.at.least(1);
      
      results.push({
        name: "Filtrage des messages inappropriés",
        success: true,
        details: { 
          filtered: moderatedMessages.length > 0,
          warning: warningMessages.length > 0
        }
      });
    } catch (error) {
      results.push({
        name: "Filtrage des messages inappropriés",
        success: false,
        error: error.message
      });
      throw error;
    }
  });
  
  it('Devrait permettre à l\'admin de modérer un utilisateur', async function() {
    try {
      // Admin mute un utilisateur
      await sendMessage(
        adminSocket, 
        ROOM_CODE, 
        USERS.ADMIN.id, 
        `/mute ${USERS.USER1.id} 1 Test de modération`
      );
      await wait(500);
      
      // Vérifier que le message de modération a été envoyé
      const muteMessages = messagesReceived.filter(m => 
        m.data.type === 'system' && 
        m.data.message.toLowerCase().includes('muet')
      );
      
      expect(muteMessages.length).to.be.at.least(1);
      
      // L'utilisateur muté essaie d'envoyer un message
      await sendMessage(user1Socket, ROOM_CODE, USERS.USER1.id, "Ce message ne devrait pas passer");
      await wait(500);
      
      // Vérifier que le message n'a pas été envoyé ou a généré un avertissement
      const blockedMessages = messagesReceived.filter(m => 
        m.data.message === "Ce message ne devrait pas passer" && 
        m.data.userId === USERS.USER1.id
      );
      
      expect(blockedMessages.length).to.equal(0);
      
      results.push({
        name: "Modération par l'admin",
        success: true,
        details: { 
          muteMessageSent: muteMessages.length > 0,
          messageBlocked: blockedMessages.length === 0
        }
      });
    } catch (error) {
      results.push({
        name: "Modération par l'admin",
        success: false,
        error: error.message
      });
      throw error;
    }
  });
  
  it('Devrait gérer la rejointe tardive d\'un utilisateur', async function() {
    try {
      // Envoyer un message de bienvenue
      await sendMessage(adminSocket, ROOM_CODE, USERS.ADMIN.id, "Message important pour tous !");
      await wait(500);
      
      // Un nouvel utilisateur rejoint tardivement
      await createUser(user3Socket, USERS.USER3, ROOM_CODE);
      await wait(1000);
      
      // Vérifier qu'il y a un message de join
      const joinMessages = messagesReceived.filter(m => 
        m.data.type === 'system' && 
        m.data.subtype === 'join' &&
        m.data.message.includes(USERS.USER3.name)
      );
      
      expect(joinMessages.length).to.be.at.least(1);
      
      results.push({
        name: "Gestion des utilisateurs tardifs",
        success: true,
        details: { 
          joinMessageReceived: joinMessages.length > 0
        }
      });
    } catch (error) {
      results.push({
        name: "Gestion des utilisateurs tardifs",
        success: false,
        error: error.message
      });
      throw error;
    }
  });
  
  // Test final : génération du rapport
  it('Devrait générer un rapport de test complet', function() {
    try {
      const totalTests = results.length;
      const passedTests = results.filter(r => r.success).length;
      
      expect(passedTests).to.equal(totalTests);
      
      console.log(`\n🎉 ${passedTests}/${totalTests} TESTS RÉUSSIS !`);
      
      results.push({
        name: "Génération du rapport",
        success: true,
        details: {
          total: totalTests,
          passed: passedTests
        }
      });
    } catch (error) {
      results.push({
        name: "Génération du rapport",
        success: false,
        error: error.message
      });
      throw error;
    }
  });
});
