'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DURATIONS, tooltipAnimation } from '@/utils/animations';
import { useGameStore } from '@/store/gameStore';

interface TooltipProps {
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  delay?: number;
  className?: string;
  contentClassName?: string;
  maxWidth?: string;
  children: React.ReactNode;
}

export default function Tooltip({
  content,
  position = 'top',
  delay = 300,
  className = '',
  contentClassName = '',
  maxWidth = '250px',
  children
}: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  
  const reducedMotion = false; // Simplifié

  // Pas de rendu côté serveur
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleMouseEnter = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
      updatePosition();
    }, delay);
  };

  const handleMouseLeave = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setIsVisible(false);
    }, 100);
  };

  const handleFocus = () => {
    setIsVisible(true);
    updatePosition();
  };

  const handleBlur = () => {
    setIsVisible(false);
  };

  const updatePosition = () => {
    if (!triggerRef.current || !tooltipRef.current) return;

    const triggerRect = triggerRef.current.getBoundingClientRect();
    const tooltipRect = tooltipRef.current.getBoundingClientRect();
    
    // Position par défaut (top)
    let x = triggerRect.left + triggerRect.width / 2;
    let y = triggerRect.top - 10;
    
    // Ajustement selon la position
    switch (position) {
      case 'bottom':
        y = triggerRect.bottom + 10;
        break;
      case 'left':
        x = triggerRect.left - 10;
        y = triggerRect.top + triggerRect.height / 2;
        break;
      case 'right':
        x = triggerRect.right + 10;
        y = triggerRect.top + triggerRect.height / 2;
        break;
      default: // 'top'
        break;
    }
    
    setCoords({ x, y });
  };

  // Mettre à jour la position lorsque la fenêtre est redimensionnée
  useEffect(() => {
    if (isVisible) {
      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);
    
      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
    return () => {}; // Return une fonction vide si pas visible
  }, [isVisible]);

  if (!mounted) return <>{children}</>;

  // Ajuster la flèche et le positionnement du tooltip selon la position
  const getTooltipStyle = () => {
    const style: React.CSSProperties = {
      maxWidth,
      transform: 'translate(-50%, -100%)', // Valeur par défaut pour 'top'
    };

    switch (position) {
      case 'bottom':
        style.transform = 'translate(-50%, 10px)';
        break;
      case 'left':
        style.transform = 'translate(-100%, -50%)';
        break;
      case 'right':
        style.transform = 'translate(10px, -50%)';
        break;
      default: // 'top'
        break;
    }

    return style;
  };

  // Classes pour la flèche du tooltip
  const getArrowClass = () => {
    switch (position) {
      case 'bottom':
        return 'top-0 left-1/2 -translate-x-1/2 -translate-y-full border-l-transparent border-r-transparent border-t-0 border-b-gray-800';
      case 'left':
        return 'top-1/2 right-0 -translate-y-1/2 translate-x-full border-t-transparent border-b-transparent border-l-gray-800 border-r-0';
      case 'right':
        return 'top-1/2 left-0 -translate-y-1/2 -translate-x-full border-t-transparent border-b-transparent border-r-gray-800 border-l-0';
      default: // 'top'
        return 'bottom-0 left-1/2 -translate-x-1/2 translate-y-full border-l-transparent border-r-transparent border-b-0 border-t-gray-800';
    }
  };

  return (
    <div 
      ref={triggerRef}
      className={`inline-block relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onTouchStart={handleMouseEnter}
      onTouchEnd={handleMouseLeave}
    >
      {children}
      
      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            className="fixed z-50 pointer-events-none"
            style={{ left: coords.x, top: coords.y }}
            variants={tooltipAnimation}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ 
              duration: reducedMotion ? DURATIONS.fast : DURATIONS.normal
            }}
          >
            <div 
              className={`bg-gray-800 text-white rounded-md shadow-lg px-3 py-2 text-sm ${contentClassName}`}
              style={getTooltipStyle()}
            >
              {content}
              <div className={`absolute border-4 h-0 w-0 ${getArrowClass()}`}></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
