'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Clock, AlertCircle, CheckCircle } from 'lucide-react';

interface GameTimerProps {
  totalTime: number;
  timeLeft: number;
  isActive: boolean;
  onTimeUp?: () => void;
  className?: string;
}

export default function GameTimer({ 
  totalTime, 
  timeLeft, 
  isActive, 
  onTimeUp,
  className = '' 
}: GameTimerProps) {
  const [isWarning, setIsWarning] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  useEffect(() => {
    if (timeLeft <= 10 && timeLeft > 5) {
      setIsWarning(true);
      setIsCritical(false);
    } else if (timeLeft <= 5) {
      setIsWarning(false);
      setIsCritical(true);
    } else {
      setIsWarning(false);
      setIsCritical(false);
    }

    if (timeLeft === 0 && onTimeUp) {
      onTimeUp();
    }
  }, [timeLeft, onTimeUp]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = (timeLeft / totalTime) * 100;

  const getTimerColor = () => {
    if (isCritical) return 'text-red-400';
    if (isWarning) return 'text-orange-400';
    return 'text-white';
  };

  const getProgressColor = () => {
    if (isCritical) return 'from-red-500 to-red-600';
    if (isWarning) return 'from-orange-500 to-orange-600';
    return 'from-blue-500 to-purple-500';
  };

  const getIcon = () => {
    if (timeLeft === 0) return <CheckCircle className="w-5 h-5 text-green-400" />;
    if (isCritical) return <AlertCircle className="w-5 h-5 text-red-400" />;
    return <Clock className="w-5 h-5 text-white" />;
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-3">
        {/* Icône animée */}
        <motion.div
          animate={isCritical ? { scale: [1, 1.2, 1] } : {}}
          transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
        >
          {getIcon()}
        </motion.div>

        {/* Temps restant */}
        <div className="flex flex-col">
          <motion.span
            className={`font-mono text-lg font-bold ${getTimerColor()}`}
            animate={isCritical ? { scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: isCritical ? Infinity : 0 }}
          >
            {formatTime(timeLeft)}
          </motion.span>
          <span className="text-xs text-white/60">
            {timeLeft === 0 ? 'Temps écoulé !' : isActive ? 'Temps restant' : 'En pause'}
          </span>
        </div>

        {/* Barre de progression circulaire */}
        <div className="relative w-12 h-12">
          <svg className="w-12 h-12 transform -rotate-90" viewBox="0 0 36 36">
            {/* Cercle de fond */}
            <path
              className="stroke-white/20"
              fill="none"
              strokeWidth="3"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Cercle de progression */}
            <motion.path
              className={`stroke-current`}
              fill="none"
              strokeWidth="3"
              strokeLinecap="round"
              d="M18 2.0845
                a 15.9155 15.9155 0 0 1 0 31.831
                a 15.9155 15.9155 0 0 1 0 -31.831"
              style={{
                strokeDasharray: `${progressPercentage}, 100`,
                color: isCritical ? '#ef4444' : isWarning ? '#f97316' : '#3b82f6'
              }}
              initial={{ strokeDasharray: '100, 100' }}
              animate={{ strokeDasharray: `${progressPercentage}, 100` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          
          {/* Pourcentage au centre */}
          <div className="absolute inset-0 flex items-center justify-center">
            <span className={`text-xs font-bold ${getTimerColor()}`}>
              {Math.round(progressPercentage)}%
            </span>
          </div>
        </div>
      </div>

      {/* Barre de progression linéaire en bas */}
      <div className="mt-2 w-full bg-white/10 rounded-full h-1">
        <motion.div
          className={`h-1 rounded-full bg-gradient-to-r ${getProgressColor()}`}
          initial={{ width: '100%' }}
          animate={{ width: `${progressPercentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Messages d'alerte */}
      {isCritical && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-center"
        >
          <span className="text-xs text-red-300 font-medium">
            ⚠️ Dépêchez-vous !
          </span>
        </motion.div>
      )}
    </div>
  );
}
