'use client';

import { useEffect, useState, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';

/**
 * Utilitaire d'optimisation des animations
 * 
 * Ce fichier contient des fonctions utilitaires pour optimiser
 * les performances des animations en fonction des capacités de l'appareil.
 */

// Seuils de performance
const PERFORMANCE_THRESHOLDS = {
  HIGH: 50, // FPS minimum pour animations complètes
  MEDIUM: 30, // FPS minimum pour animations modérées
  LOW: 15 // En dessous: animations minimales ou désactivées
};

// Types d'optimisations
export enum OptimizationLevel {
  NONE = 'none',       // Aucune optimisation
  LIGHT = 'light',     // Optimisations légères
  MODERATE = 'moderate', // Optimisations modérées
  HEAVY = 'heavy'      // Optimisations importantes
}

// Type pour les états de performance
export interface PerformanceState {
  fps: number;
  optimizationLevel: OptimizationLevel;
  isLowPowerDevice: boolean;
  prefersReducedMotion: boolean;
}

// Détection de l'option prefers-reduced-motion
const detectReducedMotion = (): boolean => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
};

// Détection des appareils à faible puissance (estimation)
const detectLowPowerDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  // Estimation basée sur facteurs multiples
  const isLowPower = 
    // Mobile
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) &&
    // Viewport petit (mobile)
    (window.innerWidth < 768) &&
    // Navigateur plus ancien (heuristique approximative)
    !('performance' in window && 'memory' in performance);
    
  return isLowPower;
};

// Mesure des FPS
const measureFPS = (): Promise<number> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(60); // Valeur par défaut
      return;
    }
    
    let frameCount = 0;
    let lastTime = performance.now();
    let rafId: number;
    
    const countFrame = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime - lastTime >= 1000) {
        const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
        cancelAnimationFrame(rafId);
        resolve(fps);
      } else {
        rafId = requestAnimationFrame(countFrame);
      }
    };
    
    rafId = requestAnimationFrame(countFrame);
    
    // Timeout de sécurité pour s'assurer qu'on résout la promesse
    setTimeout(() => {
      cancelAnimationFrame(rafId);
      if (frameCount === 0) {
        resolve(30); // Valeur par défaut si aucun frame
      } else {
        const elapsedTime = performance.now() - lastTime;
        const fps = Math.round(frameCount * 1000 / elapsedTime);
        resolve(fps);
      }
    }, 1200);
  });
};

// Déterminer le niveau d'optimisation
const determineOptimizationLevel = (
  fps: number, 
  isLowPowerDevice: boolean,
  prefersReducedMotion: boolean
): OptimizationLevel => {
  
  // Si l'utilisateur préfère les mouvements réduits, on applique des optimisations importantes
  if (prefersReducedMotion) {
    return OptimizationLevel.HEAVY;
  }
  
  // Si c'est un appareil à faible puissance, on commence déjà avec des optimisations modérées
  if (isLowPowerDevice) {
    if (fps < PERFORMANCE_THRESHOLDS.MEDIUM) {
      return OptimizationLevel.HEAVY;
    }
    return OptimizationLevel.MODERATE;
  }
  
  // Appareil standard
  if (fps < PERFORMANCE_THRESHOLDS.LOW) {
    return OptimizationLevel.HEAVY;
  } else if (fps < PERFORMANCE_THRESHOLDS.MEDIUM) {
    return OptimizationLevel.MODERATE;
  } else if (fps < PERFORMANCE_THRESHOLDS.HIGH) {
    return OptimizationLevel.LIGHT;
  }
  
  return OptimizationLevel.NONE;
};

// Hook personnalisé pour la gestion des optimisations d'animation
export const useAnimationOptimization = () => {
  const [performanceState, setPerformanceState] = useState<PerformanceState>({
    fps: 60,
    optimizationLevel: OptimizationLevel.NONE,
    isLowPowerDevice: false,
    prefersReducedMotion: false
  });
  
  const { setAnimationSettings } = useGameStore(state => ({
    setAnimationSettings: state.setAnimationSettings
  }));
  
  // Fonction pour analyser les performances et définir le niveau d'optimisation
  const analyzePerformance = useCallback(async () => {
    // Détecter les préférences et capacités
    const prefersReducedMotion = detectReducedMotion();
    const isLowPowerDevice = detectLowPowerDevice();
    
    // Mesurer les FPS
    const fps = await measureFPS();
    
    // Déterminer le niveau d'optimisation
    const optimizationLevel = determineOptimizationLevel(
      fps,
      isLowPowerDevice,
      prefersReducedMotion
    );
    
    // Mettre à jour l'état
    setPerformanceState({
      fps,
      optimizationLevel,
      isLowPowerDevice,
      prefersReducedMotion
    });
    
    // Appliquer les paramètres d'animation en fonction du niveau d'optimisation
    applyOptimizationSettings(optimizationLevel, setAnimationSettings);
    
    // Enregistrer les paramètres pour le debug
    console.log('Animation Performance Analysis:', {
      fps,
      optimizationLevel,
      isLowPowerDevice,
      prefersReducedMotion
    });
    
    return { fps, optimizationLevel, isLowPowerDevice, prefersReducedMotion };
  }, [setAnimationSettings]);
  
  // Appliquer les optimisations au démarrage
  useEffect(() => {
    analyzePerformance();
    
    // Recalculer les optimisations lors des changements de taille d'écran
    const handleResize = () => {
      // Throttle pour éviter des appels trop fréquents
      if (window.innerWidth !== prevWidth || window.innerHeight !== prevHeight) {
        prevWidth = window.innerWidth;
        prevHeight = window.innerHeight;
        analyzePerformance();
      }
    };
    
    // Surveiller le changement de préférence de réduction de mouvement
    const motionMediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleReducedMotionChange = () => {
      analyzePerformance();
    };
    
    let prevWidth = window.innerWidth;
    let prevHeight = window.innerHeight;
    
    window.addEventListener('resize', handleResize);
    motionMediaQuery.addEventListener('change', handleReducedMotionChange);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      motionMediaQuery.removeEventListener('change', handleReducedMotionChange);
    };
  }, [analyzePerformance]);
  
  return {
    ...performanceState,
    analyzePerformance
  };
};

// Fonction pour appliquer les paramètres d'optimisation aux animations
const applyOptimizationSettings = (
  level: OptimizationLevel,
  setAnimationSettings: (settings: any) => void
) => {
  switch (level) {
    case OptimizationLevel.HEAVY:
      // Optimisations importantes - presque pas d'animations
      setAnimationSettings({
        globalEnabled: true,
        reducedMotion: true,
        duration: {
          fast: 0.1,
          normal: 0.2,
          slow: 0.3
        }
      });
      break;
      
    case OptimizationLevel.MODERATE:
      // Optimisations modérées - animations simplifiées et plus rapides
      setAnimationSettings({
        globalEnabled: true,
        reducedMotion: false,
        duration: {
          fast: 0.15,
          normal: 0.25,
          slow: 0.4
        }
      });
      break;
      
    case OptimizationLevel.LIGHT:
      // Optimisations légères - animations légèrement réduites
      setAnimationSettings({
        globalEnabled: true,
        reducedMotion: false,
        duration: {
          fast: 0.2,
          normal: 0.3,
          slow: 0.5
        }
      });
      break;
      
    case OptimizationLevel.NONE:
    default:
      // Aucune optimisation - animations complètes
      setAnimationSettings({
        globalEnabled: true,
        reducedMotion: false,
        duration: {
          fast: 0.2,
          normal: 0.3,
          slow: 0.5
        }
      });
      break;
  }
};

// Optimisations spécifiques pour les composants

// Fonction pour obtenir des variantes d'animations optimisées
export const getOptimizedAnimationVariants = (
  component: string,
  optimizationLevel: OptimizationLevel
) => {
  // Configuration par défaut
  const defaultConfig = {
    useSimplifiedAnimation: false,
    useCSS: false,
    skipAnimation: false,
    reduceDuration: 1, // multiplicateur (1 = pas de réduction)
    limitConcurrentAnimations: false
  };
  
  // Configurations spécifiques par composant et niveau d'optimisation
  const optimizationConfigs: Record<string, Record<OptimizationLevel, any>> = {
    panorama: {
      [OptimizationLevel.NONE]: { ...defaultConfig },
      [OptimizationLevel.LIGHT]: {
        ...defaultConfig,
        reduceDuration: 0.8,
      },
      [OptimizationLevel.MODERATE]: {
        ...defaultConfig,
        useSimplifiedAnimation: true,
        reduceDuration: 0.6,
      },
      [OptimizationLevel.HEAVY]: {
        ...defaultConfig,
        useSimplifiedAnimation: true,
        reduceDuration: 0.4,
        limitConcurrentAnimations: true
      }
    },
    chat: {
      [OptimizationLevel.NONE]: { ...defaultConfig },
      [OptimizationLevel.LIGHT]: {
        ...defaultConfig,
        reduceDuration: 0.8,
      },
      [OptimizationLevel.MODERATE]: {
        ...defaultConfig,
        useCSS: true,
        reduceDuration: 0.6,
        limitConcurrentAnimations: true
      },
      [OptimizationLevel.HEAVY]: {
        ...defaultConfig,
        useSimplifiedAnimation: true,
        useCSS: true,
        reduceDuration: 0.4,
        limitConcurrentAnimations: true
      }
    },
    // Ajouter d'autres composants au besoin
  };
  
  // Retourner la configuration spécifique ou la configuration par défaut
  return optimizationConfigs[component]?.[optimizationLevel] || { ...defaultConfig };
};

// Fonction pour optimiser les paramètres d'animation basés sur la performance
export const optimizeAnimationParams = (
  params: any,
  component: string,
  performanceState: PerformanceState
) => {
  const { optimizationLevel } = performanceState;
  const optimizedConfig = getOptimizedAnimationVariants(component, optimizationLevel);
  
  // Si on doit sauter l'animation, retourner null
  if (optimizedConfig.skipAnimation) {
    return null;
  }
  
  // Adapter les durées d'animation
  if (params.transition && optimizedConfig.reduceDuration !== 1) {
    return {
      ...params,
      transition: {
        ...params.transition,
        duration: params.transition.duration * optimizedConfig.reduceDuration
      }
    };
  }
  
  return params;
};

export default useAnimationOptimization;
