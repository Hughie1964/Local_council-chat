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
    
    // Function to format a date to string in UK format: DD.M.YYYY
    const formatDateString = (date: Date): string => {
      const day = date.getDate();
      const month = date.getMonth() + 1; // JS months are 0-indexed
      const year = date.getFullYear();
      return `${day}.${month}.${year}`;
    };

    // Calculate maturity date based on months or years
    const calculateMaturityDate = (startDate: Date, periodMonths: number): string => {
      const maturityDate = new Date(startDate);
      maturityDate.setMonth(maturityDate.getMonth() + periodMonths);
      return formatDateString(maturityDate);
    };
    
    // Create specific demo dates for transactions
    const date1 = new Date(2025, 3, 25); // April 25, 2025
    const date2 = new Date(2025, 4, 15); // May 15, 2025
    const date3 = new Date(2025, 5, 10); // June 10, 2025
    const date4 = new Date(2025, 3, 5);  // April 5, 2025
    const date5 = new Date(2025, 2, 20); // March 20, 2025
    
    // Trade 1: Manchester County Council lending to Barclays exactly as requested
    const trade1 = await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: "Local Authority Loan",
      amount: "£15,000,000",
      details: "3-month term loan to Barclays at 4.58%",
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
        updatedTrade1.createdAt = date1;
        updatedTrade1.updatedAt = date1;
        updatedTrade1.approvedBy = 1;
        updatedTrade1.approvalComment = "Execution approved and completed";
        this.trades.set(trade1.id, updatedTrade1);
      }
    }
    
    // Trade 2: Birmingham City Council lending to Lloyds
    const trade2 = await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: "Deposit",
      amount: "£8,500,000",
      details: "3-month deposit with Lloyds at 4.62%",
      status: "executed",
      rate: "4.62%",
      lender: "Birmingham City Council",
      borrower: "Lloyds Bank Plc",
      startDate: "15.5.2025",
      maturityDate: "15.8.2025"
    });
    
    if (trade2) {
      const updatedTrade2 = this.trades.get(trade2.id);
      if (updatedTrade2) {
        updatedTrade2.createdAt = date2;
        updatedTrade2.updatedAt = date2;
        updatedTrade2.approvedBy = 1;
        updatedTrade2.approvalComment = "Execution approved and completed";
        this.trades.set(trade2.id, updatedTrade2);
      }
    }
    
    // Trade 3: Leeds City Council lending to HSBC
    const trade3 = await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: "Deposit",
      amount: "£10,000,000",
      details: "6-month deposit with HSBC at 4.75%",
      status: "executed",
      rate: "4.75%",
      lender: "Leeds City Council",
      borrower: "HSBC Bank Plc",
      startDate: "10.6.2025",
      maturityDate: "10.12.2025"
    });
    
    if (trade3) {
      const updatedTrade3 = this.trades.get(trade3.id);
      if (updatedTrade3) {
        updatedTrade3.createdAt = date3;
        updatedTrade3.updatedAt = date3;
        updatedTrade3.approvedBy = 1;
        updatedTrade3.approvalComment = "Execution approved and completed";
        this.trades.set(trade3.id, updatedTrade3);
      }
    }
    
    // Trade 4: Liverpool City Council lending to Nationwide
    const trade4 = await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: "Deposit",
      amount: "£7,250,000",
      details: "3-month deposit with Nationwide at 4.55%",
      status: "executed",
      rate: "4.55%",
      lender: "Liverpool City Council",
      borrower: "Nationwide Building Society",
      startDate: "5.4.2025",
      maturityDate: "5.7.2025"
    });
    
    if (trade4) {
      const updatedTrade4 = this.trades.get(trade4.id);
      if (updatedTrade4) {
        updatedTrade4.createdAt = date4;
        updatedTrade4.updatedAt = date4;
        updatedTrade4.approvedBy = 1;
        updatedTrade4.approvalComment = "Execution approved and completed";
        this.trades.set(trade4.id, updatedTrade4);
      }
    }
    
    // Trade 5: PWLB lending to Newcastle City Council
    const trade5 = await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: "PWLB Loan",
      amount: "£12,500,000",
      details: "5-year PWLB loan for infrastructure project",
      status: "executed",
      rate: "4.45%",
      lender: "Public Works Loan Board",
      borrower: "Newcastle City Council",
      startDate: "20.3.2025",
      maturityDate: "20.3.2030"
    });
    
    if (trade5) {
      const updatedTrade5 = this.trades.get(trade5.id);
      if (updatedTrade5) {
        updatedTrade5.createdAt = date5;
        updatedTrade5.updatedAt = date5;
        updatedTrade5.approvedBy = 1;
        updatedTrade5.approvalComment = "Execution approved and completed";
        this.trades.set(trade5.id, updatedTrade5);
      }
    }
    
    // Pending trade 
    const pendingDate = new Date(now);
    pendingDate.setDate(now.getDate() - 2);
    
    const pendingTrade = await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: "MMF Investment",
      amount: "£4,500,000",
      details: "MMF Investment with Fidelity at 4.2% short-term",
      status: "pending",
      rate: null,
      lender: "Birmingham City Council",
      borrower: "Fidelity MMF",
      startDate: formatDateString(pendingDate),
      maturityDate: calculateMaturityDate(pendingDate, 3) // 3 months
    });
    
    if (pendingTrade) {
      const updatedPendingTrade = this.trades.get(pendingTrade.id);
      if (updatedPendingTrade) {
        updatedPendingTrade.createdAt = pendingDate;
        updatedPendingTrade.updatedAt = pendingDate;
        this.trades.set(pendingTrade.id, updatedPendingTrade);
      }
    }
    
    // Negotiation trade
    const negotiationDate = new Date(now);
    
    await this.createTrade({
      userId: 1,
      sessionId: demoSessionId,
      messageId: demoMessage.id,
      tradeType: "Deposit",
      amount: "£5,500,000",
      details: "Fixed-term deposit with Lloyds, discussing rate around 4.15-4.2% for 3 months",
      status: "negotiation",
      rate: null,
      lender: "Birmingham City Council",
      borrower: "Lloyds Bank",
      startDate: formatDateString(negotiationDate),
      maturityDate: calculateMaturityDate(negotiationDate, 3) // 3 months
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
