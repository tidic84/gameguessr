'use client';

import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  fadeAnimation,
  slideUpAnimation,
  slideInRightAnimation,
  slideInLeftAnimation,
  modalAnimation,
  popupAnimation,
  pulseAnimation,
  gameStateAnimation,
  panoramaTransition,
  tooltipAnimation
} from '@/utils/animations';
import { useAnimation } from '@/store/gameStore';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import Tooltip from '@/components/ui/Tooltip';
import Popup from '@/components/ui/Popup';
import Link from 'next/link';
import { NotificationData } from '@/hooks/useNotifications';
import { ChatMessage } from '@/store/gameStore';

// Composant personnalisé pour simuler NotificationHub avec des notifications personnalisées
const TestNotificationHub: React.FC<{ notifications: NotificationData[] }> = ({ notifications }) => {
  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {notifications.map(notification => (
        <div key={notification.id} className="bg-white p-4 rounded-lg shadow-md">
          <div className="font-bold">{notification.title}</div>
          <div>{notification.content}</div>
        </div>
      ))}
    </div>
  );
};

// Composant personnalisé pour simuler le Chat
const TestChat: React.FC<{ messages: any[], roomCode: string }> = ({ messages, roomCode }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4 h-full">
      <h3 className="font-bold mb-4">Chat Room: {roomCode}</h3>
      <div className="space-y-2">
        {messages.map(message => (
          <div key={message.id} className="p-2 bg-gray-100 rounded">
            <div className="font-bold">{message.userName}</div>
            <div>{message.message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant personnalisé pour simuler le Scoreboard
const TestScoreboard: React.FC<{ users: any[] }> = ({ users }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-4">
      <h3 className="font-bold mb-4">Scoreboard</h3>
      <div className="space-y-2">
        {users.map(user => (
          <div 
            key={user.id} 
            className={`p-2 rounded flex justify-between ${user.isCurrentUser ? 'bg-blue-100' : 'bg-gray-100'}`}
          >
            <div>{user.username}</div>
            <div className="font-bold">{user.score}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Composant d'exemple d'animation pour les tests de performance
const AnimationPerformanceTest = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const [showPopup, setShowPopup] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'message' | 'system' | 'game' | 'error' | 'success';
    title: string;
    content: string;
    autoClose?: boolean;
    duration?: number;
  }>>([]);
  const [animatedElement, setAnimatedElement] = useState({
    fade: false,
    slideUp: false,
    slideRight: false,
    slideLeft: false,
    pulse: false,
    panorama: false,
    gameState: false
  });
  
  // Utilisation du hook d'animation
  const modalAnimation = useAnimation('modalAnimation');
  const notificationAnimation = useAnimation('notificationAnimation');
  const chatAnimation = useAnimation('chatAnimation');
  const scoreboardAnimation = useAnimation('scoreboardAnimation');
  const navigationAnimation = useAnimation('navigationAnimation');
  const panoramaAnimation = useAnimation('panoramaAnimation');
  
  // Données de test pour le scoreboard
  const scoreboardData = [
    { id: '1', username: 'Player1', score: 1250, isCurrentUser: true },
    { id: '2', username: 'Player2', score: 980, isCurrentUser: false },
    { id: '3', username: 'Player3', score: 850, isCurrentUser: false },
    { id: '4', username: 'Player4', score: 720, isCurrentUser: false },
    { id: '5', username: 'Player5', score: 640, isCurrentUser: false },
  ];
  
  // Messages de test pour le chat
  const chatMessages = [
    { id: '1', userId: '1', userName: 'Player1', message: 'Hello world!', timestamp: new Date(), type: 'user' },
    { id: '2', userId: '2', userName: 'Player2', message: 'Testing animations', timestamp: new Date(), type: 'user' },
    { id: '3', userId: 'system', userName: 'System', message: 'Player3 has joined', timestamp: new Date(), type: 'system' },
    { id: '4', userId: '4', userName: 'Player4', message: 'This looks great!', timestamp: new Date(), type: 'user' },
  ];
  
  // Fonction pour réinitialiser toutes les animations
  const resetAllAnimations = () => {
    setIsModalOpen(false);
    setShowTooltip(false);
    setShowPopup(false);
    setNotifications([]);
    setAnimatedElement({
      fade: false,
      slideUp: false,
      slideRight: false,
      slideLeft: false,
      pulse: false,
      panorama: false,
      gameState: false
    });
  };
  
  // Fonctions pour déclencher les animations
  const triggerModalAnimation = () => {
    resetAllAnimations();
    modalAnimation.trigger();
    setIsModalOpen(true);
    
    setTimeout(() => {
      setIsModalOpen(false);
    }, 1500);
  };
  
  const triggerNotificationAnimation = () => {
    resetAllAnimations();
    notificationAnimation.trigger();
    
    setNotifications([
      { id: '1', type: 'system', title: 'Test', content: 'This is a test notification' },
      { id: '2', type: 'success', title: 'Success', content: 'Animation test successful' }
    ]);
    
    setTimeout(() => {
      setNotifications([]);
    }, 1500);
  };
  
  const triggerChatAnimation = () => {
    resetAllAnimations();
    chatAnimation.trigger();
    
    // L'animation est gérée par le composant Chat
  };
  
  const triggerScoreboardAnimation = () => {
    resetAllAnimations();
    scoreboardAnimation.trigger();
    
    // L'animation est gérée par le composant Scoreboard
  };
  
  const triggerPanoramaAnimation = () => {
    resetAllAnimations();
    panoramaAnimation.trigger();
    setAnimatedElement({ ...animatedElement, panorama: true });
    
    setTimeout(() => {
      setAnimatedElement({ ...animatedElement, panorama: false });
    }, 1500);
  };
  
  const triggerNavigationAnimation = () => {
    resetAllAnimations();
    navigationAnimation.trigger();
    
    // Simuler une animation de navigation
    setAnimatedElement({ ...animatedElement, slideRight: true });
    
    setTimeout(() => {
      setAnimatedElement({ ...animatedElement, slideRight: false });
    }, 1500);
  };
  
  // Afficher la notification de chargement
  useEffect(() => {
    // Marquer la page comme chargée pour les tests
    const element = document.createElement('div');
    element.setAttribute('data-testid', 'animation-examples-loaded');
    element.style.display = 'none';
    document.body.appendChild(element);
    
    return () => {
      document.body.removeChild(element);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <h1 className="text-3xl font-bold mb-8">Test de Performance des Animations</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Modal</h2>
          <Button 
            onClick={triggerModalAnimation}
            data-testid="trigger-modal"
            className="w-full"
          >
            Tester Animation Modal
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Notifications</h2>
          <Button 
            onClick={triggerNotificationAnimation}
            data-testid="trigger-notification"
            className="w-full"
          >
            Tester Animation Notifications
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Chat</h2>
          <Button 
            onClick={triggerChatAnimation}
            data-testid="trigger-chat"
            className="w-full"
          >
            Tester Animation Chat
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Scoreboard</h2>
          <Button 
            onClick={triggerScoreboardAnimation}
            data-testid="trigger-scoreboard"
            className="w-full"
          >
            Tester Animation Scoreboard
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Panorama</h2>
          <Button 
            onClick={triggerPanoramaAnimation}
            data-testid="trigger-panorama"
            className="w-full"
          >
            Tester Animation Panorama
          </Button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Navigation</h2>
          <Button 
            onClick={triggerNavigationAnimation}
            data-testid="trigger-navigation"
            className="w-full"
          >
            Tester Animation Navigation
          </Button>
        </div>
      </div>
      
      {/* Zone d'affichage des animations */}
      <div className="mt-12 bg-white p-6 rounded-lg shadow-md relative min-h-[400px]">
        <h2 className="text-2xl font-bold mb-6">Aperçu des Animations</h2>
        
        {/* Modal */}
        {isModalOpen && (
          <Modal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title="Modal Test"
          >
            <div className="p-4">
              <p>Cette modal est utilisée pour tester les performances des animations.</p>
            </div>
          </Modal>
        )}
        
        {/* Notifications */}
        <TestNotificationHub notifications={notifications} />
        
        {/* Composants animés */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {animatedElement.fade && (
            <motion.div
              className="bg-blue-100 p-4 rounded"
              variants={fadeAnimation}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              Animation Fade
            </motion.div>
          )}
          
          {animatedElement.slideUp && (
            <motion.div
              className="bg-green-100 p-4 rounded"
              variants={slideUpAnimation}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              Animation Slide Up
            </motion.div>
          )}
          
          {animatedElement.slideRight && (
            <motion.div
              className="bg-yellow-100 p-4 rounded"
              variants={slideInRightAnimation}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              Animation Slide Right (Navigation)
            </motion.div>
          )}
          
          {animatedElement.slideLeft && (
            <motion.div
              className="bg-red-100 p-4 rounded"
              variants={slideInLeftAnimation}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              Animation Slide Left
            </motion.div>
          )}
          
          {animatedElement.pulse && (
            <motion.div
              className="bg-purple-100 p-4 rounded"
              variants={pulseAnimation}
              initial="initial"
              animate="animate"
            >
              Animation Pulse
            </motion.div>
          )}
          
          {animatedElement.panorama && (
            <motion.div
              className="bg-indigo-100 p-4 rounded h-64 flex items-center justify-center"
              variants={panoramaTransition}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <div className="text-center">
                <h3 className="text-xl font-bold">Animation Panorama</h3>
                <p>Transition entre les images panoramiques</p>
              </div>
            </motion.div>
          )}
          
          {animatedElement.gameState && (
            <motion.div
              className="bg-teal-100 p-4 rounded"
              variants={gameStateAnimation}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              Animation Changement d'État
            </motion.div>
          )}
        </div>
        
        {/* Chat et Scoreboard */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 overflow-hidden">
            <TestChat messages={chatMessages} roomCode="test" />
          </div>
          
          <div>
            <TestScoreboard users={scoreboardData} />
          </div>
        </div>
      </div>
      
      <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">Rapport de Performance</h2>
        <p>Cette page est utilisée pour mesurer les performances des animations dans GameGuessr.</p>
        <p>Les tests automatisés sont exécutés avec le script <code>test-animation-performance.js</code>.</p>
        
        <div className="mt-4">
          <Link href="/">
            <Button>Retour à l'accueil</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AnimationPerformanceTest;
