import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { websocketService } from '@/lib/websocket';
import { Message } from '@/types';
import { playNotificationSound, initializeAudio } from '@/lib/audio';

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
  type: 'new_message' | 'trade_update' | 'system' | 'maturity_reminder'; // Type of notification
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
    
    // Handle maturity reminders
    const handleMaturityReminder = (data: any) => {
      if (!data.message) return;
      
      // Create a notification for the maturity reminder
      const notification: Notification = {
        id: `maturity-${Date.now()}`,
        type: 'maturity_reminder',
        content: `Maturity reminder: ${data.message.content}`,
        timestamp: data.message.timestamp || new Date().toISOString(),
        read: false,
        data: {
          ...data.message,
          isMaturityReminder: true // Add the flag to identify this as a maturity reminder
        }
      };
      
      addNotification(notification);
    };

    websocketService.addListener('new_message', handleNewMessage);
    websocketService.addListener('trade_update', handleTradeUpdate);
    websocketService.addListener('maturity_reminder', handleMaturityReminder);
    
    return () => {
      websocketService.removeListener('new_message', handleNewMessage);
      websocketService.removeListener('trade_update', handleTradeUpdate);
      websocketService.removeListener('maturity_reminder', handleMaturityReminder);
    };
  }, []);
  
  // Create refs for tracking user interaction
  const hasUserInteractedRef = useRef(false);
  const audioInitializedRef = useRef(false);
  
  // Initialize audio on mount and ensure we catch all user interactions
  useEffect(() => {
    const handleUserInteraction = () => {
      if (!hasUserInteractedRef.current) {
        hasUserInteractedRef.current = true;
        console.log("First user interaction detected, initializing audio system");
      }
      
      // Try to initialize audio on every user interaction until it succeeds
      if (!audioInitializedRef.current) {
        initializeAudio()
          .then(() => {
            console.log("Audio successfully initialized after user interaction");
            audioInitializedRef.current = true;
            
            // Try to play a test sound (silent or very low volume)
            const testAudio = new Audio('/sounds/notification.mp3');
            testAudio.volume = 0.01; // Almost silent
            testAudio.play().catch(err => {
              console.log("Test audio playback failed, but initialization succeeded");
            });
          })
          .catch(err => {
            console.warn('Failed to initialize audio on user interaction:', err);
          });
      }
    };
    
    // Listen for a wide array of user interactions
    const events = ['click', 'keydown', 'touchstart', 'mousedown'];
    events.forEach(event => document.addEventListener(event, handleUserInteraction, { once: false }));
    
    // Try to initialize audio right away - this might fail but we'll retry on user interaction
    if (!audioInitializedRef.current) {
      initializeAudio()
        .then(() => {
          console.log("Audio successfully initialized on mount");
          audioInitializedRef.current = true;
        })
        .catch(err => {
          console.log("Initial audio initialization failed, will retry on user interaction");
        });
    }
    
    return () => {
      events.forEach(event => document.removeEventListener(event, handleUserInteraction));
    };
  }, []);
  
  const addNotification = (notification: Notification) => {
    setNotifications(prev => [notification, ...prev].slice(0, 100)); // Limit to latest 100 notifications
    setLatestNotification(notification);
    
    // Play sound if enabled, audio is initialized, and the user has interacted with the document
    if (soundEnabled && hasUserInteractedRef.current && audioInitializedRef.current) {
      playNotificationSound().catch(err => {
        console.warn('Failed to play notification sound:', err);
      });
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