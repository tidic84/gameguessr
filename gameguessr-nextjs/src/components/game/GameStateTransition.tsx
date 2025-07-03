'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gameStateAnimation } from '@/utils/animations';
import { useGameStore } from '@/store/gameStore';

type GameState = 'waiting' | 'starting' | 'playing' | 'paused' | 'round_end' | 'game_end';

interface GameStateTransitionProps {
  children: React.ReactNode;
  state: GameState;
  className?: string;
}

// Composant pour afficher les messages de transition entre états de jeu
const StateMessage = ({ state }: { state: GameState }) => {
  const messages: Record<GameState, { title: string; subtitle: string }> = {
    waiting: {
      title: "En attente de joueurs",
      subtitle: "D'autres joueurs rejoignent la partie..."
    },
    starting: {
      title: "La partie commence !",
      subtitle: "Préparez-vous à explorer..."
    },
    playing: {
      title: "C'est parti !",
      subtitle: "Où êtes-vous ? Trouvez votre position sur la carte."
    },
    paused: {
      title: "Jeu en pause",
      subtitle: "L'administrateur a mis le jeu en pause."
    },
    round_end: {
      title: "Fin du tour !",
      subtitle: "Voyons les résultats..."
    },
    game_end: {
      title: "Partie terminée !",
      subtitle: "Consultez le tableau des scores pour voir qui a gagné."
    }
  };

  const { title, subtitle } = messages[state];

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="text-white/80">{subtitle}</p>
    </div>
  );
};

export default function GameStateTransition({ children, state, className = '' }: GameStateTransitionProps) {
  const [showTransition, setShowTransition] = useState(false);
  const [prevState, setPrevState] = useState<GameState | null>(null);
  const { isGameActive } = useGameStore();

  // Effet pour gérer les changements d'état
  useEffect(() => {
    if (prevState !== state) {
      // Afficher la transition
      setShowTransition(true);
      
      // Masquer après un délai
      const timer = setTimeout(() => {
        setShowTransition(false);
      }, 2000);
      
      setPrevState(state);
      
      return () => clearTimeout(timer);
    }
  }, [state, prevState]);

  return (
    <div className={`relative ${className}`}>
      <AnimatePresence>
        {showTransition && (
          <motion.div
            key={`transition-${state}`}
            className="absolute inset-0 flex items-center justify-center z-50 bg-black/80"
            variants={gameStateAnimation}
            initial="initial"
            animate="animate"
            exit="exit"
          >
            <StateMessage state={state} />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Le contenu principal du jeu */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`game-state-${state}`}
          className="w-full h-full"
          variants={gameStateAnimation}
          initial={prevState ? "initial" : false}
          animate="animate"
          exit="exit"
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
