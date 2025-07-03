// Test interface GameControls
// Usage: node test-gamecontrols.js

const io = require('socket.io-client');

const SERVER_URL = 'http://localhost:3000';

console.log('🎮 Test Interface GameControls\n');

function generateRoomCode() {
  return 'TEST-CTRL-' + Math.random().toString(36).substr(2, 4).toUpperCase();
}

function generateUserId() {
  return 'ctrl-user-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
}

// Test des contrôles admin en temps réel
function testGameControlsInterface() {
  return new Promise((resolve, reject) => {
    console.log('🎛️ Test Interface GameControls...');
    
    const adminSocket = io(SERVER_URL);
    const playerSocket = io(SERVER_URL);
    
    const roomCode = generateRoomCode();
    const adminId = generateUserId();
    const playerId = generateUserId();
    
    let testResults = {
      roomCreated: false,
      playersConnected: false,
      gameStarted: false,
      nextImageWorked: false,
      gameReset: false,
      stateSync: false
    };
    
    let adminEvents = [];
    let playerEvents = [];
    
    // Setup admin
    adminSocket.on('connect', () => {
      console.log('📡 Admin connecté');
      adminSocket.emit('user create', adminId, 'AdminUser');
      
      adminSocket.on('user', () => {
        console.log('👤 Admin créé');
        const roomData = {
          code: roomCode,
          name: 'GameControls Test Room',
          owner: adminId,
          mode: 'classic',
          difficulty: 'easy',
          duration: 5,
          privacy: 'public'
        };
        
        adminSocket.emit('room create', roomData);
      });
      
      adminSocket.on('rooms', (rooms) => {
        if (rooms[roomCode]) {
          console.log('🏠 Room créée:', roomCode);
          testResults.roomCreated = true;
          adminSocket.emit('room joined', roomCode, adminId);
          
          // Attendre que le player rejoigne
          setTimeout(() => {
            console.log('🎯 Démarrage séquence de tests...');
            testGameControlsSequence();
          }, 2000);
        }
      });
      
      // Écouter les événements du jeu
      adminSocket.on('game start', () => {
        adminEvents.push('game_start');
        testResults.gameStarted = true;
        console.log('✅ Admin - Jeu démarré détecté');
      });
      
      adminSocket.on('game image update', (imageIndex) => {
        adminEvents.push('image_update');
        testResults.nextImageWorked = true;
        console.log('✅ Admin - Image suivante détectée:', imageIndex);
      });
      
      adminSocket.on('game reset', () => {
        adminEvents.push('game_reset');
        testResults.gameReset = true;
        console.log('✅ Admin - Reset détecté');
      });
      
      adminSocket.on('game timer start', (duration) => {
        console.log('⏱️ Admin - Timer démarré:', duration);
      });
      
      adminSocket.on('timer update', (timeLeft) => {
        // Ne pas logguer chaque tick
      });
      
      adminSocket.on('game timer stop', () => {
        console.log('⏹️ Admin - Timer arrêté');
      });
    });
    
    // Setup player
    playerSocket.on('connect', () => {
      console.log('📡 Player connecté');
      playerSocket.emit('user create', playerId, 'PlayerUser');
      
      playerSocket.on('user', () => {
        console.log('👤 Player créé');
        setTimeout(() => {
          playerSocket.emit('room joined', roomCode, playerId);
          testResults.playersConnected = true;
          console.log('👥 Player rejoint la room');
        }, 1000);
      });
      
      // Écouter les événements côté player pour valider la sync
      playerSocket.on('game start', () => {
        playerEvents.push('game_start');
        console.log('✅ Player - Jeu démarré reçu');
      });
      
      playerSocket.on('game image update', (imageIndex) => {
        playerEvents.push('image_update');
        console.log('✅ Player - Image suivante reçue:', imageIndex);
      });
      
      playerSocket.on('game reset', () => {
        playerEvents.push('game_reset');
        console.log('✅ Player - Reset reçu');
      });
    });
    
    // Séquence de tests des contrôles
    function testGameControlsSequence() {
      console.log('\n🎮 SÉQUENCE TESTS GAMECONTROLS');
      console.log('=====================================');
      
      // Test 1: Démarrer le jeu
      console.log('1️⃣ Test: Démarrage du jeu...');
      adminSocket.emit('game start', roomCode);
      
      // Test 2: Passer à l'image suivante après 2s
      setTimeout(() => {
        console.log('2️⃣ Test: Image suivante...');
        adminSocket.emit('next image', roomCode);
      }, 2000);
      
      // Test 3: Réinitialiser le jeu après 4s
      setTimeout(() => {
        console.log('3️⃣ Test: Reset du jeu...');
        adminSocket.emit('game reset', roomCode);
      }, 4000);
      
      // Validation finale après 6s
      setTimeout(() => {
        validateTestResults();
      }, 6000);
    }
    
    // Validation des résultats
    function validateTestResults() {
      console.log('\n📊 VALIDATION RÉSULTATS');
      console.log('========================');
      
      // Vérifier que les événements admin et player sont synchronisés
      const adminGameEvents = adminEvents.filter(e => e.startsWith('game_') || e.startsWith('image_'));
      const playerGameEvents = playerEvents.filter(e => e.startsWith('game_') || e.startsWith('image_'));
      
      testResults.stateSync = adminGameEvents.length === playerGameEvents.length;
      
      console.log('Room créée:', testResults.roomCreated ? '✅' : '❌');
      console.log('Players connectés:', testResults.playersConnected ? '✅' : '❌');
      console.log('Jeu démarré:', testResults.gameStarted ? '✅' : '❌');
      console.log('Image suivante:', testResults.nextImageWorked ? '✅' : '❌');
      console.log('Reset jeu:', testResults.gameReset ? '✅' : '❌');
      console.log('Synchronisation états:', testResults.stateSync ? '✅' : '❌');
      
      console.log('\nÉvénements Admin:', adminEvents);
      console.log('Événements Player:', playerEvents);
      
      // Vérifier si tous les tests sont passés
      const allTestsPassed = Object.values(testResults).every(Boolean);
      
      // Nettoyer les connexions
      adminSocket.disconnect();
      playerSocket.disconnect();
      
      if (allTestsPassed) {
        console.log('\n🎉 TOUS LES TESTS GAMECONTROLS RÉUSSIS !');
        resolve(testResults);
      } else {
        console.log('\n❌ Certains tests GameControls ont échoué');
        reject(new Error('GameControls tests failed'));
      }
    }
    
    // Timeout de sécurité
    setTimeout(() => {
      adminSocket.disconnect();
      playerSocket.disconnect();
      reject(new Error('Timeout test GameControls'));
    }, 15000);
  });
}

// Test des permissions (non-admin ne peut pas contrôler)
function testAdminPermissions() {
  return new Promise((resolve, reject) => {
    console.log('\n🔒 Test Permissions Admin...');
    
    const adminSocket = io(SERVER_URL);
    const normalUserSocket = io(SERVER_URL);
    
    const roomCode = generateRoomCode();
    const adminId = generateUserId();
    const normalUserId = generateUserId();
    
    let permissionTests = {
      roomCreated: false,
      normalUserCannotStart: true, // Par défaut true, devient false si il peut
      adminCanStart: false
    };
    
    // Setup admin
    adminSocket.on('connect', () => {
      adminSocket.emit('user create', adminId, 'AdminUser');
      
      adminSocket.on('user', () => {
        const roomData = {
          code: roomCode,
          name: 'Permission Test Room',
          owner: adminId,
          mode: 'classic',
          difficulty: 'easy',
          duration: 5,
          privacy: 'public'
        };
        
        adminSocket.emit('room create', roomData);
      });
      
      adminSocket.on('rooms', (rooms) => {
        if (rooms[roomCode]) {
          permissionTests.roomCreated = true;
          adminSocket.emit('room joined', roomCode, adminId);
        }
      });
      
      adminSocket.on('game start', () => {
        permissionTests.adminCanStart = true;
        console.log('✅ Admin peut démarrer le jeu');
      });
    });
    
    // Setup utilisateur normal
    normalUserSocket.on('connect', () => {
      normalUserSocket.emit('user create', normalUserId, 'NormalUser');
      
      normalUserSocket.on('user', () => {
        setTimeout(() => {
          normalUserSocket.emit('room joined', roomCode, normalUserId);
          
          // Essayer de démarrer le jeu (ne devrait pas marcher)
          setTimeout(() => {
            console.log('🔍 Utilisateur normal tente de démarrer le jeu...');
            normalUserSocket.emit('game start', roomCode);
            
            // Tester si admin peut démarrer après
            setTimeout(() => {
              console.log('🔍 Admin tente de démarrer le jeu...');
              adminSocket.emit('game start', roomCode);
              
              // Validation finale
              setTimeout(() => {
                console.log('\n📋 Résultats permissions:');
                console.log('Room créée:', permissionTests.roomCreated ? '✅' : '❌');
                console.log('User normal bloqué:', permissionTests.normalUserCannotStart ? '✅' : '❌');
                console.log('Admin autorisé:', permissionTests.adminCanStart ? '✅' : '❌');
                
                adminSocket.disconnect();
                normalUserSocket.disconnect();
                
                const allPermissionsPassed = Object.values(permissionTests).every(Boolean);
                
                if (allPermissionsPassed) {
                  console.log('✅ Tests permissions réussis');
                  resolve(permissionTests);
                } else {
                  console.log('❌ Tests permissions échoués');
                  reject(new Error('Permission tests failed'));
                }
              }, 2000);
            }, 1000);
          }, 1000);
        }, 1000);
      });
      
      // Si l'utilisateur normal reçoit game start, c'est un problème
      normalUserSocket.on('game start', () => {
        permissionTests.normalUserCannotStart = false;
        console.log('❌ Utilisateur normal a pu démarrer le jeu (problème de sécurité)');
      });
    });
    
    setTimeout(() => {
      adminSocket.disconnect();
      normalUserSocket.disconnect();
      reject(new Error('Timeout test permissions'));
    }, 10000);
  });
}

// Fonction principale
async function runGameControlsTests() {
  console.log('🚀 Démarrage tests interface GameControls...\n');
  
  const results = {
    interfaceControls: false,
    adminPermissions: false
  };
  
  try {
    // Test 1: Interface et contrôles
    await testGameControlsInterface();
    results.interfaceControls = true;
    
    // Test 2: Permissions admin
    await testAdminPermissions();
    results.adminPermissions = true;
    
  } catch (error) {
    console.log('\n❌ Erreur pendant tests:', error.message);
  }
  
  // Résultats finaux
  console.log('\n📋 RÉSULTATS TESTS GAMECONTROLS:');
  console.log('==================================');
  console.log('🎛️ Interface Controls:', results.interfaceControls ? '✅ RÉUSSI' : '❌ ÉCHEC');
  console.log('🔒 Admin Permissions:', results.adminPermissions ? '✅ RÉUSSI' : '❌ ÉCHEC');
  
  const totalTests = Object.keys(results).length;
  const passedTests = Object.values(results).filter(Boolean).length;
  
  console.log(`\n🎯 Score GameControls: ${passedTests}/${totalTests} tests réussis`);
  
  if (passedTests === totalTests) {
    console.log('🎉 INTERFACE GAMECONTROLS VALIDÉE !');
    console.log('✅ Prête pour utilisation en production');
  } else {
    console.log('⚠️ Problèmes détectés - corrections nécessaires');
  }
  
  return results;
}

// Démarrer
runGameControlsTests();
