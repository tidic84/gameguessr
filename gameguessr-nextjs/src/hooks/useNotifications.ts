import { useState, useCallback } from 'react';

export interface NotificationData {
  id: string;
  type: 'message' | 'system' | 'game' | 'error' | 'success';
  title: string;
  content: string;
  autoClose?: boolean;
  duration?: number;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  const addNotification = useCallback((notification: Omit<NotificationData, 'id'>) => {
    const id = `notification_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: NotificationData = {
      id,
      autoClose: true,
      duration: 4000,
      ...notification,
    };

    setNotifications(prev => [...prev, newNotification]);

    // Auto-remove si autoClose est activé
    if (newNotification.autoClose) {
      setTimeout(() => {
        removeNotification(id);
      }, newNotification.duration);
    }

    return id;
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  // Helpers pour créer des notifications spécifiques
  const notifyNewMessage = useCallback((userName: string, message: string) => {
    return addNotification({
      type: 'message',
      title: `Nouveau message de ${userName}`,
      content: message.length > 50 ? `${message.substring(0, 50)}...` : message,
    });
  }, [addNotification]);

  const notifySystemEvent = useCallback((title: string, content: string) => {
    return addNotification({
      type: 'system',
      title,
      content,
    });
  }, [addNotification]);

  const notifyGameEvent = useCallback((title: string, content: string) => {
    return addNotification({
      type: 'game',
      title,
      content,
      duration: 6000, // Game events stay longer
    });
  }, [addNotification]);

  const notifyError = useCallback((title: string, content: string) => {
    return addNotification({
      type: 'error',
      title,
      content,
      duration: 6000,
    });
  }, [addNotification]);

  const notifySuccess = useCallback((title: string, content: string) => {
    return addNotification({
      type: 'success',
      title,
      content,
      duration: 4000,
    });
  }, [addNotification]);

  return {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications,
    notifyNewMessage,
    notifySystemEvent,
    notifyGameEvent,
    notifyError,
    notifySuccess,
  };
};

export default useNotifications;
