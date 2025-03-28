import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { websocketService } from '@/lib/websocket';
import { playNotificationSound } from '@/lib/audio';
import { useNotifications } from '@/contexts/NotificationContext';

export const TestNotifications: FC = () => {
  const { soundEnabled } = useNotifications();
  
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
  };
  
  const testSound = () => {
    console.log('Testing notification sound');
    if (soundEnabled) {
      playNotificationSound()
        .then(() => console.log('Sound played successfully'))
        .catch(err => console.error('Error playing sound:', err));
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
        variant="default"
        size="sm"
        onClick={testSound}
        className="bg-purple-600 hover:bg-purple-700"
      >
        Test Sound
      </Button>
    </div>
  );
};