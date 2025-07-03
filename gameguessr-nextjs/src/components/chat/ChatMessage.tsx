import React, { memo, useState } from 'react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { ChatMessage, useAnimationSettings, useAnimation, useAnimationActions } from '@/store/gameStore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Flag, Check, X, Heart, Star, Smile } from 'lucide-react';
import { DURATIONS, EASINGS, fadeAnimation } from '@/utils/animations';
import { type LucideIcon } from 'lucide-react';

interface ActionButtonProps {
  onClick: () => void;
  icon: LucideIcon;
}

const ActionButton = ({ onClick, icon: Icon }: ActionButtonProps) => (
  <motion.button
    className="p-1 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700"
    whileHover={{ scale: 1.1 }}
    onClick={onClick}
  >
    <Icon size={16} />
  </motion.button>
);

interface ChatMessageProps {
  message: ChatMessage;
  currentUserId?: string;
  onAddReaction?: (messageId: string, emoji: string) => void;
  onModerate?: (messageId: string) => void;
  onReport?: (userId: string) => void;
  isAdmin?: boolean;
  index?: number;
}

const messageVariants: Variants = {
  hidden: { 
    opacity: 0,
    y: 20,
    scale: 0.95
  },
  visible: (i: number) => ({ 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      delay: i * 0.05,
      duration: DURATIONS.normal,
      ease: EASINGS.smooth
    }
  }),
  exit: { 
    opacity: 0,
    x: -10,
    transition: {
      duration: DURATIONS.fast
    }
  }
};

const reactionVariants: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: {
      duration: 0.2,
      ease: 'easeOut'
    }
  },
  hover: { 
    scale: 1.2,
    transition: { 
      duration: 0.2
    }
  }
};

const ChatMessageComponent = memo<ChatMessageProps>(({
  message,
  currentUserId,
  onAddReaction,
  onModerate,
  onReport,
  isAdmin,
  index = 0
}) => {
  const isOwnMessage = message.userId === currentUserId;
  const timestamp = format(new Date(message.timestamp), 'HH:mm', { locale: fr });
  const hasReactions = message.reactions && Object.keys(message.reactions).length > 0;
  const [showReactionButtons, setShowReactionButtons] = useState(false);
  
  // Hooks d'animation
  const animationSettings = useAnimationSettings();
  const { triggerAnimation } = useAnimationActions();

  const getMessageClasses = () => {
    const baseClasses = 'px-4 py-2 rounded-lg shadow-sm mb-2 max-w-[80%] break-words';
    
    switch (message.type) {
      case 'user':
        return isOwnMessage 
          ? `${baseClasses} bg-blue-500 text-white self-end` 
          : `${baseClasses} bg-gray-700 text-white self-start`;
      case 'system':
        return `${baseClasses} bg-gray-800 text-gray-300 italic self-center text-center max-w-[90%]`;
      case 'game':
        return `${baseClasses} bg-purple-600 text-white self-center max-w-[90%]`;
      case 'admin':
        return `${baseClasses} bg-red-600 text-white self-center max-w-[90%]`;
      case 'warning':
        return `${baseClasses} bg-yellow-600 text-white self-center max-w-[90%]`;
      case 'error':
        return `${baseClasses} bg-red-700 text-white self-center max-w-[90%]`;
      case 'info':
        return `${baseClasses} bg-blue-600 text-white self-center max-w-[90%]`;
      default:
        return `${baseClasses} bg-gray-700 text-white self-start`;
    }
  };

  const getGameClasses = () => {
    const baseClasses = 'p-2 rounded my-1';
    
    if (message.type === 'game' && message.subtype) {
      switch (message.subtype) {
        case 'roundStart':
          return `${baseClasses} bg-green-100 border-l-4 border-green-500 text-green-800 font-medium`;
        case 'roundEnd':
          return `${baseClasses} bg-blue-100 border-l-4 border-blue-500 text-blue-800 font-medium`;
        case 'score':
          return `${baseClasses} bg-purple-100 border-l-4 border-purple-500 text-purple-800 font-medium`;
        case 'guess':
          return `${baseClasses} bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 font-medium`;
        case 'notification':
          return `${baseClasses} bg-gray-100 border-l-4 border-gray-500 text-gray-800 font-medium`;
        default:
          return baseClasses;
      }
    }
    return baseClasses;
  };

  const getMessageIcon = () => {
    if (message.type === 'game' && message.subtype) {
      switch (message.subtype) {
        case 'roundStart': return '🎮';
        case 'roundEnd': return '🏁';
        case 'score': return '🏆';
        case 'guess': return '📍';
        case 'notification': return '📢';
        default: return undefined;
      }
    }
    return undefined;
  };

  return (
    <motion.div
      className="relative flex flex-col"
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      custom={index}
      whileHover={{ scale: 1.01 }}
      onHoverStart={() => setShowReactionButtons(true)}
      onHoverEnd={() => setShowReactionButtons(false)}
    >
      {/* Message header with username */}
      {message.type === 'user' && (
        <div className="text-xs text-gray-500 ml-1 mb-1">{message.username}</div>
      )}

      {/* Main message content */}
      <div className={getMessageClasses()}>
        {message.type === 'game' ? (
          <div className={getGameClasses()}>
            {getMessageIcon()}&nbsp;{message.content}
          </div>
        ) : (
          <>
            {message.content}
            {message.isModerated && (
              <span className="text-xs text-gray-400 ml-2">(modéré)</span>
            )}
          </>
        )}

        {/* Timestamp */}
        <div className="text-xs text-gray-400 mt-1">{timestamp}</div>
      </div>

      {/* Reactions section */}
      {hasReactions && (
        <motion.div
          className="flex flex-wrap gap-1 mt-1 ml-2"
          initial="hidden"
          animate="visible"
          variants={reactionVariants}
        >
          {Object.entries(message.reactions || {}).map(([emoji, users]) => (
            <motion.div
              key={emoji}
              className="flex items-center bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-1"
              whileHover="hover"
              variants={reactionVariants}
            >
              <span>{emoji}</span>
              <span className="text-xs ml-1">{users.length}</span>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Action buttons */}
      {showReactionButtons && message.type === 'user' && (
        <motion.div
          className="absolute -right-8 top-0 flex flex-col gap-1"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
        >
          <ActionButton onClick={() => onAddReaction?.(message.id, '❤️')} icon={Heart} />
          <ActionButton onClick={() => onAddReaction?.(message.id, '⭐')} icon={Star} />
          <ActionButton onClick={() => onAddReaction?.(message.id, '😊')} icon={Smile} />
          {isAdmin && (
            <>
              <ActionButton onClick={() => onModerate?.(message.id)} icon={Check} />
              <ActionButton onClick={() => onReport?.(message.userId)} icon={Flag} />
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  );
});

ChatMessageComponent.displayName = 'ChatMessageComponent';

export default ChatMessageComponent;
