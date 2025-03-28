import React, { FC, useEffect, useState } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationPopup } from './NotificationPopup';

export const NotificationDisplay: FC = () => {
  const { latestNotification, markAsRead } = useNotifications();
  const [showNotification, setShowNotification] = useState(false);

  // Show notification when a new one arrives
  useEffect(() => {
    if (latestNotification && !latestNotification.read) {
      setShowNotification(true);
    }
  }, [latestNotification]);

  const handleClose = () => {
    setShowNotification(false);
    if (latestNotification) {
      markAsRead(latestNotification.id);
    }
  };

  return showNotification ? <NotificationPopup /> : null;
};