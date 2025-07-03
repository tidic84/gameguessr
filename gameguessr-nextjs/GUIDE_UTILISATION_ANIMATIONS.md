# Guide d'utilisation des animations dans GameGuessr

Ce guide explique comment utiliser le système d'animations centralisé de GameGuessr, qui utilise Zustand pour la gestion d'état et permet d'intégrer facilement des animations fluides dans tous les composants de l'application.

## Concepts clés

Le système d'animations de GameGuessr est conçu pour:

1. **Centraliser** la configuration et l'état des animations
2. **Optimiser** les performances grâce à la gestion d'état efficace de Zustand
3. **Standardiser** l'utilisation des animations dans toute l'application
4. **Respecter** les préférences d'accessibilité (mouvement réduit)

## Types d'animations disponibles

Les animations suivantes sont prêtes à l'emploi:

- `fade` - Animation de fondu entrant/sortant
- `slide` - Animation de glissement (plusieurs directions disponibles)
- `zoom` - Animation de zoom in/out
- `bounce` - Animation de rebond pour attirer l'attention
- `pulse` - Animation de pulsation subtile
- `rotate` - Animation de rotation
- `flip` - Animation de retournement (cartes, etc.)
- `shake` - Animation de secousse pour les erreurs/feedback négatif

## Utilisation dans les composants

### 1. Hook simple `useAnimation`

Le hook `useAnimation` est la façon la plus simple d'intégrer des animations:

```tsx
import { useAnimation } from '@/store/gameStore';

const MyComponent = () => {
  const { isTriggered, trigger, reset, settings } = useAnimation('myAnimation');
  
  return (
    <div 
      className={`my-component ${isTriggered ? 'animate-fade-in' : ''}`}
      onClick={() => trigger()}
    >
      Contenu qui s'anime au clic
    </div>
  );
};
```

### 2. Déclenchement d'animations via le store

Vous pouvez déclencher des animations depuis n'importe où dans l'application:

```tsx
import { useGameActions } from '@/store/gameStore';

const MyComponent = () => {
  const { triggerAnimation } = useGameActions();
  
  const handleClick = () => {
    // Logique métier...
    
    // Déclencher une animation ailleurs dans l'application
    triggerAnimation('scoreUpdateAnimation');
  };
  
  return (
    <button onClick={handleClick}>
      Mettre à jour le score
    </button>
  );
};
```

### 3. Animation basée sur les événements de jeu

```tsx
import { useGameStore } from '@/store/gameStore';
import { useEffect } from 'react';

const GameEventComponent = () => {
  const gameEvents = useGameStore(state => state.gameEvents);
  const { triggerAnimation } = useGameActions();
  
  useEffect(() => {
    // Quand un nouvel événement est ajouté
    if (gameEvents.length > 0) {
      const latestEvent = gameEvents[gameEvents.length - 1];
      
      if (latestEvent.type === 'round_end') {
        triggerAnimation('roundEndAnimation');
      }
    }
  }, [gameEvents, triggerAnimation]);
  
  // ...
};
```

## Personnalisation des animations

### Durées

Le store centralise les durées d'animation:

```tsx
import { useAnimationSettings } from '@/store/gameStore';

const MyComponent = () => {
  const settings = useAnimationSettings();
  
  // Utilise les durées prédéfinies
  return (
    <div style={{ 
      transition: `opacity ${settings.duration.normal}ms ${settings.easing}` 
    }}>
      Contenu
    </div>
  );
};
```

### Mode mouvement réduit

Le système respecte les préférences d'accessibilité:

```tsx
import { useReducedMotion } from '@/store/gameStore';

const MyComponent = () => {
  const reducedMotion = useReducedMotion();
  
  return (
    <div className={reducedMotion ? 'simple-transition' : 'fancy-animation'}>
      Contenu avec animation adaptative
    </div>
  );
};
```

## Intégration avec les utilitaires d'animation

Le système de store s'intègre parfaitement avec les utilitaires d'animation:

```tsx
import { fadeIn, slideRight } from '@/utils/animations';
import { useAnimation } from '@/store/gameStore';

const MyComponent = () => {
  const { isTriggered, trigger } = useAnimation('myDetailAnimation');
  
  return (
    <div>
      <button onClick={() => trigger()}>Afficher détails</button>
      
      {isTriggered && (
        <div {...fadeIn({ duration: 300 })}>
          <h3 {...slideRight({ delay: 150 })}>Titre animé</h3>
          <p {...slideRight({ delay: 200 })}>Contenu animé</p>
        </div>
      )}
    </div>
  );
};
```

## Meilleures pratiques

1. **Préférez le hook `useAnimation`** pour les cas simples
2. **Utilisez `useAnimationActions`** pour les cas plus complexes
3. **Respectez toujours l'option `reducedMotion`**
4. **Limitez le nombre d'animations simultanées** pour éviter les problèmes de performance
5. **Utilisez les utilitaires d'animation** plutôt que de créer des animations personnalisées
6. **Testez sur différents appareils** pour assurer une expérience fluide

## Exemple complet: Modal animée

```tsx
import { useAnimation, useReducedMotion } from '@/store/gameStore';
import { fadeIn, fadeOut } from '@/utils/animations';

const AnimatedModal = ({ isOpen, onClose, children }) => {
  const { isTriggered, trigger, reset, settings } = useAnimation('modalAnimation');
  const reducedMotion = useReducedMotion();
  
  // Synchroniser avec l'état externe
  useEffect(() => {
    if (isOpen) {
      trigger();
    } else {
      reset();
    }
  }, [isOpen, trigger, reset]);
  
  // Animation adaptative selon préférences
  const animationProps = reducedMotion 
    ? { opacity: isTriggered ? 1 : 0 }
    : isTriggered 
      ? fadeIn({ duration: settings.duration.normal }) 
      : fadeOut({ duration: settings.duration.fast });
  
  if (!isOpen && !isTriggered) return null;
  
  return (
    <div 
      className="modal-overlay"
      style={{ opacity: isTriggered ? 1 : 0 }}
    >
      <div 
        className="modal-content"
        {...animationProps}
      >
        {children}
        <button onClick={onClose}>Fermer</button>
      </div>
    </div>
  );
};
```

## Débogage des animations

Le store enregistre l'historique des animations déclenchées, ce qui peut être utile pour le débogage:

```tsx
import { useGameStore } from '@/store/gameStore';

const AnimationDebugger = () => {
  const animationHistory = useGameStore(state => state.animationState.history);
  
  return (
    <div className="debug-panel">
      <h3>Historique des animations</h3>
      <ul>
        {animationHistory.map(event => (
          <li key={event.id}>
            {event.animation} - {event.component} - 
            {new Date(event.timestamp).toLocaleTimeString()}
          </li>
        ))}
      </ul>
    </div>
  );
};
```
