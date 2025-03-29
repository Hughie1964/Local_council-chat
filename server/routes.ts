import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse, generateSessionTitle } from "./openai";
import { scrapeUKRates } from "./rates-scraper";
import { analyzeMessageForTrade } from "./trade-analyzer";
import { fetchUKEconomicNews, fetchUKFinancialHeadlines } from './news-service';
import { checkUpcomingMaturities } from './maturity-reminder';
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { 
  insertMessageSchema, 
  insertTradeSchema, 
  updateTradeSchema, 
  councils,
  insertDocumentSchema,
  insertDocumentSharingSchema,
  insertCalendarEventSchema,
  insertEventAttendeeSchema,
  insertDirectMessageSchema,
  insertGroupSchema,
  insertGroupMemberSchema,
  insertGroupMessageSchema,
  insertInterestRateSchema,
  insertRateForecastSchema,
  insertCashFlowForecastSchema,
  insertCashFlowDataPointSchema
} from "@shared/schema";
import { WebSocketServer, WebSocket } from 'ws';
import { setupAuth } from "./auth";
import { db } from "./db";
import { eq } from "drizzle-orm";

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
        console.log("ROUTE: User not authenticated, returning default council");
        // Return default council for unauthenticated users (for demo purposes)
        const defaultCouncil = {
          id: 1,
          name: "Birmingham City Council",
          councilId: "BCC-001", 
          financialYear: "2024-2025"
        };
        return res.json(defaultCouncil);
      }
      
      // Get the authenticated user
      const user = req.user;
      console.log("ROUTE: User council lookup for:", user.username, "councilId:", user.councilId);
      console.log("ROUTE: Full user object:", JSON.stringify(user));
      
      // If user has a councilId, use it to look up their council
      if (user.councilId) {
        // Try to find the user's council in the database by councilId
        console.log("ROUTE: Looking up council with councilId:", user.councilId);
        
        // Directly query for the Kinross council as a test
        const [directKinrossCouncil] = await db.select().from(councils).where(eq(councils.councilId, "Kinross"));
        console.log("ROUTE: Direct DB lookup for Kinross:", directKinrossCouncil);
        
        const userCouncil = await storage.getCouncilByCouncilId(user.councilId);
        
        if (userCouncil) {
          console.log("ROUTE: Found council:", userCouncil);
          return res.json(userCouncil);
        }
        
        console.log("ROUTE: Council not found in database");
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
      console.log("ROUTE: User has no councilId, returning default council");
      const defaultCouncil = {
        id: 1,
        name: "Birmingham City Council",
        councilId: "BCC-001",
        financialYear: "2024-2025"
      };
      
      res.json(defaultCouncil);
    } catch (error) {
      console.error("ROUTE Error fetching council information:", error);
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
  // Helper function to check if a message is asking about maturing trades
  function isCheckingMaturities(message: string): boolean {
    const lowerMessage = message.toLowerCase();
    const maturityPhrases = [
      'check upcoming maturities',
      'upcoming maturities',
      'maturity reminder',
      'trades maturing soon',
      'when do my trades mature',
      'show maturing trades',
      'trades about to mature',
      'upcoming trade maturity',
      'maturity check',
      'show maturity dates',
      'trades due soon',
      'check maturities'
    ];
    
    return maturityPhrases.some(phrase => lowerMessage.includes(phrase));
  }

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
      
      // Check if this is a maturity check request
      if (isCheckingMaturities(message)) {
        console.log("Detected request to check upcoming maturities");
        
        // Run the maturity check
        await checkUpcomingMaturities(wss);
        
        // Provide a response to the user
        const maturityResponse = await storage.createMessage({
          sessionId,
          content: `I've checked for upcoming trade maturities. If you have any trades maturing in the next 3 days, you'll receive a notification with the details.`,
          isUser: false
        });
        
        return res.json(maturityResponse);
      }
      
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

  // Document Management API routes
  
  // Get all documents for the user's council
  app.get("/api/documents", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get council documents by default
      // Type assertion to ensure councilId is treated as string
      const councilId = req.user.councilId as string;
      const documents = await storage.getCouncilDocuments(councilId);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching documents:", error);
      res.status(500).json({ message: "Failed to fetch documents" });
    }
  });
  
  // Get documents uploaded by the current user
  app.get("/api/documents/user", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Get documents uploaded by the current user
      const documents = await storage.getUserDocuments(req.user.id);
      res.json(documents);
    } catch (error) {
      console.error("Error fetching user documents:", error);
      res.status(500).json({ message: "Failed to fetch user documents" });
    }
  });
  
  // Search documents
  app.get("/api/documents/search", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const documents = await storage.searchDocuments(query);
      res.json(documents);
    } catch (error) {
      console.error("Error searching documents:", error);
      res.status(500).json({ message: "Failed to search documents" });
    }
  });
  
  // Get a specific document by ID
  app.get("/api/documents/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user has access to this document
      if (document.accessLevel === 'private' && document.uploaderId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      if (document.accessLevel === 'council' && document.councilId !== req.user.councilId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // For group access, we would check if user is in the group
      // This would require additional queries to check group membership
      
      res.json(document);
    } catch (error) {
      console.error("Error fetching document:", error);
      res.status(500).json({ message: "Failed to fetch document" });
    }
  });
  
  // Create a new document
  app.post("/api/documents", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const documentData = req.body;
      
      // Validate with schema
      const result = insertDocumentSchema.safeParse({
        ...documentData,
        uploaderId: req.user.id,
        councilId: req.user.councilId
      });
      
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      const document = await storage.createDocument(result.data);
      res.status(201).json(document);
    } catch (error) {
      console.error("Error creating document:", error);
      res.status(500).json({ message: "Failed to create document" });
    }
  });
  
  // Update a document
  app.patch("/api/documents/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user has permission to update (only document owner or admin/super_user)
      if (document.uploaderId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_user') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedDocument = await storage.updateDocument(documentId, req.body);
      res.json(updatedDocument);
    } catch (error) {
      console.error("Error updating document:", error);
      res.status(500).json({ message: "Failed to update document" });
    }
  });
  
  // Delete a document
  app.delete("/api/documents/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user has permission to delete (only document owner or admin/super_user)
      if (document.uploaderId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_user') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteDocument(documentId);
      if (success) {
        res.sendStatus(204);
      } else {
        res.status(500).json({ message: "Failed to delete document" });
      }
    } catch (error) {
      console.error("Error deleting document:", error);
      res.status(500).json({ message: "Failed to delete document" });
    }
  });
  
  // Share a document with other users/groups
  app.post("/api/documents/:id/share", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const documentId = parseInt(req.params.id);
      if (isNaN(documentId)) {
        return res.status(400).json({ message: "Invalid document ID" });
      }
      
      const document = await storage.getDocument(documentId);
      if (!document) {
        return res.status(404).json({ message: "Document not found" });
      }
      
      // Check if user has permission to share (only document owner or admin/super_user)
      if (document.uploaderId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_user') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const sharingData = {
        documentId,
        ...req.body
      };
      
      // Validate with schema
      const result = insertDocumentSharingSchema.safeParse(sharingData);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      const sharing = await storage.shareDocument(result.data);
      res.status(201).json(sharing);
    } catch (error) {
      console.error("Error sharing document:", error);
      res.status(500).json({ message: "Failed to share document" });
    }
  });
  
  // Calendar Events API routes
  
  // Get all calendar events for the user's council
  app.get("/api/calendar-events", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Type assertion to ensure councilId is treated as string
      const councilId = req.user.councilId as string;
      const events = await storage.getCouncilCalendarEvents(councilId);
      res.json(events);
    } catch (error) {
      console.error("Error fetching calendar events:", error);
      res.status(500).json({ message: "Failed to fetch calendar events" });
    }
  });
  
  // Get calendar events for the current user
  app.get("/api/calendar-events/user", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const events = await storage.getUserCalendarEvents(req.user.id);
      res.json(events);
    } catch (error) {
      console.error("Error fetching user calendar events:", error);
      res.status(500).json({ message: "Failed to fetch user calendar events" });
    }
  });
  
  // Get a specific calendar event
  app.get("/api/calendar-events/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const event = await storage.getCalendarEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Calendar event not found" });
      }
      
      // Check if user has access to this event
      // For private events, only the creator can see them
      if (event.isPrivate && event.creatorId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // For council events, check if the user belongs to the council
      if (event.councilId && event.councilId !== req.user.councilId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(event);
    } catch (error) {
      console.error("Error fetching calendar event:", error);
      res.status(500).json({ message: "Failed to fetch calendar event" });
    }
  });
  
  // Create a new calendar event
  app.post("/api/calendar-events", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const eventData = req.body;
      
      // Validate with schema
      const result = insertCalendarEventSchema.safeParse({
        ...eventData,
        creatorId: req.user.id,
        councilId: req.user.councilId
      });
      
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      const event = await storage.createCalendarEvent(result.data);
      
      // Broadcast notification of new calendar event
      broadcastNotification({
        type: 'new_calendar_event',
        event: {
          id: event.id,
          title: event.title,
          startTime: event.startTime,
          councilId: event.councilId
        }
      });
      
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating calendar event:", error);
      res.status(500).json({ message: "Failed to create calendar event" });
    }
  });
  
  // Update a calendar event
  app.patch("/api/calendar-events/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const event = await storage.getCalendarEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Calendar event not found" });
      }
      
      // Check if user has permission to update (only event creator or admin/super_user)
      if (event.creatorId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_user') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updatedEvent = await storage.updateCalendarEvent(eventId, req.body);
      
      // Broadcast notification of updated calendar event
      if (updatedEvent) {
        broadcastNotification({
          type: 'update_calendar_event',
          event: {
            id: updatedEvent.id,
            title: updatedEvent.title,
            startTime: updatedEvent.startTime,
            councilId: updatedEvent.councilId
          }
        });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating calendar event:", error);
      res.status(500).json({ message: "Failed to update calendar event" });
    }
  });
  
  // Delete a calendar event
  app.delete("/api/calendar-events/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const event = await storage.getCalendarEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Calendar event not found" });
      }
      
      // Check if user has permission to delete (only event creator or admin/super_user)
      if (event.creatorId !== req.user.id && req.user.role !== 'admin' && req.user.role !== 'super_user') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const success = await storage.deleteCalendarEvent(eventId);
      if (success) {
        // Broadcast notification of deleted calendar event
        broadcastNotification({
          type: 'delete_calendar_event',
          eventId: eventId
        });
        
        res.sendStatus(204);
      } else {
        res.status(500).json({ message: "Failed to delete calendar event" });
      }
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      res.status(500).json({ message: "Failed to delete calendar event" });
    }
  });
  
  // Add an attendee to a calendar event
  app.post("/api/calendar-events/:id/attendees", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const event = await storage.getCalendarEvent(eventId);
      if (!event) {
        return res.status(404).json({ message: "Calendar event not found" });
      }
      
      const attendeeData = {
        eventId,
        ...req.body,
        responseStatus: req.body.responseStatus || 'pending'
      };
      
      // Validate with schema
      const result = insertEventAttendeeSchema.safeParse(attendeeData);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      const attendee = await storage.addEventAttendee(result.data);
      res.status(201).json(attendee);
    } catch (error) {
      console.error("Error adding event attendee:", error);
      res.status(500).json({ message: "Failed to add event attendee" });
    }
  });
  
  // Get attendees for a calendar event
  app.get("/api/calendar-events/:id/attendees", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const eventId = parseInt(req.params.id);
      if (isNaN(eventId)) {
        return res.status(400).json({ message: "Invalid event ID" });
      }
      
      const attendees = await storage.getEventAttendees(eventId);
      res.json(attendees);
    } catch (error) {
      console.error("Error fetching event attendees:", error);
      res.status(500).json({ message: "Failed to fetch event attendees" });
    }
  });
  
  // Update attendee response status
  app.patch("/api/calendar-events/attendees/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const attendeeId = parseInt(req.params.id);
      if (isNaN(attendeeId)) {
        return res.status(400).json({ message: "Invalid attendee ID" });
      }
      
      const { responseStatus } = req.body;
      if (!responseStatus || !['accepted', 'declined', 'tentative', 'pending'].includes(responseStatus)) {
        return res.status(400).json({ message: "Invalid response status" });
      }
      
      const updatedAttendee = await storage.updateAttendeeResponse(attendeeId, responseStatus);
      
      if (!updatedAttendee) {
        return res.status(404).json({ message: "Attendee not found" });
      }
      
      res.json(updatedAttendee);
    } catch (error) {
      console.error("Error updating attendee response:", error);
      res.status(500).json({ message: "Failed to update attendee response" });
    }
  });
  
  // Messaging API routes
  
  // Create a group
  app.post("/api/groups", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupData = {
        ...req.body,
        creatorId: req.user.id
      };
      
      // Validate with schema
      const result = insertGroupSchema.safeParse(groupData);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      const group = await storage.createGroup(result.data);
      
      // Add creator as a member automatically
      await storage.addGroupMember({
        groupId: group.id,
        userId: req.user.id,
        role: 'admin'
      });
      
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating group:", error);
      res.status(500).json({ message: "Failed to create group" });
    }
  });
  
  // Get groups for the current user
  app.get("/api/groups", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groups = await storage.getUserGroups(req.user.id);
      res.json(groups);
    } catch (error) {
      console.error("Error fetching groups:", error);
      res.status(500).json({ message: "Failed to fetch groups" });
    }
  });
  
  // Get a specific group
  app.get("/api/groups/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupId = parseInt(req.params.id);
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Check if user is a member of the group
      const members = await storage.getGroupMembers(groupId);
      const isMember = members.some(member => member.userId === req.user.id);
      
      if (!isMember) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json({
        ...group,
        members
      });
    } catch (error) {
      console.error("Error fetching group:", error);
      res.status(500).json({ message: "Failed to fetch group" });
    }
  });
  
  // Add member to a group
  app.post("/api/groups/:id/members", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupId = parseInt(req.params.id);
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      
      const group = await storage.getGroup(groupId);
      if (!group) {
        return res.status(404).json({ message: "Group not found" });
      }
      
      // Check if user is an admin of the group
      const members = await storage.getGroupMembers(groupId);
      const isAdmin = members.some(member => 
        member.userId === req.user.id && member.role === 'admin'
      );
      
      if (!isAdmin) {
        return res.status(403).json({ message: "Only group admins can add members" });
      }
      
      const memberData = {
        groupId,
        ...req.body,
        role: req.body.role || 'member'
      };
      
      // Validate with schema
      const result = insertGroupMemberSchema.safeParse(memberData);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      const member = await storage.addGroupMember(result.data);
      
      // Broadcast notification of new group member
      broadcastNotification({
        type: 'group_member_added',
        groupId,
        userId: memberData.userId
      });
      
      res.status(201).json(member);
    } catch (error) {
      console.error("Error adding group member:", error);
      res.status(500).json({ message: "Failed to add group member" });
    }
  });
  
  // Remove member from a group
  app.delete("/api/groups/:groupId/members/:userId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupId = parseInt(req.params.groupId);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(groupId) || isNaN(userId)) {
        return res.status(400).json({ message: "Invalid group ID or user ID" });
      }
      
      // Check if user is an admin of the group or removing themselves
      const members = await storage.getGroupMembers(groupId);
      const isAdmin = members.some(member => 
        member.userId === req.user.id && member.role === 'admin'
      );
      const isSelf = userId === req.user.id;
      
      if (!isAdmin && !isSelf) {
        return res.status(403).json({ message: "Only group admins can remove members" });
      }
      
      const success = await storage.removeGroupMember(groupId, userId);
      
      if (success) {
        // Broadcast notification of member removal
        broadcastNotification({
          type: 'group_member_removed',
          groupId,
          userId
        });
        
        res.sendStatus(204);
      } else {
        res.status(404).json({ message: "Member not found in group" });
      }
    } catch (error) {
      console.error("Error removing group member:", error);
      res.status(500).json({ message: "Failed to remove group member" });
    }
  });
  
  // Send a message to a group
  app.post("/api/groups/:id/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupId = parseInt(req.params.id);
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      
      // Check if user is a member of the group
      const members = await storage.getGroupMembers(groupId);
      const isMember = members.some(member => member.userId === req.user.id);
      
      if (!isMember) {
        return res.status(403).json({ message: "Only group members can send messages" });
      }
      
      const messageData = {
        groupId,
        senderId: req.user.id,
        ...req.body
      };
      
      // Validate with schema
      const result = insertGroupMessageSchema.safeParse(messageData);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      const message = await storage.sendGroupMessage(result.data);
      
      // Broadcast notification of new group message
      broadcastNotification({
        type: 'new_group_message',
        groupId,
        message: {
          id: message.id,
          content: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
          senderId: message.senderId,
          senderName: req.user.username,
          timestamp: message.timestamp
        }
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending group message:", error);
      res.status(500).json({ message: "Failed to send group message" });
    }
  });
  
  // Get messages for a group
  app.get("/api/groups/:id/messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const groupId = parseInt(req.params.id);
      if (isNaN(groupId)) {
        return res.status(400).json({ message: "Invalid group ID" });
      }
      
      // Check if user is a member of the group
      const members = await storage.getGroupMembers(groupId);
      const isMember = members.some(member => member.userId === req.user.id);
      
      if (!isMember) {
        return res.status(403).json({ message: "Only group members can view messages" });
      }
      
      const messages = await storage.getGroupMessages(groupId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching group messages:", error);
      res.status(500).json({ message: "Failed to fetch group messages" });
    }
  });
  
  // Send a direct message to another user
  app.post("/api/direct-messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const messageData = {
        senderId: req.user.id,
        ...req.body
      };
      
      // Validate with schema
      const result = insertDirectMessageSchema.safeParse(messageData);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      const message = await storage.sendDirectMessage(result.data);
      
      // Broadcast notification of new direct message to recipient
      broadcastNotification({
        type: 'new_direct_message',
        recipientId: message.recipientId,
        message: {
          id: message.id,
          content: message.content.substring(0, 100) + (message.content.length > 100 ? '...' : ''),
          senderId: message.senderId,
          senderName: req.user.username,
          timestamp: message.timestamp
        }
      });
      
      res.status(201).json(message);
    } catch (error) {
      console.error("Error sending direct message:", error);
      res.status(500).json({ message: "Failed to send direct message" });
    }
  });
  
  // Get conversation between two users
  app.get("/api/conversations/:userId", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const userId = parseInt(req.params.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }
      
      const messages = await storage.getConversation(req.user.id, userId);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching conversation:", error);
      res.status(500).json({ message: "Failed to fetch conversation" });
    }
  });
  
  // Get all direct messages for current user
  app.get("/api/direct-messages", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const messages = await storage.getUserDirectMessages(req.user.id);
      res.json(messages);
    } catch (error) {
      console.error("Error fetching direct messages:", error);
      res.status(500).json({ message: "Failed to fetch direct messages" });
    }
  });
  
  // Mark direct message as read
  app.patch("/api/direct-messages/:id/read", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const messageId = parseInt(req.params.id);
      if (isNaN(messageId)) {
        return res.status(400).json({ message: "Invalid message ID" });
      }
      
      const updatedMessage = await storage.markDirectMessageAsRead(messageId);
      
      if (!updatedMessage) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json(updatedMessage);
    } catch (error) {
      console.error("Error marking message as read:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });
  
  // Interest Rates and Forecasting API routes
  
  // Add interest rate
  app.post("/api/interest-rates", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    // Only admin or super_user can add interest rates
    if (req.user.role !== 'admin' && req.user.role !== 'super_user') {
      return res.status(403).json({ message: "Only admins can add interest rates" });
    }
    
    try {
      const rateData = {
        ...req.body,
        addedById: req.user.id
      };
      
      // Validate with schema
      const result = insertInterestRateSchema.safeParse(rateData);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      const rate = await storage.addInterestRate(result.data);
      
      // Broadcast notification of new interest rate
      broadcastNotification({
        type: 'new_interest_rate',
        rate: {
          id: rate.id,
          name: rate.name,
          value: rate.value,
          effectiveDate: rate.effectiveDate
        }
      });
      
      res.status(201).json(rate);
    } catch (error) {
      console.error("Error adding interest rate:", error);
      res.status(500).json({ message: "Failed to add interest rate" });
    }
  });
  
  // Get latest interest rates
  app.get("/api/interest-rates/latest", async (req: Request, res: Response) => {
    try {
      const rates = await storage.getLatestInterestRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching latest interest rates:", error);
      res.status(500).json({ message: "Failed to fetch latest interest rates" });
    }
  });
  
  // Get interest rate history for a specific rate name
  app.get("/api/interest-rates/:name/history", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const rates = await storage.getInterestRateHistory(name);
      res.json(rates);
    } catch (error) {
      console.error("Error fetching interest rate history:", error);
      res.status(500).json({ message: "Failed to fetch interest rate history" });
    }
  });
  
  // Create a rate forecast
  app.post("/api/rate-forecasts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const forecastData = {
        ...req.body,
        createdById: req.user.id
      };
      
      // Validate with schema
      const result = insertRateForecastSchema.safeParse(forecastData);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      const forecast = await storage.createRateForecast(result.data);
      res.status(201).json(forecast);
    } catch (error) {
      console.error("Error creating rate forecast:", error);
      res.status(500).json({ message: "Failed to create rate forecast" });
    }
  });
  
  // Get rate forecasts for a specific rate name
  app.get("/api/rate-forecasts/:name", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const forecasts = await storage.getRateForecasts(name);
      res.json(forecasts);
    } catch (error) {
      console.error("Error fetching rate forecasts:", error);
      res.status(500).json({ message: "Failed to fetch rate forecasts" });
    }
  });
  
  // Create a cash flow forecast
  app.post("/api/cash-flow-forecasts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const forecastData = {
        ...req.body,
        createdById: req.user.id,
        councilId: req.user.councilId
      };
      
      // Validate with schema
      const result = insertCashFlowForecastSchema.safeParse(forecastData);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      const forecast = await storage.createCashFlowForecast(result.data);
      res.status(201).json(forecast);
    } catch (error) {
      console.error("Error creating cash flow forecast:", error);
      res.status(500).json({ message: "Failed to create cash flow forecast" });
    }
  });
  
  // Get a specific cash flow forecast
  app.get("/api/cash-flow-forecasts/:id", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const forecastId = parseInt(req.params.id);
      if (isNaN(forecastId)) {
        return res.status(400).json({ message: "Invalid forecast ID" });
      }
      
      const forecast = await storage.getCashFlowForecast(forecastId);
      
      if (!forecast) {
        return res.status(404).json({ message: "Forecast not found" });
      }
      
      if (forecast.councilId !== req.user.councilId && req.user.role !== 'admin' && req.user.role !== 'super_user') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const dataPoints = await storage.getCashFlowDataPoints(forecastId);
      
      res.json({
        ...forecast,
        dataPoints
      });
    } catch (error) {
      console.error("Error fetching cash flow forecast:", error);
      res.status(500).json({ message: "Failed to fetch cash flow forecast" });
    }
  });
  
  // Get cash flow forecasts for the user's council
  app.get("/api/cash-flow-forecasts", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Type assertion to ensure councilId is treated as string
      const councilId = req.user.councilId as string;
      const forecasts = await storage.getCouncilCashFlowForecasts(councilId);
      res.json(forecasts);
    } catch (error) {
      console.error("Error fetching cash flow forecasts:", error);
      res.status(500).json({ message: "Failed to fetch cash flow forecasts" });
    }
  });
  
  // Add a data point to a cash flow forecast
  app.post("/api/cash-flow-forecasts/:id/data-points", async (req: Request, res: Response) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const forecastId = parseInt(req.params.id);
      if (isNaN(forecastId)) {
        return res.status(400).json({ message: "Invalid forecast ID" });
      }
      
      const forecast = await storage.getCashFlowForecast(forecastId);
      
      if (!forecast) {
        return res.status(404).json({ message: "Forecast not found" });
      }
      
      if (forecast.councilId !== req.user.councilId && req.user.role !== 'admin' && req.user.role !== 'super_user') {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const dataPointData = {
        forecastId,
        ...req.body
      };
      
      // Validate with schema
      const result = insertCashFlowDataPointSchema.safeParse(dataPointData);
      
      if (!result.success) {
        return res.status(400).json({ message: result.error.message });
      }
      
      const dataPoint = await storage.addCashFlowDataPoint(result.data);
      res.status(201).json(dataPoint);
    } catch (error) {
      console.error("Error adding cash flow data point:", error);
      res.status(500).json({ message: "Failed to add cash flow data point" });
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

  // Test the maturity reminder system
  app.get("/api/test-maturity-reminders", async (_req: Request, res: Response) => {
    try {
      await checkUpcomingMaturities(wss);
      res.json({ success: true, message: "Maturity check initiated" });
    } catch (error) {
      console.error("Error running maturity check:", error);
      res.status(500).json({ message: "Failed to run maturity check" });
    }
  });

  // Set up scheduled check for upcoming maturities
  // Check once daily at midnight
  const MATURITY_CHECK_INTERVAL = 24 * 60 * 60 * 1000; // 24 hours
  
  // Initial check when the server starts
  setTimeout(() => {
    console.log("Running initial check for upcoming maturities...");
    checkUpcomingMaturities(wss).catch(err => {
      console.error("Error in initial maturity check:", err);
    });
  }, 10000); // 10-second delay to ensure everything is initialized
  
  // Schedule regular checks
  setInterval(() => {
    console.log("Running scheduled check for upcoming maturities...");
    checkUpcomingMaturities(wss).catch(err => {
      console.error("Error in scheduled maturity check:", err);
    });
  }, MATURITY_CHECK_INTERVAL);

  return httpServer;
}
