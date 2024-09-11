# GameGuessr

GameGuessr est une application de jeu en ligne où les utilisateurs peuvent créer et rejoindre des salles de jeu, discuter et jouer ensemble. Le but du jeu est de trouver le jeu a partir d'une image, puis trouver l'emplacement sur une carte du jeu.

## Prérequis

Avant de commencer, assurez-vous d'avoir les éléments suivants installés sur votre machine :

- [Node.js](https://nodejs.org/) (version 14 ou supérieure)
- [npm](https://www.npmjs.com/) (version 6 ou supérieure)

## Installation

1. Clonez le dépôt GitHub :

```bash
git clone https://github.com/votre-utilisateur/GameGuessr.git
cd GameGuessr
```

2. Installez les dépendances :

```bash
npm install
```

## Utilisation
1. Démarrez le serveur :
```bash
node index.js
```
2.Ouvrez votre navigateur et accédez à http://localhost:3000.

## Structure du projet
Voici un aperçu de la structure des fichiers du projet :
```
GameGuessr/
├── index.js
├── index.html
├── game.html
├── js/
│   ├── three.min.js
│   └── panolens.min.js
├── res/
│   └── img/
│       └── example.png
├── package.json
└── README.md
```

### Fichiers principaux

- `index.js` : Le fichier principal du serveur Node.js utilisant Express et Socket.IO.
- `index.html` : La page d'accueil de l'application.
- `game.html` : La page de jeu où les utilisateurs peuvent jouer et discuter.
- `js/` : Dossier contenant les fichiers JavaScript nécessaires pour le jeu.
- `res/img/` : Dossier contenant les images utilisées dans l'application.

## Fonctionnalités

- **Créer une salle** : Les utilisateurs peuvent créer une nouvelle salle de jeu.
- **Rejoindre une salle** : Les utilisateurs peuvent rejoindre une salle existante en entrant le code de la salle.
- **Chat en direct** : Les utilisateurs peuvent discuter en temps réel dans la salle de jeu.
- **Tableau des scores** : Affiche les scores des joueurs dans la salle de jeu.
- **Options de jeu** : Les utilisateurs peuvent configurer les options de jeu.

## API

### Événements Socket.IO

- `debug` : Envoie un message de débogage au serveur.
- `get rooms` : Récupère la liste des salles existantes.
- `get user` : Récupère les informations d'un utilisateur.
- `get game` : Envoie une image de jeu aléatoire.
- `disconnect` : Gère la déconnexion d'un utilisateur.
- `room leave` : Permet à un utilisateur de quitter une salle.
- `user create` : Crée un nouvel utilisateur.
- `room create` : Crée une nouvelle salle de jeu.
- `room joined` : Permet à un utilisateur de rejoindre une salle.
- `uuid` : Génère un UUID unique.
- `chat message` : Envoie un message de chat dans une salle.

## Contribuer

Les contributions sont les bienvenues ! Si vous souhaitez contribuer à ce projet, veuillez suivre les étapes suivantes :

1. Forkez le dépôt.
2. Créez une branche pour votre fonctionnalité (`git checkout -b feature/ma-fonctionnalité`).
3. Commitez vos modifications (`git commit -am 'Ajoute une nouvelle fonctionnalité'`).
4. Poussez votre branche (`git push origin feature/ma-fonctionnalité`).
5. Ouvrez une Pull Request.

## Licence

Ce projet est sous licence MIT. Voir le fichier LICENSE pour plus de détails.