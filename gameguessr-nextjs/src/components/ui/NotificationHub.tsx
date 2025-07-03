'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications } from '@/hooks/useNotifications';
import { DURATIONS, EASINGS, staggerChildren } from '@/utils/animations';
import { useGameStore, useGameActions } from '@/store/gameStore';
import { Bell, MessageCircle, Info, X, AlertTriangle, CheckCircle } from 'lucide-react';

const NotificationHub: React.FC = () => {
  const { notifications, removeNotification } = useNotifications();
  const [mounted, setMounted] = useState(false);
  const reducedMotion = false; // Simplifié
  
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Simplifié - plus de triggerAnimation

  if (!mounted) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'system':
        return <Bell className="w-5 h-5" />;
      case 'message':
        return <MessageCircle className="w-5 h-5" />;
      case 'error':
        return <AlertTriangle className="w-5 h-5" />;
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'game':
      default:
        return <Info className="w-5 h-5" />;
    }
  };

  const getNotificationStyle = (type: string) => {
    switch (type) {
      case 'system':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-500';
      case 'message':
        return 'bg-purple-500/10 border-purple-500/30 text-purple-500';
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-500';
      case 'success':
        return 'bg-green-500/10 border-green-500/30 text-green-500';
      case 'game':
      default:
        return 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500';
    }
  };

  return (
    <motion.div
      className="fixed top-4 right-4 z-50 flex flex-col items-end space-y-2 max-w-sm w-full pointer-events-none"
      variants={staggerChildren}
      initial="hidden"
      animate="visible"
    >
      <AnimatePresence>
        {notifications.map((notification) => (
          <motion.div
            key={notification.id}
            className="pointer-events-auto w-full"
            initial={{ opacity: 0, y: -50, x: 100 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 100 }}
            transition={{
              duration: reducedMotion ? DURATIONS.fast : DURATIONS.normal,
              ease: EASINGS.smooth
            }}
            layout
          >
            <div className={`rounded-lg border shadow-lg overflow-hidden ${getNotificationStyle(notification.type)}`}>
              <div className="p-4 flex items-start gap-3">
                <div className="flex-shrink-0 pt-0.5">
                  {getIcon(notification.type)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm mb-1">{notification.title}</div>
                  <div className="text-sm opacity-90 line-clamp-2">{notification.content}</div>
                </div>
                
                <button
                  onClick={() => removeNotification(notification.id)}
                  className="flex-shrink-0 opacity-70 hover:opacity-100 transition-opacity p-1 rounded-full hover:bg-white/10"
                  aria-label="Fermer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              
              {notification.autoClose && (
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ 
                    duration: (notification.duration || 4000) / 1000, 
                    ease: "linear"
                  }}
                  className="h-1 bg-current opacity-30"
                />
              )}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default NotificationHub;
