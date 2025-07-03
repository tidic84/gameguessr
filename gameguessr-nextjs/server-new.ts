import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server as SocketIOServer } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  User, 
  Room,
  GameData,
  GameState 
} from './src/types';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// État du serveur
let rooms: Record<string, Room> = {};
let users: Record<string, User> = {};
let gameDB: GameData[] = [];

// Système de timers pour les rooms
let roomTimers: Record<string, NodeJS.Timeout> = {};
let roomTimeLeft: Record<string, number> = {};

// Index des images pour chaque room
let roomImageIndex: Record<string, number> = {};

// Fonction pour démarrer le timer d'une room
function startRoomTimer(roomCode: string, duration: number, io: SocketIOServer) {
  // Nettoyer le timer existant s'il y en a un
  if (roomTimers[roomCode]) {
    clearInterval(roomTimers[roomCode]);
  }
  
  // Initialiser le temps et l'index d'image
  roomTimeLeft[roomCode] = duration;
  
  // Notifier les clients du démarrage du timer
  io.to(roomCode).emit('game timer start', duration);
  
  // Créer le timer
  roomTimers[roomCode] = setInterval(() => {
    const currentTime = roomTimeLeft[roomCode];
    if (currentTime === undefined) return;
    
    roomTimeLeft[roomCode] = currentTime - 1;
    
    // Envoyer la mise à jour du timer
    io.to(roomCode).emit('timer update', roomTimeLeft[roomCode]);
    
    // Si le temps est écoulé
    if (roomTimeLeft[roomCode] <= 0) {
      clearInterval(roomTimers[roomCode]);
      delete roomTimers[roomCode];
      delete roomTimeLeft[roomCode];
      
      // Notifier la fin du timer
      io.to(roomCode).emit('game timer stop');
      
      // Passer à l'image suivante automatiquement
      const room = rooms[roomCode];
      if (room && room.gameDB && room.gameDB.length > 0) {
        const currentIndex = roomImageIndex[roomCode] || 0;
        const nextIndex = currentIndex + 1;
        
        if (nextIndex < room.gameDB.length) {
          // Passer à l'image suivante
          roomImageIndex[roomCode] = nextIndex;
          io.to(roomCode).emit('game image update', roomCode, nextIndex);
          
          // Redémarrer le timer pour l'image suivante
          setTimeout(() => {
            startRoomTimer(roomCode, room.duration, io);
          }, 3000); // 3 secondes de pause entre les images
          
        } else {
          // Fin du jeu
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

// Fonction pour arrêter le timer d'une room
function stopRoomTimer(roomCode: string, io: SocketIOServer) {
  if (roomTimers[roomCode]) {
    clearInterval(roomTimers[roomCode]);
    delete roomTimers[roomCode];
    delete roomTimeLeft[roomCode];
    delete roomImageIndex[roomCode];
    io.to(roomCode).emit('game timer stop');
  }
}

// Charger les données du jeu
try {
  const gameDataPath = join(process.cwd(), 'public/game.json');
  gameDB = JSON.parse(readFileSync(gameDataPath, 'utf-8'));
} catch (error) {
  console.error('Erreur lors du chargement des données du jeu:', error);
}

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('Nouvel utilisateur connecté:', socket.id);

    // Debug
    socket.on('debug', (message: string) => {
      console.log('Debug:', message);
    });

    // Obtenir toutes les rooms
    socket.on('get rooms', () => {
      socket.emit('rooms', rooms);
    });

    // Obtenir une room spécifique
    socket.on('get room', (roomCode: string) => {
      const room = rooms[roomCode];
      if (room) {
        socket.emit('room update', roomCode, room);
      }
    });

    // Obtenir un utilisateur
    socket.on('get user', (userId: string) => {
      const user = users[userId];
      if (user) {
        socket.emit('user', user);
      }
    });

    // Créer un utilisateur
    socket.on('user create', (userId: string, username: string) => {
      users[userId] = {
        id: userId,
        name: username,
        socketId: socket.id,
        points: 0
      };
      console.log('Utilisateur créé:', users[userId]);
      socket.emit('user', users[userId]);
    });

    // Créer une room
    socket.on('room create', (roomData) => {
      const room: Room = {
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

    // Rejoindre une room
    socket.on('room joined', (roomCode: string, userId: string) => {
      const room = rooms[roomCode];
      const user = users[userId];
      
      if (room && user) {
        socket.join(roomCode);
        
        room.users[userId] = {
          name: user.name,
          points: user.points,
          role: room.owner === userId ? 'admin' : 'player',
          status: true,
          alive: true
        };
        
        console.log(`${user.name} a rejoint ${roomCode}`);
        io.emit('room update', roomCode, room);
        io.emit('player update', roomCode, room.users);
        io.emit('chat join', userId, roomCode);
      } else {
        console.log('Room ou utilisateur inexistant');
      }
    });

    // Démarrer le jeu
    socket.on('game start', (roomCode: string) => {
      const room = rooms[roomCode];
      if (room) {
        room.gameState = 'playing';
        room.gameDB = gameDB;
        
        // Initialiser l'index d'image à 0
        roomImageIndex[roomCode] = 0;
        
        // Démarrer le timer pour cette room
        startRoomTimer(roomCode, room.duration, io);
        
        io.emit('game start', roomCode);
        io.emit('game update', roomCode, room, room.gameState);
        io.emit('room update', roomCode, room);
        io.to(roomCode).emit('game image update', roomCode, 0);
      }
    });

    // Répondre au jeu
    socket.on('game answer', (
      roomCode: string,
      userId: string,
      correct: boolean,
      mode: 'name' | 'map',
      gameState: GameState,
      roomGameDB: GameData[],
      points: number
    ) => {
      const room = rooms[roomCode];
      const roomUser = room?.users[userId];
      
      if (!room || !roomUser) return;

      if (mode === 'name') {
        if (correct && !roomUser.status) {
          roomUser.points += 100;
          roomUser.status = true;
          io.emit('player update', roomCode, room.users);
        }
      } else if (mode === 'map') {
        if (correct && roomUser.status) {
          roomUser.points += points;
          io.emit('player update', roomCode, room.users);
        }
      }

      io.emit('game update', roomCode, room, gameState);
    });

    // Passer à l'image suivante manuellement
    socket.on('next image', (roomCode: string) => {
      const room = rooms[roomCode];
      if (room && room.gameDB && room.gameDB.length > 0) {
        const currentIndex = roomImageIndex[roomCode] || 0;
        const nextIndex = currentIndex + 1;
        
        if (nextIndex < room.gameDB.length) {
          // Arrêter le timer actuel
          stopRoomTimer(roomCode, io);
          
          // Passer à l'image suivante
          roomImageIndex[roomCode] = nextIndex;
          io.to(roomCode).emit('game image update', roomCode, nextIndex);
          
          // Redémarrer le timer pour l'image suivante
          setTimeout(() => {
            startRoomTimer(roomCode, room.duration, io);
          }, 1000); // 1 seconde de pause
          
        } else {
          // Fin du jeu
          room.gameState = 'end';
          delete roomImageIndex[roomCode];
          stopRoomTimer(roomCode, io);
          io.to(roomCode).emit('game end', roomCode);
          io.emit('room update', roomCode, room);
        }
      }
    });

    // Réinitialiser le jeu
    socket.on('game reset', (roomCode: string) => {
      const room = rooms[roomCode];
      if (room) {
        room.gameState = 'wait';
        room.gameDB = [];
        
        // Arrêter le timer
        stopRoomTimer(roomCode, io);
        
        // Réinitialiser les scores
        Object.values(room.users).forEach(user => {
          user.points = 0;
          user.status = true;
          user.alive = true;
        });
        
        io.emit('game reset', roomCode);
        io.emit('game update', roomCode, room, room.gameState);
        io.emit('player update', roomCode, room.users);
        io.emit('room update', roomCode, room);
      }
    });

    // Générer UUID
    socket.on('uuid', () => {
      socket.emit('uuid', uuidv4());
    });

    // Messages de chat
    socket.on('chat message', (roomCode: string, userId: string, message: string) => {
      const room = rooms[roomCode];
      const user = users[userId];
      
      if (room && user) {
        console.log(`Message de ${user.name} dans ${roomCode}: ${message}`);
        io.to(roomCode).emit('chat message', roomCode, user.name, message);
      }
    });

    // Déconnexion
    socket.on('disconnect', () => {
      console.log('Utilisateur déconnecté:', socket.id);
      
      let userId = '';
      for (const uid in users) {
        const user = users[uid];
        if (user && user.socketId === socket.id) {
          userId = uid;
          break;
        }
      }

      if (userId) {
        for (const roomCode in rooms) {
          const room = rooms[roomCode];
          const roomUser = room?.users[userId];
          
          if (room && roomUser) {
            roomUser.alive = false;
            io.emit('player update', roomCode, room.users);
            io.emit('chat leave', userId, roomCode);
            io.emit('room update', roomCode, room);

            // Supprimer la room si vide
            const aliveUsers = Object.values(room.users).filter(user => user.alive);
            if (aliveUsers.length === 0) {
              setTimeout(() => {
                const currentRoom = rooms[roomCode];
                if (currentRoom && Object.values(currentRoom.users).every(user => !user.alive)) {
                  stopRoomTimer(roomCode, io);
                  delete rooms[roomCode];
                  console.log(`Room ${roomCode} supprimée (vide)`);
                }
              }, 5000);
            }
          }
        }
        
        delete users[userId];
      }
    });
  });

  server.listen(port, () => {
    console.log(`> Serveur prêt sur http://${hostname}:${port}`);
    console.log('> Socket.io server running');
  });
});
