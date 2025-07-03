// Test manuel pour valider le serveur temps réel GameGuessr
// Usage: node test-server.js

const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

console.log('🚀 Démarrage des tests du serveur GameGuessr...\n');

// Test 1: Connexion de base
function testConnection() {
  return new Promise((resolve, reject) => {
    console.log('📡 Test 1: Connexion au serveur...');
    
    const socket = io(SERVER_URL);
    
    socket.on('connect', () => {
      console.log('✅ Connexion réussie (ID:', socket.id + ')');
      socket.disconnect();
      resolve();
    });
    
    socket.on('connect_error', (error) => {
      console.log('❌ Erreur de connexion:', error.message);
      reject(error);
    });
    
    // Timeout après 5 secondes
    setTimeout(() => {
      socket.disconnect();
      reject(new Error('Timeout de connexion'));
    }, 5000);
  });
}

// Test 2: Création d'utilisateur et room
function testUserAndRoom() {
  return new Promise((resolve, reject) => {
    console.log('\n👤 Test 2: Création utilisateur et room...');
    
    const socket = io(SERVER_URL);
    
    socket.on('connect', () => {
      const userId = 'test-user-' + Date.now();
      const roomCode = 'TEST-' + Math.random().toString(36).substr(2, 4).toUpperCase();
      
      // Créer utilisateur
      socket.emit('user create', userId, 'TestUser');
      
      socket.on('user', (user) => {
        console.log('✅ Utilisateur créé:', user.name);
        
        // Créer room
        const roomData = {
          code: roomCode,
          name: 'Test Room',
          owner: userId,
          mode: 'classic',
          difficulty: 'easy',
          duration: 30,
          privacy: 'public'
        };
        
        socket.emit('room create', roomData);
      });
      
      socket.on('rooms', (rooms) => {
        if (rooms[roomCode]) {
          console.log('✅ Room créée:', roomCode);
          socket.disconnect();
          resolve({ userId, roomCode });
        }
      });
    });
    
    setTimeout(() => {
      socket.disconnect();
      reject(new Error('Timeout création user/room'));
    }, 5000);
  });
}

// Test 3: Démarrage du jeu et timer
function testGameTimer() {
  return new Promise((resolve, reject) => {
    console.log('\n⏱️ Test 3: Démarrage jeu et timer...');
    
    const socket = io(SERVER_URL);
    let timerUpdates = 0;
    
    socket.on('connect', async () => {
      const userId = 'test-timer-' + Date.now();
      const roomCode = 'TIMER-' + Math.random().toString(36).substr(2, 4).toUpperCase();
      
      // Créer user et room
      socket.emit('user create', userId, 'TimerUser');
      
      socket.on('user', () => {
        const roomData = {
          code: roomCode,
          name: 'Timer Test Room',
          owner: userId,
          mode: 'classic',
          difficulty: 'easy',
          duration: 5, // 5 secondes pour test rapide
          privacy: 'public'
        };
        
        socket.emit('room create', roomData);
      });
      
      socket.on('rooms', (rooms) => {
        if (rooms[roomCode]) {
          // Rejoindre la room
          socket.emit('room joined', roomCode, userId);
          
          // Démarrer le jeu
          setTimeout(() => {
            socket.emit('game start', roomCode);
          }, 500);
        }
      });
      
      socket.on('game timer start', (duration) => {
        console.log('✅ Timer démarré:', duration + 's');
      });
      
      socket.on('timer update', (timeLeft) => {
        timerUpdates++;
        console.log('📊 Timer update:', timeLeft + 's');
        
        if (timeLeft === 0) {
          console.log('✅ Timer terminé correctement');
          socket.disconnect();
          resolve({ timerUpdates });
        }
      });
      
      socket.on('game timer stop', () => {
        console.log('✅ Timer arrêté');
      });
      
      socket.on('game image update', (roomCode, imageIndex) => {
        console.log('✅ Image update:', imageIndex);
      });
    });
    
    setTimeout(() => {
      socket.disconnect();
      reject(new Error('Timeout test timer'));
    }, 10000);
  });
}

// Test 4: Chat
function testChat() {
  return new Promise((resolve, reject) => {
    console.log('\n💬 Test 4: Chat multi-utilisateur...');
    
    const socket1 = io(SERVER_URL);
    const socket2 = io(SERVER_URL);
    let messagesReceived = 0;
    
    const roomCode = 'CHAT-' + Math.random().toString(36).substr(2, 4).toUpperCase();
    
    socket1.on('connect', () => {
      const userId1 = 'chat-user1-' + Date.now();
      socket1.emit('user create', userId1, 'ChatUser1');
      
      socket1.on('user', () => {
        const roomData = {
          code: roomCode,
          name: 'Chat Test Room',
          owner: userId1,
          mode: 'classic',
          difficulty: 'easy',
          duration: 30,
          privacy: 'public'
        };
        
        socket1.emit('room create', roomData);
        socket1.emit('room joined', roomCode, userId1);
      });
    });
    
    socket2.on('connect', () => {
      const userId2 = 'chat-user2-' + Date.now();
      socket2.emit('user create', userId2, 'ChatUser2');
      
      socket2.on('user', () => {
        setTimeout(() => {
          socket2.emit('room joined', roomCode, userId2);
          
          // Envoyer message
          setTimeout(() => {
            socket2.emit('chat message', roomCode, userId2, 'Hello from user 2!');
          }, 500);
        }, 1000);
      });
    });
    
    // Écouter les messages
    const handleChatMessage = (receivedRoomCode, userName, message) => {
      if (receivedRoomCode === roomCode) {
        messagesReceived++;
        console.log('✅ Message reçu de', userName + ':', message);
        
        if (messagesReceived >= 1) {
          socket1.disconnect();
          socket2.disconnect();
          resolve({ messagesReceived });
        }
      }
    };
    
    socket1.on('chat message', handleChatMessage);
    socket2.on('chat message', handleChatMessage);
    
    setTimeout(() => {
      socket1.disconnect();
      socket2.disconnect();
      reject(new Error('Timeout test chat'));
    }, 8000);
  });
}

// Fonction principale de test
async function runTests() {
  const results = {
    connection: false,
    userAndRoom: false,
    gameTimer: false,
    chat: false
  };
  
  try {
    // Test 1
    await testConnection();
    results.connection = true;
    
    // Test 2
    await testUserAndRoom();
    results.userAndRoom = true;
    
    // Test 3
    await testGameTimer();
    results.gameTimer = true;
    
    // Test 4
    await testChat();
    results.chat = true;
    
  } catch (error) {
    console.log('\n❌ Erreur pendant les tests:', error.message);
  }
  
  // Résultats finaux
  console.log('\n📋 RÉSULTATS DES TESTS:');
  console.log('=======================');
  console.log('✅ Connexion:', results.connection ? 'RÉUSSI' : '❌ ÉCHEC');
  console.log('✅ User/Room:', results.userAndRoom ? 'RÉUSSI' : '❌ ÉCHEC');
  console.log('✅ Timer:', results.gameTimer ? 'RÉUSSI' : '❌ ÉCHEC');
  console.log('✅ Chat:', results.chat ? 'RÉUSSI' : '❌ ÉCHEC');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n🎯 Score: ${passedTests}/${totalTests} tests réussis`);
  
  if (passedTests === totalTests) {
    console.log('🎉 TOUS LES TESTS SONT RÉUSSIS !');
  } else {
    console.log('⚠️ Certains tests ont échoué - vérifiez que le serveur est démarré');
  }
}

// Démarrer les tests
runTests();
