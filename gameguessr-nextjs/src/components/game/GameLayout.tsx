'use client';

import { useState, useEffect } from 'react';
import { useCurrentRoom, useUser, useTimeLeft, useCurrentImageIndex, useIsGameActive } from '@/store/gameStore';
import PanoramaViewer from './PanoramaViewer';
import GameMap from './GameMap';
import GameInput from './GameInput';
import GameTimer from './GameTimer';
import Scoreboard from './Scoreboard';
import { GameControls } from './GameControls';
import Chat from '../chat/Chat';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Users, Star, MapPin, MessageCircle } from 'lucide-react';

interface GameLayoutProps {
  roomCode: string;
}

export default function GameLayout({ roomCode }: GameLayoutProps) {
  const currentRoom = useCurrentRoom();
  const user = useUser();
  const [hasGuessed, setHasGuessed] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'scoreboard' | 'chat'>('scoreboard');
  
  // Utiliser les données du store pour la synchronisation temps réel
  const timeLeft = useTimeLeft();
  const currentImageIndex = useCurrentImageIndex();
  const isGameActive = useIsGameActive();

  // Timer géré maintenant par le store via Socket.io
  // Plus besoin de simulation locale

  if (!currentRoom || !user) return null;

  const players = currentRoom.users || [];
  const currentImage = { 
    url: '/images/cp1.jpg', 
    id: 'demo' 
  };

  const handleGuess = (answer: string) => {
    // Ici on enverrait la réponse via Socket.io
    console.log('Answer submitted:', answer);
    setHasGuessed(true);
  };

  const handleLocationSelect = (lat: number, lng: number) => {
    // Ici on enverrait la localisation via Socket.io
    console.log('Location selected:', { lat, lng });
    setHasGuessed(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-pink-900">
      {/* Header avec timer et informations */}
      <div className="bg-black/20 backdrop-blur-md border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <h1 className="text-white font-bold text-xl">{currentRoom.name}</h1>
              
              <GameTimer
                totalTime={120}
                timeLeft={timeLeft}
                isActive={isGameActive}
                onTimeUp={() => {
                  console.log('Time up!');
                  setHasGuessed(true);
                }}
              />
              
              <div className="flex items-center space-x-2 text-white/80">
                <Star className="w-5 h-5" />
                <span>
                  Image {currentImageIndex + 1} / 5
                </span>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-white/80">
                <Users className="w-5 h-5" />
                <span>{players.length} joueurs</span>
              </div>
              <div className="text-white font-bold">
                0 pts
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contrôles de jeu pour les administrateurs */}
      <GameControls />

      <div className="flex h-[calc(100vh-80px)]">
        {/* Zone principale de jeu (70%) */}
        <div className="flex-1 flex flex-col">            {/* Vue 360° */}
            <div className="flex-1 relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentImageIndex}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.1 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full"
                >
                  <PanoramaViewer
                    imageUrl={currentImage.url}
                    className="w-full h-full rounded-none"
                  />
                </motion.div>
              </AnimatePresence>

            {/* Overlay pour les statuts */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              <div className="bg-black/50 backdrop-blur-md rounded-lg px-4 py-2">
                <p className="text-white text-sm opacity-80">
                  Trouvez où cette photo a été prise !
                </p>
              </div>
              
              {hasGuessed && (
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-green-500/80 backdrop-blur-md rounded-lg px-4 py-2"
                >
                  <div className="flex items-center space-x-2 text-white">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm font-medium">Réponse envoyée !</span>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          {/* Barre de saisie en bas */}
          <div className="bg-black/20 backdrop-blur-md border-t border-white/10 p-4">
            <GameInput
              onSubmitAnswer={handleGuess}
              disabled={hasGuessed || timeLeft === 0}
              placeholder={
                hasGuessed
                  ? "Réponse envoyée ! En attente des autres joueurs..."
                  : timeLeft === 0
                  ? "Temps écoulé !"
                  : "Tapez le nom d'un lieu ou cliquez sur la carte..."
              }
            />
          </div>
        </div>

        {/* Sidebar droite (30%) */}
        <div className="w-[30%] min-w-[350px] flex flex-col bg-black/20 backdrop-blur-md border-l border-white/10">
          {/* Carte interactive */}
          <div className="flex-1">
            <GameMap
              onLocationSelect={handleLocationSelect}
              className="w-full h-full"
            />
          </div>

          {/* Onglets pour Scoreboard/Chat */}
          <div className="border-t border-white/10">
            <div className="flex">
              <button
                onClick={() => setActiveTab('scoreboard')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'scoreboard'
                    ? 'bg-white/10 text-white border-b-2 border-blue-500'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>Classement</span>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 text-sm font-medium transition-colors ${
                  activeTab === 'chat'
                    ? 'bg-white/10 text-white border-b-2 border-blue-500'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat</span>
              </button>
            </div>
          </div>

          {/* Contenu des onglets */}
          <div className="h-80 overflow-hidden">
            <AnimatePresence mode="wait">
              {activeTab === 'scoreboard' ? (
                <motion.div
                  key="scoreboard"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Scoreboard className="h-full" />
                </motion.div>
              ) : (
                <motion.div
                  key="chat"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="h-full"
                >
                  <Chat roomCode={roomCode} className="h-full" />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
