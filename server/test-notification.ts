import { WebSocketServer, WebSocket } from 'ws';

// This function simulates sending a notification via the global broadcastNotification function
export function sendTestNotification() {
  // Access the global broadcastNotification function
  const broadcastNotificationFunc = (global as any).broadcastNotification;
  
  if (!broadcastNotificationFunc) {
    console.error("broadcastNotification is not defined globally. Make sure the WebSocket server is running.");
    return;
  }
  
  // Create a test notification for a new message
  const messageNotification = {
    type: 'new_message',
    message: {
      id: 999,
      sessionId: 'test-session',
      content: 'This is a test notification message from the server.',
      isUser: false,
      timestamp: new Date().toISOString()
    }
  };
  
  // Send the notification
  console.log('Sending test notification...');
  broadcastNotificationFunc(messageNotification);
  console.log('Test notification sent!');
  
  // Also send a trade update notification after 3 seconds
  setTimeout(() => {
    const tradeNotification = {
      type: 'trade_update',
      trade: {
        id: 101,
        status: 'approved',
        tradeType: 'Loan',
        amount: '1,000,000',
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('Sending test trade notification...');
    broadcastNotificationFunc(tradeNotification);
    console.log('Test trade notification sent!');
  }, 3000);
}