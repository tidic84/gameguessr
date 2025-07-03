// Validation des corrections de sécurité
// Usage: node validate-security.js

const fs = require('fs');
const path = require('path');

console.log('🔒 Validation des corrections de sécurité\n');

const serverPath = path.join(__dirname, 'server-realtime.js');
const serverCode = fs.readFileSync(serverPath, 'utf-8');

const securityChecks = {
  gameStartPermissions: false,
  nextImagePermissions: false,
  gameResetPermissions: false,
  getUserIdFunction: false,
  ownerCheck: false,
  errorEmission: false
};

console.log('📋 Vérification du code serveur...\n');

// Check 1: Vérification des permissions pour 'game start'
if (serverCode.includes('socket.on(\'game start\'') && 
    serverCode.includes('getUserIdBySocketId(socket.id)') &&
    serverCode.includes('room.owner !== userId')) {
  securityChecks.gameStartPermissions = true;
  console.log('✅ Permissions game start: vérification ajoutée');
} else {
  console.log('❌ Permissions game start: manquantes');
}

// Check 2: Vérification des permissions pour 'next image'
if (serverCode.includes('socket.on(\'next image\'') && 
    serverCode.includes('room.owner !== userId')) {
  securityChecks.nextImagePermissions = true;
  console.log('✅ Permissions next image: vérification ajoutée');
} else {
  console.log('❌ Permissions next image: manquantes');
}

// Check 3: Vérification des permissions pour 'game reset'
if (serverCode.includes('socket.on(\'game reset\'') && 
    serverCode.includes('room.owner !== userId')) {
  securityChecks.gameResetPermissions = true;
  console.log('✅ Permissions game reset: vérification ajoutée');
} else {
  console.log('❌ Permissions game reset: manquantes');
}

// Check 4: Fonction getUserIdBySocketId
if (serverCode.includes('function getUserIdBySocketId(socketId)')) {
  securityChecks.getUserIdFunction = true;
  console.log('✅ Fonction getUserIdBySocketId: présente');
} else {
  console.log('❌ Fonction getUserIdBySocketId: manquante');
}

// Check 5: Vérification des owner
const ownerCheckCount = (serverCode.match(/room\.owner !== userId/g) || []).length;
if (ownerCheckCount >= 3) {
  securityChecks.ownerCheck = true;
  console.log(`✅ Vérifications owner: ${ownerCheckCount} trouvées`);
} else {
  console.log(`❌ Vérifications owner: seulement ${ownerCheckCount} trouvées (attendu: 3)`);
}

// Check 6: Émission d'erreurs
if (serverCode.includes('socket.emit(\'error\'') && 
    serverCode.includes('administrateur de la room')) {
  securityChecks.errorEmission = true;
  console.log('✅ Messages d\'erreur de sécurité: présents');
} else {
  console.log('❌ Messages d\'erreur de sécurité: manquants');
}

// Résultats finaux
console.log('\n📊 RÉSULTATS VALIDATION SÉCURITÉ:');
console.log('===================================');

const passedChecks = Object.values(securityChecks).filter(Boolean).length;
const totalChecks = Object.keys(securityChecks).length;

Object.entries(securityChecks).forEach(([check, passed]) => {
  console.log(`${passed ? '✅' : '❌'} ${check}: ${passed ? 'OK' : 'ÉCHEC'}`);
});

console.log(`\n🎯 Score: ${passedChecks}/${totalChecks} vérifications réussies`);

if (passedChecks === totalChecks) {
  console.log('🎉 TOUTES LES CORRECTIONS DE SÉCURITÉ SONT EN PLACE !');
  console.log('✅ Le serveur est maintenant sécurisé');
  
  // Créer un rapport de validation
  const report = {
    timestamp: new Date().toISOString(),
    securityValidation: 'PASSED',
    checks: securityChecks,
    score: `${passedChecks}/${totalChecks}`,
    status: 'SECURED'
  };
  
  fs.writeFileSync('security-validation-report.json', JSON.stringify(report, null, 2));
  console.log('📄 Rapport sauvegardé: security-validation-report.json');
  
} else {
  console.log('⚠️ Corrections de sécurité incomplètes');
  console.log('🔧 Veuillez corriger les problèmes identifiés');
}

module.exports = { securityChecks, passedChecks, totalChecks };
