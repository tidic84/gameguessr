# GameGuessr - Migration vers Next.js

## 📋 Vue d'ensemble

Ce document décrit la migration complète de GameGuessr d'une architecture Express/Socket.io vers une application Next.js moderne avec TypeScript.

### 🎯 Objectifs de la migration

- **Modernisation** : Passage à React et Next.js pour une meilleure DX
- **Performance** : Optimisations automatiques de Next.js (SSR, code splitting)
- **Type Safety** : Adoption complète de TypeScript
- **UI/UX** : Interface moderne et responsive avec Tailwind CSS
- **Maintenabilité** : Code mieux structuré et réutilisable
- **Scalabilité** : Architecture plus robuste pour les futures fonctionnalités

## 🚀 Démarrage rapide

### Prérequis
- Node.js 18+
- npm ou yarn
- Git

### Gestionnaire de tâches
Nous utilisons un système de tâches personnalisé pour suivre la progression :

```bash
# Voir toutes les commandes disponibles
node tasks.js

# Vue d'ensemble du projet
node tasks.js overview

# Voir la phase actuelle
node tasks.js current

# Voir les statistiques
node tasks.js stats

# Mettre à jour une tâche
node tasks.js update task-1-1 in-progress

# Lister les tâches par status
node tasks.js status pending
```

## 📊 Progression actuelle

- **Total des tâches** : 22 tâches réparties en 7 phases
- **Temps estimé** : 163 heures (9-15 semaines)
- **Phase actuelle** : Phase 1 - Configuration et Architecture Next.js

## 🏗️ Architecture cible

### Frontend (Next.js 14)
```
src/
├── app/                    # App Router Next.js
│   ├── page.tsx           # Page d'accueil
│   ├── room/[code]/       # Pages de salle dynamiques
│   └── layout.tsx         # Layout global
├── components/            # Composants React
│   ├── ui/               # Composants UI réutilisables
│   ├── game/             # Composants spécifiques au jeu
│   ├── chat/             # Système de chat
│   └── room/             # Gestion des salles
├── hooks/                # Hooks personnalisés
├── lib/                  # Utilitaires et helpers
├── store/                # État global (Zustand)
└── types/                # Définitions TypeScript
```

### Backend (Next.js API Routes)
```
pages/api/
├── socket.js             # Serveur Socket.io intégré
├── rooms/                # API REST pour les salles
├── users/                # Gestion des utilisateurs  
├── game-data/            # Données de jeu
└── health.js             # Monitoring
```

### Stack technologique

**Frontend**
- ⚛️ **Next.js 14** - Framework React avec App Router
- 🔷 **TypeScript** - Type safety
- 🎨 **Tailwind CSS** - Styling utilitaire
- 🎭 **Framer Motion** - Animations fluides
- 🗺️ **React Leaflet** - Cartes interactives
- 🌐 **Pannellum React** - Images 360°
- 🔄 **Zustand** - État global simple
- 🔌 **Socket.io Client** - WebSocket temps réel

**Backend**
- 🚀 **Next.js API Routes** - Backend intégré
- 🔌 **Socket.io** - Communication temps réel
- 🗄️ **Prisma** - ORM moderne
- 🐘 **PostgreSQL** - Base de données relationnelle

**Outils & Services**
- ▲ **Vercel** - Déploiement et hosting
- 🔧 **ESLint + Prettier** - Qualité de code
- 🧪 **Jest + Cypress** - Tests
- 📊 **Sentry** - Monitoring d'erreurs

## 🔄 Phases de migration

### Phase 1 : Configuration et Architecture (1-2 semaines) 🟡
- [x] Analyse de l'existant ✅
- [ ] Initialisation Next.js + TypeScript
- [ ] Installation des dépendances
- [ ] Structure des dossiers
- [ ] Configuration TypeScript

### Phase 2 : Backend Next.js (1-2 semaines) 🔴
- [ ] Migration Socket.io vers API Routes
- [ ] Création des APIs REST
- [ ] Migration vers base de données moderne
- [ ] Tests backend

### Phase 3 : Composants UI (2-3 semaines) 🔴
- [ ] Page d'accueil modernisée
- [ ] Interface de jeu refactorisée
- [ ] Système de chat amélioré
- [ ] Tableau des scores dynamique

### Phase 4 : Intégration temps réel (1 semaine) 🔴
- [ ] Hook useSocket personnalisé
- [ ] État global avec Zustand
- [ ] Synchronisation temps réel

### Phase 5 : Fonctionnalités avancées (1-2 semaines) 🔴
- [ ] Système de jeu amélioré
- [ ] Scoring sophistiqué
- [ ] Nouveaux modes de jeu

### Phase 6 : Polish UI/UX (1-2 semaines) 🔴
- [ ] Design system complet
- [ ] Animations et microinteractions
- [ ] Optimisations de performance

### Phase 7 : Déploiement (1 semaine) 🔴
- [ ] Configuration production
- [ ] CI/CD et tests
- [ ] Monitoring et maintenance

## 📝 Fonctionnalités actuelles analysées

### Système existant
- ✅ **Authentification** - UUID avec cookies
- ✅ **Gestion des salles** - Création/Rejoindre avec codes
- ✅ **Configuration de jeu** - Modes, difficulté, durée
- ✅ **Jeu principal** - Images 360° + localisation sur carte
- ✅ **Chat temps réel** - Communication entre joueurs
- ✅ **Système de scores** - Calcul basé sur précision
- ✅ **Reconnexion** - Gestion des déconnexions

### Événements Socket.io identifiés
```javascript
// Client → Serveur
'get rooms', 'get room', 'get user'
'user create', 'room create', 'room joined'
'game start', 'game answer', 'game reset'
'chat message', 'uuid'

// Serveur → Client  
'rooms', 'room update', 'user'
'player update', 'game start', 'game update'
'game image update', 'game end', 'game reset'
'chat message', 'chat join', 'chat leave'
```

## 🛠️ Comment contribuer

1. **Choisir une tâche** : Utiliser `node tasks.js current` pour voir les tâches disponibles
2. **Mettre à jour le status** : `node tasks.js update task-id in-progress`
3. **Développer** : Suivre les sous-tâches définies
4. **Tester** : Vérifier que tout fonctionne
5. **Marquer comme terminé** : `node tasks.js update task-id completed`

## 📚 Resources utiles

- [Next.js Documentation](https://nextjs.org/docs)
- [Socket.io avec Next.js](https://socket.io/how-to/use-with-nextjs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)
- [React Leaflet](https://react-leaflet.js.org/)
- [Pannellum](https://pannellum.org/documentation/overview/)

## 🔍 Prochaines étapes

1. **Commencer la Phase 1** - Initialisation du projet Next.js
2. **Analyser les dépendances** - Vérifier la compatibilité des librairies
3. **Planifier les tests** - Définir la stratégie de test
4. **Préparer l'environnement** - Configuration du développement

---

**Dernière mise à jour** : 2 janvier 2025  
**Status global** : 0% (Phase 1 en cours)  
**Prochaine milestone** : Projet Next.js initialisé
