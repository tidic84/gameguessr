import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Bell, X } from 'lucide-react';

interface NotificationProps {
  isVisible: boolean;
  type: 'message' | 'system' | 'game';
  title: string;
  content: string;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({
  isVisible,
  type,
  title,
  content,
  onClose,
  autoClose = true,
  duration = 4000
}) => {
  React.useEffect(() => {
    if (isVisible && autoClose) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isVisible, autoClose, duration, onClose]);

  const getNotificationStyle = () => {
    switch (type) {
      case 'system':
        return 'bg-blue-500 border-blue-400';
      case 'game':
        return 'bg-green-500 border-green-400';
      case 'message':
      default:
        return 'bg-purple-500 border-purple-400';
    }
  };

  const getIcon = () => {
    switch (type) {
      case 'system':
        return <Bell className="w-5 h-5" />;
      case 'game':
        return <span className="text-lg">🎮</span>;
      case 'message':
      default:
        return <MessageCircle className="w-5 h-5" />;
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -50, x: 300 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: -50, x: 300 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className={`fixed top-4 right-4 max-w-sm w-full rounded-lg border-2 text-white shadow-xl z-50 ${getNotificationStyle()}`}
        >
          <div className="p-4 flex items-start gap-3">
            <div className="flex-shrink-0 pt-0.5">
              {getIcon()}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm mb-1">{title}</div>
              <div className="text-sm opacity-90 line-clamp-2">{content}</div>
            </div>
            
            <button
              onClick={onClose}
              className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          {/* Barre de progression pour auto-close */}
          {autoClose && (
            <motion.div
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: duration / 1000, ease: "linear" }}
              className="h-1 bg-white/30 rounded-b-lg"
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Notification;
