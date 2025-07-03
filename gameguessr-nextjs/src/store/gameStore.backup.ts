import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
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

  // Actions pour les événements de jeu temps réel
  addGameEvent: (event: GameEvent) => void;
  setCurrentImageIndex: (index: number) => void;
  setTimeLeft: (time: number) => void;
  setGameActive: (active: boolean) => void;
  updateGameState: (roomCode: string, gameState: any, imageIndex?: number) => void;

  // Actions utilitaires
  reset: () => void;
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

export const useGameStore = create<GameStore>()(
  devtools(
    (set, get) => ({
      ...initialState,

      // Actions utilisateur
      setUser: (user) => set({ user }, false, 'setUser'),
      
      updateUser: (updates) => 
        set(
          (state) => ({
            user: state.user ? { ...state.user, ...updates } : null,
          }),
          false,
          'updateUser'
        ),

      // Actions room
      setCurrentRoom: (room) => set({ currentRoom: room }, false, 'setCurrentRoom'),
      
      updateCurrentRoom: (updates) =>
        set(
          (state) => ({
            currentRoom: state.currentRoom ? { ...state.currentRoom, ...updates } : null,
          }),
          false,
          'updateCurrentRoom'
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
          },
          false,
          'updateRoomUsers'
        ),

      // Actions connexion
      setConnected: (connected) => set({ isConnected: connected }, false, 'setConnected'),

      // Actions rooms publiques
      setRooms: (rooms) => set({ rooms }, false, 'setRooms'),
      
      updateRoom: (roomCode, room) =>
        set(
          (state) => ({
            rooms: { ...state.rooms, [roomCode]: room },
          }),
          false,
          'updateRoom'
        ),

      // Actions pour le chat temps réel
      addChatMessage: (roomCode, message) =>
        set(
          (state) => {
            const roomMessages = state.chatMessages[roomCode] || [];
            return {
              chatMessages: {
                ...state.chatMessages,
                [roomCode]: [...roomMessages, message],
              },
            };
          },
          false,
          'addChatMessage'
        ),

      clearChatMessages: (roomCode) =>
        set(
          (state) => ({
            chatMessages: { ...state.chatMessages, [roomCode]: [] },
          }),
          false,
          'clearChatMessages'
        ),

      // Actions pour les événements de jeu temps réel
      addGameEvent: (event) =>
        set(
          (state) => ({
            gameEvents: [...state.gameEvents, event],
          }),
          false,
          'addGameEvent'
        ),

      setCurrentImageIndex: (index) => set({ currentImageIndex: index }, false, 'setCurrentImageIndex'),

      setTimeLeft: (time) => set({ timeLeft: time }, false, 'setTimeLeft'),

      setGameActive: (active) => set({ isGameActive: active }, false, 'setGameActive'),

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
          },
          false,
          'updateGameState'
        ),

      // Reset
      reset: () => set(initialState, false, 'reset'),
    }),
    {
      name: 'game-store',
    }
  )
);

// Sélecteurs pour des accès optimisés
export const useUser = () => useGameStore((state) => state.user);
export const useCurrentRoom = () => useGameStore((state) => state.currentRoom);
export const useIsConnected = () => useGameStore((state) => state.isConnected);
export const useRooms = () => useGameStore((state) => state.rooms);
export const useChatMessages = (roomCode: string) => useGameStore((state) => state.chatMessages[roomCode] || []);
export const useGameEvents = () => useGameStore((state) => state.gameEvents);
export const useCurrentImageIndex = () => useGameStore((state) => state.currentImageIndex);
export const useTimeLeft = () => useGameStore((state) => state.timeLeft);
export const useIsGameActive = () => useGameStore((state) => state.isGameActive);
