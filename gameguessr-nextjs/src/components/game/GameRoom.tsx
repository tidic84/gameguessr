import { memo, Suspense, lazy } from 'react';
import dynamic from 'next/dynamic';
import { useStore } from '@/store/gameStore';
import LoadingSpinner from '@/components/ui/LoadingSpinner';

// Code splitting avec lazy loading des composants principaux
const PanoramaViewer = lazy(() => import('./PanoramaViewer'));
const Chat = lazy(() => import('./Chat'));
const ScoreBoard = lazy(() => import('./ScoreBoard'));

// Le composant Map doit être chargé dynamiquement à cause de leaflet
const GameMap = dynamic(() => import('./GameMap'), {
  loading: () => <LoadingSpinner />,
  ssr: false
});

interface GameRoomProps {
  roomCode: string;
}

const GameRoom = memo(({ roomCode }: GameRoomProps) => {
  const {
    gameState,
    currentImage,
    handleLocationSelect,
    handleSendMessage,
    correctLocation,
    isMapSelectable
  } = useStore((state) => ({
    gameState: state.gameState,
    currentImage: state.currentImage,
    handleLocationSelect: state.handleLocationSelect,
    handleSendMessage: state.handleSendMessage,
    correctLocation: state.correctLocation,
    isMapSelectable: state.isMapSelectable
  }));

  return (
    <div className="game-room">
      <div className="game-area">
        <Suspense fallback={<LoadingSpinner />}>
          <PanoramaViewer 
            imageUrl={currentImage} 
          />
        </Suspense>

        <Suspense fallback={<LoadingSpinner />}>
          <GameMap
            onLocationSelect={handleLocationSelect}
            correctLocation={correctLocation}
            isSelectable={isMapSelectable}
          />
        </Suspense>
      </div>

      <div className="side-panel">
        <Suspense fallback={<LoadingSpinner />}>
          <ScoreBoard roomCode={roomCode} />
        </Suspense>

        <Suspense fallback={<LoadingSpinner />}>
          <Chat 
            roomCode={roomCode}
            onSendMessage={handleSendMessage}
          />
        </Suspense>
      </div>
    </div>
  );
});

GameRoom.displayName = 'GameRoom';

export default GameRoom;
