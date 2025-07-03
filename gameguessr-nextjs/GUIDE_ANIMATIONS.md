# Guide des Animations et Transitions - GameGuessr

Ce guide explique comment utiliser le système d'animations et transitions dans le projet GameGuessr.

## Table des matières

1. [Système d'animation](#système-danimation)
2. [Composants animés](#composants-animés)
3. [Animations de base](#animations-de-base)
4. [Animations de feedback](#animations-de-feedback)
5. [Transitions d'état](#transitions-détat)
6. [Loaders et placeholders](#loaders-et-placeholders)
7. [Bonnes pratiques](#bonnes-pratiques)

## Système d'animation

Le système central d'animations est défini dans `src/utils/animations.tsx`. Il contient des animations prédéfinies, des durées et des courbes d'accélération standardisées.

### Durées standardisées

```typescript
export const DURATIONS = {
  fast: 0.2,   // Animations rapides (hover, click)
  normal: 0.3, // Animations standard
  slow: 0.5,   // Animations plus lentes
  verySlow: 0.8, // Transitions importantes
};
```

### Courbes d'accélération

```typescript
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
```

## Composants animés

### PanoramaViewer

Le `PanoramaViewer` offre des transitions fluides entre les images 360°.

```tsx
import PanoramaViewer from '@/components/game/PanoramaViewer';

// Utilisation de base
<PanoramaViewer imageUrl="/images/panorama1.jpg" />

// Avec transition contrôlée
<PanoramaViewer 
  imageUrl={currentImageUrl} 
  isChanging={isChangingImage}
  transitionDuration={0.8} 
/>
```

### GameStateTransition

Utilisez `GameStateTransition` pour animer les changements d'état du jeu.

```tsx
import GameStateTransition from '@/components/game/GameStateTransition';

// Utilisation
<GameStateTransition state={gameState}>
  {/* Contenu du jeu */}
  <GameContent />
</GameStateTransition>
```

Les états possibles sont : 'waiting', 'starting', 'playing', 'paused', 'round_end', 'game_end'.

### AnimatedFeedbackButton

Boutons avec animations de feedback.

```tsx
import { AnimatedFeedbackButton } from '@/components/ui/AnimatedFeedback';

// Bouton avec animation de succès
<AnimatedFeedbackButton
  variant="primary"
  feedbackType="success"
  onClick={handleClick}
>
  Soumettre
</AnimatedFeedbackButton>

// Bouton avec état de chargement
<AnimatedFeedbackButton
  variant="secondary"
  isLoading={isLoading}
>
  Charger les données
</AnimatedFeedbackButton>
```

## Animations de base

### Fade Animation

```tsx
import { motion } from 'framer-motion';
import { fadeAnimation } from '@/utils/animations';

<motion.div
  variants={fadeAnimation}
  initial="hidden"
  animate="visible"
  exit="exit"
>
  Contenu qui apparaît/disparaît en fondu
</motion.div>
```

### Slide Animation

```tsx
import { motion } from 'framer-motion';
import { slideUpAnimation, slideInRightAnimation, slideInLeftAnimation } from '@/utils/animations';

// Slide depuis le bas
<motion.div
  variants={slideUpAnimation}
  initial="hidden"
  animate="visible"
  exit="exit"
>
  Contenu qui monte depuis le bas
</motion.div>

// Slide depuis la droite ou la gauche
<motion.div variants={slideInRightAnimation} initial="hidden" animate="visible" exit="exit">
  Contenu qui arrive depuis la droite
</motion.div>
```

## Animations de feedback

### Success/Error Animations

```tsx
import { motion } from 'framer-motion';
import { successAnimation, errorAnimation } from '@/utils/animations';

// Animation de succès
<motion.div
  variants={successAnimation}
  initial="initial"
  animate="animate"
>
  Opération réussie !
</motion.div>

// Animation d'erreur
<motion.div
  variants={errorAnimation}
  initial="initial"
  animate="animate"
>
  Une erreur est survenue
</motion.div>
```

### AnimatedFormFeedback

```tsx
import { AnimatedFormFeedback } from '@/components/ui/AnimatedFeedback';

<AnimatedFormFeedback
  status={formStatus} // 'idle', 'loading', 'success', 'error'
  successMessage="Formulaire envoyé avec succès !"
  errorMessage="Erreur lors de l'envoi du formulaire"
>
  {/* Votre formulaire ici */}
  <form>...</form>
</AnimatedFormFeedback>
```

## Transitions d'état

```tsx
import { motion, AnimatePresence } from 'framer-motion';
import { gameStateAnimation } from '@/utils/animations';

<AnimatePresence mode="wait">
  <motion.div
    key={currentState}
    variants={gameStateAnimation}
    initial="initial"
    animate="animate"
    exit="exit"
  >
    {/* Contenu dépendant de l'état */}
  </motion.div>
</AnimatePresence>
```

## Loaders et placeholders

```tsx
import SkeletonLoader, { TextSkeleton, CardSkeleton } from '@/components/ui/SkeletonLoader';

// Loader simple
<SkeletonLoader variant="rectangle" height={200} />

// Texte en chargement
<TextSkeleton lines={3} width="random" />

// Carte complète en chargement
<CardSkeleton />
```

## Bonnes pratiques

1. **Cohérence** : Utilisez les animations prédéfinies du système pour maintenir une cohérence visuelle.

2. **Subtilité** : Les animations doivent être subtiles et ne pas distraire l'utilisateur.

3. **Performance** : 
   - Animez uniquement les propriétés `opacity` et `transform` autant que possible
   - Utilisez `will-change` avec parcimonie
   - Évitez d'animer de nombreux éléments simultanément

4. **Accessibilité** : Respectez les préférences de réduction de mouvement :
   ```tsx
   <MotionConfig reducedMotion="user">
     {/* Composants animés */}
   </MotionConfig>
   ```

5. **Timing** : 
   - Animations rapides (< 300ms) pour les réactions immédiates
   - Animations plus lentes (300-800ms) pour les transitions importantes

6. **Tests** : Vérifiez que les animations fonctionnent correctement sur différents appareils et navigateurs.

7. **Loading States** : Toujours fournir un feedback visuel pour les opérations longues.
