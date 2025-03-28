import { FC, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { websocketService } from '@/lib/websocket';
import { playNotificationSound, initializeAudio } from '@/lib/audio';
import { useNotifications } from '@/contexts/NotificationContext';

export const TestNotifications: FC = () => {
  const { soundEnabled } = useNotifications();
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [initializationInProgress, setInitializationInProgress] = useState(false);
  
  const initializeAudioSystem = () => {
    console.log('Initializing audio system...');
    setInitializationInProgress(true);
    
    // Call initializeAudio which must be triggered by a user interaction
    initializeAudio()
      .then(() => {
        console.log('Audio system initialized successfully');
        setAudioInitialized(true);
        setInitializationInProgress(false);
      })
      .catch(error => {
        console.error('Failed to initialize audio system:', error);
        setInitializationInProgress(false);
      });
  };
  
  const sendTestMessage = () => {
    const testMessage = {
      type: 'new_message',
      message: {
        id: 999,
        sessionId: 'test-session',
        content: 'This is a test notification message from the client.',
        isUser: false,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('Simulating new message notification');
    websocketService.simulateMessage('new_message', testMessage);
    
    // Try to initialize audio if not already initialized
    if (!audioInitialized && !initializationInProgress) {
      initializeAudioSystem();
    }
  };
  
  const sendTestTradeUpdate = () => {
    const testTrade = {
      type: 'trade_update',
      trade: {
        id: 101,
        status: 'approved',
        tradeType: 'Loan',
        amount: '1,000,000',
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('Simulating trade update notification');
    websocketService.simulateMessage('trade_update', testTrade);
    
    // Try to initialize audio if not already initialized
    if (!audioInitialized && !initializationInProgress) {
      initializeAudioSystem();
    }
  };
  
  const testSound = () => {
    console.log('Testing notification sound');
    
    // If audio is not initialized, initialize it first
    if (!audioInitialized) {
      initializeAudioSystem();
      return;
    }
    
    if (soundEnabled) {
      playNotificationSound()
        .then(() => console.log('Sound played successfully'))
        .catch(error => console.error('Error playing sound:', error));
    } else {
      console.log('Sound is disabled, enable it first');
    }
  };
  
  return (
    <div className="fixed left-4 bottom-4 z-50 flex gap-2 flex-wrap">
      <Button 
        variant="default" 
        size="sm" 
        onClick={sendTestMessage}
        className="bg-blue-600 hover:bg-blue-700"
      >
        Test Message Notification
      </Button>
      <Button 
        variant="default" 
        size="sm" 
        onClick={sendTestTradeUpdate}
        className="bg-green-600 hover:bg-green-700"
      >
        Test Trade Notification
      </Button>
      <Button
        variant={audioInitialized ? "default" : "outline"}
        size="sm"
        onClick={testSound}
        className={audioInitialized 
          ? "bg-purple-600 hover:bg-purple-700" 
          : "border-purple-600 text-purple-600 hover:bg-purple-100"}
        disabled={initializationInProgress}
      >
        {initializationInProgress 
          ? "Initializing..." 
          : audioInitialized 
            ? "Test Sound" 
            : "Initialize Sound"}
      </Button>
    </div>
  );
};