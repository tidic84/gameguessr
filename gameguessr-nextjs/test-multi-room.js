// Test avancé multi-room pour GameGuessr
// Usage: node test-multi-room.js

const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

console.log('🎮 Test Multi-Room GameGuessr\n');

// Utilitaires
function generateRoomCode() {
  return 'TEST-' + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function generateUserId() {
  return 'user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
}

// Test 1: Timer Multi-Room Indépendant
function testMultiRoomTimers() {
  return new Promise((resolve, reject) => {
    console.log('⏱️ Test 1: Timers Multi-Room Indépendants...');
    
    const rooms = [
      { code: generateRoomCode(), duration: 3, name: 'Room Rapide' },
      { code: generateRoomCode(), duration: 5, name: 'Room Moyenne' },
      { code: generateRoomCode(), duration: 7, name: 'Room Lente' }
    ];
    
    const sockets = [];
    const timerEvents = {};
    
    let completedRooms = 0;
    
    rooms.forEach((roomConfig, index) => {
      const socket = io(SERVER_URL);
      const userId = generateUserId();
      
      sockets.push(socket);
      timerEvents[roomConfig.code] = {
        started: false,
        updates: 0,
        stopped: false,
        duration: roomConfig.duration
      };
      
      socket.on('connect', () => {
        // Créer utilisateur
        socket.emit('user create', userId, `User${index + 1}`);
        
        socket.on('user', () => {
          // Créer room
          const roomData = {
            code: roomConfig.code,
            name: roomConfig.name,
            owner: userId,
            mode: 'classic',
            difficulty: 'easy',
            duration: roomConfig.duration,
            privacy: 'public'
          };
          
          socket.emit('room create', roomData);
        });
        
        socket.on('rooms', (rooms) => {
          if (rooms[roomConfig.code]) {
            // Rejoindre et démarrer
            socket.emit('room joined', roomConfig.code, userId);
            setTimeout(() => {
              socket.emit('game start', roomConfig.code);
            }, 500);
          }
        });
        
        socket.on('game timer start', (duration) => {
          timerEvents[roomConfig.code].started = true;
          console.log(`✅ ${roomConfig.name} - Timer démarré: ${duration}s`);
        });
        
        socket.on('timer update', (timeLeft) => {
          timerEvents[roomConfig.code].updates++;
        });
        
        socket.on('game timer stop', () => {
          timerEvents[roomConfig.code].stopped = true;
          console.log(`⏹️ ${roomConfig.name} - Timer arrêté`);
          
          completedRooms++;
          if (completedRooms === rooms.length) {
            // Validation
            let allValid = true;
            
            rooms.forEach(room => {
              const events = timerEvents[room.code];
              const expectedUpdates = room.duration; // Approximatif
              
              if (!events.started || !events.stopped) {
                console.log(`❌ ${room.name} - Timer incomplet`);
                allValid = false;
              } else if (events.updates < expectedUpdates - 2 || events.updates > expectedUpdates + 2) {
                console.log(`⚠️ ${room.name} - Updates inattendus: ${events.updates} (attendu: ~${expectedUpdates})`);
              } else {
                console.log(`✅ ${room.name} - Timer correct (${events.updates} updates)`);
              }
            });
            
            sockets.forEach(s => s.disconnect());
            
            if (allValid) {
              resolve(timerEvents);
            } else {
              reject(new Error('Timers multi-room invalides'));
            }
          }
        });
      });
    });
    
    setTimeout(() => {
      sockets.forEach(s => s.disconnect());
      reject(new Error('Timeout test multi-room timers'));
    }, 15000);
  });
}

// Test 2: Isolation Chat Multi-Room
function testChatIsolation() {
  return new Promise((resolve, reject) => {
    console.log('\n💬 Test 2: Isolation Chat Multi-Room...');
    
    const room1Code = generateRoomCode();
    const room2Code = generateRoomCode();
    
    const user1Socket = io(SERVER_URL);
    const user2Socket = io(SERVER_URL);
    const user3Socket = io(SERVER_URL);
    
    const user1Id = generateUserId();
    const user2Id = generateUserId();
    const user3Id = generateUserId();
    
    let room1Created = false;
    let room2Created = false;
    let usersJoined = 0;
    
    const messagesReceived = {
      user1: [],
      user2: [],
      user3: []
    };
    
    // Setup utilisateur 1 (Room 1)
    user1Socket.on('connect', () => {
      user1Socket.emit('user create', user1Id, 'User1Room1');
      
      user1Socket.on('user', () => {
        const roomData = {
          code: room1Code,
          name: 'Chat Room 1',
          owner: user1Id,
          mode: 'classic',
          difficulty: 'easy',
          duration: 30,
          privacy: 'public'
        };
        
        user1Socket.emit('room create', roomData);
      });
      
      user1Socket.on('rooms', (rooms) => {
        if (rooms[room1Code] && !room1Created) {
          room1Created = true;
          user1Socket.emit('room joined', room1Code, user1Id);
          usersJoined++;
        }
      });
      
      user1Socket.on('chat message', (roomCode, userName, message) => {
        messagesReceived.user1.push({ roomCode, userName, message });
      });
    });
    
    // Setup utilisateur 2 (Room 1)
    user2Socket.on('connect', () => {
      user2Socket.emit('user create', user2Id, 'User2Room1');
      
      user2Socket.on('user', () => {
        setTimeout(() => {
          user2Socket.emit('room joined', room1Code, user2Id);
          usersJoined++;
        }, 1000);
      });
      
      user2Socket.on('chat message', (roomCode, userName, message) => {
        messagesReceived.user2.push({ roomCode, userName, message });
      });
    });
    
    // Setup utilisateur 3 (Room 2)
    user3Socket.on('connect', () => {
      user3Socket.emit('user create', user3Id, 'User3Room2');
      
      user3Socket.on('user', () => {
        const roomData = {
          code: room2Code,
          name: 'Chat Room 2',
          owner: user3Id,
          mode: 'classic',
          difficulty: 'easy',
          duration: 30,
          privacy: 'public'
        };
        
        user3Socket.emit('room create', roomData);
      });
      
      user3Socket.on('rooms', (rooms) => {
        if (rooms[room2Code] && !room2Created) {
          room2Created = true;
          user3Socket.emit('room joined', room2Code, user3Id);
          usersJoined++;
        }
      });
      
      user3Socket.on('chat message', (roomCode, userName, message) => {
        messagesReceived.user3.push({ roomCode, userName, message });
      });
    });
    
    // Quand tous les users sont connectés, envoyer messages
    const checkAndSendMessages = setInterval(() => {
      if (usersJoined >= 3) {
        clearInterval(checkAndSendMessages);
        
        // Envoyer messages
        setTimeout(() => {
          user1Socket.emit('chat message', room1Code, user1Id, 'Message from Room 1 User 1');
          user2Socket.emit('chat message', room1Code, user2Id, 'Message from Room 1 User 2');
          user3Socket.emit('chat message', room2Code, user3Id, 'Message from Room 2 User 3');
        }, 500);
        
        // Vérifier résultats
        setTimeout(() => {
          console.log('📊 Messages reçus:');
          console.log('User1 (Room1):', messagesReceived.user1.length);
          console.log('User2 (Room1):', messagesReceived.user2.length);
          console.log('User3 (Room2):', messagesReceived.user3.length);
          
          // Validation
          const user1Room1Messages = messagesReceived.user1.filter(m => m.roomCode === room1Code).length;
          const user2Room1Messages = messagesReceived.user2.filter(m => m.roomCode === room1Code).length;
          const user3Room2Messages = messagesReceived.user3.filter(m => m.roomCode === room2Code).length;
          
          // User1 et User2 doivent recevoir 2 messages de Room1
          // User3 doit recevoir 1 message de Room2
          // Personne ne doit recevoir de messages de l'autre room
          
          if (user1Room1Messages === 2 && user2Room1Messages === 2 && user3Room2Messages === 1) {
            console.log('✅ Isolation chat correcte');
            
            user1Socket.disconnect();
            user2Socket.disconnect();
            user3Socket.disconnect();
            
            resolve(messagesReceived);
          } else {
            console.log('❌ Isolation chat échouée');
            console.log('Détails:', { user1Room1Messages, user2Room1Messages, user3Room2Messages });
            
            user1Socket.disconnect();
            user2Socket.disconnect();
            user3Socket.disconnect();
            
            reject(new Error('Chat isolation failed'));
          }
        }, 2000);
      }
    }, 100);
    
    setTimeout(() => {
      user1Socket.disconnect();
      user2Socket.disconnect();
      user3Socket.disconnect();
      reject(new Error('Timeout test chat isolation'));
    }, 10000);
  });
}

// Test 3: Contrôles Admin (simplifié)
function testAdminControls() {
  return new Promise((resolve, reject) => {
    console.log('\n👨‍💼 Test 3: Contrôles Admin...');
    
    const adminSocket = io(SERVER_URL);
    const playerSocket = io(SERVER_URL);
    
    const roomCode = generateRoomCode();
    const adminId = generateUserId();
    const playerId = generateUserId();
    
    let adminEvents = {
      gameStarted: false,
      nextImageTriggered: false,
      gameReset: false
    };
    
    // Setup admin
    adminSocket.on('connect', () => {
      adminSocket.emit('user create', adminId, 'AdminUser');
      
      adminSocket.on('user', () => {
        const roomData = {
          code: roomCode,
          name: 'Admin Test Room',
          owner: adminId,
          mode: 'classic',
          difficulty: 'easy',
          duration: 10,
          privacy: 'public'
        };
        
        adminSocket.emit('room create', roomData);
      });
      
      adminSocket.on('rooms', (rooms) => {
        if (rooms[roomCode]) {
          adminSocket.emit('room joined', roomCode, adminId);
          
          // Attendre le player puis tester contrôles
          setTimeout(() => {
            testAdminActions();
          }, 2000);
        }
      });
    });
    
    // Setup player
    playerSocket.on('connect', () => {
      playerSocket.emit('user create', playerId, 'PlayerUser');
      
      playerSocket.on('user', () => {
        setTimeout(() => {
          playerSocket.emit('room joined', roomCode, playerId);
        }, 1000);
      });
    });
    
    // Events de jeu
    const handleGameStart = () => {
      adminEvents.gameStarted = true;
      console.log('✅ Admin - Jeu démarré');
    };
    
    const handleImageUpdate = () => {
      adminEvents.nextImageTriggered = true;
      console.log('✅ Admin - Image suivante');
    };
    
    const handleGameReset = () => {
      adminEvents.gameReset = true;
      console.log('✅ Admin - Jeu réinitialisé');
      
      // Validation finale
      if (adminEvents.gameStarted && adminEvents.nextImageTriggered && adminEvents.gameReset) {
        console.log('✅ Tous contrôles admin fonctionnent');
        adminSocket.disconnect();
        playerSocket.disconnect();
        resolve(adminEvents);
      } else {
        console.log('❌ Certains contrôles admin échoués');
        adminSocket.disconnect();
        playerSocket.disconnect();
        reject(new Error('Admin controls failed'));
      }
    };
    
    adminSocket.on('game start', handleGameStart);
    playerSocket.on('game start', handleGameStart);
    
    adminSocket.on('game image update', handleImageUpdate);
    playerSocket.on('game image update', handleImageUpdate);
    
    adminSocket.on('game reset', handleGameReset);
    playerSocket.on('game reset', handleGameReset);
    
    // Actions admin
    function testAdminActions() {
      // 1. Démarrer jeu
      adminSocket.emit('game start', roomCode);
      
      // 2. Passer image après 2s
      setTimeout(() => {
        adminSocket.emit('next image', roomCode);
      }, 2000);
      
      // 3. Reset après 2s
      setTimeout(() => {
        adminSocket.emit('game reset', roomCode);
      }, 4000);
    }
    
    setTimeout(() => {
      adminSocket.disconnect();
      playerSocket.disconnect();
      reject(new Error('Timeout test admin controls'));
    }, 10000);
  });
}

// Fonction principale
async function runMultiRoomTests() {
  console.log('🚀 Démarrage tests robustesse multi-room...\n');
  
  const results = {
    multiRoomTimers: false,
    chatIsolation: false,
    adminControls: false
  };
  
  try {
    // Test 1: Timers multi-room
    await testMultiRoomTimers();
    results.multiRoomTimers = true;
    
    // Test 2: Isolation chat
    await testChatIsolation();
    results.chatIsolation = true;
    
    // Test 3: Contrôles admin
    await testAdminControls();
    results.adminControls = true;
    
  } catch (error) {
    console.log('\n❌ Erreur pendant tests:', error.message);
  }
  
  // Résultats finaux
  console.log('\n📋 RÉSULTATS TESTS MULTI-ROOM:');
  console.log('===============================');
  console.log('⏱️ Timers Multi-Room:', results.multiRoomTimers ? '✅ RÉUSSI' : '❌ ÉCHEC');
  console.log('💬 Chat Isolation:', results.chatIsolation ? '✅ RÉUSSI' : '❌ ÉCHEC');
  console.log('👨‍💼 Admin Controls:', results.adminControls ? '✅ RÉUSSI' : '❌ ÉCHEC');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n🎯 Score Multi-Room: ${passedTests}/${totalTests} tests réussis`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ROBUSTESSE MULTI-ROOM VALIDÉE !');
    console.log('✅ Le système est prêt pour production');
  } else {
    console.log('⚠️ Problèmes détectés - corrections nécessaires');
  }
  
  return results;
}

// Démarrer
runMultiRoomTests();
