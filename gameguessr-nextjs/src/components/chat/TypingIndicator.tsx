import React from 'react';
import { motion } from 'framer-motion';
import { useAnimationSettings } from '@/store/gameStore';
import { DURATIONS, EASINGS } from '@/utils/animations';

interface TypingIndicatorProps {
  users: string[];
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ users, className = '' }) => {
  // Récupérer les paramètres d'animation du store global
  const animationSettings = useAnimationSettings();
  
  if (users.length === 0) return null;

  const getText = () => {
    if (users.length === 1) {
      return `${users[0]} écrit...`;
    } else if (users.length === 2) {
      return `${users[0]} et ${users[1]} écrivent...`;
    } else {
      return `${users[0]} et ${users.length - 1} autres écrivent...`;
    }
  };

  // Désactiver ou adapter les animations si l'option de mouvement réduit est activée
  const animationDuration = animationSettings.reducedMotion ? 0.5 : 1.4;
  const animationScale = animationSettings.reducedMotion ? [1, 1.2, 1] : [1, 1.5, 1];

  return (
    <motion.div
      initial={{ opacity: 0, height: 0, y: 10 }}
      animate={{ opacity: 1, height: 'auto', y: 0 }}
      exit={{ opacity: 0, height: 0, y: 10 }}
      transition={{ 
        duration: DURATIONS.normal,
        ease: EASINGS.smooth
      }}
      className={`flex items-center gap-2 text-sm text-white/60 p-2 rounded-lg bg-white/5 ${className}`}
    >
      {/* Animation des points */}
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{
              scale: animationScale,
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: animationDuration,
              repeat: Infinity,
              delay: i * 0.2,
              ease: "easeInOut"
            }}
            className="w-2 h-2 bg-blue-400/70 rounded-full"
          />
        ))}
      </div>
      
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {getText()}
      </motion.span>
    </motion.div>
  );
};

export default TypingIndicator;
