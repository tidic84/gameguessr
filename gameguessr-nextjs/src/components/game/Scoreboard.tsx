'use client';

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { Trophy, Crown, Users, Star, Target, ArrowUp, Award } from 'lucide-react';
import { 
  useCurrentRoom, 
  useUser, 
  useAnimation, 
  useAnimationTrigger, 
  useAnimationSettings, 
  useAnimationActions 
} from '@/store/gameStore';
import { 
  DURATIONS, 
  EASINGS, 
  fadeAnimation, 
  slideUpAnimation, 
  pulseAnimation,
  createStaggerAnimation
} from '@/utils/animations';

interface ScoreboardProps {
  className?: string;
  showProgress?: boolean;
}

// Variants pour les animations de classement
const playerCardVariants: Variants = {
  hidden: { 
    opacity: 0, 
    x: 20,
    scale: 0.95,
    transition: { duration: DURATIONS.normal } 
  },
  visible: (i: number) => ({ 
    opacity: 1, 
    x: 0,
    scale: 1,
    transition: { 
      duration: DURATIONS.normal,
      delay: i * 0.05,
      ease: EASINGS.smooth
    } 
  }),
  exit: { 
    opacity: 0, 
    x: -20, 
    transition: { duration: DURATIONS.fast } 
  },
  updated: { 
    scale: [1, 1.02, 1],
    backgroundColor: ['rgba(255,255,255,0)', 'rgba(255,255,255,0.1)', 'rgba(255,255,255,0)'],
    transition: { duration: 0.5, ease: EASINGS.bounce }
  },
  rankUp: {
    y: [0, -10, 0],
    scale: [1, 1.05, 1],
    transition: { duration: 0.6, ease: EASINGS.bounce }
  },
  rankDown: {
    y: [0, 5, 0],
    scale: [1, 0.98, 1],
    transition: { duration: 0.5, ease: EASINGS.smooth }
  }
};

// Variants pour le container
const scoreboardContainerVariants = createStaggerAnimation(0.05);

export default function Scoreboard({ className = '', showProgress = true }: ScoreboardProps) {
  const currentRoom = useCurrentRoom();
  const user = useUser();
  const [prevScores, setPrevScores] = useState<Record<string, number>>({});
  const [playerRanks, setPlayerRanks] = useState<Record<string, number>>({});
  const [prevRanks, setPrevRanks] = useState<Record<string, number>>({});
  const [updatedPlayers, setUpdatedPlayers] = useState<string[]>([]);
  const [rankChanges, setRankChanges] = useState<Record<string, 'up' | 'down' | null>>({});
  
  // Animation hooks
  const isScoreUpdateTriggered = useAnimationTrigger('scoreboard_update');
  const isPlayerJoinTriggered = useAnimationTrigger('player_join');
  const settings = useAnimationSettings();
  const { triggerAnimation, resetAnimationTrigger, logAnimationEvent } = useAnimationActions();
  const scoreUpdateAnimation = useAnimation('score_change');
  
  // Ref pour suivre si c'est le premier rendu
  const firstRenderRef = useRef(true);

  if (!currentRoom || !user) return null;

  const players = Object.entries(currentRoom.users || {});
  const sortedPlayers = players.sort(([, a], [, b]) => (b.points || 0) - (a.points || 0));
  const maxPoints = Math.max(...players.map(([, p]) => p.points || 0), 1);

  // Détecter les changements de score et de classement
  useEffect(() => {
    if (firstRenderRef.current) {
      // Premier rendu, initialiser les scores et rangs précédents
      const initialScores: Record<string, number> = {};
      const initialRanks: Record<string, number> = {};
      
      sortedPlayers.forEach(([playerId, player], index) => {
        initialScores[playerId] = player.points || 0;
        initialRanks[playerId] = index;
      });
      
      setPrevScores(initialScores);
      setPlayerRanks(initialRanks);
      setPrevRanks(initialRanks);
      firstRenderRef.current = false;
      return;
    }

    // Calculer les rangs actuels
    const currentRanks: Record<string, number> = {};
    sortedPlayers.forEach(([playerId, _], index) => {
      currentRanks[playerId] = index;
    });
    
    // Détecter les changements de score
    const updated: string[] = [];
    const rankChanged: Record<string, 'up' | 'down' | null> = {};
    
    sortedPlayers.forEach(([playerId, player]) => {
      const currentScore = player.points || 0;
      const previousScore = prevScores[playerId] || 0;
      
      // Si le score a changé, ajouter à la liste des joueurs mis à jour
      if (currentScore !== previousScore) {
        updated.push(playerId);
        // Déclencher l'animation de mise à jour de score
        triggerAnimation('scoreboard_update');
        logAnimationEvent({
          animation: 'score_change',
          component: 'Scoreboard',
          duration: settings.duration.normal
        });
      }
      
      // Vérifier si le classement a changé
      const currentRank = currentRanks[playerId];
      const previousRank = prevRanks[playerId];
      
      if (previousRank !== undefined && currentRank !== undefined) {
        if (currentRank < previousRank) {
          rankChanged[playerId] = 'up';
        } else if (currentRank > previousRank) {
          rankChanged[playerId] = 'down';
        } else {
          rankChanged[playerId] = null;
        }
      } else {
        rankChanged[playerId] = null;
      }
    });
    
    // Mettre à jour les états
    setUpdatedPlayers(updated);
    setRankChanges(rankChanged);
    setPrevScores(
      sortedPlayers.reduce((acc, [playerId, player]) => {
        acc[playerId] = player.points || 0;
        return acc;
      }, {} as Record<string, number>)
    );
    setPlayerRanks(currentRanks);
    setPrevRanks(currentRanks);
    
    // Réinitialiser les joueurs mis à jour après un délai
    if (updated.length > 0) {
      const timer = setTimeout(() => {
        setUpdatedPlayers([]);
        resetAnimationTrigger('scoreboard_update');
      }, 2000);
      return () => clearTimeout(timer);
    }
    
    return undefined; // Pour éviter l'erreur "Les chemins du code ne retournent pas tous une valeur"
  }, [sortedPlayers, prevScores, prevRanks, triggerAnimation, resetAnimationTrigger, logAnimationEvent, settings.duration.normal]);

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0:
        return <Trophy className="w-4 h-4 text-yellow-400" />;
      case 1:
        return <Star className="w-4 h-4 text-gray-300" />;
      case 2:
        return <Target className="w-4 h-4 text-orange-400" />;
      default:
        return <div className="w-4 h-4 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">{index + 1}</div>;
    }
  };

  const getRankColor = (index: number) => {
    switch (index) {
      case 0:
        return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500/30';
      case 1:
        return 'from-gray-400/20 to-gray-500/20 border-gray-400/30';
      case 2:
        return 'from-orange-500/20 to-orange-600/20 border-orange-500/30';
      default:
        return 'from-white/5 to-white/10 border-white/20';
    }
  };

  return (
    <motion.div 
      className={`${className} bg-black/20 backdrop-blur-sm rounded-lg border border-white/10`}
      initial="hidden"
      animate="visible"
      variants={fadeAnimation}
    >
      <motion.div 
        className="p-4 border-b border-white/10"
        variants={slideUpAnimation}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-white" />
            <h3 className="text-white font-bold">Classement</h3>
          </div>
          <motion.div 
            className="text-white/60 text-sm"
            animate={isPlayerJoinTriggered ? "animate" : "initial"}
            variants={pulseAnimation}
          >
            {players.length} joueur{players.length > 1 ? 's' : ''}
          </motion.div>
        </div>
      </motion.div>

      <motion.div 
        className="p-4 space-y-3 overflow-y-auto max-h-[400px]"
        variants={scoreboardContainerVariants}
      >
        <AnimatePresence mode="sync">
          {sortedPlayers.map(([playerId, player], index) => {
            const isUpdated = updatedPlayers.includes(playerId);
            const rankChange = rankChanges[playerId];
            const animationState = 
              isUpdated ? "updated" : 
              rankChange === 'up' ? "rankUp" : 
              rankChange === 'down' ? "rankDown" : "visible";
              
            return (
              <motion.div
                key={playerId}
                custom={index}
                initial="hidden"
                animate={animationState}
                exit="exit"
                variants={playerCardVariants}
                layout
                className={`relative overflow-hidden rounded-lg border bg-gradient-to-r ${getRankColor(index)} ${
                  playerId === user.id
                    ? 'ring-2 ring-blue-500/50'
                    : ''
                } ${
                  !player.alive ? 'opacity-60' : ''
                }`}
              >
                <div className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        {getRankIcon(index)}
                        {rankChange === 'up' && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="absolute -top-3 -right-1"
                          >
                            <ArrowUp className="w-3 h-3 text-green-400" />
                          </motion.div>
                        )}
                      </div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-white font-medium text-sm">
                            {player.name}
                          </span>
                          {playerId === currentRoom.owner && (
                            <Crown className="w-3 h-3 text-yellow-400" />
                          )}
                          {playerId === user.id && (
                            <motion.span 
                              className="text-xs px-2 py-0.5 bg-blue-500/30 text-blue-200 rounded-full"
                              animate={playerId === user.id ? { scale: [1, 1.05, 1] } : {}}
                              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 5 }}
                            >
                              Vous
                            </motion.span>
                          )}
                        </div>
                        {!player.alive && (
                          <div className="flex items-center space-x-1 mt-1">
                            <div className="w-2 h-2 rounded-full bg-red-500" />
                            <span className="text-xs text-red-300">Éliminé</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <motion.div 
                      className="text-right"
                      animate={isUpdated ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ duration: 0.5, ease: EASINGS.elastic }}
                    >
                      <div className="text-white font-bold relative group">
                        {isUpdated && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="absolute -right-6 -top-1"
                          >
                            <Award className="w-4 h-4 text-green-400" />
                          </motion.div>
                        )}
                        {player.points || 0}
                      </div>
                      <div className="text-white/60 text-xs">
                        points
                      </div>
                    </motion.div>
                  </div>

                  {/* Barre de progression des points */}
                  {showProgress && (
                    <div className="mt-3">
                      <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ 
                            width: `${((player.points || 0) / maxPoints) * 100}%` 
                          }}
                          transition={{ 
                            duration: 0.8, 
                            delay: index * 0.05,
                            ease: EASINGS.smooth
                          }}
                          className={`h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 ${
                            isUpdated ? 'relative overflow-hidden' : ''
                          }`}
                        >
                          {isUpdated && (
                            <motion.div
                              initial={{ x: '-100%' }}
                              animate={{ x: '100%' }}
                              transition={{ duration: 1, ease: 'linear' }}
                              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                            />
                          )}
                        </motion.div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Effet de brillance pour le premier */}
                {index === 0 && (
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '100%' }}
                    transition={{
                      duration: 2,
                      repeat: Infinity,
                      repeatDelay: 3,
                      ease: 'linear'
                    }}
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -skew-x-12"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>

        {players.length === 0 && (
          <motion.div 
            variants={fadeAnimation}
            className="text-center py-8"
          >
            <Users className="w-8 h-8 text-white/40 mx-auto mb-2" />
            <p className="text-white/60 text-sm">Aucun joueur</p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
