import { User as StoreUser, Room as StoreRoom, GameState as StoreGameState } from '@/store/gameStore';

// Type pour les données de jeu
export interface GameData {
  image: string;
  game: string[];
  map: [number, number, [string, string]];
  location: [number, number];
}

// Types communs
interface BaseUser {
  id: string;
  username: string;
  isAdmin?: boolean;
  isAuthenticated: boolean;
}

// Type utilisateur côté serveur
export interface ServerUser extends BaseUser {
  socketId: string;
  score: number;
  status: 'active' | 'inactive' | 'away';
}

// Type utilisateur dans une room (hérite de ServerUser avec des propriétés de jeu)
export interface RoomUser extends ServerUser {
  alive?: boolean;
  gameStatus?: boolean; // status du jeu (différent de connection status)
}

// Type utilisateur côté store (client)
export type User = BaseUser;

// Types communs pour la room
interface BaseRoom {
  code: string;
  name: string;
  owner: string;
  mode: string;
  maxPlayers?: number;
  settings?: Record<string, any>;
}

// Type room côté serveur
export interface ServerRoom extends BaseRoom {
  users: Record<string, RoomUser>;
  status: 'waiting' | 'playing' | 'finished';
  currentRound: number;
  maxRounds: number;
  timeLimit: number;
  gameDB?: GameData[];
  gameState?: 'waiting' | 'playing' | 'end';
  duration?: number;
  difficulty?: string;
  privacy?: string;
}

// Type room côté store (client)
export interface Room extends BaseRoom {
  users: User[];
  gameState?: GameState;
}

// Type pour l'état du jeu
export interface GameState {
  status: 'waiting' | 'playing' | 'finished';
  currentRound: number;
  totalRounds: number;
  timeLeft?: number;
  scores: Record<string, number>;
  currentLocation?: {
    lat: number;
    lng: number;
    panoramaUrl: string;
  };
}

// Fonctions de conversion
export const convertServerUserToStoreUser = (serverUser: ServerUser): User => ({
  id: serverUser.id,
  username: serverUser.username,
  isAdmin: serverUser.isAdmin,
  isAuthenticated: serverUser.isAuthenticated
});

export const convertServerRoomToStoreRoom = (serverRoom: ServerRoom): Room => ({
  code: serverRoom.code,
  name: serverRoom.name,
  owner: serverRoom.owner,
  mode: serverRoom.mode,
  maxPlayers: serverRoom.maxPlayers,
  settings: serverRoom.settings,
  users: Object.values(serverRoom.users).map(convertServerUserToStoreUser),
  gameState: {
    status: serverRoom.status,
    currentRound: serverRoom.currentRound,
    totalRounds: serverRoom.maxRounds,
    timeLeft: serverRoom.timeLimit,
    scores: {}
  }
});

// Types pour les événements socket.io
export interface ServerToClientEvents {
  roomJoined: (data: { room: ServerRoom; user: ServerUser }) => void;
  roomUpdated: (room: ServerRoom) => void;
  usersUpdated: (data: { roomCode: string; users: ServerUser[] }) => void;
  error: (error: { message: string }) => void;
}

export interface ClientToServerEvents {
  createUser: (data: { userId: string; username: string }) => void;
  createRoom: (data: BaseRoom) => void;
  joinRoom: (data: { roomCode: string }) => void;
  leaveRoom: (data: { roomCode: string }) => void;
  startGame: (data: { roomCode: string }) => void;
  submitGuess: (data: { roomCode: string; guess: { lat: number; lng: number } }) => void;
  sendMessage: (data: { roomCode: string; message: string }) => void;
}
