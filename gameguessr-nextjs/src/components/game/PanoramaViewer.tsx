'use client';

import { useRef, useState, useEffect, useMemo } from 'react';
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber';
import { OrbitControls, Sphere } from '@react-three/drei';
import { TextureLoader } from 'three';
import * as THREE from 'three';
import { motion, AnimatePresence } from 'framer-motion';
import { panoramaTransition } from '@/utils/animations';
import { 
  useProgressivePanorama, 
  usePanoramaPreloader,
  usePanoramaViewStore,
  detectBestSupportedFormat,
  determineOptimalQuality,
  ImageQuality
} from '@/utils/panoramaOptimization';

interface PanoramaViewerProps {
  imageUrl: string;
  className?: string;
  isChanging?: boolean;
  transitionDuration?: number;
  quality?: ImageQuality;
  allPanoramas?: string[]; // Optionnel: tableau de toutes les URLs de panoramas pour le préchargement
  currentIndex?: number;    // Optionnel: index actuel dans le tableau allPanoramas
}

function PanoramaSphere({ imageUrl }: { imageUrl: string }) {
  const sphereRef = useRef<THREE.Mesh>(null);
  const texture = useLoader(TextureLoader, imageUrl);
  const { camera } = useThree();
  const setPanoramaViewAngle = usePanoramaViewStore(state => state.setPanoramaViewAngle);
  
  // Configuration de la texture pour une sphère panoramique
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;

  useFrame(() => {
    if (sphereRef.current) {
      // Rotation automatique lente pour un effet plus immersif
      sphereRef.current.rotation.y += 0.0005;
      
      // Suivre l'angle de la caméra pour le préchargement intelligent
      const angle = Math.atan2(camera.position.x, camera.position.z) * (180 / Math.PI);
      setPanoramaViewAngle(angle);
    }
  });

  return (
    <mesh ref={sphereRef} scale={[-1, 1, 1]}>
      <sphereGeometry args={[500, 60, 40]} />
      <meshBasicMaterial map={texture} side={THREE.BackSide} />
    </mesh>
  );
}

// Composant pour afficher la progression du chargement
function LoadingIndicator({ progress }: { progress: number }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-800 bg-opacity-80 z-10">
      <div className="w-16 h-16 border-t-4 border-blue-500 rounded-full animate-spin mb-4"></div>
      <div className="relative w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
        <div 
          className="absolute top-0 left-0 h-full bg-blue-500 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="mt-2 text-white text-sm">{Math.round(progress)}%</div>
    </div>
  );
}

export default function PanoramaViewer({ 
  imageUrl, 
  className = '',
  isChanging: externalIsChanging = false,
  transitionDuration = 0.8,
  quality,
  allPanoramas = [],
  currentIndex = 0
}: PanoramaViewerProps) {
  const [error, setError] = useState<string | null>(null);
  const [key, setKey] = useState(0); // Clé pour forcer le rechargement du Canvas
  const [isChanging, setIsChanging] = useState(externalIsChanging);

  // Déterminer la qualité optimale en fonction de l'appareil si non spécifiée
  const optimalQuality = useMemo(() => quality || determineOptimalQuality(), [quality]);
  const bestFormat = useMemo(() => detectBestSupportedFormat(), []);

  // Utiliser notre hook de chargement progressif
  const { 
    url: optimizedImageUrl, 
    isLoading, 
    progress 
  } = useProgressivePanorama(imageUrl, { 
    quality: optimalQuality, 
    format: bestFormat
  });

  // Précharger les prochains panoramas si allPanoramas est fourni
  usePanoramaPreloader(allPanoramas, currentIndex);

  // Effet pour gérer les changements d'image
  useEffect(() => {
    if (imageUrl && imageUrl !== optimizedImageUrl && !isLoading) {
      // Animation de transition
      setIsChanging(true);
      
      // Délai pour permettre à l'animation de sortie de se terminer
      const timer = setTimeout(() => {
        setKey(prev => prev + 1);
        setIsChanging(false);
      }, transitionDuration * 500); // Moitié de la durée pour la transition
      
      return () => clearTimeout(timer);
    }
    return undefined; // Ajout d'une valeur de retour explicite
  }, [imageUrl, optimizedImageUrl, isLoading, transitionDuration]);

  const handleError = () => {
    setError('Erreur lors du chargement de l\'image');
  };

  return (
    <AnimatePresence mode="wait">
      <motion.div 
        key={key}
        className={`relative bg-black rounded-lg overflow-hidden ${className}`}
        variants={panoramaTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {isLoading && (
          <LoadingIndicator progress={progress} />
        )}
        
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-red-900/50 z-10">
            <div className="text-white">{error}</div>
          </div>
        )}
        
        {optimizedImageUrl && (
          <Canvas 
            camera={{ 
              position: [0, 0, 0.1], 
              fov: 75,
              near: 0.1,
              far: 1000 
            }}
            onCreated={({ gl }) => {
              // Optimiser les paramètres WebGL selon la qualité sélectionnée
              if (optimalQuality === 'low') {
                gl.setPixelRatio(Math.min(window.devicePixelRatio, 1));
              } else if (optimalQuality === 'medium') {
                gl.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
              } else {
                gl.setPixelRatio(window.devicePixelRatio);
              }
            }}
          >
            <PanoramaSphere imageUrl={optimizedImageUrl} />
            <OrbitControls 
              enableZoom={true}
              enablePan={false}
              enableDamping={true}
              dampingFactor={0.1}
              rotateSpeed={0.5}
              minDistance={0.1}
              maxDistance={10}
            />
          </Canvas>
        )}

        {/* Instructions d'utilisation */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="absolute bottom-4 left-4 bg-black/50 text-white text-sm px-3 py-2 rounded"
        >
          Cliquez et glissez pour regarder autour • Molette pour zoomer
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
