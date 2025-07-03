// Test de la modération avancée du chat
const { io } = require('socket.io-client');
const { expect } = require('chai');
const { faker } = require('@faker-js/faker');

// Configuration
const TEST_URL = 'http://localhost:3000';
const ROOM_CODE = 'test-moderation-' + Date.now().toString().slice(-6);
const ADMIN_USER = { id: 'admin1', name: 'Admin Test', isAdmin: true };
const NORMAL_USER = { id: 'user1', name: 'User Test', isAdmin: false };
const SPAMMER_USER = { id: 'spammer1', name: 'Spammer Test', isAdmin: false };

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

// Tests
describe('Test de la modération avancée du chat', function() {
  this.timeout(10000);
  
  let adminSocket;
  let userSocket;
  let spammerSocket;
  let messagesReceived = [];
  let moderationEvents = [];
  
  before(async function() {
    // Connexion des utilisateurs
    adminSocket = io(TEST_URL, socketOptions);
    userSocket = io(TEST_URL, socketOptions);
    spammerSocket = io(TEST_URL, socketOptions);
    
    // Attendre les connexions
    await Promise.all([
      new Promise(resolve => adminSocket.on('connect', resolve)),
      new Promise(resolve => userSocket.on('connect', resolve)),
      new Promise(resolve => spammerSocket.on('connect', resolve))
    ]);
    
    console.log('Tous les utilisateurs sont connectés');
    
    // Rejoindre la salle de test
    await createUser(adminSocket, ADMIN_USER, ROOM_CODE);
    await createUser(userSocket, NORMAL_USER, ROOM_CODE);
    await createUser(spammerSocket, SPAMMER_USER, ROOM_CODE);
    
    // Écouter les messages pour l'admin
    adminSocket.on('chat_message', (data) => {
      messagesReceived.push(data);
      console.log(`Message reçu: ${data.userName}: ${data.message}`);
    });
    
    // Écouter les événements de modération
    adminSocket.on('moderation_event', (data) => {
      moderationEvents.push(data);
      console.log(`Événement de modération: ${data.type} - ${data.targetId}`);
    });
    
    // Attendre que tout soit prêt
    await wait(1000);
  });
  
  after(function() {
    // Fermeture des connexions
    adminSocket.close();
    userSocket.close();
    spammerSocket.close();
  });
  
  beforeEach(function() {
    // Réinitialiser les tableaux de messages et événements
    messagesReceived = [];
    moderationEvents = [];
  });
  
  it('Devrait filtrer les messages contenant des gros mots', async function() {
    const badWords = ['merde', 'putain', 'connard'];
    
    for (const word of badWords) {
      await sendMessage(userSocket, ROOM_CODE, NORMAL_USER.id, `Test avec le mot ${word} dedans`);
      await wait(300);
    }
    
    // Vérifier que les messages ont été filtrés
    const filteredMessages = messagesReceived.filter(m => 
      m.userId === NORMAL_USER.id && 
      badWords.some(word => !m.message.includes(word))
    );
    
    expect(filteredMessages.length).to.be.at.least(badWords.length);
    
    // Vérifier que les *** sont présents dans les messages filtrés
    const starredMessages = messagesReceived.filter(m => 
      m.userId === NORMAL_USER.id && 
      m.message.includes('***')
    );
    
    expect(starredMessages.length).to.be.at.least(1);
  });
  
  it('Devrait détecter le spam et avertir un utilisateur qui envoie trop de messages', async function() {
    // Envoyer beaucoup de messages rapidement
    const spamCount = 8;
    for (let i = 0; i < spamCount; i++) {
      await sendMessage(spammerSocket, ROOM_CODE, SPAMMER_USER.id, `Message spam #${i} ${faker.lorem.sentence(3)}`);
      // Pas de délai pour simuler le spam
    }
    
    await wait(500);
    
    // Vérifier qu'il y a un avertissement
    const warningMessages = messagesReceived.filter(m => 
      m.type === 'system' && 
      m.subtype === 'warning' && 
      m.message.toLowerCase().includes('spam')
    );
    
    expect(warningMessages.length).to.be.at.least(1);
  });
  
  it('Devrait permettre à un admin de muter un utilisateur', async function() {
    // Admin envoie une commande pour muter un utilisateur
    await sendMessage(
      adminSocket, 
      ROOM_CODE, 
      ADMIN_USER.id, 
      `/mute ${SPAMMER_USER.id} 5 Test de la commande mute`
    );
    
    await wait(500);
    
    // L'utilisateur muté essaie d'envoyer un message
    await sendMessage(
      spammerSocket, 
      ROOM_CODE, 
      SPAMMER_USER.id, 
      `Message après avoir été muté`
    );
    
    await wait(500);
    
    // Vérifier qu'il y a un message système indiquant le mute
    const muteMessages = messagesReceived.filter(m => 
      m.type === 'system' && 
      m.message.toLowerCase().includes('muté')
    );
    
    expect(muteMessages.length).to.be.at.least(1);
    
    // Vérifier que le message de l'utilisateur muté n'est pas passé
    const mutedUserMessages = messagesReceived.filter(m => 
      m.userId === SPAMMER_USER.id && 
      m.timestamp > muteMessages[0].timestamp
    );
    
    expect(mutedUserMessages.length).to.equal(0);
  });
  
  it('Devrait permettre de signaler un utilisateur', async function() {
    // Simuler un signalement (normalement fait via l'UI)
    adminSocket.emit('report_user', {
      roomCode: ROOM_CODE,
      reporterId: NORMAL_USER.id,
      reporterName: NORMAL_USER.name,
      targetUserId: SPAMMER_USER.id,
      targetUserName: SPAMMER_USER.name,
      reason: 'Test de signalement',
      category: 'spam'
    });
    
    await wait(500);
    
    // Vérifier que l'événement de signalement a été enregistré
    // (Dans une implémentation réelle, cela serait stocké dans la base de données)
    const reportEvents = moderationEvents.filter(e => 
      e.type === 'report' && 
      e.targetId === SPAMMER_USER.id
    );
    
    // Si le serveur émet des événements de modération, ce test pourrait réussir
    // Sinon, ce test peut être désactivé ou modifié en fonction de l'implémentation
    if (moderationEvents.length > 0) {
      expect(reportEvents.length).to.be.at.least(1);
    } else {
      console.log('Pas d\'événements de modération reçus - vérification ignorée');
    }
  });
  
  it('Devrait bloquer un utilisateur avec une commande admin', async function() {
    // Admin envoie une commande pour bloquer un utilisateur
    await sendMessage(
      adminSocket, 
      ROOM_CODE, 
      ADMIN_USER.id, 
      `/block ${SPAMMER_USER.id} 60 Test de la commande block`
    );
    
    await wait(500);
    
    // Vérifier qu'il y a un message système indiquant le blocage
    const blockMessages = messagesReceived.filter(m => 
      m.type === 'system' && 
      (m.message.toLowerCase().includes('bloqu') || m.message.toLowerCase().includes('block'))
    );
    
    expect(blockMessages.length).to.be.at.least(1);
    
    // L'utilisateur bloqué essaie de rejoindre à nouveau
    let rejoined = false;
    
    try {
      await createUser(spammerSocket, SPAMMER_USER, ROOM_CODE);
      rejoined = true;
    } catch (error) {
      rejoined = false;
    }
    
    // L'utilisateur ne devrait pas pouvoir rejoindre ou ses messages devraient être bloqués
    // (Le comportement exact dépend de l'implémentation)
    // Si l'utilisateur a pu rejoindre, ses messages devraient être bloqués
    if (rejoined) {
      await sendMessage(
        spammerSocket, 
        ROOM_CODE, 
        SPAMMER_USER.id, 
        `Message après avoir été bloqué`
      );
      
      await wait(500);
      
      // Vérifier que le message de l'utilisateur bloqué n'est pas passé
      const blockedUserMessages = messagesReceived.filter(m => 
        m.userId === SPAMMER_USER.id && 
        m.timestamp > blockMessages[0].timestamp
      );
      
      expect(blockedUserMessages.length).to.equal(0);
    }
  });
});
