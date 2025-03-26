import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse, generateSessionTitle } from "./openai";
import { scrapeUKRates } from "./rates-scraper";
import { v4 as uuidv4 } from "uuid";
import { z } from "zod";
import { insertMessageSchema } from "@shared/schema";

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
      await storage.createMessage({
        sessionId,
        content: message,
        isUser: true
      });
      
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

  const httpServer = createServer(app);

  return httpServer;
}
