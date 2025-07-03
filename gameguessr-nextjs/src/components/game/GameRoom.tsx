'use client';

import { memo, Suspense, lazy } from 'react';
import { useGameStore } from '@/store/gameStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Code splitting avec lazy loading des composants principaux
const Chat = lazy(() => import('../chat/Chat'));

interface GameRoomProps {
  roomCode: string;
}

const GameRoom = memo(({ roomCode }: GameRoomProps) => {
  const currentRoom = useGameStore((state) => state.currentRoom);

  if (!currentRoom) {
    return <LoadingSpinner />;
  }

  return (
    <div className="game-room min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-xl border border-white/20 p-6">
          <h1 className="text-2xl font-bold text-white mb-4">Salle de jeu: {currentRoom.name}</h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Zone de jeu principale */}
            <div className="bg-black/20 rounded-lg p-4">
              <p className="text-white/80">Zone de jeu - À implémenter</p>
            </div>

            {/* Chat */}
            <div className="bg-black/20 rounded-lg overflow-hidden">
              <Suspense fallback={<LoadingSpinner />}>
                <Chat roomCode={roomCode} />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

GameRoom.displayName = 'GameRoom';

export default GameRoom;