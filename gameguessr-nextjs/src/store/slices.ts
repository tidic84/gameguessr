// Store slices pour une meilleure modularité et performance
import { StateCreator } from 'zustand';
import type { User, Room } from '@/types';

// Slice utilisateur
export interface UserSlice {
  user: User | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
}

export const createUserSlice: StateCreator<
  UserSlice & RoomSlice & ChatSlice & GameSlice & ConnectionSlice,
  [],
  [],
  UserSlice
> = (set) => ({
  user: null,
  
  setUser: (user) => set({ user }),
  
  updateUser: (updates) => 
    set(
      (state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })
    ),
});

// Slice room
export interface RoomSlice {
  currentRoom: Room | null;
  rooms: Record<string, Room>;
  setCurrentRoom: (room: Room | null) => void;
  updateCurrentRoom: (updates: Partial<Room>) => void;
  updateRoomUsers: (roomCode: string, users: Record<string, any>) => void;
  setRooms: (rooms: Record<string, Room>) => void;
  updateRoom: (roomCode: string, room: Room) => void;
}

export const createRoomSlice: StateCreator<
  UserSlice & RoomSlice & ChatSlice & GameSlice & ConnectionSlice,
  [],
  [],
  RoomSlice
> = (set) => ({
  currentRoom: null,
  rooms: {},
  
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

  setRooms: (rooms) => set({ rooms }, false, 'setRooms'),
  
  updateRoom: (roomCode, room) =>
    set(
      (state) => ({
        rooms: { ...state.rooms, [roomCode]: room },
      }),
      false,
      'updateRoom'
    ),
});

// Slice chat
export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  message: string;
  timestamp: Date;
  type: 'user' | 'system' | 'game';
}

export interface ChatSlice {
  chatMessages: Record<string, ChatMessage[]>;
  addChatMessage: (roomCode: string, message: ChatMessage) => void;
  clearChatMessages: (roomCode: string) => void;
  batchAddChatMessages: (roomCode: string, messages: ChatMessage[]) => void;
}

export const createChatSlice: StateCreator<
  UserSlice & RoomSlice & ChatSlice & GameSlice & ConnectionSlice,
  [],
  [],
  ChatSlice
> = (set) => ({
  chatMessages: {},
  
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

  // Batch pour optimiser les re-renders
  batchAddChatMessages: (roomCode, messages) =>
    set(
      (state) => {
        const roomMessages = state.chatMessages[roomCode] || [];
        return {
          chatMessages: {
            ...state.chatMessages,
            [roomCode]: [...roomMessages, ...messages],
          },
        };
      },
      false,
      'batchAddChatMessages'
    ),
});

// Slice jeu
export interface GameEvent {
  id: string;
  type: 'start' | 'image_change' | 'answer_submitted' | 'round_end' | 'game_end';
  timestamp: Date;
  data?: any;
}

export interface GameSlice {
  gameEvents: GameEvent[];
  currentImageIndex: number;
  timeLeft: number;
  isGameActive: boolean;
  addGameEvent: (event: GameEvent) => void;
  setCurrentImageIndex: (index: number) => void;
  setTimeLeft: (time: number) => void;
  setGameActive: (active: boolean) => void;
  updateGameState: (roomCode: string, gameState: any, imageIndex?: number) => void;
  batchUpdateGameState: (updates: {
    timeLeft?: number;
    currentImageIndex?: number;
    isGameActive?: boolean;
  }) => void;
}

export const createGameSlice: StateCreator<
  UserSlice & RoomSlice & ChatSlice & GameSlice & ConnectionSlice,
  [],
  [],
  GameSlice
> = (set) => ({
  gameEvents: [],
  currentImageIndex: 0,
  timeLeft: 0,
  isGameActive: false,
  
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

  // Action batch pour réduire les re-renders
  batchUpdateGameState: (updates) =>
    set(
      (state) => ({
        ...state,
        ...updates,
      }),
      false,
      'batchUpdateGameState'
    ),
});

// Slice connexion
export interface ConnectionSlice {
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
}

export const createConnectionSlice: StateCreator<
  UserSlice & RoomSlice & ChatSlice & GameSlice & ConnectionSlice,
  [],
  [],
  ConnectionSlice
> = (set) => ({
  isConnected: false,
  
  setConnected: (connected) => set({ isConnected: connected }, false, 'setConnected'),
});
