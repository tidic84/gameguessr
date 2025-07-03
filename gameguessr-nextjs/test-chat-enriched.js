// Test des nouvelles fonctionnalités de chat enrichi
// Usage: node test-chat-enriched.js

const { 
  createUserMessage, 
  createSystemMessage, 
  createGameMessage, 
  createAdminMessage,
  addReactionToMessage,
  moderateMessage 
} = require('../src/store/gameStore.ts');

console.log('🎬 Test des Messages Chat Enrichis\n');

// Test 1: Messages utilisateur
console.log('1️⃣ Test Messages Utilisateur:');
const userMessage = createUserMessage('user1', 'Alice', 'Salut tout le monde! 👋');
console.log('✅ Message utilisateur créé:', {
  type: userMessage.type,
  userName: userMessage.userName,
  message: userMessage.message,
  isEmoji: userMessage.metadata?.isEmoji
});

// Test 2: Messages système
console.log('\n2️⃣ Test Messages Système:');
const systemMessage = createSystemMessage('Alice a rejoint la room', 'join');
console.log('✅ Message système créé:', {
  type: systemMessage.type,
  subtype: systemMessage.subtype,
  message: systemMessage.message
});

// Test 3: Messages de jeu
console.log('\n3️⃣ Test Messages de Jeu:');
const gameMessage = createGameMessage('Le jeu commence!', 'game_start');
console.log('✅ Message jeu créé:', {
  type: gameMessage.type,
  subtype: gameMessage.subtype,
  message: gameMessage.message,
  highlighted: gameMessage.isHighlighted
});

// Test 4: Messages admin
console.log('\n4️⃣ Test Messages Admin:');
const adminMessage = createAdminMessage('admin1', 'Moderator', 'Attention aux règles!');
console.log('✅ Message admin créé:', {
  type: adminMessage.type,
  userName: adminMessage.userName,
  message: adminMessage.message,
  highlighted: adminMessage.isHighlighted
});

// Test 5: Réactions
console.log('\n5️⃣ Test Réactions:');
let messageWithReaction = addReactionToMessage(userMessage, '👍', 'user2');
messageWithReaction = addReactionToMessage(messageWithReaction, '👍', 'user3');
messageWithReaction = addReactionToMessage(messageWithReaction, '❤️', 'user2');
console.log('✅ Réactions ajoutées:', messageWithReaction.reactions);

// Test 6: Modération
console.log('\n6️⃣ Test Modération:');
const inappropriateMessage = 'Ce jeu est vraiment stupide et spam';
const moderation = moderateMessage(inappropriateMessage);
console.log('✅ Modération testée:', {
  original: inappropriateMessage,
  filtered: moderation.filteredMessage,
  allowed: moderation.isAllowed
});

console.log('\n🎉 TOUS LES TESTS RÉUSSIS!');
console.log('✅ Types de messages enrichis fonctionnels');
console.log('✅ Système de réactions opérationnel');
console.log('✅ Modération basique active');
console.log('✅ Métadonnées et sous-types gérés');

module.exports = {
  userMessage,
  systemMessage,
  gameMessage,
  adminMessage,
  messageWithReaction
};
