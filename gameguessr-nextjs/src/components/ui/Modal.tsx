'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { DURATIONS, EASINGS, modalAnimation, overlayAnimation } from '@/utils/animations';
import { useGameStore, useGameActions } from '@/store/gameStore';
import Button from '@/components/ui/Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  hideCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEsc?: boolean;
  position?: 'center' | 'top' | 'bottom';
  showFooter?: boolean;
  footerContent?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export default function Modal({
  isOpen,
  onClose,
  title,
  size = 'md',
  hideCloseButton = false,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  position = 'center',
  showFooter = false,
  footerContent,
  className = '',
  children
}: ModalProps) {
  const [mounted, setMounted] = useState(false);
  const { triggerAnimation, resetAnimationTrigger } = useGameActions();
  const { animationState } = useGameStore();
  const { reducedMotion } = animationState.animationSettings;
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      triggerAnimation('modal-open');
    }
    
    const handleEsc = (e: KeyboardEvent) => {
      if (closeOnEsc && isOpen && e.key === 'Escape') {
        onClose();
      }
    };
    
    window.addEventListener('keydown', handleEsc);
    return () => {
      window.removeEventListener('keydown', handleEsc);
      resetAnimationTrigger('modal-open');
    };
  }, [isOpen, closeOnEsc, onClose, triggerAnimation, resetAnimationTrigger]);

  // Ne rien rendre côté serveur
  if (!mounted) return null;

  // Détermine la largeur du modal en fonction de la taille
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    full: 'max-w-full w-full h-full m-0 rounded-none'
  };

  // Détermine la position du modal
  const positionClasses = {
    center: 'items-center',
    top: 'items-start pt-16',
    bottom: 'items-end pb-16'
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex justify-center overflow-y-auto ${positionClasses[position]}`}
            onClick={closeOnOverlayClick ? onClose : undefined}
            variants={overlayAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{
              duration: reducedMotion ? DURATIONS.fast : DURATIONS.normal,
              ease: EASINGS.smooth
            }}
          >
            {/* Modal */}
            <motion.div
              className={`bg-gray-900 border border-white/20 shadow-2xl m-4 ${sizeClasses[size]} ${className}`}
              onClick={(e) => e.stopPropagation()}
              variants={modalAnimation}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{
                duration: reducedMotion ? DURATIONS.fast : DURATIONS.normal,
                ease: EASINGS.smooth
              }}
              style={{ 
                borderRadius: size === 'full' ? '0' : '0.75rem',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
                  <h2 className="text-lg font-bold text-white truncate">{title}</h2>
                  {!hideCloseButton && (
                    <button
                      onClick={onClose}
                      className="text-white/60 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                      aria-label="Fermer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className={`p-4 sm:p-6 ${!title ? 'pt-10' : ''}`}>
                {!title && !hideCloseButton && (
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                {children}
              </div>

              {/* Footer */}
              {showFooter && (
                <motion.div 
                  className="p-4 sm:p-6 border-t border-white/10 bg-gray-800/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {footerContent || (
                    <div className="flex justify-end space-x-2">
                      <Button
                        onClick={onClose}
                        variant="secondary"
                        size="sm"
                      >
                        Fermer
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
            {/* Modal */}
            <motion.div
              className={`bg-gray-900 border border-white/20 shadow-2xl m-4 ${sizeClasses[size]} ${className}`}
              onClick={(e) => e.stopPropagation()}
              variants={modalAnimation}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{
                duration: reducedMotion ? DURATIONS.fast : DURATIONS.normal,
                ease: EASINGS.smooth
              }}
              style={{ 
                borderRadius: size === 'full' ? '0' : '0.75rem',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
                  <h2 className="text-lg font-bold text-white truncate">{title}</h2>
                  {!hideCloseButton && (
                    <button
                      onClick={onClose}
                      className="text-white/60 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                      aria-label="Fermer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className={`p-4 sm:p-6 ${!title ? 'pt-10' : ''}`}>
                {!title && !hideCloseButton && (
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                {children}
              </div>

              {/* Footer */}
              {showFooter && (
                <motion.div 
                  className="p-4 sm:p-6 border-t border-white/10 bg-gray-800/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {footerContent || (
                    <div className="flex justify-end space-x-2">
                      <Button
                        onClick={onClose}
                        variant="secondary"
                        size="sm"
                      >
                        Fermer
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
          >
            {/* Modal */}
            <motion.div
              className={`bg-gray-900 border border-white/20 shadow-2xl m-4 ${sizeClasses[size]} ${className}`}
              onClick={(e) => e.stopPropagation()}
              variants={modalAnimation}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{
                duration: reducedMotion ? DURATIONS.fast : DURATIONS.normal,
                ease: EASINGS.smooth
              }}
              style={{ 
                borderRadius: size === 'full' ? '0' : '0.75rem',
                overflow: 'hidden'
              }}
            >
              {/* Header */}
              {title && (
                <div className="flex items-center justify-between p-4 sm:p-6 border-b border-white/10">
                  <h2 className="text-lg font-bold text-white truncate">{title}</h2>
                  {!hideCloseButton && (
                    <button
                      onClick={onClose}
                      className="text-white/60 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                      aria-label="Fermer"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className={`p-4 sm:p-6 ${!title ? 'pt-10' : ''}`}>
                {!title && !hideCloseButton && (
                  <button
                    onClick={onClose}
                    className="absolute top-3 right-3 text-white/60 hover:text-white transition-colors rounded-full p-1 hover:bg-white/10"
                    aria-label="Fermer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
                {children}
              </div>

              {/* Footer */}
              {showFooter && (
                <motion.div 
                  className="p-4 sm:p-6 border-t border-white/10 bg-gray-800/50"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {footerContent || (
                    <div className="flex justify-end space-x-2">
                      <Button
                        onClick={onClose}
                        variant="secondary"
                        size="sm"
                      >
                        Fermer
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
