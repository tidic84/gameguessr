import type { Room as ServerRoom, RoomUser } from '@/types';
import type { Room as StoreRoom, User as StoreUser } from '@/store/gameStore';

export const convertServerRoomToStoreRoom = (serverRoom: ServerRoom): StoreRoom => {
  const users = Object.values(serverRoom.users).map(user => ({
    id: user.id,
    username: user.username || '',
    isAdmin: user.isAdmin || false,
    isAuthenticated: user.isAuthenticated
  }));

  return {
    code: serverRoom.code,
    name: serverRoom.name || '',
    owner: serverRoom.owner,
    mode: serverRoom.mode || 'classic',
    users,
    gameState: {
      status: 'waiting',
      currentRound: 0,
      totalRounds: 5,
      scores: {},
      timeLeft: 120
    }
  };
};

export const convertServerUserToStoreUser = (serverUser: RoomUser): StoreUser => {
  return {
    id: serverUser.id,
    username: serverUser.username || '',
    isAdmin: serverUser.isAdmin || false,
    isAuthenticated: serverUser.isAuthenticated
  };
};