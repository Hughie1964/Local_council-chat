import React, { createContext, useContext, useState, useEffect } from 'react';
import { websocketService } from '@/lib/websocket';
import { Message } from '@/types';

// Sound effect for notifications
const notificationSound = new Audio('/sounds/notification.mp3');

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  latestNotification: Notification | null;
  soundEnabled: boolean;
  toggleSound: () => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

interface Notification {
  id: string; // Unique identifier for the notification
  type: 'new_message' | 'trade_update' | 'system'; // Type of notification
  content: string; // Content of the notification
  timestamp: string; // Timestamp of when the notification was created
  read: boolean; // Whether the notification has been read
  data?: any; // Additional data related to the notification
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [latestNotification, setLatestNotification] = useState<Notification | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  
  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Listen for WebSocket notifications
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (!data.message) return;
      
      const notification: Notification = {
        id: `msg-${Date.now()}`,
        type: 'new_message',
        content: `New message: ${data.message.content}`,
        timestamp: data.message.timestamp || new Date().toISOString(),
        read: false,
        data: data.message
      };
      
      addNotification(notification);
    };
    
    const handleTradeUpdate = (data: any) => {
      if (!data.trade) return;
      
      let content = '';
      if (data.trade.status === 'approved') {
        content = `Trade #${data.trade.id} approved: ${data.trade.tradeType} - £${data.trade.amount}`;
      } else if (data.trade.status === 'rejected') {
        content = `Trade #${data.trade.id} rejected: ${data.trade.tradeType} - £${data.trade.amount}`;
      } else {
        content = `Trade #${data.trade.id} updated: ${data.trade.status}`;
      }
      
      const notification: Notification = {
        id: `trade-${Date.now()}`,
        type: 'trade_update',
        content,
        timestamp: data.trade.timestamp || new Date().toISOString(),
        read: false,
        data: data.trade
      };
      
      addNotification(notification);
    };
    
    websocketService.addListener('new_message', handleNewMessage);
    websocketService.addListener('trade_update', handleTradeUpdate);
    
    return () => {
      websocketService.removeListener('new_message', handleNewMessage);
      websocketService.removeListener('trade_update', handleTradeUpdate);
    };
  }, []);
  
  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 100)); // Limit to latest 100 notifications
    setLatestNotification(notification);
    
    // Play sound if enabled
    if (soundEnabled) {
      try {
        notificationSound.currentTime = 0;
        notificationSound.play().catch(err => {
          console.warn('Failed to play notification sound:', err);
        });
      } catch (error) {
        console.warn('Error playing notification sound:', error);
      }
    }
  };
  
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    
    if (latestNotification?.id === id) {
      setLatestNotification(null);
    }
  };
  
  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
    setLatestNotification(null);
  };
  
  const clearNotifications = () => {
    setNotifications([]);
    setLatestNotification(null);
  };
  
  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  };
  
  return (
    <NotificationContext.Provider 
      value={{ 
        notifications, 
        unreadCount, 
        latestNotification, 
        soundEnabled,
        toggleSound,
        markAllAsRead, 
        markAsRead, 
        clearNotifications 
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};