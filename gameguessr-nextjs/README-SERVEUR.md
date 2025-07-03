# GameGuessr - Guide de Démarrage Serveur Temps Réel

## 🚀 Démarrage Rapide

### 1. Démarrer le serveur
```bash
cd gameguessr-nextjs
npm run dev-realtime
# ou
node server-realtime.js
```

### 2. Tester le serveur
```bash
# Dans un autre terminal
node test-server.js
```

### 3. Accéder à l'application
- Frontend: http://localhost:3000
- Socket.io: ws://localhost:3000

## 🔧 Scripts NPM Disponibles

- `npm run dev-realtime` - Serveur temps réel (JavaScript)
- `npm run dev-new` - Serveur TypeScript (si tsx fonctionne)
- `npm run start-realtime` - Production temps réel
- `npm run dev:next` - Next.js seulement (sans Socket.io)

## ✅ Fonctionnalités Temps Réel Implémentées

### Timer Multi-Room
- ⏱️ Timer côté serveur précis (1000ms)
- 🔄 Synchronisation automatique clients
- 📡 Events: `timer update`, `game timer start`, `game timer stop`

### Transition Automatique Images
- 🖼️ Passage automatique quand timer expire
- ⏸️ Pause 3s entre transitions
- 📊 Index synchronisé toutes rooms
- 📡 Event: `game image update`

### Contrôles Admin
- 👨‍💼 Démarrer/arrêter jeu
- ⏭️ Passer image manuellement
- 🔄 Reset complet
- 📡 Event: `next image`

### Chat Multi-Room
- 💬 Messages par room isolés
- 👥 Synchronisation multi-utilisateurs
- 📡 Events: `chat message`, `chat join`, `chat leave`

### Gestion États Robuste
- 🔄 Flow: `wait` → `playing` → `end`
- 🧹 Nettoyage automatique ressources
- 💾 Persistence état pendant déconnexions courtes
- 🗑️ Suppression rooms vides (5s delay)

## 🧪 Tests Automatisés

Le fichier `test-server.js` valide:

1. **Connexion** - Connection Socket.io basique
2. **User/Room** - Création utilisateur et room
3. **Timer** - Fonctionnement timer temps réel
4. **Chat** - Messages multi-utilisateur

### Résultats attendus
```
📋 RÉSULTATS DES TESTS:
=======================
✅ Connexion: RÉUSSI
✅ User/Room: RÉUSSI  
✅ Timer: RÉUSSI
✅ Chat: RÉUSSI

🎯 Score: 4/4 tests réussis
🎉 TOUS LES TESTS SONT RÉUSSIS !
```

## 🔍 Debugging

### Logs Serveur
Le serveur affiche:
- Connexions/déconnexions utilisateurs
- Création/suppression rooms
- Démarrage/arrêt timers
- Messages de chat
- Transitions d'images

### Events Socket.io
Utilisez les DevTools navigateur pour voir:
- Network > WS pour trafic WebSocket
- Console pour logs côté client

### Problèmes Fréquents

**Port 3000 occupé:**
```bash
netstat -ano | findstr :3000
taskkill /F /PID <PID>
```

**Modules non trouvés:**
```bash
npm install
```

**TypeError modules:**
- Utiliser `server-realtime.js` (JavaScript pur)
- Éviter `server-new.ts` si problèmes TypeScript

## 📂 Structure Fichiers

```
gameguessr-nextjs/
├── server-realtime.js     # ⭐ Serveur principal JavaScript
├── server-new.ts         # Serveur TypeScript (si tsx OK)
├── test-server.js        # Tests automatisés
├── package.json          # Scripts NPM
└── src/
    ├── store/gameStore.ts    # Store Zustand optimisé
    ├── hooks/useSocket.ts    # Hook Socket.io
    ├── components/game/
    │   ├── GameControls.tsx  # Interface admin
    │   ├── GameLayout.tsx    # Layout principal
    │   └── ...
    └── types/index.ts        # Types TypeScript
```

## 🎯 Prochaines Étapes

1. ✅ **Serveur fonctionnel** - server-realtime.js créé
2. 🔄 **Tests validation** - Lancer test-server.js
3. 📱 **Tests UI** - Interface GameControls
4. 🎨 **Polish UX** - Animations et feedback
5. 🚀 **Production** - Optimisations et déploiement
