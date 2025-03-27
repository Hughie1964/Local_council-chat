import { 
  users, type User, type InsertUser,
  sessions, type Session, type InsertSession,
  messages, type Message, type InsertMessage,
  trades, type Trade, type InsertTrade, type UpdateTrade,
  userRoleEnum, tradeStatusEnum
} from "@shared/schema";
import { v4 as uuidv4 } from "uuid";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(userId: number, role: "user" | "admin" | "super_user"): Promise<User | undefined>;
  getSuperUsers(): Promise<User[]>;
  
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private sessions: Map<number, Session>;
  private messages: Map<number, Message>;
  private trades: Map<number, Trade>;
  currentUserId: number;
  currentSessionId: number;
  currentMessageId: number;
  currentTradeId: number;

  constructor() {
    this.users = new Map();
    this.sessions = new Map();
    this.messages = new Map();
    this.trades = new Map();
    this.currentUserId = 1;
    this.currentSessionId = 1;
    this.currentMessageId = 1;
    this.currentTradeId = 1;
    
    // Create a default super user
    this.createUser({
      username: "superuser",
      password: "password123", // This should be properly hashed in a real app
      role: "super_user",
      councilId: "BCC001"
    });
    
    // Create demo data for analytics visualization
    this.initializeDemoData();
  }
  
  // Create demo data for the analytics dashboard
  private async initializeDemoData() {
    // Create example session for demo data
    const demoSessionId = "demo-session-123";
    const demoSession = await this.createSession({
      sessionId: demoSessionId,
      title: "Demo Financial Discussion"
    });
    
    // Create demo message
    const demoMessage = await this.createMessage({
      sessionId: demoSessionId,
      content: "Demo trade message",
      isUser: true
    });
    
    // Sample trade types
    const tradeTypes = [
      "PWLB Loan",
      "MMF Investment",
      "Treasury Bill",
      "Deposit",
      "Local Authority Loan"
    ];
    
    // Create executed trades with different rates and timestamps
    const now = new Date();
    
    // First trade from 3 months ago
    const trade1Date = new Date(now);
    trade1Date.setMonth(now.getMonth() - 3);
    const trade1 = await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: tradeTypes[0],
      amount: "£5,000,000",
      details: "PWLB borrowing for infrastructure project at 4.25% for 5 years",
      status: "executed",
      rate: "4.25%"
    });
    
    // Update the trade properties directly
    if (trade1) {
      // Get the trade from the map to update it directly
      const updatedTrade1 = this.trades.get(trade1.id);
      if (updatedTrade1) {
        updatedTrade1.createdAt = trade1Date;
        updatedTrade1.updatedAt = trade1Date;
        updatedTrade1.approvedBy = 1;
        updatedTrade1.approvalComment = "Execution approved and completed";
        // Save the updated trade back to the map
        this.trades.set(trade1.id, updatedTrade1);
      }
    }
    
    // Second trade from 2 months ago
    const trade2Date = new Date(now);
    trade2Date.setMonth(now.getMonth() - 2);
    const trade2 = await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: tradeTypes[1],
      amount: "£3,000,000",
      details: "MMF Investment with BlackRock at 4.15% short-term",
      status: "executed",
      rate: "4.15%"
    });
    
    // Update the trade properties directly
    if (trade2) {
      const updatedTrade2 = this.trades.get(trade2.id);
      if (updatedTrade2) {
        updatedTrade2.createdAt = trade2Date;
        updatedTrade2.updatedAt = trade2Date;
        updatedTrade2.approvedBy = 1;
        updatedTrade2.approvalComment = "Execution approved and completed";
        this.trades.set(trade2.id, updatedTrade2);
      }
    }
    
    // Third trade from 1 month ago
    const trade3Date = new Date(now);
    trade3Date.setMonth(now.getMonth() - 1);
    await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: tradeTypes[2],
      amount: "£2,500,000",
      details: "Treasury Bill purchase at 4.35% for 6 months",
      status: "executed",
      rate: "4.35%"
    });
    this.trades.get(3).createdAt = trade3Date;
    this.trades.get(3).updatedAt = trade3Date;
    this.trades.get(3).approvedBy = 1;
    this.trades.get(3).approvalComment = "Execution approved and completed";
    
    // Fourth trade from 3 weeks ago
    const trade4Date = new Date(now);
    trade4Date.setDate(now.getDate() - 21);
    await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: tradeTypes[3],
      amount: "£4,250,000",
      details: "Fixed-term deposit with Barclays at 4.1% for 3 months",
      status: "executed",
      rate: "4.1%"
    });
    this.trades.get(4).createdAt = trade4Date;
    this.trades.get(4).updatedAt = trade4Date;
    this.trades.get(4).approvedBy = 1;
    this.trades.get(4).approvalComment = "Execution approved and completed";
    
    // Fifth trade from 2 weeks ago
    const trade5Date = new Date(now);
    trade5Date.setDate(now.getDate() - 14);
    await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: tradeTypes[4],
      amount: "£3,750,000",
      details: "Loan to Manchester City Council at 4.45% for 4 months",
      status: "executed",
      rate: "4.45%"
    });
    this.trades.get(5).createdAt = trade5Date;
    this.trades.get(5).updatedAt = trade5Date;
    this.trades.get(5).approvedBy = 1;
    this.trades.get(5).approvalComment = "Execution approved and completed";
    
    // Sixth trade from 1 week ago
    const trade6Date = new Date(now);
    trade6Date.setDate(now.getDate() - 7);
    await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: tradeTypes[0],
      amount: "£6,000,000",
      details: "PWLB borrowing for capital projects at 4.3% for 7 years",
      status: "executed",
      rate: "4.3%"
    });
    this.trades.get(6).createdAt = trade6Date;
    this.trades.get(6).updatedAt = trade6Date;
    this.trades.get(6).approvedBy = 1;
    this.trades.get(6).approvalComment = "Execution approved and completed";
    
    // Pending trade from 2 days ago
    const trade7Date = new Date(now);
    trade7Date.setDate(now.getDate() - 2);
    await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: tradeTypes[1],
      amount: "£4,500,000",
      details: "MMF Investment with Fidelity at 4.2% short-term",
      status: "pending",
      rate: null
    });
    this.trades.get(7).createdAt = trade7Date;
    this.trades.get(7).updatedAt = trade7Date;
    
    // Negotiation trade from today
    await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: tradeTypes[3],
      amount: "£5,500,000",
      details: "Fixed-term deposit with Lloyds, discussing rate around 4.15-4.2% for 3 months",
      status: "negotiation",
      rate: null
    });
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: now,
      role: insertUser.role || "user",
      councilId: insertUser.councilId || null
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUserRole(userId: number, role: "user" | "admin" | "super_user"): Promise<User | undefined> {
    const user = await this.getUser(userId);
    if (!user) {
      return undefined;
    }
    
    const updatedUser: User = {
      ...user,
      role
    };
    
    this.users.set(userId, updatedUser);
    return updatedUser;
  }
  
  async getSuperUsers(): Promise<User[]> {
    return Array.from(this.users.values()).filter(user => user.role === "super_user");
  }
  
  // Session methods
  async getSessions(): Promise<Session[]> {
    return Array.from(this.sessions.values()).sort((a, b) => {
      // Sort by timestamp descending (newest first)
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }
  
  async getSession(sessionId: string): Promise<Session | undefined> {
    return Array.from(this.sessions.values()).find(
      (session) => session.sessionId === sessionId
    );
  }
  
  async createSession(insertSession: InsertSession): Promise<Session> {
    const id = this.currentSessionId++;
    const now = new Date();
    const session: Session = { 
      ...insertSession, 
      id, 
      timestamp: now 
    };
    this.sessions.set(id, session);
    return session;
  }
  
  // Message methods
  async getSessionMessages(sessionId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(message => message.sessionId === sessionId)
      .sort((a, b) => {
        // Sort by timestamp ascending (oldest first)
        return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
      });
  }
  
  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const now = new Date();
    const message: Message = { 
      ...insertMessage, 
      id, 
      timestamp: now 
    };
    this.messages.set(id, message);
    return message;
  }
  
  // Trade methods
  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentTradeId++;
    const now = new Date();
    const trade: Trade = {
      ...insertTrade,
      id,
      status: insertTrade.status || "pending",
      approvalComment: null,
      approvedBy: null,
      rate: null, // Add rate field with default value
      createdAt: now,
      updatedAt: now
    };
    this.trades.set(id, trade);
    return trade;
  }
  
  async getTrade(id: number): Promise<Trade | undefined> {
    return this.trades.get(id);
  }
  
  async getTrades(status?: "negotiation" | "pending" | "approved" | "rejected" | "executed"): Promise<Trade[]> {
    let trades = Array.from(this.trades.values());
    
    if (status) {
      trades = trades.filter(trade => trade.status === status);
    }
    
    // Sort by createdAt descending (newest first)
    return trades.sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  
  async getUserTrades(userId: number): Promise<Trade[]> {
    return Array.from(this.trades.values())
      .filter(trade => trade.userId === userId)
      .sort((a, b) => {
        // Sort by createdAt descending (newest first)
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }
  
  async updateTradeStatus(tradeId: number, update: UpdateTrade): Promise<Trade | undefined> {
    const trade = await this.getTrade(tradeId);
    if (!trade) {
      return undefined;
    }
    
    const now = new Date();
    const updatedTrade: Trade = {
      ...trade,
      ...update,
      updatedAt: now
    };
    
    this.trades.set(tradeId, updatedTrade);
    return updatedTrade;
  }
}

export const storage = new MemStorage();
