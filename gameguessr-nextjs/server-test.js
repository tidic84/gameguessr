// Serveur de test simple en JavaScript
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { Server } = require('socket.io');
const { v4: uuidv4 } = require('uuid');
const { readFileSync } = require('fs');
const { join } = require('path');

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// État du serveur
let rooms = {};
let users = {};
let gameDB = [];

// Système de timers pour les rooms
let roomTimers = {};
let roomTimeLeft = {};
let roomImageIndex = {};

// Fonction pour démarrer le timer d'une room
function startRoomTimer(roomCode, duration, io) {
  if (roomTimers[roomCode]) {
    clearInterval(roomTimers[roomCode]);
  }
  
  roomTimeLeft[roomCode] = duration;
  io.to(roomCode).emit('game timer start', duration);
  
  roomTimers[roomCode] = setInterval(() => {
    const currentTime = roomTimeLeft[roomCode];
    if (currentTime === undefined) return;
    
    roomTimeLeft[roomCode] = currentTime - 1;
    io.to(roomCode).emit('timer update', roomTimeLeft[roomCode]);
    
    if (roomTimeLeft[roomCode] <= 0) {
      clearInterval(roomTimers[roomCode]);
      delete roomTimers[roomCode];
      delete roomTimeLeft[roomCode];
      
      io.to(roomCode).emit('game timer stop');
      
      const room = rooms[roomCode];
      if (room && room.gameDB && room.gameDB.length > 0) {
        const currentIndex = roomImageIndex[roomCode] || 0;
        const nextIndex = currentIndex + 1;
        
        if (nextIndex < room.gameDB.length) {
          roomImageIndex[roomCode] = nextIndex;
          io.to(roomCode).emit('game image update', roomCode, nextIndex);
          
          setTimeout(() => {
            startRoomTimer(roomCode, room.duration, io);
          }, 3000);
          
        } else {
          room.gameState = 'end';
          delete roomImageIndex[roomCode];
          io.to(roomCode).emit('game end', roomCode);
          io.emit('room update', roomCode, room);
        }
      }
      
      console.log(`Timer écoulé pour la room ${roomCode}`);
    }
  }, 1000);
}

// Charger les données du jeu
try {
  const gameDataPath = join(process.cwd(), 'public/game.json');
  gameDB = JSON.parse(readFileSync(gameDataPath, 'utf-8'));
  console.log(`Données du jeu chargées: ${gameDB.length} images`);
} catch (error) {
  console.error('Erreur lors du chargement des données du jeu:', error);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Nouvel utilisateur connecté:', socket.id);

    // Créer une room
    socket.on('room create', (roomData) => {
      const room = {
        code: roomData.code,
        name: roomData.name,
        owner: roomData.owner,
        mode: roomData.mode,
        difficulty: roomData.difficulty,
        duration: roomData.duration,
        privacy: roomData.privacy,
        gameState: 'wait',
        gameDB: [],
        users: {}
      };
      
      rooms[roomData.code] = room;
      console.log('Room créée:', room);
      io.emit('rooms', rooms);
    });

    // Démarrer le jeu
    socket.on('game start', (roomCode) => {
      const room = rooms[roomCode];
      if (room) {
        room.gameState = 'playing';
        room.gameDB = gameDB;
        
        roomImageIndex[roomCode] = 0;
        
        startRoomTimer(roomCode, room.duration, io);
        
        io.emit('game start', roomCode);
        io.emit('game update', roomCode, room, room.gameState);
        io.emit('room update', roomCode, room);
        io.to(roomCode).emit('game image update', roomCode, 0);
      }
    });

    // Passer à l'image suivante manuellement
    socket.on('next image', (roomCode) => {
      const room = rooms[roomCode];
      if (room && room.gameDB && room.gameDB.length > 0) {
        const currentIndex = roomImageIndex[roomCode] || 0;
        const nextIndex = currentIndex + 1;
        
        if (nextIndex < room.gameDB.length) {
          // Arrêter le timer actuel
          if (roomTimers[roomCode]) {
            clearInterval(roomTimers[roomCode]);
            delete roomTimers[roomCode];
            delete roomTimeLeft[roomCode];
          }
          
          roomImageIndex[roomCode] = nextIndex;
          io.to(roomCode).emit('game image update', roomCode, nextIndex);
          
          setTimeout(() => {
            startRoomTimer(roomCode, room.duration, io);
          }, 1000);
          
        } else {
          room.gameState = 'end';
          delete roomImageIndex[roomCode];
          io.to(roomCode).emit('game end', roomCode);
          io.emit('room update', roomCode, room);
        }
      }
    });

    socket.on('disconnect', () => {
      console.log('Utilisateur déconnecté:', socket.id);
    });
  });

  server.listen(port, () => {
    console.log(`> Serveur prêt sur http://${hostname}:${port}`);
    console.log('> Socket.io server running');
  });
});
