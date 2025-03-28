import React, { createContext, useContext, useState } from 'react';

interface NotificationContextType {
  showNotification: (title: string, message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // This is a placeholder implementation that doesn't actually show notifications
  // Uses toast from react-hot-toast or a similar library in a real implementation
  const showNotification = (title: string, message: string) => {
    console.log(`NOTIFICATION: ${title} - ${message}`);
    // In a real implementation, this would trigger a toast or notification
  };

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
    </NotificationContext.Provider>
  );
};