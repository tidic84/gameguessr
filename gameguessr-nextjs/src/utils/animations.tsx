'use client';

import { HTMLMotionProps, Variant, Variants, Easing } from 'framer-motion';

/**
 * Système d'animation global pour GameGuessr
 * 
 * Ce fichier contient toutes les animations réutilisables et configurations
 * pour maintenir une cohérence visuelle dans l'application.
 */

// Durées standards (en secondes)
export const DURATIONS = {
  fast: 0.2,
  normal: 0.3,
  slow: 0.5,
  verySlow: 0.8,
};

// Easings standards
export const EASINGS: Record<string, [number, number, number, number]> = {
  // Standard
  smooth: [0.4, 0.0, 0.2, 1], // Material Design standard
  decelerate: [0.0, 0.0, 0.2, 1], // Décélération
  accelerate: [0.4, 0.0, 1, 1], // Accélération
  sharp: [0.4, 0.0, 0.6, 1], // Sharp
  
  // Bounces
  bounce: [0.2, 0.9, 0.1, 1.1],
  elastic: [0.68, -0.55, 0.27, 1.55],
  
  // Spécifiques
  panoramaTransition: [0.25, 1, 0.5, 1],
  gameStateChange: [0.3, 0, 0.3, 1],
};

// Animation de base pour les éléments qui apparaissent/disparaissent
export const fadeAnimation: Variants = {
  hidden: { 
    opacity: 0,
    transition: { 
      duration: DURATIONS.normal,
      ease: "easeOut"
    }
  },
  visible: { 
    opacity: 1,
    transition: { 
      duration: DURATIONS.normal,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    transition: { 
      duration: DURATIONS.fast,
      ease: "easeOut"
    }
  }
};

// Animation pour les éléments qui slidant depuis le bas
export const slideUpAnimation: Variants = {
  hidden: { 
    opacity: 0,
    y: 20,
    transition: { 
      duration: DURATIONS.normal,
      ease: "easeOut"
    }
  },
  visible: { 
    opacity: 1,
    y: 0,
    transition: { 
      duration: DURATIONS.normal,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    y: 20,
    transition: { 
      duration: DURATIONS.fast,
      ease: "easeOut"
    }
  }
};

// Animation pour les éléments qui slidant depuis la droite
export const slideInRightAnimation: Variants = {
  hidden: { 
    opacity: 0,
    x: 50,
    transition: { 
      duration: DURATIONS.normal,
      ease: "easeOut"
    }
  },
  visible: { 
    opacity: 1,
    x: 0,
    transition: { 
      duration: DURATIONS.normal,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    x: 50,
    transition: { 
      duration: DURATIONS.fast,
      ease: "easeOut"
    }
  }
};

// Animation pour les éléments qui slidant depuis la gauche
export const slideInLeftAnimation: Variants = {
  hidden: { 
    opacity: 0,
    x: -50,
    transition: { 
      duration: DURATIONS.normal,
      ease: "easeOut"
    }
  },
  visible: { 
    opacity: 1,
    x: 0,
    transition: { 
      duration: DURATIONS.normal,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    x: -50,
    transition: { 
      duration: DURATIONS.fast,
      ease: "easeOut"
    }
  }
};

// Animation pour les panoramas (crossfade avec zoom)
export const panoramaTransition: Variants = {
  initial: {
    opacity: 0,
    scale: 1.05,
    transition: { 
      duration: DURATIONS.slow,
      ease: "easeOut"
    }
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { 
      duration: DURATIONS.slow,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { 
      duration: DURATIONS.slow,
      ease: "easeOut"
    }
  }
};

// Animation pour les transitions d'état de jeu
export const gameStateAnimation: Variants = {
  initial: {
    opacity: 0,
    scale: 0.9,
    transition: { 
      duration: DURATIONS.normal,
      ease: "easeOut"
    }
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: { 
      duration: DURATIONS.normal,
      ease: "easeOut"
    }
  },
  exit: {
    opacity: 0,
    scale: 1.1,
    transition: { 
      duration: DURATIONS.normal,
      ease: "easeOut"
    }
  }
};

// Animation pour les succès (feedback positif)
export const successAnimation: Variants = {
  initial: { scale: 1 },
  animate: { 
    scale: [1, 1.05, 1],
    transition: {
      duration: 0.5,
      ease: "easeInOut"
    }
  }
};

// Animation pour les erreurs (feedback négatif)
export const errorAnimation: Variants = {
  initial: { x: 0 },
  animate: { 
    x: [0, -5, 5, -5, 5, 0],
    transition: {
      duration: 0.4,
      ease: "easeInOut"
    }
  }
};

// Animation de chargement (skeleton/shimmer effect)
export const loadingShimmerAnimation: Variants = {
  initial: { 
    backgroundPosition: '-200px 0',
  },
  animate: { 
    backgroundPosition: '200px 0',
    transition: {
      repeat: Infinity,
      duration: 1.5,
      ease: "linear"
    }
  }
};

// Animation de pulsation (pour les éléments qui nécessitent l'attention)
export const pulseAnimation: Variants = {
  initial: { scale: 1, opacity: 0.9 },
  animate: { 
    scale: [1, 1.05, 1],
    opacity: [0.9, 1, 0.9],
    transition: {
      repeat: Infinity,
      duration: 2,
      ease: "easeInOut"
    }
  }
};

// Animation pour les modals
export const modalAnimation: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.9,
    y: 10,
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    y: 10,
  }
};

// Animation pour les overlays de modal
export const overlayAnimation: Variants = {
  hidden: { 
    opacity: 0,
  },
  visible: { 
    opacity: 1,
  },
  exit: { 
    opacity: 0,
  }
};

// Animation pour les tooltips
export const tooltipAnimation: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.8,
    y: 5,
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: { 
    opacity: 0,
    scale: 0.8,
    y: 5,
  }
};

// Animation pour les popups (différent des modals, plus léger)
export const popupAnimation: Variants = {
  hidden: { 
    opacity: 0,
    scale: 0.95,
    y: -5,
  },
  visible: { 
    opacity: 1,
    scale: 1,
    y: 0,
  },
  exit: { 
    opacity: 0,
    scale: 0.95,
    y: -5,
  }
};

// Animation de liste pour les éléments qui apparaissent un par un
export const staggerChildren = {
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: 0.1,
    },
  },
  hidden: {
    opacity: 0,
    transition: {
      when: "afterChildren",
    },
  },
};

// Fonction pour créer une animation de liste personnalisée
export const createStaggerAnimation = (staggerTime: number = 0.1): Variants => ({
  visible: {
    opacity: 1,
    transition: {
      when: "beforeChildren",
      staggerChildren: staggerTime,
    },
  },
  hidden: {
    opacity: 0,
    transition: {
      when: "afterChildren",
    },
  },
});

// Interface pour les props d'animation
export interface AnimationProps extends HTMLMotionProps<"div"> {
  delay?: number;
  duration?: number;
  ease?: any;
  variant?: Variant;
  customVariants?: Variants;
}
