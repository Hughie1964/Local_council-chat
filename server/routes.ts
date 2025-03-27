import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse, generateSessionTitle } from "./openai";
import { scrapeUKRates } from "./rates-scraper";
import { analyzeMessageForTrade } from "./trade-analyzer";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { insertMessageSchema, insertTradeSchema, updateTradeSchema } from "@shared/schema";

// Type for chat request body
const chatRequestSchema = z.object({
  message: z.string().min(1, "Message is required"),
  sessionId: z.string().optional()
});

export async function registerRoutes(app: Express): Promise<Server> {
  // prefix all routes with /api
  
  // Get council information (mock data for now)
  app.get("/api/council", async (_req: Request, res: Response) => {
    try {
      // In a real app, this would come from a database based on authenticated user
      const council = {
        id: 1,
        name: "Birmingham City Council",
        councilId: "BCC-4578",
        financialYear: "2023/24"
      };
      
      res.json(council);
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
          status: tradeDetails.isConfirmation ? "pending" : "negotiation"
        });
      }
      
      // Generate AI response
      const aiResponse = await generateChatResponse(message);
      
      // Save the AI response
      await storage.createMessage({
        sessionId,
        content: aiResponse,
        isUser: false
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

  const httpServer = createServer(app);

  return httpServer;
}
