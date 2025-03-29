import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse, generateSessionTitle } from "./openai";
import { scrapeUKRates } from "./rates-scraper";
import { analyzeMessageForTrade } from "./trade-analyzer";
import { fetchUKEconomicNews, fetchUKFinancialHeadlines } from './news-service';
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { insertMessageSchema, insertTradeSchema, updateTradeSchema } from "@shared/schema";
import { WebSocketServer, WebSocket } from 'ws';
import { setupAuth } from "./auth";

// Type for chat request body
const chatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  sessionId: z.string().optional()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup authentication routes and middleware
  setupAuth(app);
  
  // prefix all routes with /api
  
  // Get council information based on authenticated user
  app.get("/api/council", async (req: Request, res: Response) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        // Return default council for unauthenticated users (for demo purposes)
        const defaultCouncil = {
          id: 1,
          name: "Birmingham City Council",
          councilId: "BCC-4578", 
          financialYear: "2023/24"
        };
        return res.json(defaultCouncil);
      }
      
      // Get the authenticated user
      const user = req.user;
      console.log("User council lookup for:", user.username, "councilId:", user.councilId);
      
      // If user has a councilId, use it to look up their council
      if (user.councilId) {
        // Try to find the user's council in the database by councilId
        console.log("Looking up council with councilId:", user.councilId);
        const userCouncil = await storage.getCouncilByCouncilId(user.councilId);
        
        if (userCouncil) {
          console.log("Found council:", userCouncil);
          return res.json(userCouncil);
        }
        
        console.log("Council not found in database");
        // If the council can't be found but user has councilId,
        // create a basic council with the ID
        const customCouncil = {
          id: 0, // Temporary ID
          name: `${user.username}'s Council`,
          councilId: user.councilId,
          financialYear: "2024-2025"
        };
        
        return res.json(customCouncil);
      }
      
      // If the user doesn't have a councilId, return the default council
      console.log("User has no councilId, returning default council");
      const defaultCouncil = {
        id: 1,
        name: "Birmingham City Council",
        councilId: "BCC-4578",
        financialYear: "2024-2025"
      };
      
      res.json(defaultCouncil);
    } catch (error) {
      console.error("Error fetching council information:", error);
      res.status(500).json({ message: "Failed to fetch council information" });
    }
  });

  // Get recent conversations/sessions
  app.get("/api/sessions", async (_req: Request, res: Response) => {
    try {
      const sessions = await storage.getSessions();
      res.json(sessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // Create a new session
  app.post("/api/sessions", async (_req: Request, res: Response) => {
    try {
      const sessionId = uuidv4();
      const session = await storage.createSession({
        sessionId,
        title: "New Conversation"
      });
      
      res.json({ sessionId });
    } catch (error) {
      console.error("Error creating session:", error);
      res.status(500).json({ message: "Failed to create session" });
    }
  });

  // Get messages for a session
  app.get("/api/messages/:sessionId", async (req: Request, res: Response) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getSessionMessages(sessionId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching messages:", error);
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  // Get current UK money market rates
  app.get("/api/rates", async (_req: Request, res: Response) => {
    try {
      const rates = await scrapeUKRates();
      res.json({ rates });
    } catch (error) {
      console.error("Error fetching UK money market rates:", error);
      res.status(500).json({ message: "Failed to fetch current market rates" });
    }
  });

  // Send a message to the AI and get a response
  app.post("/api/chat", async (req: Request, res: Response) => {
    try {
      const validatedData = chatRequestSchema.parse(req.body);
      const { message, sessionId: existingSessionId } = validatedData;
      
      // Create a new session if one doesn't exist
      let sessionId = existingSessionId;
      if (!sessionId) {
        sessionId = uuidv4();
        
        // Generate title from the first message
        const title = await generateSessionTitle(message);
        
        await storage.createSession({
          sessionId,
          title
        });
      }
      
      // Save the user message
      const savedMessage = await storage.createMessage({
        sessionId,
        content: message,
        isUser: true
      });
      
      // Check if the message contains a trade, negotiation, or confirmation
      const tradeDetails = await analyzeMessageForTrade(message);
      
      if (tradeDetails.isTradeRequest) {
        console.log("Detected trade activity:", tradeDetails);
        
        // Prepare trade description with additional details
        let tradeDescription = tradeDetails.details;
        
        // For trade confirmations, create a more detailed description
        if (tradeDetails.isConfirmation) {
          tradeDescription = `CONFIRMATION: ${tradeDetails.details}`;
        } 
        // For negotiations, specify that this is a price negotiation
        else if (tradeDetails.isNegotiation) {
          tradeDescription = `NEGOTIATION: ${tradeDetails.details}`;
        }
        
        // If we have rate information, include it in a structured format
        let formattedAmount = tradeDetails.amount || "Unknown amount";
        let formattedType = tradeDetails.tradeType || "Money Market Transaction";
        
        // Enhance trade type with period information if available
        if (tradeDetails.period) {
          formattedType += ` (${tradeDetails.period})`;
        }
        
        // Enhance amount with rate information if available
        if (tradeDetails.rate) {
          formattedAmount += ` at ${tradeDetails.rate}`;
        }
        
        // Add counterparty information if available
        let counterpartyInfo = "";
        if (tradeDetails.counterparty) {
          counterpartyInfo = ` with ${tradeDetails.counterparty}`;
        }
        
        // Store the trade with status based on whether it's a confirmation or negotiation
        await storage.createTrade({
          userId: 1, // Default user ID since we don't have auth yet
          sessionId, // Use the current sessionId
          messageId: savedMessage.id, // Use the id of the saved message
          details: tradeDescription,
          amount: formattedAmount,
          tradeType: formattedType + counterpartyInfo,
          rate: tradeDetails.rate || null, // Include the interest rate if available
          status: tradeDetails.isConfirmation ? "pending" : "negotiation"
        });
      }
      
      // Generate AI response
      const aiResponse = await generateChatResponse(message);
      
      // Save the AI response
      const aiMessage = await storage.createMessage({
        sessionId,
        content: aiResponse,
        isUser: false
      });
      
      // Broadcast notification of new message
      broadcastNotification({
        type: 'new_message',
        message: {
          id: aiMessage.id,
          sessionId: aiMessage.sessionId,
          content: aiMessage.content.substring(0, 100) + (aiMessage.content.length > 100 ? '...' : ''),
          timestamp: aiMessage.timestamp
        }
      });
      
      res.json({ 
        message: aiResponse,
        sessionId
      });
    } catch (error) {
      console.error("Error in chat endpoint:", error);
      res.status(500).json({ message: "Failed to process chat request" });
    }
  });

  // Trade management routes
  
  // Create a trade request
  app.post("/api/trades", async (req: Request, res: Response) => {
    try {
      const validatedData = insertTradeSchema.parse(req.body);
      const trade = await storage.createTrade(validatedData);
      
      res.status(201).json(trade);
    } catch (error) {
      console.error("Error creating trade request:", error);
      res.status(500).json({ message: "Failed to create trade request" });
    }
  });
  
  // Get all trades with optional status filter
  app.get("/api/trades", async (req: Request, res: Response) => {
    try {
      const status = req.query.status as "negotiation" | "pending" | "approved" | "rejected" | "executed" | undefined;
      const trades = await storage.getTrades(status);
      
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });
  
  // Get a specific trade
  app.get("/api/trades/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid trade ID" });
      }
      
      const trade = await storage.getTrade(id);
      
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      res.json(trade);
    } catch (error) {
      console.error("Error fetching trade:", error);
      res.status(500).json({ message: "Failed to fetch trade" });
    }
  });
  
  // Get trades for a specific user
  app.get("/api/users/:userId/trades", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const trades = await storage.getUserTrades(userId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching user trades:", error);
      res.status(500).json({ message: "Failed to fetch user trades" });
    }
  });
  
  // Update trade status (approve/reject by super user)
  app.patch("/api/trades/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid trade ID" });
      }
      
      const validatedData = updateTradeSchema.parse(req.body);
      const updatedTrade = await storage.updateTradeStatus(id, validatedData);
      
      if (!updatedTrade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      // Broadcast notification of trade status update
      broadcastNotification({
        type: 'trade_update',
        trade: {
          id: updatedTrade.id,
          status: updatedTrade.status,
          amount: updatedTrade.amount,
          tradeType: updatedTrade.tradeType,
          timestamp: new Date().toISOString()
        }
      });
      
      res.json(updatedTrade);
    } catch (error) {
      console.error("Error updating trade:", error);
      res.status(500).json({ message: "Failed to update trade" });
    }
  });

  // User management routes
  
  // Get all super users
  app.get("/api/super-users", async (_req: Request, res: Response) => {
    try {
      const superUsers = await storage.getSuperUsers();
      res.json(superUsers);
    } catch (error) {
      console.error("Error fetching super users:", error);
      res.status(500).json({ message: "Failed to fetch super users" });
    }
  });
  
  // Update user role
  app.patch("/api/users/:id/role", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const { role } = req.body;
      
      if (!role || !["user", "admin", "super_user"].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }
      
      const updatedUser = await storage.updateUserRole(id, role as "user" | "admin" | "super_user");
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json(updatedUser);
    } catch (error) {
      console.error("Error updating user role:", error);
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  // News API routes
  
  // Get UK economic news
  app.get("/api/news/economic", async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
      
      if (isNaN(page) || isNaN(pageSize) || page < 1 || pageSize < 1 || pageSize > 50) {
        return res.status(400).json({ 
          message: "Invalid pagination parameters. Page must be ≥1, pageSize must be between 1-50." 
        });
      }
      
      const news = await fetchUKEconomicNews(page, pageSize);
      res.json({ news, page, pageSize });
    } catch (error) {
      console.error("Error fetching UK economic news:", error);
      res.status(500).json({ message: "Failed to fetch UK economic news" });
    }
  });
  
  // Get UK financial headlines
  app.get("/api/news/headlines", async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
      
      if (isNaN(page) || isNaN(pageSize) || page < 1 || pageSize < 1 || pageSize > 50) {
        return res.status(400).json({ 
          message: "Invalid pagination parameters. Page must be ≥1, pageSize must be between 1-50." 
        });
      }
      
      const headlines = await fetchUKFinancialHeadlines(page, pageSize);
      res.json({ headlines, page, pageSize });
    } catch (error) {
      console.error("Error fetching UK financial headlines:", error);
      res.status(500).json({ message: "Failed to fetch UK financial headlines" });
    }
  });

  const httpServer = createServer(app);
  
  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Track active connections
  const clients: WebSocket[] = [];
  
  wss.on('connection', (ws: WebSocket) => {
    console.log('New WebSocket client connected');
    clients.push(ws);
    
    // Send a welcome message to the client
    ws.send(JSON.stringify({
      type: 'connection',
      message: 'Connected to UK Council Money Market Assistant WebSocket server'
    }));
    
    // Handle client messages
    ws.on('message', (message: string) => {
      console.log('Received message:', message);
      // Process messages here if needed
    });
    
    // Handle client disconnection
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      const index = clients.indexOf(ws);
      if (index !== -1) {
        clients.splice(index, 1);
      }
    });
  });
  
  // Helper function to broadcast a notification to all connected clients
  const broadcastNotification = (data: any) => {
    const message = JSON.stringify({
      type: 'notification',
      data
    });
    
    clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };
  
  // Make broadcastNotification available globally
  (global as any).broadcastNotification = broadcastNotification;

  // Test endpoint for notifications
  app.get("/api/test-notification", (_req: Request, res: Response) => {
    try {
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
      broadcastNotification(messageNotification);
      console.log('Test notification sent!');
      
      // Schedule a trade notification after 3 seconds
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
        broadcastNotification(tradeNotification);
        console.log('Test trade notification sent!');
      }, 3000);
      
      res.json({ success: true, message: "Test notifications sent" });
    } catch (error) {
      console.error("Error sending test notification:", error);
      res.status(500).json({ success: false, message: "Failed to send test notification" });
    }
  });

  return httpServer;
}
