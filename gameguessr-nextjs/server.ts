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
  ServerUser,
  ServerRoom
} from './src/types/server';

const dev = process.env.NODE_ENV !== 'production';
const hostname = 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

// État du serveur
let rooms: Record<string, ServerRoom> = {};
let users: Record<string, ServerUser> = {};
let gameDB: any[] = [];

// Système de timers pour les rooms
let roomTimers: Record<string, NodeJS.Timeout> = {};
let roomTimeLeft: Record<string, number> = {};

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
    console.log('Client connecté:', socket.id);

    socket.on('createUser', ({ userId, username }) => {
      console.log(`Création utilisateur: ${username} (${userId})`);
      users[userId] = {
        id: userId,
        name: username,
        socketId: socket.id,
        score: 0,
        status: 'active'
      };
    });

    socket.on('createRoom', (data) => {
      const { code, name, owner, mode = 'classic', maxPlayers = 10, settings = {} } = data;
      
      console.log(`Création room ${code} par ${owner}`);
      
      if (rooms[code]) {
        socket.emit('error', { message: 'Code de room déjà utilisé' });
        return;
      }

      const room: Room = {
        code,
        name,
        owner,
        mode,
        maxPlayers,
        settings,
        users: {},
        status: 'waiting',
        currentRound: 0,
        maxRounds: 5,
        timeLimit: 120
      };

      rooms[code] = room;
      
      // Ajouter le créateur à la room
      socket.join(code);
      if (users[owner]) {
        rooms[code].users[owner] = users[owner];
      }

      socket.emit('roomJoined', { 
        room: rooms[code],
        user: users[owner]
      });
    });

    socket.on('joinRoom', ({ roomCode }) => {
      const room = rooms[roomCode];
      if (!room) {
        socket.emit('error', { message: 'Room introuvable' });
        return;
      }

      const userId = Object.keys(users).find(id => users[id].socketId === socket.id);
      if (!userId || !users[userId]) {
        socket.emit('error', { message: 'Utilisateur non authentifié' });
        return;
      }

      socket.join(roomCode);
      room.users[userId] = users[userId];

      io.to(roomCode).emit('roomUpdated', room);
      socket.emit('roomJoined', { room, user: users[userId] });
    });

    // Obtenir la liste des rooms
    socket.on('get rooms', () => {
      socket.emit('rooms', rooms);
    });

    // Obtenir une room spécifique
    socket.on('get room', (roomCode: string) => {
      const room = rooms[roomCode];
      if (room) {
        io.emit('room update', roomCode, room);
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
      
      rooms[room.code] = room;
      console.log('Room créée:', room);
    });

    // Rejoindre une room
    socket.on('room joined', (roomCode: string, userId: string) => {
      console.log(`Utilisateur ${userId} rejoint la room ${roomCode}`);
      
      const user = users[userId];
      if (user && user.socketId !== socket.id) {
        user.socketId = socket.id;
      }

      const room = rooms[roomCode];
      if (room) {
        if (!room.users[userId]) {
          room.users[userId] = {
            name: user?.name || 'Inconnu',
            points: 0,
            role: 'player',
            team: undefined,
            status: false,
            alive: true
          };
        } else {
          room.users[userId].name = user?.name || 'Inconnu';
          room.users[userId].alive = true;
        }

        io.emit(`player update ${roomCode}`, room.users);
        io.emit('chat join', userId, roomCode);
      } else {
        console.log('Room inexistante');
      }
    });

    // Démarrer le jeu
    socket.on('game start', (roomCode: string) => {
      const room = rooms[roomCode];
      if (room) {
        room.gameState = 'playing';
        room.gameDB = gameDB;
        
        // Démarrer le timer pour cette room
        startRoomTimer(roomCode, room.duration, io);
        
        io.emit('game start', roomCode);
        io.emit('game update', roomCode, room, room.gameState);
        io.emit('room update', roomCode, room);
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
          room.gameState = gameState.replace('image', 'image') + ' map' as GameState;
        }
        if (!correct) {
          roomUser.status = true;
        }
        io.emit(`player update ${roomCode}`, room.users);
      }

      if (mode === 'map') {
        roomUser.status = true;
        roomUser.points += points;
        io.emit(`player update ${roomCode}`, room.users);
      }

      // Vérifier si tous les joueurs ont répondu
      if (Object.values(room.users).every(user => user.status)) {
        const gameStateParts = gameState.split(' ');
        const imageNumberStr = gameStateParts[1];
        
        if (!imageNumberStr) return;
        
        const currentImageNumber = parseInt(imageNumberStr);
        
        if (roomGameDB[currentImageNumber]) {
          // Image suivante
          room.gameState = `image ${currentImageNumber + 1}` as GameState;
          Object.values(room.users).forEach(user => {
            user.status = false;
          });
          
          io.emit('game update', roomCode, room, room.gameState);
          io.emit('room update', roomCode, room);
          io.emit('game image update', roomCode, currentImageNumber + 1);
        } else {
          // Fin du jeu
          room.gameState = 'end';
          Object.values(room.users).forEach(user => {
            user.status = false;
          });
          
          io.emit('game update', roomCode, room, room.gameState);
          io.emit('room update', roomCode, room);
          io.emit('game end', roomCode);
        }
      }
    });

    // Réinitialiser le jeu
    socket.on('game reset', (roomCode: string) => {
      setTimeout(() => {
        const room = rooms[roomCode];
        if (room) {
          room.gameState = 'wait';
          Object.values(room.users).forEach(user => {
            user.points = 0;
          });
          
          io.emit('game update', roomCode, room, room.gameState);
          io.emit('room update', roomCode, room);
          io.emit(`player update ${roomCode}`, room.users);
          io.emit('game reset', roomCode);
        }
      }, 2500);
    });

    // Générer UUID
    socket.on('uuid', () => {
      socket.emit('uuid', uuidv4());
    });

    // Messages de chat
    socket.on('chat message', (roomCode: string, userId: string, message: string) => {
      const user = users[userId];
      const room = rooms[roomCode];
      
      if (user && room) {
        io.emit('game update', roomCode, room, room.gameState);
        io.emit(`chat message ${roomCode}`, user.name, message);
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
            io.emit(`player update ${roomCode}`, room.users);
            io.emit('chat leave', userId, roomCode);
            io.emit('room update', roomCode, room);

            // Supprimer la room si vide
            const aliveUsers = Object.values(room.users).filter(user => user.alive);
            if (aliveUsers.length === 0) {
              setTimeout(() => {
                const currentRoom = rooms[roomCode];
                if (currentRoom && Object.values(currentRoom.users).every(user => !user.alive)) {
                  delete rooms[roomCode];
                  console.log(`Room ${roomCode} supprimée`);
                }
              }, 10000);
            }
          }
        }
      }
    });
  });

  server.listen(port, () => {
    console.log(`> Serveur prêt sur http://${hostname}:${port}`);
    console.log(`> Socket.io server running`);
  });
});

// Fonction pour démarrer le timer d'une room
function startRoomTimer(roomCode: string, duration: number, io: SocketIOServer) {
  // Nettoyer le timer existant s'il y en a un
  if (roomTimers[roomCode]) {
    clearInterval(roomTimers[roomCode]);
  }
  
  // Initialiser le temps
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
      
      // Optionnel: passer à l'image suivante automatiquement
      const room = rooms[roomCode];
      if (room) {
        // Logique pour passer à l'image suivante ou terminer le jeu
        console.log(`Timer écoulé pour la room ${roomCode}`);
      }
    }
  }, 1000);
}

// Fonction pour arrêter le timer d'une room
function stopRoomTimer(roomCode: string, io: SocketIOServer) {
  if (roomTimers[roomCode]) {
    clearInterval(roomTimers[roomCode]);
    delete roomTimers[roomCode];
    delete roomTimeLeft[roomCode];
    io.to(roomCode).emit('game timer stop');
  }
}
