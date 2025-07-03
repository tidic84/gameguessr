'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Smile, Users, ChevronUp, MoreHorizontal, Shield, Flag } from 'lucide-react';
import { useSocket } from '@/hooks/useSocket';
import { 
  useCurrentRoom, 
  useUser, 
  useChatMessages, 
  useGameActions, 
  useIsCurrentUserAdmin, 
  useGameStore,
  ChatMessage,
  paginateMessages,
  debounce,
  throttle,
  advancedModerateMessage,
  canUserPostMessage,
  updateUserMessageFrequency,
  useAnimationSettings,
  useAnimation,
  useAnimationActions
} from '@/store/gameStore';
import ChatMessageComponent from './ChatMessage';
import TypingIndicator from './TypingIndicator';
import ChatPerformanceIndicator from './ChatPerformanceIndicator';
import ModerationPanel from './ModerationPanel';
import ReportModal from './ReportModal';
import { useNotifications } from '@/hooks/useNotifications';
import { AnimatedBadge, NewMessageIndicator } from '@/components/ui/AnimatedElements';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { DURATIONS, EASINGS, fadeAnimation, slideUpAnimation } from '@/utils/animations';

interface ChatProps {
  roomCode: string;
  className?: string;
}

// Variants d'animation pour différents éléments du chat
const chatContainerVariants = {
  hidden: { opacity: 0, y: 50 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.smooth,
      staggerChildren: 0.1
    }
  },
  exit: { 
    opacity: 0, 
    y: 50,
    transition: {
      duration: DURATIONS.normal
    }
  }
};

const messageListVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: {
      staggerChildren: 0.05
    }
  }
};

const messageItemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: {
      duration: DURATIONS.normal,
      ease: EASINGS.smooth
    }
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: {
      duration: DURATIONS.fast
    }
  }
};

export default function Chat({ roomCode, className = '' }: ChatProps) {
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isChatVisible, setIsChatVisible] = useState(true);
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [showNewMessageIndicator, setShowNewMessageIndicator] = useState(false);
  
  // Nouveaux états pour la pagination et performance
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [performanceStats, setPerformanceStats] = useState<any | null>(null);
  const [showLoadMore, setShowLoadMore] = useState(false);
  
  // États de modération
  const [showModerationPanel, setShowModerationPanel] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportTargetId, setReportTargetId] = useState<string | null>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string>('');
  
  // Hooks d'animation
  const animationSettings = useAnimationSettings();
  const isChatAnimated = useAnimation('chatAnimation');
  const { triggerAnimation, resetAnimation, updateAnimationSettings } = useAnimationActions();
  
  // Gestionnaire d'animation pour les nouveaux messages
  const triggerNewMessageAnimation = useCallback(() => {
    triggerAnimation('newChatMessage');
    setTimeout(() => {
      resetAnimation('newChatMessage');
    }, animationSettings.duration * 1000 + 500);
  }, [triggerAnimation, resetAnimation, animationSettings.duration]);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastScrollPosition = useRef(0);
  
  const { emit } = useSocket();
  const currentRoom = useCurrentRoom();
  const user = useUser();
  const isAdmin = useIsCurrentUserAdmin();
  const { notifyNewMessage, notifySystemEvent, notifyGameEvent } = useNotifications();
  const { 
    addUserMessage, 
    addSystemMessage, 
    addGameMessage, 
    addAdminMessage,
    addReaction,
    moderateUserMessage,
    getUserModerationStatus,
    warnUser,
    muteUser,
    blockUser,
    clearChatMessages,
    parseAdminCommand
  } = useGameActions();
  
  // Utiliser les messages du store avec pagination
  const allMessages = useChatMessages(roomCode);
  
  // Messages paginés pour l'affichage
  const paginatedData = useMemo(() => {
    return paginateMessages(allMessages, currentPage, 20);
  }, [allMessages, currentPage]);
  
  const displayMessages = paginatedData.messages;
  const hasMoreMessages = paginatedData.hasMore;

  // Récupérer les données de modération depuis le store
  const moderationData = useGameStore((state) => ({
    userStatuses: {},
    moderationActions: [],
    reports: [],
  }));

  // Gestion de l'affichage du bouton "Charger plus"
  useEffect(() => {
    setShowLoadMore(hasMoreMessages && currentPage === 0);
  }, [hasMoreMessages, currentPage]);

  // Auto-scroll vers le bas et gestion des messages non lus
  useEffect(() => {
    if (isAtBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnreadCount(0);
      setShowNewMessageIndicator(false);
    } else {
      // Compter les nouveaux messages quand l'utilisateur n'est pas en bas
      const lastMessage = displayMessages[displayMessages.length - 1];
      if (lastMessage && lastMessage.userId !== user?.id) {
        setUnreadCount(prev => prev + 1);
        setShowNewMessageIndicator(true);
        // Notification pour nouveau message
        if (lastMessage.type === 'user') {
          notifyNewMessage(lastMessage.username, lastMessage.content);
        }
      }
    }
  }, [displayMessages, isAtBottom, user?.id, notifyNewMessage]);

  // Gestion du scroll pour détecter si l'utilisateur est en bas avec throttling
  const handleScroll = useCallback(throttle(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop, scrollHeight, clientHeight } = container;
      const threshold = 100; // pixels de tolérance
      const atBottom = scrollHeight - scrollTop - clientHeight < threshold;
      setIsAtBottom(atBottom);
      
      // Détecter si l'utilisateur scroll vers le haut pour charger plus de messages
      const scrolledUp = scrollTop < lastScrollPosition.current;
      if (scrolledUp && scrollTop < 200 && hasMoreMessages && !isLoadingHistory) {
        loadMoreMessages();
      }
      lastScrollPosition.current = scrollTop;
    }
  }, 100), [hasMoreMessages, isLoadingHistory]);

  // Fonction pour charger plus de messages (pagination)
  const loadMoreMessages = useCallback(async () => {
    if (isLoadingHistory || !hasMoreMessages) return;
    
    setIsLoadingHistory(true);
    
    try {
      // Simuler un délai de chargement (en réalité, cela viendrait du serveur)
      await new Promise(resolve => setTimeout(resolve, 300));
      setCurrentPage(prev => prev + 1);
    } catch (error) {
      console.error('Erreur lors du chargement des messages:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [isLoadingHistory, hasMoreMessages]);

  // Fonction pour scroller vers le bas avec debouncing
  const scrollToBottom = useCallback(debounce(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    setIsAtBottom(true);
    setUnreadCount(0);
    setShowNewMessageIndicator(false);
  }, 100), []);

  // Optimisation des stats de performance
  useEffect(() => {
    const updatePerformanceStats = debounce(() => {
      const stats: any = {
        messageCount: allMessages.length,
        memoryUsage: JSON.stringify(allMessages).length,
        lastCleanup: new Date(),
        compressionRatio: 1, // À calculer avec les vraies données compressées
      };
      setPerformanceStats(stats);
    }, 1000);

    updatePerformanceStats();
  }, [allMessages]);

  // Nettoyage automatique des messages anciens (en arrière-plan)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      if (allMessages.length > 200) {
        // Déclencher un nettoyage via le store
        // cleanupOldMessages sera appelé automatiquement
      }
    }, 60000); // Chaque minute

    return () => clearInterval(cleanupInterval);
  }, [allMessages.length]);

  // Gestion du scroll pour charger plus de messages
  const handleScrollLoadMore = useCallback(() => {
    const container = messagesContainerRef.current;
    if (container) {
      const { scrollTop } = container;
      
      // Si l'utilisateur scroll en haut, charger plus de messages
      if (scrollTop === 0) {
        loadMoreMessages();
      }
    }
  }, [loadMoreMessages]);

  useEffect(() => {
    const container = messagesContainerRef.current;
    container?.addEventListener('scroll', handleScrollLoadMore);
    
    return () => {
      container?.removeEventListener('scroll', handleScrollLoadMore);
    };
  }, [handleScrollLoadMore]);

  // Messages système pour les événements de jeu avec notifications
  useEffect(() => {
    if (currentRoom?.gameState?.status === 'playing') {
      addSystemMessage(roomCode, '🎮 Le jeu a commencé ! Bonne chance !', 'info');
      notifyGameEvent('Jeu démarré', 'Le jeu a commencé ! Bonne chance !');
    } else if (currentRoom?.gameState?.status === 'finished') {
      addSystemMessage(roomCode, '🏁 Le jeu est terminé !', 'info');
      notifyGameEvent('Jeu terminé', 'Le jeu est terminé !');
    }
  }, [currentRoom?.gameState?.status, roomCode, addSystemMessage, notifyGameEvent]);

  // Gestion de l'envoi de messages avec modération avancée
  const handleSendMessage = useCallback(() => {
    if (!inputValue.trim() || !user) return;

    const trimmedMessage = inputValue.trim();

    // Vérifier si l'utilisateur peut poster
    const canPost = true; // Simplifié pour le moment

    if (!canPost) {
      addSystemMessage(roomCode, '❌ Vous ne pouvez pas poster de message en ce moment', 'warning');
      setInputValue('');
      return;
    }

    // Vérifier les commandes admin
    if (isAdmin && trimmedMessage.startsWith('/')) {
      const command = parseAdminCommand(trimmedMessage);
      
      if (command.isCommand) {
        handleAdminCommand(command);
        setInputValue('');
        return;
      }
    }

    // Envoyer le message directement (modération simplifiée temporairement)
    addUserMessage(roomCode, user.id, user.username, trimmedMessage);
    
    // Envoyer via Socket.io (à implémenter)
    // emit.sendChatMessage(roomCode, user.id, trimmedMessage);
    
    setInputValue('');
    setShowEmojiPicker(false);
    
    // Arrêter l'indicateur de frappe
    setIsTyping(false);
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
  }, [
    inputValue, 
    user, 
    roomCode, 
    isAdmin, 
    parseAdminCommand,
    addUserMessage,
    addSystemMessage
  ]);

  // Gestion des commandes admin
  const handleAdminCommand = useCallback((command: any) => {
    if (!command.target) {
      addSystemMessage(roomCode, '❌ Nom d\'utilisateur requis pour cette commande', 'warning');
      return;
    }

    // Trouver l'utilisateur cible (simulation - en réalité, chercher dans la liste des utilisateurs)
    const targetUserStatus = getUserModerationStatus(roomCode, command.target);

    switch (command.command) {
      case 'warn':
        warnUser(roomCode, command.target, user?.id || '', command.reason || 'Avertissement admin');
        break;
      case 'mute':
        muteUser(roomCode, command.target, user?.id || '', command.duration || 5, command.reason || 'Muté par admin');
        break;
      case 'block':
        blockUser(roomCode, command.target, user?.id || '', command.duration || 0, command.reason || 'Bloqué par admin');
        break;
      case 'unmute':
        // unmuteUser(roomCode, command.target, user?.id || '');
        break;
      case 'unblock':
        // unblockUser(roomCode, command.target, user?.id || '');
        break;
      case 'clear':
        clearChatMessages(roomCode);
        addSystemMessage(roomCode, '🧹 Chat nettoyé par un admin', 'info');
        break;
    }
  }, [roomCode, user?.id, warnUser, muteUser, blockUser, clearChatMessages, addSystemMessage]);

  // Gestion de la saisie de texte avec debouncing pour l'indicateur de frappe
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    
    // Gestion de l'indicateur de frappe avec debouncing
    if (!isTyping && e.target.value.length > 0) {
      setIsTyping(true);
      // Envoyer event typing start via Socket.io (à implémenter côté serveur)
      // emit.startTyping(roomCode, user?.id);
    }
    
    // Reset du timeout de frappe
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      // emit.stopTyping(roomCode, user?.id);
    }, 1000);
  }, [isTyping, roomCode, user?.id]);

  // Gestion des touches du clavier
  const handleKeyPress = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  // Emojis communs pour le sélecteur
  const commonEmojis = ['😀', '😂', '🤔', '👍', '❤️', '🎉', '😎', '🔥', '💯', '🚀'];

  // Fonction pour ouvrir le modal de signalement d'un message
  const handleReportMessage = useCallback((userId: string) => {
    setReportTargetId(userId);
    setShowReportModal(true);
  }, []);

  // Fonction pour ajouter un emoji au message
  const addEmoji = useCallback((emoji: string) => {
    setInputValue(prev => prev + emoji);
    setShowEmojiPicker(false);
    inputRef.current?.focus();
  }, []);

  return (
    <motion.div 
      className={`flex flex-col ${className}`}
      variants={chatContainerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      {/* En-tête du chat */}
      <motion.div 
        className="flex items-center justify-between p-4 border-b border-white/10"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-center space-x-2">
          <AnimatedBadge count={unreadCount}>
            <Users className="w-4 h-4 text-white" />
          </AnimatedBadge>
          <h3 className="text-white font-medium">Discussion</h3>
        </div>
        
        <div className="flex items-center space-x-3">
          <motion.div 
            className="text-white/60 text-sm"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            {Object.keys(currentRoom?.users || {}).length} participants
          </motion.div>
          
          {/* Boutons de modération pour les admins */}
          {isAdmin && (
            <motion.div 
              className="flex items-center space-x-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              <button
                onClick={() => setShowModerationPanel(true)}
                className="flex items-center space-x-1 px-3 py-1 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors text-red-400 hover:text-red-300"
                title="Panneau de modération"
              >
                <Shield className="w-4 h-4" />
                <span className="text-sm">Modérer</span>
                {false && (
                  <motion.span 
                    className="bg-red-500 text-white text-xs rounded-full px-2 py-1 min-w-[16px] h-4 flex items-center justify-center"
                    initial={{ scale: 0 }}
                    animate={{ scale: [0, 1.2, 1] }}
                    transition={{ duration: 0.5, ease: EASINGS.elastic }}
                  >
                    !
                  </motion.span>
                )}
              </button>
            </motion.div>
          )}
          
          {/* Bouton de signalement pour tous les utilisateurs */}
          {user && (
            <motion.button
              onClick={() => setShowReportModal(true)}
              className="flex items-center space-x-1 px-3 py-1 bg-yellow-600/20 hover:bg-yellow-600/30 rounded-lg transition-colors text-yellow-400 hover:text-yellow-300"
              title="Signaler un problème"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Flag className="w-4 h-4" />
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Zone des messages */}
      <motion.div 
        ref={messagesContainerRef}
        onScroll={handleScroll}
        className="flex-1 p-4 overflow-y-auto space-y-3 min-h-0 group relative"
        variants={messageListVariants}
      >
        <AnimatePresence initial={false}>
          {displayMessages.map((message, index) => (
            <motion.div
              key={message.id}
              variants={messageItemVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              custom={index}
              layout
              className="group-item"
              onAnimationComplete={() => {
                if (index === displayMessages.length - 1 && message.userId !== user?.id) {
                  triggerNewMessageAnimation();
                }
              }}
            >
              <ChatMessageComponent
                message={message}
                currentUserId={user?.id}
                isAdmin={isAdmin}
                index={index}
                onAddReaction={(messageId, emoji) => addReaction(roomCode, messageId, emoji, user?.id || '')}
                onModerate={(messageId) => moderateUserMessage(roomCode, messageId)}
                onReport={handleReportMessage}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        
        {/* Indicateur de frappe */}
        <AnimatePresence>
          {typingUsers.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.3 }}
            >
              <TypingIndicator users={typingUsers} />
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
        
        {/* Indicateur de nouveaux messages */}
        <NewMessageIndicator 
          isVisible={showNewMessageIndicator}
          onClick={scrollToBottom}
        />
        
        {/* Bouton pour charger plus de messages */}
        {showLoadMore && (
          <div className="flex justify-center py-4">
            <Button 
              onClick={loadMoreMessages} 
              className={`px-4 py-2 ${isLoadingHistory ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={isLoadingHistory}
            >
              {isLoadingHistory ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <span>Chargement...</span>
                </div>
              ) : (
                'Charger plus de messages'
              )}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Zone de saisie */}
      <motion.div 
        className="p-4 border-t border-white/10 relative"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Sélecteur d'emojis */}
        <AnimatePresence>
          {showEmojiPicker && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="absolute bottom-full left-4 right-4 mb-2 bg-gray-800 rounded-lg p-3 border border-white/20 shadow-xl"
            >
              <motion.div 
                className="grid grid-cols-5 gap-2"
                variants={{
                  hidden: { opacity: 0 },
                  visible: { 
                    opacity: 1,
                    transition: { staggerChildren: 0.03 }
                  }
                }}
                initial="hidden"
                animate="visible"
              >
                {commonEmojis.map(emoji => (
                  <motion.button
                    key={emoji}
                    onClick={() => addEmoji(emoji)}
                    className="text-2xl hover:bg-white/10 rounded p-2 transition-colors"
                    variants={{
                      hidden: { opacity: 0, scale: 0.8 },
                      visible: { opacity: 1, scale: 1 }
                    }}
                    whileHover={{ scale: 1.1, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    {emoji}
                  </motion.button>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex space-x-2">
          <motion.button
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="px-3 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-white"
            title="Emojis"
            whileHover={{ scale: 1.05, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
            whileTap={{ scale: 0.95 }}
          >
            <Smile className="w-4 h-4" />
          </motion.button>
          
          <motion.div 
            className="flex-1"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Input
              ref={inputRef}
              value={inputValue}
              onChange={handleInputChange}
              onKeyPress={handleKeyPress}
              placeholder="Tapez votre message..."
              disabled={!user}
              className="bg-white/10 border-white/20 text-white placeholder-white/50"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.7 }}
          >
            <Button
              onClick={handleSendMessage}
              disabled={!inputValue.trim() || !user}
              className="px-3"
            >
              <Send className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Indicateur de performance (visible pour les admins en mode debug) */}
      <ChatPerformanceIndicator
        stats={performanceStats}
        isVisible={isAdmin && process.env.NODE_ENV === 'development'}
      />

      {/* Panneau de modération (pour les admins) */}
      <ModerationPanel
        roomCode={roomCode}
        currentUserId={user?.id || ''}
        isVisible={showModerationPanel}
        onClose={() => setShowModerationPanel(false)}
        userStatuses={moderationData.userStatuses}
        reports={moderationData.reports}
      />

      {/* Modal de signalement (pour tous les utilisateurs) */}
      <ReportModal
        roomCode={roomCode}
        userId={user?.id || ''}
        userName={user?.username || ''}
        isVisible={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetUserId={reportTargetId}
        targetUserName={reportTargetId ? 'Utilisateur' : null}
      />
    </motion.div>
  );
}
