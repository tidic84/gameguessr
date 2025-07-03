# Analyse Technique Détaillée - GameGuessr

## 🔍 Événements Socket.io Analysés

### Client → Serveur

| Événement | Paramètres | Description | Fréquence |
|-----------|------------|-------------|-----------|
| `debug` | `message` | Messages de débogage | Dev only |
| `get rooms` | - | Récupère la liste des salles | À la connexion |
| `get room` | `roomCode` | Récupère les détails d'une salle | En continu |
| `get user` | `userId` | Récupère les infos utilisateur | À la connexion |
| `user create` | `userId`, `username` | Crée un nouvel utilisateur | À la première visite |
| `room create` | `room` object | Crée une nouvelle salle | Action utilisateur |
| `room joined` | `roomCode`, `userId` | Rejoint une salle | Action utilisateur |
| `game start` | `roomCode` | Démarre le jeu | Hôte uniquement |
| `game answer` | `roomCode`, `userId`, `correct`, `mode`, `gameState`, `roomGameDB`, `points` | Soumet une réponse | Pendant le jeu |
| `game reset` | `roomCode` | Remet à zéro le jeu | Fin de partie |
| `chat message` | `roomCode`, `userId`, `message` | Envoie un message | Action utilisateur |
| `uuid` | - | Demande un nouvel UUID | Nouveau utilisateur |

### Serveur → Client

| Événement | Paramètres | Description | Destinataires |
|-----------|------------|-------------|---------------|
| `rooms` | `rooms` object | Liste des salles disponibles | Demandeur |
| `room update` | `roomCode`, `room` | Mise à jour d'une salle | Tous dans la salle |
| `user` | `user` object | Informations utilisateur | Demandeur |
| `player update ${roomCode}` | `players` | Mise à jour des joueurs | Tous dans la salle |
| `game start` | `roomCode` | Signal de début de jeu | Tous dans la salle |
| `game update` | `roomCode`, `room`, `gameState` | État du jeu mis à jour | Tous dans la salle |
| `game image update` | `roomCode`, `imageNumber` | Nouvelle image à deviner | Tous dans la salle |
| `game end` | `roomCode` | Fin de partie | Tous dans la salle |
| `game reset` | `roomCode` | Jeu remis à zéro | Tous dans la salle |
| `chat message ${roomCode}` | `username`, `message` | Message de chat | Tous dans la salle |
| `chat join` | `userId`, `roomCode` | Notification de connexion | Tous dans la salle |
| `chat leave` | `userId`, `roomCode` | Notification de déconnexion | Tous dans la salle |
| `uuid` | `uuid` | Nouvel UUID généré | Demandeur |

## 📊 Structures de Données

### User Object
```javascript
{
  name: string,
  socketId: string
}
```

### Room Object (serveur)
```javascript
{
  name: string,
  owner: string, // userId
  mode: "classic" | "solo" | "team",
  difficulty: "easy" | "medium" | "hard",
  duration: "quick" | "medium" | "long",
  privacy: "public" | "private",
  gameState: "wait" | "image 1" | "image 1 map" | "image 2" | etc. | "end",
  gameDB: GameData[],
  users: {
    [userId]: {
      name: string,
      points: number,
      role: "player",
      team: undefined,
      status: boolean, // true si a répondu
      alive: boolean   // false si déconnecté
    }
  }
}
```

### GameData Object
```javascript
{
  image: string,           // "../images/cp1.jpg"
  game: string[],          // ["Cyberpunk", "Cyberpunk2077"]
  map: [number, number, [string, string]], // [3, 4, ["cpmap", ".jpg"]]
  location: [number, number] // [1885, 1260] coordonnées sur la carte
}
```

## 🎮 Logique de Jeu Analysée

### États du Jeu
1. **"wait"** - En attente, bouton start visible
2. **"image X"** - Phase de devinette du jeu (X = numéro de l'image)
3. **"image X map"** - Phase de localisation sur la carte
4. **"end"** - Fin de partie, affichage des gagnants

### Système de Score
- **100 points** pour avoir trouvé le bon jeu
- **Points variables** pour la localisation : `Math.floor((530 - distance) / 5)`
  - Maximum 500 points si très proche
  - Minimum 0 points
  - Distance calculée avec Pythagore : `Math.sqrt((x - correct[1])² + (y - correct[0])²)`

### Transitions d'État
1. Tous les joueurs rejoignent → État "wait"
2. Hôte lance → État "image 1"
3. Joueur trouve le jeu → État "image 1 map" (pour ce joueur)
4. Tous ont répondu → État "image 2" ou "end"

## 🗺️ Système de Cartes

### Configuration Leaflet
```javascript
var map = L.map('map', {
    crs: L.CRS.Simple,
    minZoom: -1,
    maxZoom: 2
});

// Grille d'images 3x4 (12 tuiles)
let x = 3, y = 4, imageNumber = 1;
for (let i = y - 1; i >= 0; i--) {
    for (let j = 0; j < x; j++) {
        let bounds = [[i * 1000, j * 1000], [(i + 1) * 1000, (j + 1) * 1000]];
        let image = L.imageOverlay(`../images/cpmap${imageNumber}.jpg`, bounds).addTo(map);
        imageNumber++;
    }
}
```

### Placement des Markers
- Click sur la carte → Place un marker
- Un seul marker à la fois
- Coordonnées sauvegardées pour calcul de distance

## 🖼️ Système d'Images 360°

### Configuration Pannellum
```javascript
pannellum.viewer('panorama', {
    "type": "equirectangular",
    "disableKeyboardCtrl": true,
    "autoLoad": true,
    "showZoomCtrl": false,
    "showFullscreenCtrl": false,
    "panorama": `${room.gameDB[imageNumber-1].image}`
});
```

## 💬 Système de Chat

### Types de Messages
1. **Messages utilisateur** - `username: message`
2. **Messages système** - `<strong>username has joined/left</strong>`

### Gestion du Scroll
- Auto-scroll vers le bas à chaque nouveau message
- `chatMessages.scrollTop = chatMessages.scrollHeight + 250`

## 🔄 Gestion des Connexions

### Nouvel Utilisateur
1. Vérification cookie `userId`
2. Si absent → `uuid` event → création cookie
3. `user create` avec nom (Guest + nombre aléatoire si pas de nom)
4. `room joined` pour rejoindre la salle

### Reconnexion
1. Cookie existant → récupération des données utilisateur
2. Mise à jour du `socketId`
3. Marquage `alive: true`

### Déconnexion
1. Marquage `alive: false`
2. Notification aux autres joueurs
3. Suppression de la salle si tous déconnectés (après 10s)

## 🎯 Points d'Amélioration Identifiés

### Performance
- [ ] Images non optimisées (pas de lazy loading)
- [ ] Pas de compression des assets
- [ ] Rechargement complet de la page parfois nécessaire

### UX/UI
- [ ] Interface peu responsive
- [ ] Pas d'animations fluides
- [ ] Design daté
- [ ] Pas de feedback visuel pour les actions

### Code
- [ ] Pas de type safety
- [ ] Code dupliqué
- [ ] Gestion d'erreur basique
- [ ] Pas de tests

### Sécurité
- [ ] Validation côté client uniquement
- [ ] Pas de sanitisation des inputs
- [ ] Pas de rate limiting

### Fonctionnalités
- [ ] Pas de système de compte persistant
- [ ] Pas de statistiques
- [ ] Modes de jeu limités
- [ ] Pas de système de classement

## 🚀 Priorités pour la Migration

### Critiques (Phase 1-2)
1. **Socket.io** - Maintenir la compatibilité
2. **Structure des données** - Garder la même logique
3. **Événements** - Migration 1:1 d'abord

### Importantes (Phase 3-4)
1. **UI/UX** - Modernisation complète
2. **Type Safety** - TypeScript partout
3. **Performance** - Optimisations Next.js

### Améliorations (Phase 5+)
1. **Nouvelles fonctionnalités**
2. **Modes de jeu étendus**
3. **Système de progression**

---

**Note** : Cette analyse servira de base pour la migration. Chaque fonctionnalité sera d'abord répliquée à l'identique, puis améliorée.
