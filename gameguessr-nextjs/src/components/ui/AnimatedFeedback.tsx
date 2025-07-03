'use client';

import { useState } from 'react';
import { motion, MotionConfig, MotionProps, AnimatePresence, PanInfo } from 'framer-motion';
import { successAnimation, errorAnimation, pulseAnimation } from '@/utils/animations';

// Composant pour un bouton avec animation de feedback
interface AnimatedFeedbackButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info';
  size?: 'sm' | 'md' | 'lg';
  feedbackType?: 'success' | 'error' | 'none';
  isLoading?: boolean;
  isAnimated?: boolean;
  pulseAnimation?: boolean;
  children?: React.ReactNode;
}

export function AnimatedFeedbackButton({
  variant = 'primary',
  size = 'md',
  feedbackType = 'none',
  isLoading = false,
  isAnimated = true,
  pulseAnimation: shouldPulse = false,
  className = '',
  children,
  ...props
}: AnimatedFeedbackButtonProps) {
  const [hasFeedback, setHasFeedback] = useState(false);
  
  const baseClasses = 'rounded-md font-medium focus:outline-none transition-colors relative';
  
  const variantClasses = {
    primary: 'bg-blue-500 hover:bg-blue-600 text-white',
    secondary: 'bg-gray-500 hover:bg-gray-600 text-white',
    success: 'bg-green-500 hover:bg-green-600 text-white',
    danger: 'bg-red-500 hover:bg-red-600 text-white',
    warning: 'bg-yellow-500 hover:bg-yellow-600 text-white',
    info: 'bg-indigo-500 hover:bg-indigo-600 text-white',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  // Détermine l'animation à utiliser en fonction du type de feedback
  const animationVariant = () => {
    if (!isAnimated) return {};
    
    if (hasFeedback) {
      if (feedbackType === 'success') return successAnimation;
      if (feedbackType === 'error') return errorAnimation;
    }
    
    if (shouldPulse) return pulseAnimation;
    
    return {};
  };
  
  // Fonction pour déclencher l'animation et la réinitialiser après
  const triggerFeedback = () => {
    if (feedbackType !== 'none' && isAnimated) {
      setHasFeedback(true);
      setTimeout(() => setHasFeedback(false), 600);
    }
  };
  
  return (
    <motion.button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className} ${props.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      variants={animationVariant()}
      initial="initial"
      animate={hasFeedback || shouldPulse ? 'animate' : 'initial'}
      onClick={(e) => {
        triggerFeedback();
        props.onClick?.(e);
      }}
      whileTap={{ scale: isAnimated ? 0.97 : 1 }}
      whileHover={{ scale: isAnimated ? 1.02 : 1 }}
      disabled={isLoading || props.disabled}
      {...props as any}
    >
      <span className="flex items-center justify-center gap-2">
        {isLoading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </span>
    </motion.button>
  );
}

// Composant pour un élément avec animation de feedback pour les interactions drag & drop
interface AnimatedDragDropProps extends MotionProps {
  children: React.ReactNode;
  onDragSuccess?: () => void;
  onDragError?: () => void;
  dragConstraints?: any;
  className?: string;
}

export function AnimatedDragDrop({
  children,
  onDragSuccess,
  onDragError,
  dragConstraints,
  className = '',
  ...props
}: AnimatedDragDropProps) {
  const [feedback, setFeedback] = useState<'none' | 'success' | 'error'>('none');
  
  const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    // Exemple simple : considérer que le drag est réussi si la distance est > 100px
    const distance = Math.sqrt(Math.pow(info.offset.x, 2) + Math.pow(info.offset.y, 2));
    
    if (distance > 100) {
      setFeedback('success');
      onDragSuccess?.();
    } else {
      setFeedback('error');
      onDragError?.();
    }
    
    // Réinitialiser l'état après l'animation
    setTimeout(() => setFeedback('none'), 500);
  };
  
  return (
    <motion.div
      className={`cursor-grab active:cursor-grabbing ${className}`}
      drag
      dragConstraints={dragConstraints || { left: 0, right: 0, top: 0, bottom: 0 }}
      dragElastic={0.2}
      dragTransition={{ bounceStiffness: 300, bounceDamping: 20 }}
      onDragEnd={handleDragEnd}
      variants={{
        ...(feedback === 'success' ? successAnimation : {}),
        ...(feedback === 'error' ? errorAnimation : {})
      }}
      animate={feedback !== 'none' ? 'animate' : 'initial'}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Composant pour animer la validation/erreur d'un formulaire
interface AnimatedFormFeedbackProps {
  children: React.ReactNode;
  status?: 'idle' | 'loading' | 'success' | 'error';
  errorMessage?: string;
  successMessage?: string;
  className?: string;
}

export function AnimatedFormFeedback({
  children,
  status = 'idle',
  errorMessage = 'Une erreur est survenue',
  successMessage = 'Opération réussie',
  className = ''
}: AnimatedFormFeedbackProps) {
  return (
    <MotionConfig reducedMotion="user">
      <div className={`relative ${className}`}>
        <motion.div
          animate={status === 'loading' ? { opacity: 0.7 } : { opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {children}
        </motion.div>
        
        {status === 'loading' && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/30 backdrop-blur-sm">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        
        <AnimatePresence>
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-green-100 border border-green-500 text-green-700 px-4 py-2 rounded-md mt-2"
              variants={successAnimation}
            >
              {successMessage}
            </motion.div>
          )}
          
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-red-100 border border-red-500 text-red-700 px-4 py-2 rounded-md mt-2"
              variants={errorAnimation}
            >
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
