import bcrypt from "bcrypt";
import { 
  InsertUser, 
  User, 
  InsertCouncil, 
  Council, 
  InsertSession, 
  Session, 
  InsertMessage, 
  Message, 
  InsertTrade, 
  Trade,
  UpdateTrade,
  users,
  councils,
  sessions,
  messages,
  trades
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(userId: number, role: "user" | "admin" | "super_user"): Promise<User | undefined>;
  getSuperUsers(): Promise<User[]>;
  
  // Council methods
  getCouncilByCouncilId(councilId: string): Promise<Council | undefined>;
  
  // Session methods
  getSessions(): Promise<Session[]>;
  getSession(sessionId: string): Promise<Session | undefined>;
  createSession(session: InsertSession): Promise<Session>;
  
  // Message methods
  getSessionMessages(sessionId: string): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Trade methods
  createTrade(trade: InsertTrade): Promise<Trade>;
  getTrade(id: number): Promise<Trade | undefined>;
  getTrades(status?: "negotiation" | "pending" | "approved" | "rejected" | "executed"): Promise<Trade[]>;
  getUserTrades(userId: number): Promise<Trade[]>;
  updateTradeStatus(tradeId: number, update: UpdateTrade): Promise<Trade | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async updateUserRole(userId: number, role: "user" | "admin" | "super_user"): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }
  
  async getSuperUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, "super_user"));
  }
  
  // Council methods
  async getCouncilByCouncilId(councilId: string): Promise<Council | undefined> {
    const [council] = await db
      .select()
      .from(councils)
      .where(eq(councils.councilId, councilId));
    return council;
  }
  
  // Session methods
  async getSessions(): Promise<Session[]> {
    return await db
      .select()
      .from(sessions)
      .orderBy(desc(sessions.timestamp));
  }
  
  async getSession(sessionId: string): Promise<Session | undefined> {
    const [session] = await db
      .select()
      .from(sessions)
      .where(eq(sessions.sessionId, sessionId));
    return session;
  }
  
  async createSession(insertSession: InsertSession): Promise<Session> {
    const [session] = await db
      .insert(sessions)
      .values(insertSession)
      .returning();
    return session;
  }
  
  // Message methods
  async getSessionMessages(sessionId: string): Promise<Message[]> {
    return await db
      .select()
      .from(messages)
      .where(eq(messages.sessionId, sessionId))
      .orderBy(messages.timestamp);
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }
  
  // Trade methods
  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const [trade] = await db
      .insert(trades)
      .values({
        ...insertTrade,
        status: insertTrade.status || "pending",
        approvedBy: null,
        approvalComment: null,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return trade;
  }
  
  async getTrade(id: number): Promise<Trade | undefined> {
    const [trade] = await db
      .select()
      .from(trades)
      .where(eq(trades.id, id));
    return trade;
  }
  
  async getTrades(status?: "negotiation" | "pending" | "approved" | "rejected" | "executed"): Promise<Trade[]> {
    if (status) {
      return await db
        .select()
        .from(trades)
        .where(eq(trades.status, status))
        .orderBy(desc(trades.createdAt));
    } else {
      return await db
        .select()
        .from(trades)
        .orderBy(desc(trades.createdAt));
    }
  }
  
  async getUserTrades(userId: number): Promise<Trade[]> {
    return await db
      .select()
      .from(trades)
      .where(eq(trades.userId, userId))
      .orderBy(desc(trades.createdAt));
  }
  
  async updateTradeStatus(tradeId: number, update: UpdateTrade): Promise<Trade | undefined> {
    const [updatedTrade] = await db
      .update(trades)
      .set({
        ...update,
        updatedAt: new Date()
      })
      .where(eq(trades.id, tradeId))
      .returning();
    return updatedTrade;
  }

  // Initialize demo data
  async initializeDemoData() {
    try {
      // Check if any users exist
      const existingUsers = await db.select().from(users).limit(1);
      if (existingUsers.length > 0) {
        console.log("Demo data already exists. Skipping initialization.");
        return;
      }

      console.log("Initializing demo data...");
      
      const userPassword = await bcrypt.hash("password123", 10);
      const adminPassword = await bcrypt.hash("admin123", 10);
      
      // Create default council
      const [council] = await db
        .insert(councils)
        .values({
          name: "Birmingham City Council",
          councilId: "BCC-001",
          financialYear: "2024-2025"
        })
        .returning();
      
      // Create default users
      const [user1] = await db
        .insert(users)
        .values({
          username: "user",
          password: userPassword,
          role: "user",
          councilId: "BCC-001"
        })
        .returning();
      
      const [user2] = await db
        .insert(users)
        .values({
          username: "admin",
          password: adminPassword,
          role: "admin",
          councilId: "BCC-001"
        })
        .returning();
      
      const [user3] = await db
        .insert(users)
        .values({
          username: "super_user",
          password: adminPassword,
          role: "super_user",
          councilId: "BCC-001"
        })
        .returning();
      
      // Create a demo session
      const demoSessionId = "demo-session-123";
      const [session] = await db
        .insert(sessions)
        .values({
          sessionId: demoSessionId,
          title: "Demo Session"
        })
        .returning();
      
      // Create a demo message
      const [demoMessage] = await db
        .insert(messages)
        .values({
          sessionId: demoSessionId,
          content: "Hello! I'd like to discuss current money market rates for local council investments.",
          isUser: true
        })
        .returning();
      
      // Create demo trades
      // Example 1: Manchester lends to Barclays
      const april252025 = new Date(2025, 3, 25); // April 25, 2025
      const [trade1] = await db
        .insert(trades)
        .values({
          userId: user1.id,
          sessionId: demoSessionId,
          messageId: demoMessage.id,
          tradeType: "Local Authority Loan",
          amount: "£15,000,000",
          details: "Three-month term loan to Barclays",
          status: "executed",
          approvedBy: user1.id,
          approvalComment: "Execution approved and completed",
          rate: "4.58%",
          lender: "Manchester County Council",
          borrower: "Barclays Bank Plc",
          startDate: "25.4.2025",
          maturityDate: "25.7.2025",
          createdAt: april252025,
          updatedAt: april252025
        })
        .returning();
      
      // Example 2: West Yorkshire lends to NatWest
      const may152025 = new Date(2025, 4, 15); // May 15, 2025
      const [trade2] = await db
        .insert(trades)
        .values({
          userId: user1.id,
          sessionId: demoSessionId,
          messageId: demoMessage.id,
          tradeType: "Deposit",
          amount: "£7,500,000",
          details: "Six-month deposit facility",
          status: "executed",
          approvedBy: user1.id,
          approvalComment: "Execution approved and completed",
          rate: "4.62%",
          lender: "West Yorkshire Combined Authority",
          borrower: "NatWest Bank Plc",
          startDate: "15.5.2025",
          maturityDate: "15.11.2025",
          createdAt: may152025,
          updatedAt: may152025
        })
        .returning();
      
      // Example 3: PWLB lending to Birmingham
      const june102025 = new Date(2025, 5, 10); // June 10, 2025
      const [trade3] = await db
        .insert(trades)
        .values({
          userId: user1.id,
          sessionId: demoSessionId,
          messageId: demoMessage.id,
          tradeType: "PWLB Loan",
          amount: "£25,000,000",
          details: "Long-term capital project financing",
          status: "executed",
          approvedBy: user1.id,
          approvalComment: "Execution approved and completed",
          rate: "4.87%",
          lender: "Public Works Loan Board",
          borrower: "Birmingham City Council",
          startDate: "10.6.2025",
          maturityDate: "10.6.2030",
          createdAt: june102025,
          updatedAt: june102025
        })
        .returning();
      
      console.log("Demo data initialized successfully.");
    } catch (error) {
      console.error("Error initializing demo data:", error);
    }
  }
}

// Initialize a DatabaseStorage instance and setup demo data
const storage = new DatabaseStorage();

// Export the storage instance
export { storage };