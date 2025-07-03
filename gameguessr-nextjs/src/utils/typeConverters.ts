import type { Room as ServerRoom, RoomUser } from '@/types';
import type { Room as StoreRoom, User as StoreUser } from '@/store/gameStore';

export const convertServerRoomToStoreRoom = (serverRoom: ServerRoom): StoreRoom => {
  const users = Object.values(serverRoom.users).map(user => ({
    id: user.id,
    username: user.name || '',
    isAdmin: user.role === 'admin',
    isAuthenticated: user.isAuthenticated
  }));

  return {
    code: serverRoom.code,
    name: serverRoom.name || '',
    owner: serverRoom.owner,
    mode: serverRoom.mode || 'classic',
    users,
    gameState: {
      status: serverRoom.gameState === 'playing' ? 'playing' : serverRoom.gameState === 'wait' ? 'waiting' : 'finished',
      currentRound: (() => {
        const match = serverRoom.gameState.match(/image (\d+)/);
        return match && match[1] ? parseInt(match[1], 10) : 0;
      })(),
      totalRounds: serverRoom.gameDB?.length || 5,
      scores: Object.entries(serverRoom.users).reduce((acc, [id, user]) => ({
        ...acc,
        [id]: user.points
      }), {}),
      timeLeft: serverRoom.duration
    }
  };
};

export const convertServerUserToStoreUser = (serverUser: RoomUser): StoreUser => {
  return {
    id: serverUser.id,
    username: serverUser.name || '',
    isAdmin: serverUser.role === 'admin',
    isAuthenticated: serverUser.isAuthenticated
  };
};