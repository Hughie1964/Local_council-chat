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
} from "@shared/schema";

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
  private councils: Map<number, Council>;
  private sessions: Map<number, Session>;
  private messages: Map<number, Message>;
  private trades: Map<number, Trade>;
  currentUserId: number;
  currentCouncilId: number;
  currentSessionId: number;
  currentMessageId: number;
  currentTradeId: number;

  constructor() {
    this.users = new Map();
    this.councils = new Map();
    this.sessions = new Map();
    this.messages = new Map();
    this.trades = new Map();
    this.currentUserId = 1;
    this.currentCouncilId = 1;
    this.currentSessionId = 1;
    this.currentMessageId = 1;
    this.currentTradeId = 1;

    this.initializeDemoData();
  }

  private async createCouncil(insertCouncil: InsertCouncil): Promise<Council> {
    const id = this.currentCouncilId++;
    const currentDate = new Date();
    // Now we can use createdAt since we added it to the schema
    const council: Council = { 
      ...insertCouncil, 
      id,
      createdAt: currentDate
    };
    this.councils.set(id, council);
    return council;
  }
  
  private async initializeDemoData() {
    const userPassword = await bcrypt.hash("password123", 10);
    const adminPassword = await bcrypt.hash("admin123", 10);
    const createdDate = new Date();
    
    // Create default users
    await this.createUser({
      username: "user",
      password: userPassword,
      role: "user",
      councilId: "BCC-001"
    });
    
    await this.createUser({
      username: "admin",
      password: adminPassword,
      role: "admin",
      councilId: "BCC-001"
    });
    
    await this.createUser({
      username: "super_user",
      password: adminPassword,
      role: "super_user",
      councilId: "BCC-001"
    });

    // Create default council
    const council = await this.createCouncil({
      name: "Birmingham City Council",
      councilId: "BCC-001",
      financialYear: "2024-2025"
    });
    
    // Create a demo session
    const demoSessionId = "demo-session-123";
    await this.createSession({
      sessionId: demoSessionId,
      title: "Demo Session",
    });
    
    // Create a demo message
    const demoMessage = await this.createMessage({
      sessionId: demoSessionId,
      content: "Hello! I'd like to discuss current money market rates for local council investments.",
      isUser: true,
    });
    
    // Example 1: Manchester lends to Barclays
    const trade1 = await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: "Local Authority Loan",
      amount: "£15,000,000",
      details: "Three-month term loan to Barclays",
      status: "executed",
      rate: "4.58%",
      lender: "Manchester County Council",
      borrower: "Barclays Bank Plc",
      startDate: "25.4.2025",
      maturityDate: "25.7.2025"
    });
    
    if (trade1) {
      const updatedTrade1 = this.trades.get(trade1.id);
      if (updatedTrade1) {
        updatedTrade1.createdAt = new Date(2025, 3, 25); // April 25, 2025
        updatedTrade1.updatedAt = new Date(2025, 3, 25);
        updatedTrade1.approvedBy = 1;
        updatedTrade1.approvalComment = "Execution approved and completed";
        this.trades.set(trade1.id, updatedTrade1);
      }
    }
    
    // Example 2: West Yorkshire lends to NatWest
    const trade2 = await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: "Deposit",
      amount: "£7,500,000",
      details: "Six-month deposit facility",
      status: "executed",
      rate: "4.62%",
      lender: "West Yorkshire Combined Authority",
      borrower: "NatWest Bank Plc",
      startDate: "15.5.2025",
      maturityDate: "15.11.2025"
    });
    
    if (trade2) {
      const updatedTrade2 = this.trades.get(trade2.id);
      if (updatedTrade2) {
        updatedTrade2.createdAt = new Date(2025, 4, 15); // May 15, 2025
        updatedTrade2.updatedAt = new Date(2025, 4, 15);
        updatedTrade2.approvedBy = 1;
        updatedTrade2.approvalComment = "Execution approved and completed";
        this.trades.set(trade2.id, updatedTrade2);
      }
    }
    
    // Example 3: PWLB lending to Birmingham
    const trade3 = await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: "PWLB Loan",
      amount: "£25,000,000",
      details: "Long-term capital project financing",
      status: "executed",
      rate: "4.87%",
      lender: "Public Works Loan Board",
      borrower: "Birmingham City Council",
      startDate: "10.6.2025",
      maturityDate: "10.6.2030"
    });
    
    if (trade3) {
      const updatedTrade3 = this.trades.get(trade3.id);
      if (updatedTrade3) {
        updatedTrade3.createdAt = new Date(2025, 5, 10); // June 10, 2025
        updatedTrade3.updatedAt = new Date(2025, 5, 10);
        updatedTrade3.approvedBy = 1;
        updatedTrade3.approvalComment = "Execution approved and completed";
        this.trades.set(trade3.id, updatedTrade3);
      }
    }
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
    const createdDate = new Date();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: createdDate,
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
    const createdDate = new Date();
    const session: Session = { 
      ...insertSession, 
      id, 
      timestamp: createdDate 
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
    const createdDate = new Date();
    const message: Message = { 
      ...insertMessage, 
      id, 
      timestamp: createdDate 
    };
    this.messages.set(id, message);
    return message;
  }
  
  // Trade methods
  async createTrade(insertTrade: InsertTrade): Promise<Trade> {
    const id = this.currentTradeId++;
    const createdDate = new Date();
    const trade: Trade = {
      id,
      userId: insertTrade.userId,
      sessionId: insertTrade.sessionId,
      messageId: insertTrade.messageId,
      tradeType: insertTrade.tradeType,
      amount: insertTrade.amount,
      details: insertTrade.details,
      status: insertTrade.status || "pending",
      approvalComment: null,
      approvedBy: null,
      rate: insertTrade.rate || null,
      lender: insertTrade.lender || null,
      borrower: insertTrade.borrower || null,
      startDate: insertTrade.startDate || null,
      maturityDate: insertTrade.maturityDate || null,
      createdAt: createdDate,
      updatedAt: createdDate
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
    
    const updatedDate = new Date();
    const updatedTrade: Trade = {
      ...trade,
      ...update,
      updatedAt: updatedDate
    };
    
    this.trades.set(tradeId, updatedTrade);
    return updatedTrade;
  }
}

export const storage = new MemStorage();