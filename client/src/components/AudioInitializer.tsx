import { FC, useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { initializeAudio } from '@/lib/audio';
import { useNotifications } from '@/contexts/NotificationContext';

/**
 * This component handles audio initialization in the application
 * It shows a floating button that users can click to enable audio
 * Once audio is initialized, it becomes a sound toggle
 */
export const AudioInitializer: FC = () => {
  const { soundEnabled, toggleSound } = useNotifications();
  const [showButton, setShowButton] = useState(true);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [initializing, setInitializing] = useState(false);
  
  // Auto-hide the button after audio is initialized and a delay
  useEffect(() => {
    if (audioInitialized) {
      const timer = setTimeout(() => {
        setShowButton(false);
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [audioInitialized]);
  
  const initializeAudioSystem = () => {
    if (initializing || audioInitialized) return;
    
    setInitializing(true);
    initializeAudio()
      .then(() => {
        setAudioInitialized(true);
        setInitializing(false);
      })
      .catch(error => {
        console.error('Failed to initialize audio:', error);
        setInitializing(false);
      });
  };
  
  const handleClick = () => {
    if (!audioInitialized) {
      initializeAudioSystem();
    } else {
      toggleSound();
    }
  };
  
  // Mouse enter handler to show button if audio is initialized
  const handleMouseEnter = () => {
    if (audioInitialized) {
      setShowButton(true);
    }
  };
  
  if (!showButton && audioInitialized) {
    // Show a small dot indicator when button is hidden
    return (
      <div 
        className="fixed right-4 top-20 z-50 w-3 h-3 rounded-full bg-purple-500 shadow-md cursor-pointer"
        onMouseEnter={handleMouseEnter}
      />
    );
  }
  
  return (
    <div className="fixed right-4 top-20 z-50">
      <Button
        variant="outline"
        size="sm"
        onClick={handleClick}
        disabled={initializing}
        className={`shadow-md transition-all duration-300 ${
          !audioInitialized 
            ? 'bg-purple-100 border-purple-500 text-purple-700 hover:bg-purple-200' 
            : 'bg-white'
        }`}
      >
        {!audioInitialized ? (
          initializing ? 'Initializing...' : 'Enable Notifications'
        ) : (
          <>
            {soundEnabled ? <Volume2 size={16} /> : <VolumeX size={16} />}
            <span className="ml-2">{soundEnabled ? 'Sound On' : 'Sound Off'}</span>
          </>
        )}
      </Button>
    </div>
  );
};