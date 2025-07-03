import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, SkipForward, RotateCcw, Clock, Users, Gamepad2, AlertCircle } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { 
  useCurrentRoom, 
  useUser, 
  useIsGameActive, 
  useTimeLeft, 
  useCurrentImageIndex,
  useIsCurrentUserAdmin,
  useCurrentRoomUsers 
} from '@/store/gameStore';
import Button from '@/components/ui/Button';

export const GameControls: React.FC = () => {
  const { emit } = useSocket();
  const currentRoom = useCurrentRoom();
  const user = useUser();
  const isGameActive = useIsGameActive();
  const timeLeft = useTimeLeft();
  const currentImageIndex = useCurrentImageIndex();
  const isAdmin = useIsCurrentUserAdmin();
  const roomUsers = useCurrentRoomUsers();
  
  const [isLoading, setIsLoading] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);

  if (!isAdmin || !currentRoom) {
    return null;
  }

  const userCount = Object.keys(roomUsers).length;
  const gameState = currentRoom.gameState?.status || 'waiting';

  const handleAction = async (action: () => void, actionName: string) => {
    setIsLoading(true);
    setLastAction(actionName);
    try {
      action();
      setTimeout(() => {
        setIsLoading(false);
        setLastAction(null);
      }, 1000);
    } catch (error) {
      setIsLoading(false);
      setLastAction(null);
    }
  };

  const handleStartGame = () => {
    handleAction(() => emit.startGame(currentRoom.code), 'start');
  };

  const handleResetGame = () => {
    handleAction(() => emit.resetGame(currentRoom.code), 'reset');
  };

  const handleNextImage = () => {
    handleAction(() => emit.nextImage(currentRoom.code), 'next');
  };

  const getGameStateColor = () => {
    switch (gameState) {
      case 'waiting': return 'text-yellow-600';
      case 'playing': return 'text-green-600';
      case 'finished': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const getGameStateText = () => {
    switch (gameState) {
      case 'waiting': return 'En attente';
      case 'playing': return 'En cours';
      case 'finished': return 'Terminé';
      default: return gameState;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-lg shadow-lg p-4 mb-4 border-l-4 border-blue-500"
    >
      {/* Header avec indicateur admin */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Gamepad2 className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Contrôles Admin</h3>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 rounded-full">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
          <span className="text-xs font-medium text-blue-700">ADMIN</span>
        </div>
      </div>
      
      {/* Informations sur l'état du jeu */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 p-3 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">État</div>
          <div className={`font-medium ${getGameStateColor()}`}>
            {getGameStateText()}
          </div>
        </div>
        
        <div className="text-center">
          <div className="text-xs text-gray-500 mb-1">Joueurs</div>
          <div className="flex items-center justify-center gap-1">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="font-medium">{userCount}</span>
          </div>
        </div>
        
        {isGameActive && (
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Temps</div>
            <div className="flex items-center justify-center gap-1">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="font-medium text-blue-600">{timeLeft}s</span>
            </div>
          </div>
        )}
        
        {gameState === 'playing' && (
          <div className="text-center">
            <div className="text-xs text-gray-500 mb-1">Image</div>
            <div className="font-medium text-green-600">#{currentImageIndex + 1}</div>
          </div>
        )}
      </div>

      {/* Warning si pas assez de joueurs */}
      {userCount < 2 && gameState === 'waiting' && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 p-2 mb-3 bg-yellow-50 border border-yellow-200 rounded-lg"
        >
          <AlertCircle className="w-4 h-4 text-yellow-600" />
          <span className="text-sm text-yellow-700">
            Il faut au moins 2 joueurs pour démarrer une partie
          </span>
        </motion.div>
      )}
      
      {/* Contrôles */}
      <div className="flex flex-wrap gap-2">
        <AnimatePresence mode="wait">
          {gameState === 'waiting' && (
            <motion.div
              key="start"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                onClick={handleStartGame}
                disabled={isLoading || userCount < 2}
                variant="primary"
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
              >
                <Play className="w-4 h-4 mr-2" />
                {isLoading && lastAction === 'start' ? 'Démarrage...' : 'Démarrer le jeu'}
              </Button>
            </motion.div>
          )}
          
          {gameState === 'playing' && (
            <motion.div
              key="playing"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex gap-2"
            >
              <Button
                onClick={handleNextImage}
                disabled={isLoading}
                variant="primary"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <SkipForward className="w-4 h-4 mr-2" />
                {isLoading && lastAction === 'next' ? 'Changement...' : 'Image suivante'}
              </Button>
              
              <Button
                onClick={handleResetGame}
                disabled={isLoading}
                variant="secondary"
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                {isLoading && lastAction === 'reset' ? 'Reset...' : 'Réinitialiser'}
              </Button>
            </motion.div>
          )}

          {gameState === 'finished' && (
            <motion.div
              key="end"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Button
                onClick={handleResetGame}
                disabled={isLoading}
                variant="primary"
                className="bg-green-600 hover:bg-green-700"
              >
                <Play className="w-4 h-4 mr-2" />
                {isLoading && lastAction === 'reset' ? 'Préparation...' : 'Nouveau jeu'}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Feedback utilisateur */}
      <AnimatePresence>
        {lastAction && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg"
          >
            <span className="text-sm text-green-700">
              Action "{lastAction}" exécutée avec succès !
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
