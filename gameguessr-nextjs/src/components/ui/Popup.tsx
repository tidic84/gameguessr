'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DURATIONS, popupAnimation } from '@/utils/animations';
import { useGameStore, useGameActions } from '@/store/gameStore';

interface PopupProps {
  isOpen: boolean;
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'center';
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
}

export default function Popup({
  isOpen,
  onClose,
  position = 'bottom-right',
  children,
  className = '',
  showCloseButton = true,
  autoClose = false,
  autoCloseDelay = 5000
}: PopupProps) {
  const [mounted, setMounted] = useState(false);
  const reducedMotion = false; // Simplifié
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, autoCloseDelay);
      
      return () => clearTimeout(timer);
    }
    return () => {};
  }, [isOpen, autoClose, autoCloseDelay, onClose]);

  if (!mounted) return null;

  // Définit les classes de positionnement
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className={`fixed z-40 max-w-sm ${positionClasses[position]} ${className}`}
          variants={popupAnimation}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ 
            duration: reducedMotion ? DURATIONS.fast : DURATIONS.normal
          }}
        >
          <div className="bg-gray-800 border border-gray-700 rounded-lg shadow-lg overflow-hidden">
            <div className="relative p-4">
              {showCloseButton && (
                <button 
                  onClick={onClose}
                  className="absolute top-2 right-2 text-gray-400 hover:text-white p-1 rounded-full hover:bg-gray-700 transition-colors"
                  aria-label="Fermer"
                >
                  <X size={16} />
                </button>
              )}
              <div className={showCloseButton ? 'pr-6' : ''}>
                {children}
              </div>
            </div>
            
            {autoClose && (
              <motion.div
                className="h-1 bg-blue-500"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ 
                  duration: autoCloseDelay / 1000,
                  ease: 'linear'
                }}
              />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
