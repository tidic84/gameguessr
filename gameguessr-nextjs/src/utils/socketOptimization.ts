import { Socket } from 'socket.io-client';
import { debounce, throttle } from 'lodash';

// Configuration des intervalles de throttling par type d'événement
const THROTTLE_INTERVALS = {
  player_update: 100,  // 100ms pour les mises à jour de position
  chat_message: 300,   // 300ms pour les messages de chat
  game_state: 500,     // 500ms pour les états de jeu
  score_update: 1000,  // 1s pour les mises à jour de score
};

// Configuration de la reconnexion
const RECONNECTION_CONFIG = {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  randomizationFactor: 0.5,
};

// Utilitaire de compression de données
const compressData = (data: any): string => {
  if (typeof data === 'string') return data;
  return JSON.stringify(data, (key, value) => {
    // Optimisation des nombres
    if (typeof value === 'number') {
      return Number(value.toFixed(2));
    }
    // Optimisation des dates
    if (value instanceof Date) {
      return value.getTime();
    }
    return value;
  });
};

// Classe d'optimisation Socket.io
export class SocketOptimizer {
  private socket: Socket;
  private eventBuffers: Map<string, any[]>;
  private flushTimers: Map<string, NodeJS.Timeout>;

  constructor(socket: Socket) {
    this.socket = socket;
    this.eventBuffers = new Map();
    this.flushTimers = new Map();
    this.setupSocket();
  }

  private setupSocket() {
    // Configuration de la reconnexion
    this.socket.io.opts = { ...this.socket.io.opts, ...RECONNECTION_CONFIG };

    // Gestion des erreurs et reconnexions
    this.socket.on('connect_error', this.handleConnectionError);
    this.socket.on('disconnect', this.handleDisconnect);
    this.socket.on('reconnect', this.handleReconnect);
  }

  // Émission optimisée avec throttling
  public emit = throttle((event: string, data: any) => {
    const compressedData = compressData(data);
    this.socket.emit(event, compressedData);
  }, 100);

  // Émission en lot pour les événements fréquents
  public batchEmit(event: string, data: any) {
    if (!this.eventBuffers.has(event)) {
      this.eventBuffers.set(event, []);
      this.setupFlushTimer(event);
    }
    this.eventBuffers.get(event)?.push(data);
  }

  private setupFlushTimer(event: string) {
    const interval = THROTTLE_INTERVALS[event as keyof typeof THROTTLE_INTERVALS] || 1000;
    const timer = setInterval(() => this.flushBuffer(event), interval);
    this.flushTimers.set(event, timer);
  }

  private flushBuffer(event: string) {
    const buffer = this.eventBuffers.get(event);
    if (buffer && buffer.length > 0) {
      const compressedData = compressData(buffer);
      this.socket.emit(`${event}_batch`, compressedData);
      this.eventBuffers.set(event, []);
    }
  }

  // Gestionnaires d'événements de connexion
  private handleConnectionError = debounce((error: Error) => {
    console.warn('Socket.io connection error:', error);
    // Implémenter la logique de retry personnalisée si nécessaire
  }, 1000);

  private handleDisconnect = debounce((reason: string) => {
    console.warn('Socket.io disconnected:', reason);
    // Sauvegarder l'état si nécessaire
  }, 1000);

  private handleReconnect = debounce((attemptNumber: number) => {
    console.log('Socket.io reconnected after', attemptNumber, 'attempts');
    // Restaurer l'état si nécessaire
  }, 1000);

  // Nettoyage
  public dispose() {
    this.flushTimers.forEach(timer => clearInterval(timer));
    this.eventBuffers.clear();
    this.flushTimers.clear();
  }
}

// Hook personnalisé pour utiliser l'optimiseur
export const useSocketOptimizer = (socket: Socket) => {
  const optimizer = new SocketOptimizer(socket);
  return optimizer;
};
