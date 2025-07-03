import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AnimatedBadgeProps {
  count: number;
  className?: string;
  children?: React.ReactNode;
}

export const AnimatedBadge: React.FC<AnimatedBadgeProps> = ({ 
  count, 
  className = '', 
  children 
}) => {
  const [prevCount, setPrevCount] = useState(count);
  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (count > prevCount) {
      setShowPulse(true);
      const timer = setTimeout(() => setShowPulse(false), 1000);
      setPrevCount(count);
      return () => clearTimeout(timer);
    } else {
      setPrevCount(count);
    }
  }, [count, prevCount]);

  if (count === 0) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <motion.span
        key={count}
        initial={{ scale: 0.5, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center ${className} ${
          showPulse ? 'animate-pulse ring-2 ring-red-300' : ''
        }`}
      >
        {count > 99 ? '99+' : count}
      </motion.span>
    </div>
  );
};

interface PulseEffectProps {
  trigger: boolean;
  children: React.ReactNode;
  className?: string;
}

export const PulseEffect: React.FC<PulseEffectProps> = ({ 
  trigger, 
  children, 
  className = '' 
}) => {
  return (
    <motion.div
      animate={trigger ? { scale: [1, 1.05, 1] } : {}}
      transition={{ duration: 0.3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

interface NewMessageIndicatorProps {
  isVisible: boolean;
  onClick: () => void;
}

export const NewMessageIndicator: React.FC<NewMessageIndicatorProps> = ({ 
  isVisible, 
  onClick 
}) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          onClick={onClick}
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg transition-colors z-10"
        >
          ↓ Nouveau messages
        </motion.button>
      )}
    </AnimatePresence>
  );
};

// Nouveaux composants pour le menu et la navigation

interface AnimatedContainerProps {
  children: React.ReactNode;
  className?: string;
  animation?: 'fade' | 'slideUp' | 'slideLeft' | 'slideRight' | 'zoom';
  delay?: number;
}

export const AnimatedContainer: React.FC<AnimatedContainerProps> = ({ 
  children, 
  className = '', 
  animation = 'fade',
  delay = 0 
}) => {
  // Définir les différentes animations disponibles
  const animations = {
    fade: {
      hidden: { opacity: 0 },
      visible: { 
        opacity: 1,
        transition: { duration: 0.3, delay }
      },
      exit: { opacity: 0, transition: { duration: 0.2 } }
    },
    slideUp: {
      hidden: { opacity: 0, y: 20 },
      visible: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 0.3, delay } 
      },
      exit: { opacity: 0, y: 20, transition: { duration: 0.2 } }
    },
    slideLeft: {
      hidden: { opacity: 0, x: -20 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: { duration: 0.3, delay } 
      },
      exit: { opacity: 0, x: -20, transition: { duration: 0.2 } }
    },
    slideRight: {
      hidden: { opacity: 0, x: 20 },
      visible: { 
        opacity: 1, 
        x: 0,
        transition: { duration: 0.3, delay } 
      },
      exit: { opacity: 0, x: 20, transition: { duration: 0.2 } }
    },
    zoom: {
      hidden: { opacity: 0, scale: 0.9 },
      visible: { 
        opacity: 1, 
        scale: 1,
        transition: { duration: 0.3, delay } 
      },
      exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } }
    }
  };

  return (
    <motion.div
      className={className}
      variants={animations[animation]}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {children}
    </motion.div>
  );
};

interface AnimatedButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  animation?: 'scale' | 'bounce' | 'pulse';
  type?: 'button' | 'submit' | 'reset';
  form?: string;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({ 
  children, 
  className = '', 
  onClick,
  disabled = false,
  animation = 'scale',
  type = 'button',
  form
}) => {
  // Animations spécifiques aux boutons
  const animations = {
    scale: {
      whileHover: { scale: 1.05 },
      whileTap: { scale: 0.95 },
    },
    bounce: {
      whileHover: { y: -5 },
      whileTap: { y: 2 },
    },
    pulse: {
      whileHover: { 
        scale: [1, 1.05, 1],
      },
      whileTap: { scale: 0.95 },
    }
  };

  const { whileHover, whileTap } = animations[animation];

  return (
    <motion.button
      className={className}
      onClick={onClick}
      disabled={disabled}
      whileHover={whileHover}
      whileTap={whileTap}
      transition={{ type: 'spring', stiffness: 500, damping: 15 }}
      type={type}
      form={form}
    >
      {children}
    </motion.button>
  );
};

interface AnimatedLinkProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  isActive?: boolean;
  href?: string;
}

export const AnimatedLink: React.FC<AnimatedLinkProps> = ({ 
  children, 
  className = '', 
  onClick,
  isActive = false,
  href
}) => {
  return (
    <motion.a
      className={className}
      onClick={onClick}
      href={href}
      whileHover={{ scale: 1.05, color: "#3b82f6" }}
      whileTap={{ scale: 0.95 }}
    >
      {children}
      {isActive && (
        <motion.div
          className="h-0.5 bg-blue-500 mt-1"
          layoutId="activeNavIndicator"
          initial={{ opacity: 0, width: '0%' }}
          animate={{ opacity: 1, width: '100%' }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.a>
  );
};

interface PageTransitionProps {
  children: React.ReactNode;
}

export const PageTransition: React.FC<PageTransitionProps> = ({ children }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  );
};

export default {
  AnimatedBadge,
  PulseEffect,
  NewMessageIndicator,
  AnimatedContainer,
  AnimatedButton,
  AnimatedLink,
  PageTransition
};
