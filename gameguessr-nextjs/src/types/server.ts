// Types spécifiques au serveur
export interface ServerUser {
  id: string;
  username: string;
  socketId: string;
  score: number;
  points: number;
  status: boolean;
  alive: boolean;
  isAdmin?: boolean;
  isAuthenticated: boolean;
}

export interface ServerRoom {
  code: string;
  name: string;
  owner: string;
  mode: string;
  maxPlayers: number;
  settings: Record<string, any>;
  users: Record<string, ServerUser>;
  status: 'waiting' | 'playing' | 'finished';
  gameState: 'wait' | 'playing' | `image ${number}` | `image ${number} map` | 'end';
  currentRound: number;
  maxRounds: number;
  timeLimit: number;
  duration: number;
  difficulty: string;
  gameDB?: any[];
}

export interface ServerToClientEvents {
  roomJoined: (data: { room: ServerRoom; user: ServerUser }) => void;
  roomUpdated: (room: ServerRoom) => void;
  usersUpdated: (data: { roomCode: string; users: ServerUser[] }) => void;
  error: (error: { message: string }) => void;
}

export interface ClientToServerEvents {
  createUser: (data: { userId: string; username: string }) => void;
  createRoom: (data: {
    code: string;
    name: string;
    owner: string;
    mode?: string;
    maxPlayers?: number;
    settings?: Record<string, any>;
  }) => void;
  joinRoom: (data: { roomCode: string }) => void;
  leaveRoom: (data: { roomCode: string }) => void;
  startGame: (data: { roomCode: string }) => void;
  submitGuess: (data: { roomCode: string; guess: { lat: number; lng: number } }) => void;
  sendMessage: (data: { roomCode: string; message: string }) => void;
}