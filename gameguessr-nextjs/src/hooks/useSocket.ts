import { useEffect, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';
import { useGameStore } from '@/store/gameStore';
import type { Room, RoomUser } from '@/types';
import { convertServerRoomToStoreRoom, convertServerUserToStoreUser } from '@/utils/typeConverters';

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 5;
  const RECONNECT_DELAY = 2000;

  const {
    setCurrentRoom,
    updateCurrentRoom,
    updateRoomUsers,
    currentRoom,
    setUser
  } = useGameStore();

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io('http://localhost:3000', {
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: RECONNECT_DELAY,
      timeout: 10000
    });

    socket.on('connect', () => {
      console.log('Socket connecté');
      reconnectAttemptsRef.current = 0;
      
      // Rejoindre la room actuelle si on était déjà dans une room
      if (currentRoom) {
        socket.emit('joinRoom', { roomCode: currentRoom.code });
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket déconnecté');
    });

    socket.on('error', (error: Error) => {
      console.error('Erreur socket:', error);
    });

    socket.on('roomJoined', (data: { room: Room; user: RoomUser }) => {
      const storeRoom = convertServerRoomToStoreRoom(data.room);
      const storeUser = convertServerUserToStoreUser(data.user);
      setCurrentRoom(storeRoom);
      setUser(storeUser);
    });

    socket.on('roomUpdated', (room: Room) => {
      const storeRoom = convertServerRoomToStoreRoom(room);
      updateCurrentRoom(storeRoom);
    });

    socket.on('usersUpdated', ({ roomCode, users }: { roomCode: string; users: RoomUser[] }) => {
      const storeUsers = users.map(convertServerUserToStoreUser);
      updateRoomUsers(roomCode, storeUsers);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [currentRoom, setCurrentRoom, updateCurrentRoom, updateRoomUsers, setUser]);

  useEffect(() => {
    const cleanup = connect();
    return cleanup;
  }, [connect]);

  return {
    socket: socketRef.current,
    isConnected: socketRef.current?.connected ?? false,
    emit: {
      joinRoom: (roomCode: string) => {
        socketRef.current?.emit('join room', roomCode);
      },
      leaveRoom: (roomCode: string) => {
        socketRef.current?.emit('leave room', roomCode);
      },
      sendMessage: (roomCode: string, message: string) => {
        socketRef.current?.emit('chat message', roomCode, message);
      },
      startGame: (roomCode: string) => {
        socketRef.current?.emit('start game', roomCode);
      },
      submitGuess: (roomCode: string, location: [number, number]) => {
        socketRef.current?.emit('submit guess', roomCode, location);
      },
      resetGame: (roomCode: string) => {
        socketRef.current?.emit('reset game', roomCode);
      },
      nextImage: (roomCode: string) => {
        socketRef.current?.emit('next image', roomCode);
      }
    }
  };
};

export default useSocket;
