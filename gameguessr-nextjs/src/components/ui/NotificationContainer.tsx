import React from 'react';
import Notification from './Notification';
import { useNotifications, NotificationData } from '@/hooks/useNotifications';

interface NotificationContainerProps {
  className?: string;
}

const NotificationContainer: React.FC<NotificationContainerProps> = ({ className = '' }) => {
  const { notifications, removeNotification } = useNotifications();

  return (
    <div className={`fixed top-0 right-0 z-50 p-4 space-y-2 ${className}`}>
      {notifications.map((notification) => (
        <Notification
          key={notification.id}
          isVisible={true}
          type={notification.type}
          title={notification.title}
          content={notification.content}
          autoClose={notification.autoClose}
          duration={notification.duration}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

export default NotificationContainer;
