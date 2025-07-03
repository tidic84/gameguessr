import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useMemo, useCallback } from 'react';
import type { User, Room, AppState } from '@/types';

// Types pour les messages de chat
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'user' | 'system' | 'game';
}

// Types pour les événements de jeu
export interface GameEvent {
  id: string;
  type: 'start' | 'image_change' | 'answer_submitted' | 'round_end' | 'game_end';
  timestamp: Date;
  data?: any;
}

interface GameStore extends AppState {
  // Nouvelles propriétés pour le temps réel
  chatMessages: Record<string, ChatMessage[]>; // Par roomCode
  gameEvents: GameEvent[];
  currentImageIndex: number;
  timeLeft: number;
  isGameActive: boolean;

  // Actions pour l'utilisateur
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;

  // Actions pour la room
  setCurrentRoom: (room: Room | null) => void;
  updateCurrentRoom: (updates: Partial<Room>) => void;
  updateRoomUsers: (roomCode: string, users: Record<string, any>) => void;

  // Actions pour la connexion
  setConnected: (connected: boolean) => void;

  // Actions pour les rooms publiques
  setRooms: (rooms: Record<string, Room>) => void;
  updateRoom: (roomCode: string, room: Room) => void;

  // Actions pour le chat temps réel
  addChatMessage: (roomCode: string, message: ChatMessage) => void;
  clearChatMessages: (roomCode: string) => void;
  batchAddChatMessages: (roomCode: string, messages: ChatMessage[]) => void;

  // Actions pour les événements de jeu temps réel
  addGameEvent: (event: GameEvent) => void;
  setCurrentImageIndex: (index: number) => void;
  setTimeLeft: (time: number) => void;
  setGameActive: (active: boolean) => void;
  updateGameState: (roomCode: string, gameState: any, imageIndex?: number) => void;
  
  // Actions batch pour optimiser les re-renders
  batchUpdateGameState: (updates: {
    timeLeft?: number;
    currentImageIndex?: number;
    isGameActive?: boolean;
  }) => void;
  
  batchUpdateRoom: (roomCode: string, updates: Partial<Room>) => void;

  // Actions utilitaires
  reset: () => void;
  resetGameState: () => void;
}

const initialState = {
  user: null as User | null,
  currentRoom: null as Room | null,
  isConnected: false,
  rooms: {} as Record<string, Room>,
  chatMessages: {} as Record<string, ChatMessage[]>,
  gameEvents: [] as GameEvent[],
  currentImageIndex: 0,
  timeLeft: 0,
  isGameActive: false,
};

// Store principal avec optimisations
export const useGameStore = create<GameStore>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        // Actions utilisateur
        setUser: (user) => set({ user }),
        
        updateUser: (updates) => 
          set(
            (state) => ({
              user: state.user ? { ...state.user, ...updates } : null,
            })
          ),

        // Actions room avec optimisations
        setCurrentRoom: (room) => set({ currentRoom: room }),
        
        updateCurrentRoom: (updates) =>
          set(
            (state) => ({
              currentRoom: state.currentRoom ? { ...state.currentRoom, ...updates } : null,
            })
          ),

        updateRoomUsers: (roomCode, users) =>
          set(
            (state) => {
              if (state.currentRoom?.code === roomCode) {
                return {
                  currentRoom: { ...state.currentRoom, users },
                };
              }
              return state;
            }
          ),

        // Actions connexion
        setConnected: (connected) => set({ isConnected: connected }),

        // Actions rooms publiques
        setRooms: (rooms) => set({ rooms }),
        
        updateRoom: (roomCode, room) =>
          set(
            (state) => ({
              rooms: { ...state.rooms, [roomCode]: room },
            })
          ),
          
        // Action batch optimisée pour room
        batchUpdateRoom: (roomCode, updates) =>
          set(
            (state) => {
              const room = state.rooms[roomCode];
              if (!room) return state;
              
              const updatedRoom = { ...room, ...updates };
              return {
                rooms: { ...state.rooms, [roomCode]: updatedRoom },
                ...(state.currentRoom?.code === roomCode && {
                  currentRoom: { ...state.currentRoom, ...updates }
                })
              };
            }
          ),

        // Actions pour le chat temps réel
        addChatMessage: (roomCode, message) =>
          set(
            (state) => {
              const roomMessages = state.chatMessages[roomCode] || [];
              // Limiter le nombre de messages en mémoire (performance)
              const maxMessages = 100;
              const newMessages = [...roomMessages, message];
              const limitedMessages = newMessages.length > maxMessages 
                ? newMessages.slice(-maxMessages) 
                : newMessages;
              
              return {
                chatMessages: {
                  ...state.chatMessages,
                  [roomCode]: limitedMessages,
                },
              };
            }
          ),

        clearChatMessages: (roomCode) =>
          set(
            (state) => ({
              chatMessages: { ...state.chatMessages, [roomCode]: [] },
            })
          ),

        // Batch pour optimiser les re-renders
        batchAddChatMessages: (roomCode, messages) =>
          set(
            (state) => {
              const roomMessages = state.chatMessages[roomCode] || [];
              const maxMessages = 100;
              const newMessages = [...roomMessages, ...messages];
              const limitedMessages = newMessages.length > maxMessages 
                ? newMessages.slice(-maxMessages) 
                : newMessages;
              
              return {
                chatMessages: {
                  ...state.chatMessages,
                  [roomCode]: limitedMessages,
                },
              };
            }
          ),

        // Actions pour les événements de jeu temps réel
        addGameEvent: (event) =>
          set(
            (state) => {
              // Limiter les événements en mémoire
              const maxEvents = 50;
              const newEvents = [...state.gameEvents, event];
              const limitedEvents = newEvents.length > maxEvents
                ? newEvents.slice(-maxEvents)
                : newEvents;
              
              return { gameEvents: limitedEvents };
            }
          ),

        setCurrentImageIndex: (index) => set({ currentImageIndex: index }),

        setTimeLeft: (time) => set({ timeLeft: time }),

        setGameActive: (active) => set({ isGameActive: active }),

        updateGameState: (roomCode, gameState, imageIndex) =>
          set(
            (state) => {
              if (state.currentRoom?.code === roomCode) {
                return {
                  currentRoom: {
                    ...state.currentRoom,
                    gameState,
                    ...(imageIndex !== undefined && { currentImageIndex: imageIndex }),
                  },
                };
              }
              return state;
            }
          ),

        // Action batch pour réduire les re-renders du timer
        batchUpdateGameState: (updates) =>
          set(
            (state) => ({
              ...state,
              ...updates,
            })
          ),

        // Reset complet
        reset: () => set(initialState),
        
        // Reset seulement l'état du jeu
        resetGameState: () => set({
          gameEvents: [],
          currentImageIndex: 0,
          timeLeft: 0,
          isGameActive: false,
        }),
      }),
      {
        name: 'game-store',
        // Persister seulement les données utilisateur
        partialize: (state) => ({
          user: state.user,
        }),
      }
    ),
    {
      name: 'game-store',
    }
  )
);

// ===============================
// SÉLECTEURS OPTIMISÉS AVEC MEMOISATION
// ===============================

// Sélecteurs de base optimisés
export const useUser = () => useGameStore((state) => state.user);
export const useCurrentRoom = () => useGameStore((state) => state.currentRoom);
export const useIsConnected = () => useGameStore((state) => state.isConnected);
export const useRooms = () => useGameStore((state) => state.rooms);
export const useGameEvents = () => useGameStore((state) => state.gameEvents);
export const useCurrentImageIndex = () => useGameStore((state) => state.currentImageIndex);
export const useTimeLeft = () => useGameStore((state) => state.timeLeft);
export const useIsGameActive = () => useGameStore((state) => state.isGameActive);

// Sélecteurs optimisés avec memoisation pour les calculs complexes
export const useChatMessages = (roomCode: string) => {
  return useGameStore(
    useCallback(
      (state) => state.chatMessages[roomCode] || [],
      [roomCode]
    )
  );
};

// Sélecteur memoizé pour les utilisateurs de la room actuelle
export const useCurrentRoomUsers = () => {
  return useGameStore(
    useMemo(
      () => (state) => state.currentRoom?.users || {},
      []
    )
  );
};

// Sélecteur memoizé pour le statut admin de l'utilisateur actuel
export const useIsCurrentUserAdmin = () => {
  return useGameStore(
    useMemo(
      () => (state) => {
        if (!state.user || !state.currentRoom) return false;
        return state.currentRoom.owner === state.user.id;
      },
      []
    )
  );
};

// Sélecteur memoizé pour les rooms filtrées
export const useFilteredRooms = (filter?: string) => {
  return useGameStore(
    useCallback(
      (state) => {
        if (!filter) return state.rooms;
        
        return Object.fromEntries(
          Object.entries(state.rooms).filter(([_, room]) =>
            room.name.toLowerCase().includes(filter.toLowerCase()) ||
            room.code.toLowerCase().includes(filter.toLowerCase())
          )
        );
      },
      [filter]
    )
  );
};

// Sélecteur memoizé pour les derniers messages de chat
export const useRecentChatMessages = (roomCode: string, limit = 20) => {
  return useGameStore(
    useCallback(
      (state) => {
        const messages = state.chatMessages[roomCode] || [];
        return messages.slice(-limit);
      },
      [roomCode, limit]
    )
  );
};

// Sélecteur memoizé pour les statistiques de jeu
export const useGameStats = () => {
  return useGameStore(
    useMemo(
      () => (state) => {
        const events = state.gameEvents;
        return {
          totalEvents: events.length,
          gameStarts: events.filter(e => e.type === 'start').length,
          imageChanges: events.filter(e => e.type === 'image_change').length,
          answersSubmitted: events.filter(e => e.type === 'answer_submitted').length,
        };
      },
      []
    )
  );
};

// Actions d'aide pour les composants
export const useGameActions = () => {
  const store = useGameStore();
  
  return useMemo(
    () => ({
      // Actions utilisateur
      setUser: store.setUser,
      updateUser: store.updateUser,
      
      // Actions room
      setCurrentRoom: store.setCurrentRoom,
      updateCurrentRoom: store.updateCurrentRoom,
      updateRoomUsers: store.updateRoomUsers,
      batchUpdateRoom: store.batchUpdateRoom,
      
      // Actions connexion
      setConnected: store.setConnected,
      
      // Actions rooms
      setRooms: store.setRooms,
      updateRoom: store.updateRoom,
      
      // Actions chat
      addChatMessage: store.addChatMessage,
      clearChatMessages: store.clearChatMessages,
      batchAddChatMessages: store.batchAddChatMessages,
      
      // Actions jeu
      addGameEvent: store.addGameEvent,
      setCurrentImageIndex: store.setCurrentImageIndex,
      setTimeLeft: store.setTimeLeft,
      setGameActive: store.setGameActive,
      updateGameState: store.updateGameState,
      batchUpdateGameState: store.batchUpdateGameState,
      
      // Reset
      reset: store.reset,
      resetGameState: store.resetGameState,
    }),
    [store]
  );
};
