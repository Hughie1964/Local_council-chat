import React, { FC, useEffect, useState, useCallback } from 'react';
import { useNotifications } from '@/contexts/NotificationContext';
import { NotificationPopup } from './NotificationPopup';
import { VolumeX, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { initializeAudio, playNotificationSound } from '@/lib/audio';

export const NotificationDisplay: FC = () => {
  const { latestNotification, markAsRead, soundEnabled, toggleSound } = useNotifications();
  const [showNotification, setShowNotification] = useState(false);
  const [showSoundButton, setShowSoundButton] = useState(false);

  // Initialize audio on mount with user interaction
  const initAudio = useCallback(() => {
    // This is user triggered, so it should work
    initializeAudio()
      .then(() => {
        // Try playing a test sound (very low volume)
        const testAudio = new Audio('/sounds/notification.mp3');
        testAudio.volume = 0.01; // Almost silent
        return testAudio.play();
      })
      .then(() => {
        console.log('Audio system working perfectly!');
        // Maybe play a real but quiet notification to confirm to the user it's working
        if (soundEnabled) {
          setTimeout(() => playNotificationSound(), 300);
        }
      })
      .catch(err => {
        console.warn('Audio still has issues:', err);
      });
  }, [soundEnabled]);

  // Show notification when a new one arrives
  useEffect(() => {
    if (latestNotification && !latestNotification.read) {
      setShowNotification(true);
    }
  }, [latestNotification]);

  // Show sound button after component mounts
  useEffect(() => {
    // Small delay to let the UI settle
    const timer = setTimeout(() => {
      setShowSoundButton(true);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setShowNotification(false);
    if (latestNotification) {
      markAsRead(latestNotification.id);
    }
  };

  return (
    <>
      {showNotification && <NotificationPopup />}
      
      {showSoundButton && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 rounded-full shadow-md z-50 bg-white"
          onClick={() => {
            toggleSound();
            initAudio();
          }}
          title={soundEnabled ? 'Disable notification sounds' : 'Enable notification sounds'}
        >
          {soundEnabled ? 
            <Volume2 className="h-4 w-4 text-primary" /> : 
            <VolumeX className="h-4 w-4 text-muted-foreground" />
          }
        </Button>
      )}
    </>
  );
};