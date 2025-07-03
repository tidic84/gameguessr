import { create } from 'zustand';

// Types pour le jeu
export interface User {
  id: string;
  username: string;
  isAdmin?: boolean;
  isAuthenticated: boolean;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  language?: string;
  theme?: 'light' | 'dark';
  reducedMotion?: boolean;
}

export interface Room {
  code: string;
  name: string;
  owner: string;
  mode: string;
  users: User[];
  maxPlayers?: number;
  gameState?: GameState;
  gameData?: {
    currentRound: number;
    totalRounds: number;
    scores: Record<string, number>;
  };
}

export interface GameState {
  status: 'waiting' | 'playing' | 'finished';
  currentRound: number;
  totalRounds: number;
  timeLeft?: number;
  scores: Record<string, number>;
  currentLocation?: GameLocation;
}

export interface GameLocation {
  lat: number;
  lng: number;
  panoramaUrl: string;
  name?: string;
  region?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
}

export interface GameEvent {
  id: string;
  type: 'roundStart' | 'roundEnd' | 'gameStart' | 'gameEnd' | 'userGuess';
  data: Record<string, any>;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  userId: string;
  username: string;
  content: string;
  type: 'user' | 'system' | 'warning' | 'error' | 'info' | 'game' | 'admin';
  subtype?: 'roundStart' | 'roundEnd' | 'guess' | 'score' | 'notification';
  timestamp: number;
  isModerated?: boolean;
  gameData?: Record<string, any>;
  reactions?: Record<string, string[]>;
}

export interface GameMessage extends ChatMessage {
  type: 'game';
  subtype: 'roundStart' | 'roundEnd' | 'guess' | 'score';
  gameData: {
    round?: number;
    score?: number;
    location?: GameLocation;
    guess?: { lat: number; lng: number };
  };
}

export interface AdminMessage extends ChatMessage {
  type: 'admin';
  isModerated: true;
}

export interface ModerationAction {
  id: string;
  type: 'warn' | 'mute' | 'unmute' | 'block' | 'unblock';
  adminId: string;
  targetUserId: string;
  roomCode: string;
  reason?: string;
  duration?: number;
  timestamp: number;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  targetUserId: string;
  messageId: string;
  roomCode: string;
  reason: string;
  category: 'spam' | 'harassment' | 'inappropriate' | 'other';
  timestamp: number;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface UserModerationStatus {
  userId: string;
  username: string;
  warningCount: number;
  muteEndTime?: number;
  blockEndTime?: number;
  isBlocked: boolean;
  isMuted: boolean;
  messageFrequency: {
    lastMessage: number;
    lastMinute: number;
    consecutiveSpam: number;
  };
  violations: ModerationAction[];
}

export interface ModerationCommandResult {
  isCommand: boolean;
  command: string;
  target?: string;
  duration?: number;
  reason?: string;
  error?: string;
}

// Types de base
export interface GameStateForAnimation {
  previousState?: GameState;
  currentState: GameState;
  animationTriggers: Record<string, boolean>;
  isAnimating: boolean;
  currentAnimation: string | null;
  animationSettings: {
    globalEnabled: boolean;
    reducedMotion: boolean;
    duration: number;
    easing: string;
  };
}

// Types pour les animations
export interface AnimationHook {
  isAnimating: boolean;
  trigger: () => void;
  reset: () => void;
}

export interface AnimationState {
  name: string;
  isActive: boolean;
  duration: number;
}

// État initial
const initialGameState: Partial<GameStore> = {
  user: null,
  isConnected: false,
  rooms: {},
  currentRoom: null,
  chatMessages: {},
  gameEvents: {},
  currentImageIndex: 0,
  timeLeft: 0,
  scores: {},
  roundHistory: [],
  lastGuess: null,
  showResults: false,
  errorMessage: null,
  gameStateForAnimation: {
    currentState: {
      status: 'waiting',
      currentRound: 0,
      totalRounds: 0,
      scores: {}
    },
    animationTriggers: {},
    isAnimating: false,
    currentAnimation: null,
    animationSettings: {
      globalEnabled: true,
      reducedMotion: false,
      duration: 300,
      easing: 'ease-in-out'
    }
  },
  moderationStatus: {},
  moderationActions: {},
  moderationReports: {}
} as const;

const baseState = {
  user: null as User | null,
  isConnected: false as boolean,
  rooms: {} as Record<string, Room>,
  currentRoom: null as Room | null,
  chatMessages: {} as Record<string, ChatMessage[]>,
  gameEvents: {} as Record<string, GameEvent[]>,
  currentImageIndex: 0 as number,
  timeLeft: 0 as number,
  scores: {} as Record<string, number>,
  roundHistory: [] as any[],
  lastGuess: null as { lat: number; lng: number } | null,
  showResults: false as boolean,
  errorMessage: null as string | null,
  gameStateForAnimation: {
    currentState: {
      status: 'waiting' as const,
      currentRound: 0,
      totalRounds: 0,
      scores: {}
    },
    animationTriggers: {},
    isAnimating: false,
    currentAnimation: null,
    animationSettings: {
      globalEnabled: true,
      reducedMotion: false,
      duration: 300,
      easing: 'ease-in-out'
    }
  } as GameStateForAnimation,
  moderationStatus: {} as Record<string, Record<string, UserModerationStatus>>,
  moderationActions: {} as Record<string, ModerationAction[]>,
  moderationReports: {} as Record<string, ModerationReport[]>
} as const;

// Interface pour le store de jeu
export interface GameStore {
  // État
  user: User | null;
  isConnected: boolean;
  rooms: Record<string, Room>;
  currentRoom: Room | null;
  chatMessages: Record<string, ChatMessage[]>;
  gameEvents: Record<string, GameEvent[]>;
  currentImageIndex: number;
  timeLeft: number;
  scores: Record<string, number>;
  roundHistory: any[];
  lastGuess: { lat: number; lng: number } | null;
  showResults: boolean;
  errorMessage: string | null;
  gameStateForAnimation: GameStateForAnimation;
  moderationStatus: Record<string, Record<string, UserModerationStatus>>;
  moderationActions: Record<string, ModerationAction[]>;
  moderationReports: Record<string, ModerationReport[]>;

  // Actions utilisateur
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setCurrentRoom: (room: Room | null) => void;
  updateCurrentRoom: (updates: Partial<Room>) => void;
  updateRoomUsers: (roomCode: string, users: User[]) => void;
  setConnected: (connected: boolean) => void;
  setRooms: (rooms: Record<string, Room>) => void;
  updateRoom: (roomCode: string, room: Partial<Room>) => void;
  
  // Actions chat
  addChatMessage: (roomCode: string, message: ChatMessage) => void;
  addUserMessage: (
    roomCode: string,
    userId: string,
    userName: string,
    message: string,
    metadata?: { isSystemMessage?: boolean; type?: ChatMessage['type'] }
  ) => void;
  addSystemMessage: (
    roomCode: string, 
    message: string,
    type?: 'info' | 'warning' | 'error'
  ) => void;
  addGameMessage: (
    roomCode: string,
    message: string,
    subtype: GameMessage['subtype'],
    gameData?: GameMessage['gameData']
  ) => void;
  addAdminMessage: (
    roomCode: string,
    userId: string,
    userName: string,
    message: string
  ) => void;
  addReaction: (
    roomCode: string,
    messageId: string,
    emoji: string,
    userId: string
  ) => void;
  moderateUserMessage: (roomCode: string, messageId: string) => void;
  clearChatMessages: (roomCode: string) => void;
  batchAddChatMessages: (roomCode: string, messages: ChatMessage[]) => void;

  // Actions de jeu
  setGameState: (state: Partial<GameState>) => void;
  updateScores: (scores: Record<string, number>) => void;
  setTimeLeft: (time: number) => void;
  addGameEvent: (roomCode: string, event: GameEvent) => void;
  setLastGuess: (guess: { lat: number; lng: number } | null) => void;
  setShowResults: (show: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  startRound: (round: number) => void;
  endRound: () => void;

  // Actions de modération
  addModerationAction: (roomCode: string, action: ModerationAction) => void;
  addModerationReport: (report: ModerationReport) => void;
  warnUser: (roomCode: string, targetUserId: string, adminId: string, reason: string) => void;
  muteUser: (roomCode: string, targetUserId: string, adminId: string, duration: number, reason: string) => void;
  unmuteUser: (roomCode: string, targetUserId: string, adminId: string) => void;
  blockUser: (roomCode: string, targetUserId: string, adminId: string, duration: number, reason: string) => void;
  unblockUser: (roomCode: string, targetUserId: string, adminId: string) => void;
  isUserMuted: (roomCode: string, userId: string) => boolean;
  isUserBlocked: (roomCode: string, userId: string) => boolean;
  getUserModerationStatus: (roomCode: string, userId: string) => UserModerationStatus | undefined;
  parseAdminCommand: (input: string) => ModerationCommandResult;

  // Actions d'animation
  triggerAnimation: (name: string) => void;
  resetAnimation: (name: string) => void;
  updateAnimationSettings: (settings: Partial<GameStateForAnimation['animationSettings']>) => void;
  getAnimationState: (name: string) => AnimationState;
  cleanupAnimations: () => void;
}

// Helpers pour la création de messages
const createGameMessage = (
  roomCode: string,
  content: string,
  subtype: GameMessage['subtype'],
  gameData?: GameMessage['gameData']
): GameMessage => ({
  id: `game-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  userId: 'system',
  username: 'Game',
  content,
  type: 'game',
  subtype,
  timestamp: Date.now(),
  gameData: gameData || {}
});

const createAdminMessage = (
  roomCode: string,
  userId: string,
  username: string,
  content: string
): AdminMessage => ({
  id: `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  userId,
  username,
  content,
  type: 'admin',
  timestamp: Date.now(),
  isModerated: true
});

// Store principal
export const useGameStore = create<GameStore>()((set, get) => ({
  ...initialGameState as GameStore,

  // Actions utilisateur
  setUser: (user: User | null) => set({ user }),
  
  updateUser: (updates: Partial<User>) => 
    set((state: GameStore) => ({
      user: state.user ? { ...state.user, ...updates } : null
    })),

  setCurrentRoom: (room: Room | null) => {
    if (!room) {
      set({ currentRoom: null });
      return;
    }
    
    // S'assurer que la room existe dans la liste des rooms
    set((state) => {
      const updatedRooms = {
        ...state.rooms,
        [room.code]: room
      };
      
      return {
        rooms: updatedRooms,
        currentRoom: room
      };
    });
  },

  updateCurrentRoom: (updates: Partial<Room>) =>
    set((state: GameStore) => {
      if (!state.currentRoom) return state;

      const updatedRoom = {
        ...state.currentRoom,
        ...updates
      };

      return {
        currentRoom: updatedRoom,
        rooms: {
          ...state.rooms,
          [updatedRoom.code]: updatedRoom
        }
      };
    }),

  updateRoomUsers: (roomCode: string, users: User[]) =>
    set((state: GameStore) => {
      // Mettre à jour la room dans la liste des rooms
      const updatedRooms = {
        ...state.rooms,
        [roomCode]: state.rooms[roomCode] 
          ? { ...state.rooms[roomCode], users }
          : { code: roomCode, name: '', owner: '', mode: '', users }
      };

      // Si c'est la room courante, la mettre à jour aussi
      const updatedCurrentRoom = state.currentRoom?.code === roomCode
        ? { ...state.currentRoom, users }
        : state.currentRoom;

      return {
        rooms: updatedRooms,
        currentRoom: updatedCurrentRoom
      };
    }),

  setConnected: (connected: boolean) => set({ isConnected: connected }),

  setRooms: (rooms: Record<string, Room>) => set({ rooms }),

  updateRoom: (roomCode: string, updates: Partial<Room>) =>
    set((state: GameStore) => ({
      rooms: {
        ...state.rooms,
        [roomCode]: state.rooms[roomCode]
          ? { ...state.rooms[roomCode], ...updates }
          : updates as Room
      }
    })),

  // Actions chat
  addChatMessage: (roomCode: string, message: ChatMessage) =>
    set((state: GameStore) => ({
      chatMessages: {
        ...state.chatMessages,
        [roomCode]: [...(state.chatMessages[roomCode] || []), message]
      }
    })),

  addGameMessage: (
    roomCode: string,
    content: string,
    subtype: GameMessage['subtype'],
    gameData?: GameMessage['gameData']
  ) => {
    const message = createGameMessage(roomCode, content, subtype, gameData);
    get().addChatMessage(roomCode, message);
  },

  addAdminMessage: (
    roomCode: string,
    userId: string,
    userName: string,
    content: string
  ) => {
    const message = createAdminMessage(roomCode, userId, userName, content);
    get().addChatMessage(roomCode, message);
  },

  addSystemMessage: (
    roomCode: string,
    content: string,
    type: 'info' | 'warning' | 'error' = 'info'
  ) => {
    const message: ChatMessage = {
      id: `system-${Date.now()}`,
      userId: 'system',
      username: 'Système',
      content,
      type,
      timestamp: Date.now()
    };
    get().addChatMessage(roomCode, message);
  },

  addUserMessage: (
    roomCode: string,
    userId: string,
    userName: string,
    content: string,
    metadata?: { isSystemMessage?: boolean; type?: ChatMessage['type'] }
  ) => {
    const message: ChatMessage = {
      id: `msg-${Date.now()}`,
      userId,
      username: userName,
      content,
      type: metadata?.type || (metadata?.isSystemMessage ? 'system' : 'user'),
      timestamp: Date.now()
    };
    get().addChatMessage(roomCode, message);
  },

  moderateUserMessage: (roomCode: string, messageId: string) =>
    set((state: GameStore) => {
      const messages = state.chatMessages[roomCode] || [];
      return {
        chatMessages: {
          ...state.chatMessages,
          [roomCode]: messages.map(msg =>
            msg.id === messageId
              ? { ...msg, isModerated: true }
              : msg
          )
        }
      };
    }),

  clearChatMessages: (roomCode: string) =>
    set((state: GameStore) => ({
      chatMessages: {
        ...state.chatMessages,
        [roomCode]: []
      }
    })),

  batchAddChatMessages: (roomCode: string, messages: ChatMessage[]) =>
    set((state: GameStore) => ({
      chatMessages: {
        ...state.chatMessages,
        [roomCode]: [...(state.chatMessages[roomCode] || []), ...messages]
      }
    })),

  addReaction: (
    roomCode: string,
    messageId: string,
    emoji: string,
    userId: string
  ) =>
    set((state: GameStore) => {
      const messages = state.chatMessages[roomCode] || [];
      return {
        chatMessages: {
          ...state.chatMessages,
          [roomCode]: messages.map(msg => {
            if (msg.id !== messageId) return msg;
            const reactions = msg.reactions || {};
            const userList = reactions[emoji] || [];
            return {
              ...msg,
              reactions: {
                ...reactions,
                [emoji]: userList.includes(userId)
                  ? userList.filter(id => id !== userId)
                  : [...userList, userId]
              }
            };
          })
        }
      };
    }),

  // Actions de jeu
  setGameState: (state: Partial<GameState>) =>
    set((current: GameStore) => ({
      currentRoom: current.currentRoom
        ? {
            ...current.currentRoom,
            gameState: current.currentRoom.gameState
              ? {
                  ...current.currentRoom.gameState,
                  ...state
                }
              : {
                  status: 'waiting',
                  currentRound: 0,
                  totalRounds: 0,
                  scores: {},
                  ...state
                }
          }
        : null
    })),

  updateScores: (scores: Record<string, number>) =>
    set((current: GameStore) => ({
      currentRoom: current.currentRoom
        ? {
            ...current.currentRoom,
            gameState: current.currentRoom.gameState
              ? {
                  ...current.currentRoom.gameState,
                  scores
                }
              : {
                  status: 'waiting',
                  currentRound: 0,
                  totalRounds: 0,
                  scores
                }
          }
        : null
    })),

  setTimeLeft: (time: number) => set({ timeLeft: time }),

  addGameEvent: (roomCode: string, event: GameEvent) =>
    set((state: GameStore) => ({
      gameEvents: {
        ...state.gameEvents,
        [roomCode]: [...(state.gameEvents[roomCode] || []), event]
      }
    })),

  setLastGuess: (guess: { lat: number; lng: number } | null) =>
    set({ lastGuess: guess }),

  setShowResults: (show: boolean) => set({ showResults: show }),

  setErrorMessage: (message: string | null) => set({ errorMessage: message }),

  startRound: (round: number) =>
    set((state: GameStore) => ({
      currentRoom: state.currentRoom
        ? {
            ...state.currentRoom,
            gameState: {
              status: 'playing',
              currentRound: round,
              totalRounds: state.currentRoom.gameState?.totalRounds || 0,
              scores: state.currentRoom.gameState?.scores || {}
            }
          }
        : null
    })),

  endRound: () =>
    set((state: GameStore) => ({
      currentRoom: state.currentRoom
        ? {
            ...state.currentRoom,
            gameState: state.currentRoom.gameState
              ? {
                  ...state.currentRoom.gameState,
                  status:
                    state.currentRoom.gameState.currentRound ===
                    state.currentRoom.gameState.totalRounds
                      ? 'finished'
                      : 'waiting'
                }
              : {
                  status: 'waiting',
                  currentRound: 0,
                  totalRounds: 0,
                  scores: {}
                }
          }
        : null
    })),

  // Actions de modération
  addModerationAction: (roomCode: string, action: ModerationAction) =>
    set((state: GameStore) => ({
      moderationActions: {
        ...state.moderationActions,
        [roomCode]: [...(state.moderationActions[roomCode] || []), action]
      }
    })),

  addModerationReport: (report: ModerationReport) =>
    set((state: GameStore) => ({
      moderationReports: {
        ...state.moderationReports,
        [report.roomCode]: [...(state.moderationReports[report.roomCode] || []), report]
      }
    })),

  getUserModerationStatus: (roomCode: string, userId: string) => {
    const state = get();
    return state.moderationStatus[roomCode]?.[userId];
  },

  isUserMuted: (roomCode: string, userId: string) => {
    const status = get().getUserModerationStatus(roomCode, userId);
    if (!status) return false;
    return status.muteEndTime ? status.muteEndTime > Date.now() : false;
  },

  isUserBlocked: (roomCode: string, userId: string) => {
    const status = get().getUserModerationStatus(roomCode, userId);
    if (!status) return false;
    return status.isBlocked && (!status.blockEndTime || status.blockEndTime > Date.now());
  },

  warnUser: (roomCode: string, targetUserId: string, adminId: string, reason: string) => {
    const action: ModerationAction = {
      id: `warn-${Date.now()}`,
      type: 'warn',
      adminId,
      targetUserId,
      roomCode,
      reason,
      timestamp: Date.now()
    };

    const status = get().getUserModerationStatus(roomCode, targetUserId) || {
      userId: targetUserId,
      username: '',
      warningCount: 0,
      isBlocked: false,
      isMuted: false,
      messageFrequency: {
        lastMessage: 0,
        lastMinute: 0,
        consecutiveSpam: 0
      },
      violations: []
    };

    set((state: GameStore) => ({
      moderationStatus: {
        ...state.moderationStatus,
        [roomCode]: {
          ...(state.moderationStatus[roomCode] || {}),
          [targetUserId]: {
            ...status,
            warningCount: status.warningCount + 1,
            violations: [...status.violations, action]
          }
        }
      }
    }));

    get().addModerationAction(roomCode, action);
    get().addSystemMessage(roomCode, `⚠️ Un utilisateur a reçu un avertissement: ${reason}`, 'warning');
  },

  muteUser: (roomCode: string, targetUserId: string, adminId: string, duration: number, reason: string) => {
    const muteEndTime = Date.now() + duration * 60 * 1000;
    const action: ModerationAction = {
      id: `mute-${Date.now()}`,
      type: 'mute',
      adminId,
      targetUserId,
      roomCode,
      reason,
      duration,
      timestamp: Date.now()
    };

    const status = get().getUserModerationStatus(roomCode, targetUserId) || {
      userId: targetUserId,
      username: '',
      warningCount: 0,
      isBlocked: false,
      isMuted: false,
      messageFrequency: {
        lastMessage: 0,
        lastMinute: 0,
        consecutiveSpam: 0
      },
      violations: []
    };

    set((state: GameStore) => ({
      moderationStatus: {
        ...state.moderationStatus,
        [roomCode]: {
          ...(state.moderationStatus[roomCode] || {}),
          [targetUserId]: {
            ...status,
            muteEndTime,
            isMuted: true,
            violations: [...status.violations, action]
          }
        }
      }
    }));

    get().addModerationAction(roomCode, action);
    get().addSystemMessage(roomCode, `🔇 Un utilisateur a été rendu muet pour ${duration} minutes: ${reason}`, 'warning');
  },

  unmuteUser: (roomCode: string, targetUserId: string, adminId: string) => {
    const action: ModerationAction = {
      id: `unmute-${Date.now()}`,
      type: 'unmute',
      adminId,
      targetUserId,
      roomCode,
      timestamp: Date.now()
    };

    const status = get().getUserModerationStatus(roomCode, targetUserId);
    if (status) {
      set((state: GameStore) => ({
        moderationStatus: {
          ...state.moderationStatus,
          [roomCode]: {
            ...(state.moderationStatus[roomCode] || {}),
            [targetUserId]: {
              ...status,
              muteEndTime: undefined,
              isMuted: false
            }
          }
        }
      }));
    }

    get().addModerationAction(roomCode, action);
    get().addSystemMessage(roomCode, '🔊 Un utilisateur n\'est plus muet', 'info');
  },

  blockUser: (roomCode: string, targetUserId: string, adminId: string, duration: number, reason: string) => {
    const blockEndTime = duration === 0 ? undefined : Date.now() + duration * 60 * 1000;
    const action: ModerationAction = {
      id: `block-${Date.now()}`,
      type: 'block',
      adminId,
      targetUserId,
      roomCode,
      reason,
      duration,
      timestamp: Date.now()
    };

    const status = get().getUserModerationStatus(roomCode, targetUserId) || {
      userId: targetUserId,
      username: '',
      warningCount: 0,
      isBlocked: false,
      isMuted: false,
      messageFrequency: {
        lastMessage: 0,
        lastMinute: 0,
        consecutiveSpam: 0
      },
      violations: []
    };

    set((state: GameStore) => ({
      moderationStatus: {
        ...state.moderationStatus,
        [roomCode]: {
          ...(state.moderationStatus[roomCode] || {}),
          [targetUserId]: {
            ...status,
            isBlocked: true,
            blockEndTime,
            violations: [...status.violations, action]
          }
        }
      }
    }));

    get().addModerationAction(roomCode, action);
    const durationText = duration === 0 ? 'de manière permanente' : `pour ${duration} minutes`;
    get().addSystemMessage(roomCode, `🚫 Un utilisateur a été bloqué ${durationText}: ${reason}`, 'error');
  },

  unblockUser: (roomCode: string, targetUserId: string, adminId: string) => {
    const action: ModerationAction = {
      id: `unblock-${Date.now()}`,
      type: 'unblock',
      adminId,
      targetUserId,
      roomCode,
      timestamp: Date.now()
    };

    const status = get().getUserModerationStatus(roomCode, targetUserId);
    if (status) {
      set((state: GameStore) => ({
        moderationStatus: {
          ...state.moderationStatus,
          [roomCode]: {
            ...(state.moderationStatus[roomCode] || {}),
            [targetUserId]: {
              ...status,
              isBlocked: false,
              blockEndTime: undefined
            }
          }
        }
      }));
    }

    get().addModerationAction(roomCode, action);
    get().addSystemMessage(roomCode, '✅ Un utilisateur a été débloqué', 'info');
  },

  parseAdminCommand: (input: string): ModerationCommandResult => {
    if (!input.startsWith('/')) {
      return { isCommand: false, command: '' };
    }

    const parts = input.slice(1).split(' ');
    const command = parts[0]?.toLowerCase() || '';
    const target = parts[1];

    switch (command) {
      case 'warn':
        if (!target) {
          return { isCommand: true, command, error: 'Utilisateur cible manquant' };
        }
        const warnReason = parts.slice(2).join(' ');
        if (!warnReason) {
          return { isCommand: true, command, target, error: 'Raison manquante' };
        }
        return { isCommand: true, command, target: target.replace('@', ''), reason: warnReason };
      
      case 'mute':
        if (!target) {
          return { isCommand: true, command, error: 'Utilisateur cible manquant' };
        }
        const muteDuration = parseInt(parts[2] || '', 10);
        if (isNaN(muteDuration) || muteDuration <= 0) {
          return { isCommand: true, command, target, error: 'Durée invalide' };
        }
        const muteReason = parts.slice(3).join(' ');
        if (!muteReason) {
          return { isCommand: true, command, target, duration: muteDuration, error: 'Raison manquante' };
        }
        return { 
          isCommand: true, 
          command, 
          target: target.replace('@', ''), 
          duration: muteDuration,
          reason: muteReason 
        };

      case 'unmute':
        if (!target) {
          return { isCommand: true, command, error: 'Utilisateur cible manquant' };
        }
        return { isCommand: true, command, target: target.replace('@', '') };

      case 'block':
        if (!target) {
          return { isCommand: true, command, error: 'Utilisateur cible manquant' };
        }
        const blockDuration = parseInt(parts[2] || '0', 10);
        if (isNaN(blockDuration) || blockDuration < 0) {
          return { isCommand: true, command, target, error: 'Durée invalide' };
        }
        const blockReason = parts.slice(3).join(' ');
        if (!blockReason) {
          return { isCommand: true, command, target, duration: blockDuration, error: 'Raison manquante' };
        }
        return {
          isCommand: true,
          command,
          target: target.replace('@', ''),
          duration: blockDuration,
          reason: blockReason
        };

      case 'unblock':
        if (!target) {
          return { isCommand: true, command, error: 'Utilisateur cible manquant' };
        }
        return { isCommand: true, command, target: target.replace('@', '') };

      case 'clear':
        return { isCommand: true, command };

      case 'help':
        return { isCommand: true, command };
      
      default:
        return { isCommand: true, command, error: 'Commande inconnue' };
    }
  },

  // Actions d'animation
  triggerAnimation: (name: string) => {
    const { animationSettings } = get().gameStateForAnimation;
    
    set((state) => {
      const triggers = { ...state.gameStateForAnimation.animationTriggers };
      triggers[name] = true;
      
      return {
        gameStateForAnimation: {
          ...state.gameStateForAnimation,
          animationTriggers: triggers,
          isAnimating: true,
          currentAnimation: name
        }
      };
    });

    setTimeout(() => {
      set((state) => {
        const triggers = { ...state.gameStateForAnimation.animationTriggers };
        delete triggers[name];
        
        return {
          gameStateForAnimation: {
            ...state.gameStateForAnimation,
            animationTriggers: triggers,
            isAnimating: Object.keys(triggers).length > 0,
            currentAnimation: Object.keys(triggers).length > 0 ? state.gameStateForAnimation.currentAnimation : null
          }
        };
      });
    }, animationSettings.duration);
  },

  resetAnimation: (name: string) => {
    set((state) => {
      const triggers = { ...state.gameStateForAnimation.animationTriggers };
      delete triggers[name];
      
      return {
        gameStateForAnimation: {
          ...state.gameStateForAnimation,
          animationTriggers: triggers,
          isAnimating: Object.keys(triggers).length > 0,
          currentAnimation: Object.keys(triggers).length > 0 ? state.gameStateForAnimation.currentAnimation : null
        }
      };
    });
  },

  updateAnimationSettings: (settings) => {
    set((state) => ({
      gameStateForAnimation: {
        ...state.gameStateForAnimation,
        animationSettings: {
          ...state.gameStateForAnimation.animationSettings,
          ...settings
        }
      }
    }));
  },

  getAnimationState: (name: string) => {
    const state = get().gameStateForAnimation;
    return {
      name,
      isActive: !!state.animationTriggers[name],
      duration: state.animationSettings.duration
    };
  },

  cleanupAnimations: () => {
    set((state) => ({
      gameStateForAnimation: {
        ...state.gameStateForAnimation,
        animationTriggers: {},
        isAnimating: false,
        currentAnimation: null
      }
    }));
  }
}));

// Utilitaires de performance
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

// Utilitaires de pagination
export const paginateMessages = (
  messages: ChatMessage[],
  page: number = 1,
  pageSize: number = 50
): {
  messages: ChatMessage[];
  hasMore: boolean;
  totalPages: number;
} => {
  const totalMessages = messages.length;
  const totalPages = Math.ceil(totalMessages / pageSize);
  const startIndex = Math.max(0, totalMessages - (page * pageSize));
  const endIndex = totalMessages;
  
  return {
    messages: messages.slice(startIndex, endIndex),
    hasMore: page < totalPages,
    totalPages
  };
};

// Utilitaires de modération
export const canUserPostMessage = (
  roomCode: string,
  userId: string,
  moderationStatus: Record<string, Record<string, UserModerationStatus>>
): boolean => {
  const userStatus = moderationStatus[roomCode]?.[userId];
  if (!userStatus) return true;
  
  // Vérifier si l'utilisateur est bloqué
  if (userStatus.isBlocked && (!userStatus.blockEndTime || userStatus.blockEndTime > Date.now())) {
    return false;
  }
  
  // Vérifier si l'utilisateur est muet
  if (userStatus.isMuted && userStatus.muteEndTime && userStatus.muteEndTime > Date.now()) {
    return false;
  }
  
  // Vérifier le spam (plus de 5 messages par minute)
  const now = Date.now();
  const oneMinuteAgo = now - 60000;
  if (userStatus.messageFrequency.lastMinute < oneMinuteAgo) {
    return userStatus.messageFrequency.consecutiveSpam < 5;
  }
  
  return true;
};

export const updateUserMessageFrequency = (
  roomCode: string,
  userId: string,
  moderationStatus: Record<string, Record<string, UserModerationStatus>>
): UserModerationStatus => {
  const now = Date.now();
  const userStatus = moderationStatus[roomCode]?.[userId] || {
    userId,
    username: '',
    warningCount: 0,
    isBlocked: false,
    isMuted: false,
    messageFrequency: {
      lastMessage: 0,
      lastMinute: 0,
      consecutiveSpam: 0
    },
    violations: []
  };

  const timeSinceLastMessage = now - userStatus.messageFrequency.lastMessage;
  const oneMinuteAgo = now - 60000;

  // Réinitialiser le compteur si plus d'une minute s'est écoulée
  if (userStatus.messageFrequency.lastMinute < oneMinuteAgo) {
    userStatus.messageFrequency.consecutiveSpam = 0;
    userStatus.messageFrequency.lastMinute = now;
  }

  // Détecter le spam (messages trop fréquents)
  if (timeSinceLastMessage < 2000) { // Moins de 2 secondes
    userStatus.messageFrequency.consecutiveSpam++;
  } else {
    userStatus.messageFrequency.consecutiveSpam = Math.max(0, userStatus.messageFrequency.consecutiveSpam - 1);
  }

  userStatus.messageFrequency.lastMessage = now;
  
  return userStatus;
};

export const advancedModerateMessage = (
  content: string,
  userStatus: UserModerationStatus
): {
  shouldBlock: boolean;
  reason: string;
  severity: 'low' | 'medium' | 'high';
} => {
  const lowerContent = content.toLowerCase();
  
  // Mots interdits (exemple simple)
  const forbiddenWords = ['spam', 'idiot', 'stupid'];
  const hasForbiddenWords = forbiddenWords.some(word => lowerContent.includes(word));
  
  // Détection de spam par répétition
  const isSpam = userStatus.messageFrequency.consecutiveSpam > 3;
  
  // Messages trop longs
  const isTooLong = content.length > 500;
  
  // Messages en majuscules (cri)
  const isYelling = content.length > 10 && content === content.toUpperCase();
  
  if (isSpam) {
    return { shouldBlock: true, reason: 'Spam détecté', severity: 'high' };
  }
  
  if (hasForbiddenWords) {
    return { shouldBlock: true, reason: 'Langage inapproprié', severity: 'medium' };
  }
  
  if (isTooLong) {
    return { shouldBlock: true, reason: 'Message trop long', severity: 'low' };
  }
  
  if (isYelling) {
    return { shouldBlock: false, reason: 'Message en majuscules', severity: 'low' };
  }
  
  return { shouldBlock: false, reason: '', severity: 'low' };
};

// Hooks d'accès au store pour le chat
export const useChatMessages = (roomCode: string) => {
  return useGameStore((state) => state.chatMessages[roomCode] || []);
};

export const useGameActions = () => {
  const store = useGameStore();
  return {
    addChatMessage: store.addChatMessage,
    addUserMessage: store.addUserMessage,
    addSystemMessage: store.addSystemMessage,
    addGameMessage: store.addGameMessage,
    addAdminMessage: store.addAdminMessage,
    moderateUserMessage: store.moderateUserMessage,
    clearChatMessages: store.clearChatMessages,
    batchAddChatMessages: store.batchAddChatMessages,
    addReaction: store.addReaction,
    warnUser: store.warnUser,
    muteUser: store.muteUser,
    unmuteUser: store.unmuteUser,
    blockUser: store.blockUser,
    unblockUser: store.unblockUser,
    addModerationReport: store.addModerationReport,
    parseAdminCommand: store.parseAdminCommand,
    isUserMuted: store.isUserMuted,
    isUserBlocked: store.isUserBlocked,
    getUserModerationStatus: store.getUserModerationStatus
  };
};

// Hooks d'animation
export const useAnimation = (animationName: string): AnimationHook => {
  const store = useGameStore();
  const isAnimating = store.gameStateForAnimation.animationTriggers[animationName] || false;

  const trigger = () => {
    if (!isAnimating) {
      store.triggerAnimation(animationName);
    }
  };

  const reset = () => {
    if (isAnimating) {
      store.resetAnimation(animationName);
    }
  };
  
  return { isAnimating, trigger, reset };
};

export const useAnimationSettings = () => {
  const store = useGameStore();
  return {
    ...store.gameStateForAnimation.animationSettings,
    update: (settings: Partial<GameStateForAnimation['animationSettings']>) => 
      store.updateAnimationSettings(settings)
  };
};

// Hooks d'accès au state
export const useUser = () => useGameStore((state) => state.user);

export const useCurrentRoom = () => useGameStore((state) => state.currentRoom);

export const useTimeLeft = () => useGameStore((state) => state.timeLeft);

export const useCurrentImageIndex = () => useGameStore((state) => state.currentImageIndex);

export const useIsGameActive = () => {
  const currentRoom = useGameStore((state) => state.currentRoom);
  return currentRoom?.gameState?.status === 'playing';
};

export const useCurrentRoomUsers = () => {
  const currentRoom = useGameStore((state) => state.currentRoom);
  return currentRoom?.users || [];
};

export const useIsCurrentUserAdmin = () => {
  const user = useGameStore((state) => state.user);
  return user?.isAdmin || false;
};

export const useAnimationTrigger = (name: string) => {
  const triggers = useGameStore((state) => state.gameStateForAnimation.animationTriggers);
  return triggers[name] || false;
};

export const useAnimationActions = () => {
  const { triggerAnimation, resetAnimation, cleanupAnimations, updateAnimationSettings } = useGameStore();
  return {
    triggerAnimation,
    resetAnimation,
    cleanupAnimations,
    updateAnimationSettings
  };
};
