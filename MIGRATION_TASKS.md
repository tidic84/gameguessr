# Migration GameGuessr vers Next.js - Liste des Tâches Détaillées

## Analyse du Code Existant ✅

Après analyse du code existant, voici les fonctionnalités principales de GameGuessr :

### Fonctionnalités Existantes
1. **Authentification utilisateur** - Système de cookies avec UUID
2. **Gestion des salles** - Création/Rejoindre des salles avec codes
3. **Configuration de jeu** - Mode (classic/solo/team), difficulté, durée, confidentialité
4. **Jeu principal** - Devinette d'images 360° de jeux vidéo + localisation sur carte
5. **Chat en temps réel** - Communication entre joueurs
6. **Système de scores** - Points basés sur la précision et vitesse
7. **Gestion des connexions** - Reconnexion automatique, gestion déconnexions

### Technologies Actuelles
- **Backend** : Node.js + Express + Socket.io
- **Frontend** : HTML/CSS/JS vanilla
- **Base de données** : JSON local (`game.json`)
- **Cartes** : Leaflet.js
- **Images 360°** : Pannellum.js

---

## Phase 1: Configuration et Architecture Next.js

### 1.1 Initialisation du projet Next.js
- [ ] Créer nouveau projet Next.js avec TypeScript
- [ ] Configurer ESLint, Prettier
- [ ] Installer les dépendances principales :
  - `socket.io-client` (client WebSocket)
  - `@types/leaflet` (cartes)
  - `pannellum-react` ou équivalent (images 360°)
  - `tailwindcss` (styling moderne)
  - `framer-motion` (animations)
  - `react-hot-toast` (notifications)
  - `zustand` (état global)

### 1.2 Structure des dossiers
```
src/
├── app/
│   ├── page.tsx (page d'accueil)
│   ├── room/[code]/page.tsx (salle de jeu)
│   └── layout.tsx
├── components/
│   ├── ui/ (composants réutilisables)
│   ├── game/ (composants spécifiques au jeu)
│   ├── chat/
│   └── room/
├── hooks/ (hooks personnalisés)
├── lib/ (utilitaires, types)
├── store/ (état global Zustand)
└── styles/
```

### 1.3 Configuration TypeScript
- [ ] Définir les interfaces TypeScript pour :
  - `User`, `Room`, `GameState`, `Message`
  - `GameData`, `Location`, `Answer`
  - Événements Socket.io

---

## Phase 2: Backend Next.js avec API Routes

### 2.1 Migration du serveur Socket.io
- [ ] Créer `/api/socket.js` pour intégrer Socket.io avec Next.js
- [ ] Migrer la logique de gestion des salles
- [ ] Migrer la logique de gestion des utilisateurs
- [ ] Migrer la logique du jeu (états, scores, transitions)

### 2.2 API Routes REST
- [ ] `/api/rooms` - CRUD des salles
- [ ] `/api/users` - Gestion des utilisateurs
- [ ] `/api/game-data` - Chargement des données de jeu
- [ ] `/api/health` - Vérification de l'état du serveur

### 2.3 Base de données améliorée
- [ ] Migrer de JSON vers une vraie DB (SQLite/PostgreSQL)
- [ ] Créer les schémas de base de données
- [ ] Système de migration des données
- [ ] API pour l'upload d'images de jeu

---

## Phase 3: Composants UI Modernes

### 3.1 Page d'accueil modernisée
- [ ] Design responsive avec Tailwind CSS
- [ ] Formulaire de création de salle avec validation
- [ ] Formulaire de connexion à une salle
- [ ] Animations avec Framer Motion
- [ ] Gestion d'état avec Zustand

### 3.2 Interface de jeu refactorisée
- [ ] Layout responsive à 2 colonnes (jeu + chat/scores)
- [ ] Composant pour l'affichage d'images 360° (Pannellum React)
- [ ] Composant carte interactive (React Leaflet)
- [ ] Zone de saisie de réponse avec autocomplétion
- [ ] Indicateurs de progression et temps restant

### 3.3 Système de chat amélioré
- [ ] Interface moderne avec bulles de messages
- [ ] Émojis et réactions
- [ ] Messages système (connexions/déconnexions)
- [ ] Historique des messages scrollable

### 3.4 Tableau des scores dynamique
- [ ] Affichage en temps réel des scores
- [ ] Animations lors des changements de score
- [ ] Indicateur du joueur hôte
- [ ] Status des joueurs (en ligne/hors ligne)

---

## Phase 4: Intégration Socket.io Client

### 4.1 Hook personnalisé useSocket
- [ ] Hook pour gérer la connexion Socket.io
- [ ] Reconnexion automatique
- [ ] Gestion des états de connexion
- [ ] Typesafety pour les événements

### 4.2 État global avec Zustand
- [ ] Store pour l'utilisateur actuel
- [ ] Store pour l'état de la salle
- [ ] Store pour l'état du jeu
- [ ] Store pour les messages de chat

### 4.3 Synchronisation temps réel
- [ ] Synchronisation des scores
- [ ] Synchronisation des réponses
- [ ] Synchronisation du chat
- [ ] Gestion des déconnexions

---

## Phase 5: Fonctionnalités de Jeu Avancées

### 5.1 Système de jeu amélioré
- [ ] Validation côté client et serveur
- [ ] Timer visuel pour les réponses
- [ ] Système de hints/indices
- [ ] Mode spectateur
- [ ] Replay des parties

### 5.2 Système de scoring sophistiqué
- [ ] Calcul basé sur la distance et le temps
- [ ] Bonus pour les réponses rapides
- [ ] Malus pour les mauvaises réponses
- [ ] Classement global des joueurs

### 5.3 Modes de jeu étendus
- [ ] Mode Classic (actuel)
- [ ] Mode Solo (entraînement)
- [ ] Mode Team (équipes)
- [ ] Mode Battle Royale
- [ ] Mode Ranked

---

## Phase 6: UX/UI Polish et Optimisations

### 6.1 Design System
- [ ] Palette de couleurs cohérente
- [ ] Système de typographie
- [ ] Composants UI réutilisables
- [ ] Thème sombre/clair
- [ ] Responsive design mobile-first

### 6.2 Animations et Microinteractions
- [ ] Transitions de page fluides
- [ ] Animations de chargement
- [ ] Feedback visuel pour les actions
- [ ] Effets de hover et focus
- [ ] Animations de score

### 6.3 Performance et Optimisations
- [ ] Lazy loading des images
- [ ] Optimisation des images (Next.js Image)
- [ ] Code splitting automatique
- [ ] Préchargement des données de jeu
- [ ] Mise en cache intelligente

---

## Phase 7: Fonctionnalités Avancées

### 7.1 Système d'authentification robuste
- [ ] Connexion avec nom d'utilisateur/mot de passe
- [ ] Connexion OAuth (Google, Discord)
- [ ] Profils utilisateur persistants
- [ ] Statistiques personnelles
- [ ] Système d'amis

### 7.2 Administration et Modération
- [ ] Panel d'administration
- [ ] Système de rapports
- [ ] Modération automatique du chat
- [ ] Bannissement temporaire/permanent
- [ ] Logs d'activité

### 7.3 Monétisation et Progression
- [ ] Système de levels et XP
- [ ] Achievements/Trophées
- [ ] Cosmétiques (avatars, frames)
- [ ] Système de saisons
- [ ] Battle Pass (optionnel)

---

## Phase 8: Déploiement et Infrastructure

### 8.1 Configuration de déploiement
- [ ] Configuration Vercel/Netlify
- [ ] Variables d'environnement
- [ ] Base de données cloud (PlanetScale/Supabase)
- [ ] CDN pour les assets
- [ ] Monitoring et analytics

### 8.2 CI/CD et Testing
- [ ] Tests unitaires (Jest)
- [ ] Tests d'intégration (Cypress)
- [ ] GitHub Actions pour CI/CD
- [ ] Tests de performance
- [ ] Tests de charge pour Socket.io

### 8.3 Monitoring et Maintenance
- [ ] Logs applicatifs
- [ ] Monitoring des performances
- [ ] Alertes en cas d'erreur
- [ ] Backup automatique des données
- [ ] Documentation technique

---

## Phase 9: Contenu et Extension

### 9.1 Système de contenu extensible
- [ ] Upload d'images par les admins
- [ ] Système de tags pour les jeux
- [ ] Difficulté variable selon les images
- [ ] Système de packs de contenu
- [ ] Contenu généré par la communauté

### 9.2 Intégrations externes
- [ ] API Steam pour métadonnées des jeux
- [ ] Intégration Twitch pour streaming
- [ ] API Discord pour notifications
- [ ] Partage sur réseaux sociaux
- [ ] Leaderboards publics

---

## Estimation des Délais

- **Phase 1-2** (Architecture) : 1-2 semaines
- **Phase 3-4** (UI + Socket.io) : 2-3 semaines  
- **Phase 5** (Fonctionnalités jeu) : 1-2 semaines
- **Phase 6** (Polish UI/UX) : 1-2 semaines
- **Phase 7** (Fonctionnalités avancées) : 2-3 semaines
- **Phase 8** (Déploiement) : 1 semaine
- **Phase 9** (Extensions) : 1-2 semaines

**Durée totale estimée : 9-15 semaines** (selon le niveau de polish souhaité)

---

## Technologies Recommandées

### Frontend
- **Next.js 14** (App Router)
- **TypeScript** (type safety)
- **Tailwind CSS** (styling rapide)
- **Framer Motion** (animations)
- **React Leaflet** (cartes)
- **Pannellum React** (images 360°)
- **Zustand** (état global)

### Backend
- **Next.js API Routes** (backend intégré)
- **Socket.io** (temps réel)
- **Prisma** (ORM)
- **PostgreSQL** (base de données)

### Outils et Services
- **Vercel** (déploiement)
- **PlanetScale** (base de données cloud)
- **Cloudinary** (gestion d'images)
- **Sentry** (monitoring d'erreurs)
