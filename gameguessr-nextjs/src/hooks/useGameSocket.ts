import { useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useSocketOptimizer } from '@/utils/socketOptimization';
import { useGameStore } from '@/store/gameStore';

export const useGameSocket = (roomCode: string) => {
  const socketRef = useRef<Socket | null>(null);
  const optimizerRef = useRef<ReturnType<typeof useSocketOptimizer> | null>(null);
  const {
    addUserMessage,
    addSystemMessage,
    updateRoomUsers
  } = useGameStore();

  // Initialisation de la connexion
  useEffect(() => {
    if (!roomCode) return;

    // Configuration de la connexion
    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      transports: ['websocket'],
      query: { roomCode },
    });

    // Initialisation de l'optimiseur
    const optimizer = useSocketOptimizer(socket);
    socketRef.current = socket;
    optimizerRef.current = optimizer;

    // Gestionnaires d'événements optimisés
    socket.on('connect', () => {
      console.log('Connected to game server');
      addSystemMessage(roomCode, 'Connecté au serveur de jeu', 'info');
    });

    socket.on('disconnect', (reason) => {
      console.log('Disconnected:', reason);
      if (reason === 'io server disconnect') {
        socket.connect(); // Reconnexion automatique
      }
      addSystemMessage(roomCode, 'Déconnecté du serveur', 'warning');
    });

    socket.on('reconnect_attempt', (attemptNumber) => {
      addSystemMessage(roomCode, `Tentative de reconnexion ${attemptNumber}...`, 'warning');
    });

    socket.on('reconnect', () => {
      addSystemMessage(roomCode, 'Reconnecté au serveur', 'info');
    });

    // Événements de jeu en lot - simplifié pour le moment
    socket.on('game_state_batch', (states: any[]) => {
      console.log('Game state batch received:', states);
    });

    // Nettoyage à la déconnexion
    return () => {
      optimizer.dispose();
      socket.disconnect();
    };
  }, [roomCode]);

  // Émetteurs d'événements optimisés
  const emitGameEvent = useCallback((eventName: string, data: any) => {
    if (!optimizerRef.current) return;
    optimizerRef.current.emit(eventName, data);
  }, []);

  const emitBatchedGameEvent = useCallback((eventName: string, data: any) => {
    if (!optimizerRef.current) return;
    optimizerRef.current.batchEmit(eventName, data);
  }, []);

  return {
    socket: socketRef.current,
    emitGameEvent,
    emitBatchedGameEvent,
  };
};

export default useGameSocket;
