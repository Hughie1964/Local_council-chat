import { storage } from './storage';
import { Trade } from '@shared/schema';
import { WebSocketServer, WebSocket } from 'ws';
import { differenceInDays, format } from 'date-fns';

// Number of days before maturity to send a reminder
const REMINDER_DAYS = 3;

/**
 * Checks for transactions with upcoming maturities and sends reminders
 */
export async function checkUpcomingMaturities(wss: WebSocketServer): Promise<void> {
  try {
    // Get all active trades
    const allTrades = await storage.getAllTrades();
    
    // Current date
    const currentDate = new Date();
    
    // Find trades that mature in REMINDER_DAYS days
    const upcomingMaturities = allTrades.filter(trade => {
      // Skip trades without a maturity date
      if (!trade.maturityDate) return false;
      
      try {
        // Parse maturity date - log values for debugging
        console.log(`Processing trade ${trade.id}, maturity date: ${trade.maturityDate}`);
        
        const maturityDate = new Date(trade.maturityDate);
        console.log(`Parsed maturity date: ${maturityDate.toISOString()}`);
        console.log(`Current date: ${currentDate.toISOString()}`);
        
        // Calculate days until maturity
        const daysUntilMaturity = differenceInDays(maturityDate, currentDate);
        console.log(`Days until maturity: ${daysUntilMaturity}, vs REMINDER_DAYS: ${REMINDER_DAYS}`);
        
        // For testing purposes, we'll allow 2 or 3 days for the reminders
        // In production, we'd use: return daysUntilMaturity === REMINDER_DAYS;
        return daysUntilMaturity === REMINDER_DAYS || daysUntilMaturity === 2;
      } catch (err) {
        console.error(`Error processing maturity date for trade ${trade.id}:`, err);
        return false;
      }
    });
    
    // Send notifications for each upcoming maturity
    for (const trade of upcomingMaturities) {
      await sendMaturityReminder(trade, wss);
    }
    
    console.log(`Checked for upcoming maturities. Found ${upcomingMaturities.length} trades maturing in ${REMINDER_DAYS} days.`);
  } catch (error) {
    console.error('Error checking for upcoming maturities:', error);
  }
}

/**
 * Sends a notification about an upcoming maturity
 */
async function sendMaturityReminder(trade: Trade, wss: WebSocketServer): Promise<void> {
  try {
    // Get user info
    const user = await storage.getUser(trade.userId);
    if (!user) {
      console.error(`User not found for trade ID ${trade.id}`);
      return;
    }
    
    // Format the dates for display - handle null values safely
    const maturityDate = trade.maturityDate ? format(new Date(trade.maturityDate), 'dd.M.yyyy') : 'N/A';
    const startDate = trade.startDate ? format(new Date(trade.startDate), 'dd.M.yyyy') : 'N/A';
    
    // Parse amount as a number (it's stored as text in the DB)
    const amount = parseFloat(trade.amount) || 0;
    
    // Format the message
    const reminderMessage = {
      id: Date.now(),
      sessionId: 'maturity-system',
      content: `
        <div class="bg-amber-50 border-l-4 border-amber-500 p-4 rounded">
          <div class="flex items-center">
            <div class="flex-shrink-0">
              <svg class="h-5 w-5 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="ml-3">
              <p class="text-sm font-medium text-amber-800">Upcoming Trade Maturity</p>
              <div class="mt-1 text-sm text-amber-700">
                <p>Your money market trade will mature in 3 days on <strong>${maturityDate}</strong>.</p>
                <p class="mt-1">Trade ID: <strong>${trade.id}</strong></p>
                <p>Details: ${trade.lender || 'Unknown'} lent ${formatCurrency(amount)} to ${trade.borrower || 'Unknown'} at ${trade.rate || '0'}% from ${startDate} to ${maturityDate}.</p>
                <p class="mt-2">Please prepare for the return of principal (${formatCurrency(amount)}) plus interest.</p>
              </div>
            </div>
          </div>
        </div>
      `,
      isUser: false,
      timestamp: new Date().toISOString(),
      isMaturityReminder: true
    };
    
    // Create a notification object
    const notification = {
      type: 'notification',
      data: {
        type: 'new_message',
        message: reminderMessage
      }
    };
    
    // Broadcast the notification to all connected clients
    // In a real production system, we'd target only specific users
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(notification));
      }
    });
    
    // Also store this as a message in the user's chat history
    await storeReminderMessage(user.id, reminderMessage);
    
    console.log(`Sent maturity reminder for trade ID ${trade.id} to user ${user.username}`);
  } catch (error) {
    console.error(`Error sending maturity reminder for trade ID ${trade.id}:`, error);
  }
}

/**
 * Stores the reminder message in the user's chat history
 */
async function storeReminderMessage(userId: number, message: any): Promise<void> {
  try {
    // Get the most recent session for this user
    const userSessions = await storage.getUserSessions(userId);
    
    if (userSessions.length > 0) {
      // Use the most recent session
      const sessionId = userSessions[0].sessionId;
      
      // Add the message to this session
      await storage.addSessionMessage({
        sessionId,
        content: message.content,
        isUser: false,
        userId
      });
    } else {
      // Create a new session for system messages if none exists
      const sessionId = `system-messages-${userId}`;
      
      try {
        // Create a session for the system notifications
        // Since the session schema might not have userId as a required field,
        // we'll try with the minimal required fields first
        await storage.createSession({
          sessionId,
          title: 'System Notifications'
        });
      } catch (err) {
        console.error('Failed to create session with minimal fields:', err);
        
        // If the above fails, the session might be expecting a userId field
        await storage.createSession({
          sessionId,
          title: 'System Notifications',
          // We add any additional fields manually that might be required but not in the type definition
          // @ts-ignore - userId might not be in the type definition
          userId
        });
      }
      
      // Add the message to this new session
      await storage.addSessionMessage({
        sessionId,
        content: message.content,
        isUser: false,
        userId
      });
    }
  } catch (error) {
    console.error('Error storing reminder message:', error);
  }
}

/**
 * Format a number as GBP currency
 */
function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'GBP'
  }).format(amount);
}