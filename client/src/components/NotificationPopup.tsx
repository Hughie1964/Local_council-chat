import React, { useState, useEffect } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { X, Bell, Volume2, VolumeX } from 'lucide-react';
import { Message } from '@/types';
import { useLocation } from 'wouter';

interface NotificationPopupProps {
  message: Message | null;
  onClose: () => void;
  onViewMessage: () => void;
}

export const NotificationPopup: React.FC<NotificationPopupProps> = ({ 
  message, 
  onClose, 
  onViewMessage 
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const { soundEnabled, toggleSound } = useNotifications();

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
        onClose();
      }, 5000); // Auto-hide after 5 seconds
      
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message || !isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 max-w-sm w-full shadow-lg rounded-lg overflow-hidden z-50 
                  bg-gradient-to-r from-slate-800 to-slate-900 text-white border border-blue-600">
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-700 to-blue-800">
        <div className="flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          <span className="font-semibold">New Message</span>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={toggleSound}
            className="text-white hover:text-blue-200 transition-colors"
            title={soundEnabled ? "Mute notifications" : "Unmute notifications"}
          >
            {soundEnabled ? 
              <Volume2 className="h-5 w-5" /> : 
              <VolumeX className="h-5 w-5" />
            }
          </button>
          <button 
            onClick={() => {
              setIsVisible(false);
              onClose();
            }}
            className="text-white hover:text-blue-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <p className="text-sm truncate">{message.content}</p>
      </div>
      <div className="bg-slate-800 p-2 flex justify-end">
        <button 
          onClick={() => {
            setIsVisible(false);
            onViewMessage();
          }}
          className="text-xs px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white transition-colors"
        >
          View Message
        </button>
      </div>
    </div>
  );
};

// Notification Indicator for Header
export const NotificationIndicator: React.FC = () => {
  const { unreadCount, soundEnabled, toggleSound } = useNotifications();
  const [showDropdown, setShowDropdown] = useState(false);
  const [_, navigate] = useLocation();
  
  return (
    <div className="relative">
      <button 
        onClick={() => setShowDropdown(!showDropdown)}
        className="relative p-1 rounded-full hover:bg-slate-700 transition-colors"
        title="Notifications"
      >
        <Bell className="h-6 w-6 text-white" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
      
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <button
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                toggleSound();
              }}
            >
              {soundEnabled ? (
                <>
                  <VolumeX className="h-4 w-4 mr-2" />
                  <span>Mute Notifications</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  <span>Unmute Notifications</span>
                </>
              )}
            </button>
            <button
              className="flex w-full items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              onClick={() => {
                setShowDropdown(false);
                // Navigate to notifications page if available
              }}
            >
              <span>View All Notifications</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};