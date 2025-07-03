'use client';

import { ReactNode, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAnimation } from '@/store/gameStore';

interface PageTransitionProps {
  children: ReactNode;
  pageKey: string; // Clé unique pour identifier la page (utiliser pathname)
}

export default function PageTransition({ children, pageKey }: PageTransitionProps) {
  const { trigger, reset } = useAnimation('pageTransition');
  
  // Déclencher l'animation au chargement de la page
  useEffect(() => {
    trigger();
    return () => reset();
  }, [pageKey, trigger, reset]);
  
  return (
    <motion.div
      key={pageKey}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ 
        duration: 0.3,
        ease: [0.25, 1, 0.5, 1]
      }}
    >
      {children}
    </motion.div>
  );
}
