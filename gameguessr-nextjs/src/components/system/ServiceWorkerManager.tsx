import { useEffect } from 'react';
import { useServiceWorker } from '@/hooks/useServiceWorker';
import { toast } from 'react-hot-toast';

export const ServiceWorkerManager = () => {
  const { isReady, update } = useServiceWorker();

  useEffect(() => {
    // Vérifier les mises à jour périodiquement
    if (isReady) {
      const interval = setInterval(update, 60 * 60 * 1000); // Toutes les heures
      return () => clearInterval(interval);
    }
  }, [isReady, update]);

  return null; // Composant sans rendu
};

// Méthodes utilitaires pour la gestion du cache
export const cacheUtils = {
  // Précharger les ressources pour une salle
  preloadRoom: async (roomCode: string) => {
    if ('serviceWorker' in navigator) {
      try {
        // Ressources à précharger
        const resources = [
          `/api/rooms/${roomCode}`,
          '/images/leaflet/marker-icon.png',
          '/images/leaflet/marker-shadow.png',
        ];

        // Charger en parallèle
        await Promise.all(
          resources.map(async (url) => {
            try {
              const cache = await caches.open('gameguessr-cache-v1');
              await cache.add(url);
            } catch (error) {
              console.warn(`Échec du préchargement de ${url}:`, error);
            }
          })
        );
      } catch (error) {
        console.error('Erreur lors du préchargement:', error);
      }
    }
  },

  // Précharger les panoramas pour une partie
  preloadPanoramas: async (urls: string[]) => {
    if ('serviceWorker' in navigator) {
      try {
        const cache = await caches.open('gameguessr-images-v1');
        
        // Charger les images en parallèle avec limite de concurrence
        const batchSize = 3;
        for (let i = 0; i < urls.length; i += batchSize) {
          const batch = urls.slice(i, i + batchSize);
          await Promise.all(
            batch.map(async (url) => {
              try {
                await cache.add(url);
              } catch (error) {
                console.warn(`Échec du préchargement de ${url}:`, error);
              }
            })
          );
        }
      } catch (error) {
        console.error('Erreur lors du préchargement des panoramas:', error);
      }
    }
  },

  // Nettoyer le cache d'une salle
  clearRoomCache: async (roomCode: string) => {
    if ('serviceWorker' in navigator) {
      try {
        const cache = await caches.open('gameguessr-cache-v1');
        const keys = await cache.keys();
        const roomKeys = keys.filter((key) => 
          key.url.includes(`/api/rooms/${roomCode}`) ||
          key.url.includes(`/images/panoramas/${roomCode}`)
        );
        await Promise.all(roomKeys.map((key) => cache.delete(key)));
      } catch (error) {
        console.error('Erreur lors du nettoyage du cache:', error);
        toast.error('Erreur lors du nettoyage du cache');
      }
    }
  },
};
