/**
 * Utilitaire pour l'optimisation des images panoramiques
 * Gère le chargement progressif, les formats modernes et le préchargement
 */

import { useCallback, useEffect, useState } from 'react';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import { create } from 'zustand';

// Types pour la gestion des images optimisées
export type ImageQuality = 'low' | 'medium' | 'high';
export type ImageFormat = 'jpg' | 'webp' | 'avif';

interface OptimizedImageUrls {
  low: { [format in ImageFormat]?: string };
  medium: { [format in ImageFormat]?: string };
  high: { [format in ImageFormat]?: string };
}

interface PanoramaImageOptions {
  quality?: ImageQuality;
  format?: ImageFormat;
  prefetch?: boolean;
  basePath?: string;
}

// Store pour suivre l'angle de vue panoramique
interface PanoramaViewState {
  panoramaViewAngle: number;
  setPanoramaViewAngle: (angle: number) => void;
}

export const usePanoramaViewStore = create<PanoramaViewState>((set) => ({
  panoramaViewAngle: 0,
  setPanoramaViewAngle: (angle) => set({ panoramaViewAngle: angle }),
}));

const DEFAULT_OPTIONS: PanoramaImageOptions = {
  quality: 'high',
  format: 'webp',
  prefetch: false,
  basePath: '/images'
};

// Création du cache pour les images
const imageCache: Map<string, Promise<HTMLImageElement | null>> = new Map();
const textureCache: Map<string, THREE.Texture> = new Map();

/**
 * Génère des URLs optimisées pour une image panoramique
 */
export function generatePanoramaUrls(
  imageName: string,
  options: PanoramaImageOptions = {}
): OptimizedImageUrls {
  const { basePath = DEFAULT_OPTIONS.basePath } = options;
  
  // Extraire le nom de base sans extension
  const baseName = imageName.replace(/\.(jpg|jpeg|png|webp|avif)$/, '');
  
  return {
    low: {
      jpg: `${basePath}/panoramas/low/${baseName}_low.jpg`,
      webp: `${basePath}/panoramas/low/${baseName}_low.webp`,
      avif: `${basePath}/panoramas/low/${baseName}_low.avif`,
    },
    medium: {
      jpg: `${basePath}/panoramas/medium/${baseName}_medium.jpg`,
      webp: `${basePath}/panoramas/medium/${baseName}_medium.webp`,
      avif: `${basePath}/panoramas/medium/${baseName}_medium.avif`,
    },
    high: {
      jpg: `${basePath}/panoramas/${baseName}.jpg`,
      webp: `${basePath}/panoramas/${baseName}.webp`,
      avif: `${basePath}/panoramas/${baseName}.avif`,
    }
  };
}

/**
 * Détecte le meilleur format d'image supporté par le navigateur
 */
export function detectBestSupportedFormat(): ImageFormat {
  if (typeof document === 'undefined') return 'jpg'; // Fallback pour SSR
  
  const canvas = document.createElement('canvas');
  if (canvas.toDataURL('image/avif').indexOf('data:image/avif') === 0) {
    return 'avif';
  }
  if (canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0) {
    return 'webp';
  }
  return 'jpg';
}

/**
 * Détermine la qualité d'image optimale en fonction des capacités de l'appareil
 */
export function determineOptimalQuality(): ImageQuality {
  if (typeof window === 'undefined') return 'medium'; // Fallback pour SSR
  
  // Détecter les appareils à faible puissance ou en mode économie d'énergie
  const connection = (navigator as any).connection;
  const saveData = connection?.saveData;
  const effectiveType = connection?.effectiveType;
  const isLowEnd = 
    window.navigator.hardwareConcurrency <= 4 || // CPU faible
    (window as any).deviceMemory <= 4; // RAM faible (API expérimentale)
    
  if (saveData || effectiveType === 'slow-2g' || effectiveType === '2g') {
    return 'low';
  }
  
  if (isLowEnd || effectiveType === '3g') {
    return 'medium';
  }
  
  return 'high';
}

/**
 * Précharge une image en mémoire
 */
function preloadImage(url: string): Promise<HTMLImageElement | null> {
  // Vérifier si l'image est déjà en cache
  if (imageCache.has(url)) {
    return imageCache.get(url)!;
  }
  
  // Créer une nouvelle promesse pour le chargement de l'image
  const promise = new Promise<HTMLImageElement | null>((resolve) => {
    // Éviter les erreurs côté serveur
    if (typeof window === 'undefined') {
      resolve(null);
      return;
    }
    
    const img = new Image();
    
    img.onload = () => {
      resolve(img);
    };
    
    img.onerror = () => {
      // En cas d'erreur, on résout avec null et on retire du cache
      imageCache.delete(url);
      resolve(null);
    };
    
    img.src = url;
  });
  
  // Stocker la promesse dans le cache
  imageCache.set(url, promise);
  return promise;
}

/**
 * Précharge une texture Three.js
 */
export function preloadTexture(url: string): Promise<THREE.Texture | null> {
  // Vérifier si la texture est déjà en cache
  if (textureCache.has(url)) {
    return Promise.resolve(textureCache.get(url) || null);
  }
  
  return new Promise((resolve) => {
    const loader = new TextureLoader();
    loader.load(
      url,
      (texture) => {
        textureCache.set(url, texture);
        resolve(texture);
      },
      undefined,
      () => resolve(null)
    );
  });
}

/**
 * Hook pour gérer le chargement progressif des images panoramiques
 */
export function useProgressivePanorama(originalUrl: string, options: PanoramaImageOptions = {}) {
  // Extraire le nom de l'image depuis l'URL
  const imageName = originalUrl.split('/').pop() || originalUrl;
  
  // État pour suivre l'URL actuellement affichée et l'état de chargement
  const [currentUrl, setCurrentUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  
  // Détecter le format et la qualité optimaux
  const bestFormat = detectBestSupportedFormat();
  const optimalQuality = determineOptimalQuality();
  
  // Combiner les options par défaut avec les options fournies
  const mergedOptions = {
    ...DEFAULT_OPTIONS,
    ...options,
    format: options.format || bestFormat,
    quality: options.quality || optimalQuality
  };
  
  // Générer les URLs optimisées
  const urls = generatePanoramaUrls(imageName, mergedOptions);
  
  // Fonction pour obtenir l'URL correspondant à la qualité et au format
  const getUrl = useCallback((quality: ImageQuality, format: ImageFormat): string => {
    const qualityUrls = urls[quality];
    // Utiliser le format demandé ou faire un fallback sur jpg
    return qualityUrls[format] || qualityUrls.jpg || originalUrl;
  }, [urls, originalUrl]);
  
  // Gestion du chargement progressif
  useEffect(() => {
    let isMounted = true;
    
    const loadSequence = async () => {
      if (!isMounted) return;
      
      // Toujours commencer par charger la version basse qualité
      const lowQualityUrl = getUrl('low', mergedOptions.format as ImageFormat);
      setCurrentUrl(lowQualityUrl);
      setIsLoading(true);
      setLoadingProgress(10);
      
      // Précharger la version basse qualité
      await preloadImage(lowQualityUrl);
      if (!isMounted) return;
      
      // Si la qualité demandée est supérieure à "low", charger la qualité moyenne
      if (mergedOptions.quality !== 'low') {
        setLoadingProgress(40);
        const mediumQualityUrl = getUrl('medium', mergedOptions.format as ImageFormat);
        
        // Précharger la version moyenne qualité
        await preloadImage(mediumQualityUrl);
        if (!isMounted) return;
        
        // Mettre à jour l'URL affichée
        setCurrentUrl(mediumQualityUrl);
        
        // Si la qualité demandée est "high", charger la haute qualité
        if (mergedOptions.quality === 'high') {
          setLoadingProgress(70);
          const highQualityUrl = getUrl('high', mergedOptions.format as ImageFormat);
          
          // Précharger la version haute qualité
          await preloadImage(highQualityUrl);
          if (!isMounted) return;
          
          // Mettre à jour l'URL affichée
          setCurrentUrl(highQualityUrl);
        }
      }
      
      // Chargement terminé
      setIsLoading(false);
      setLoadingProgress(100);
    };
    
    loadSequence();
    
    return () => {
      isMounted = false;
    };
  }, [getUrl, mergedOptions.quality, mergedOptions.format]);
  
  // Retourner l'URL courante et l'état de chargement
  return {
    url: currentUrl,
    isLoading,
    progress: loadingProgress
  };
}

/**
 * Système de préchargement intelligent des panoramas
 */
export function usePanoramaPreloader(panoramas: string[], currentIndex: number) {
  const preloadDepth = 2; // Nombre d'images à précharger en avant
  
  useEffect(() => {
    // Précharger les prochaines images
    for (let i = 1; i <= preloadDepth; i++) {
      const nextIndex = (currentIndex + i) % panoramas.length;
      if (nextIndex !== currentIndex) {
        const nextImage = panoramas[nextIndex];
        if (nextImage) {
          // Extraire le nom de l'image
          const imageName = nextImage.split('/').pop() || nextImage;
          
          // Générer les URLs pour les différentes qualités
          const urls = generatePanoramaUrls(imageName);
          
          // Précharger d'abord la basse qualité
          const lowQualityUrl = urls.low.webp || urls.low.jpg;
          if (lowQualityUrl) {
            preloadImage(lowQualityUrl);
          }
          
          // Si c'est la prochaine image (i=1), précharger aussi la moyenne qualité
          if (i === 1) {
            const mediumQualityUrl = urls.medium.webp || urls.medium.jpg;
            if (mediumQualityUrl) {
              preloadImage(mediumQualityUrl);
            }
          }
        }
      }
    }
  }, [currentIndex, panoramas, preloadDepth]);
}

/**
 * Hook pour détecter la direction du regard dans le panorama
 * et précharger intelligemment dans cette direction
 */
export function useLookDirectionPreloader(
  panoramas: Record<string, string>,
  currentPanorama: string
) {
  // Récupérer l'angle de vue actuel du store
  const viewAngle = usePanoramaViewStore(state => state.panoramaViewAngle);
  
  useEffect(() => {
    // Simplifier l'angle à une direction (N, S, E, O)
    const normalizedAngle = ((viewAngle % 360) + 360) % 360;
    
    // Déterminer la direction approximative
    let direction: 'north' | 'east' | 'south' | 'west';
    if (normalizedAngle >= 315 || normalizedAngle < 45) {
      direction = 'north';
    } else if (normalizedAngle >= 45 && normalizedAngle < 135) {
      direction = 'east';
    } else if (normalizedAngle >= 135 && normalizedAngle < 225) {
      direction = 'south';
    } else {
      direction = 'west';
    }
    
    // Identifier les panoramas potentiellement liés à cette direction
    // En supposant que les clés contiennent des indications de direction ou de position
    const directionalKeywords = {
      north: ['north', 'up', 'front', 'forward'],
      east: ['east', 'right'],
      south: ['south', 'down', 'back', 'backward'],
      west: ['west', 'left']
    };
    
    // Trouver les panoramas correspondant potentiellement à la direction
    const keywordsForDirection = directionalKeywords[direction];
    const potentialPanoramas = Object.entries(panoramas)
      .filter(([key]) => 
        key !== currentPanorama && 
        keywordsForDirection.some(keyword => 
          key.toLowerCase().includes(keyword)
        )
      )
      .map(([_, url]) => url);
    
    // Précharger ces panoramas
    potentialPanoramas.forEach(url => {
      // Extraire le nom de l'image
      const imageName = url.split('/').pop() || url;
      
      // Générer les URLs pour les différentes qualités
      const urls = generatePanoramaUrls(imageName);
      
      // Précharger la basse qualité
      const lowQualityUrl = urls.low.webp || urls.low.jpg;
      if (lowQualityUrl) {
        preloadImage(lowQualityUrl);
      }
    });
    
  }, [viewAngle, panoramas, currentPanorama]);
}

/**
 * Nettoie les caches d'images et de textures qui ne sont plus nécessaires
 */
export function cleanImageCaches(keepUrls: string[] = []) {
  // Convertir en Set pour des recherches plus rapides
  const keepUrlsSet = new Set(keepUrls);
  
  // Nettoyer le cache d'images
  for (const url of imageCache.keys()) {
    if (!keepUrlsSet.has(url)) {
      imageCache.delete(url);
    }
  }
  
  // Nettoyer le cache de textures
  for (const url of textureCache.keys()) {
    if (!keepUrlsSet.has(url)) {
      const texture = textureCache.get(url);
      if (texture) {
        texture.dispose(); // Libérer la mémoire GPU
      }
      textureCache.delete(url);
    }
  }
}
