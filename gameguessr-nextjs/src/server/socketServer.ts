import { Server as SocketServer } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { instrument } from '@socket.io/admin-ui';
import compression from 'compression';

// Configuration avancée de Socket.io
export const configureSocketServer = (httpServer: HTTPServer) => {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'development' 
        ? ['http://localhost:3000'] 
        : [process.env.NEXT_PUBLIC_SITE_URL as string],
      credentials: true
    },
    // Activation de la compression
    perMessageDeflate: true,
    // Configuration des timeouts
    pingTimeout: 30000,
    pingInterval: 25000,
    // Configuration des transports
    transports: ['websocket', 'polling'],
    // Configuration de l'adapter
    adapter: {
      rooms: new Map(),
      sids: new Map(),
    },
  });

  // Configuration de l'UI d'administration si en développement
  if (process.env.NODE_ENV === 'development') {
    instrument(io, {
      auth: false,
      mode: 'development',
    });
  }

  // Middleware de compression
  io.use((socket, next) => {
    compression()(socket.request as any, {} as any, next);
  });

  // Middleware pour limiter le taux de messages
  io.use((socket, next) => {
    const rateLimit = {
      windowMs: 1000, // 1 seconde
      max: 10 // maximum 10 messages par seconde
    };

    const store = new Map<string, number[]>();

    socket.on('message', (data) => {
      const now = Date.now();
      const userId = socket.id;
      
      if (!store.has(userId)) {
        store.set(userId, []);
      }

      const userMessages = store.get(userId) as number[];
      const windowStart = now - rateLimit.windowMs;
      
      // Nettoyer les anciens messages
      const recentMessages = userMessages.filter(timestamp => timestamp > windowStart);
      store.set(userId, recentMessages);

      // Vérifier la limite
      if (recentMessages.length >= rateLimit.max) {
        socket.emit('error', 'Rate limit exceeded');
        return;
      }

      // Ajouter le nouveau message
      recentMessages.push(now);
      store.set(userId, recentMessages);
    });

    next();
  });

  // Gestion des salles optimisée
  const roomManager = {
    // Limiter le nombre de joueurs par salle
    maxUsersPerRoom: 10,
    
    // Vérifier si une salle peut accepter un nouveau joueur
    canJoinRoom: (roomId: string): boolean => {
      const room = io.sockets.adapter.rooms.get(roomId);
      return !room || room.size < roomManager.maxUsersPerRoom;
    },
    
    // Obtenir les statistiques d'une salle
    getRoomStats: (roomId: string) => {
      const room = io.sockets.adapter.rooms.get(roomId);
      return {
        usersCount: room?.size || 0,
        isFull: room?.size === roomManager.maxUsersPerRoom,
      };
    },
  };

  // Gestionnaire d'événements optimisé
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Gestionnaire de déconnexion optimisé
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      // Nettoyage des ressources
    });

    // Gestionnaire d'événements en lot
    socket.on('batch_events', (events) => {
      events.forEach((event: { type: string; data: any }) => {
        socket.emit(event.type, event.data);
      });
    });
  });

  return { io, roomManager };
};

export default configureSocketServer;
