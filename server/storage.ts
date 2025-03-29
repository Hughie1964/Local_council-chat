import bcrypt from "bcrypt";
import { 
  // User types
  InsertUser, 
  User, 
  
  // Council types
  InsertCouncil, 
  Council, 
  
  // Session types
  InsertSession, 
  Session, 
  
  // Message types
  InsertMessage, 
  Message, 
  
  // Trade types
  InsertTrade, 
  Trade,
  UpdateTrade,
  
  // Document types
  InsertDocument,
  Document,
  InsertDocumentSharing,
  DocumentSharing,
  
  // Calendar types
  InsertCalendarEvent,
  CalendarEvent,
  InsertEventAttendee,
  EventAttendee,
  
  // Messaging types
  InsertDirectMessage,
  DirectMessage,
  InsertGroup,
  Group,
  InsertGroupMember,
  GroupMember,
  InsertGroupMessage,
  GroupMessage,
  
  // Interest rate and forecasting types
  InsertInterestRate,
  InterestRate,
  InsertRateForecast,
  RateForecast,
  InsertCashFlowForecast,
  CashFlowForecast,
  InsertCashFlowDataPoint,
  CashFlowDataPoint,
  
  // Tables
  users,
  councils,
  sessions,
  messages,
  trades,
  documents,
  documentSharing,
  calendarEvents,
  eventAttendees,
  directMessages,
  groups,
  groupMembers,
  groupMessages,
  interestRates,
  rateForecasts,
  cashFlowForecasts,
  cashFlowDataPoints
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, or } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserRole(userId: number, role: "user" | "admin" | "super_user"): Promise<User | undefined>;
  getSuperUsers(): Promise<User[]>;
  verifyUser(verificationToken: string): Promise<User | undefined>;
  updateUserVerificationToken(userId: number, token: string, expiry: Date): Promise<User | undefined>;
  
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
  
  // Document methods
  createDocument(document: InsertDocument): Promise<Document>;
  getDocument(id: number): Promise<Document | undefined>;
  getUserDocuments(userId: number): Promise<Document[]>;
  getCouncilDocuments(councilId: string): Promise<Document[]>;
  searchDocuments(query: string): Promise<Document[]>;
  updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined>;
  deleteDocument(id: number): Promise<boolean>;
  shareDocument(sharing: InsertDocumentSharing): Promise<DocumentSharing>;
  getDocumentSharing(documentId: number): Promise<DocumentSharing[]>;
  
  // Calendar methods
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  getCalendarEvent(id: number): Promise<CalendarEvent | undefined>;
  getUserCalendarEvents(userId: number): Promise<CalendarEvent[]>;
  getCouncilCalendarEvents(councilId: string): Promise<CalendarEvent[]>;
  updateCalendarEvent(id: number, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: number): Promise<boolean>;
  addEventAttendee(attendee: InsertEventAttendee): Promise<EventAttendee>;
  getEventAttendees(eventId: number): Promise<EventAttendee[]>;
  updateAttendeeResponse(id: number, responseStatus: string): Promise<EventAttendee | undefined>;
  
  // Messaging methods
  sendDirectMessage(message: InsertDirectMessage): Promise<DirectMessage>;
  getUserDirectMessages(userId: number): Promise<DirectMessage[]>;
  getConversation(user1Id: number, user2Id: number): Promise<DirectMessage[]>;
  markDirectMessageAsRead(id: number): Promise<DirectMessage | undefined>;
  createGroup(group: InsertGroup): Promise<Group>;
  getGroup(id: number): Promise<Group | undefined>;
  getUserGroups(userId: number): Promise<Group[]>;
  addGroupMember(member: InsertGroupMember): Promise<GroupMember>;
  getGroupMembers(groupId: number): Promise<GroupMember[]>;
  removeGroupMember(groupId: number, userId: number): Promise<boolean>;
  sendGroupMessage(message: InsertGroupMessage): Promise<GroupMessage>;
  getGroupMessages(groupId: number): Promise<GroupMessage[]>;
  
  // Interest rates and forecasting methods
  addInterestRate(rate: InsertInterestRate): Promise<InterestRate>;
  getLatestInterestRates(): Promise<InterestRate[]>;
  getInterestRateHistory(rateName: string): Promise<InterestRate[]>;
  createRateForecast(forecast: InsertRateForecast): Promise<RateForecast>;
  getRateForecasts(rateName: string): Promise<RateForecast[]>;
  createCashFlowForecast(forecast: InsertCashFlowForecast): Promise<CashFlowForecast>;
  getCashFlowForecast(id: number): Promise<CashFlowForecast | undefined>;
  getCouncilCashFlowForecasts(councilId: string): Promise<CashFlowForecast[]>;
  addCashFlowDataPoint(dataPoint: InsertCashFlowDataPoint): Promise<CashFlowDataPoint>;
  getCashFlowDataPoints(forecastId: number): Promise<CashFlowDataPoint[]>;
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
      .values({
        ...insertUser,
        isVerified: false,
        verificationToken: null,
        tokenExpiry: null
      })
      .returning();
    return user;
  }
  
  async verifyUser(verificationToken: string): Promise<User | undefined> {
    // Find user with the given verification token
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.verificationToken, verificationToken));
    
    if (!user || !user.tokenExpiry || new Date(user.tokenExpiry) < new Date()) {
      return undefined;
    }
    
    // Update user to verified
    const [updatedUser] = await db
      .update(users)
      .set({
        isVerified: true,
        verificationToken: null,
        tokenExpiry: null
      })
      .where(eq(users.id, user.id))
      .returning();
      
    return updatedUser;
  }
  
  async updateUserVerificationToken(userId: number, token: string, expiry: Date): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        verificationToken: token,
        tokenExpiry: expiry
      })
      .where(eq(users.id, userId))
      .returning();
      
    return updatedUser;
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
    console.log("STORAGE: Looking up council with councilId:", councilId);
    
    try {
      const [council] = await db
        .select()
        .from(councils)
        .where(eq(councils.councilId, councilId));
      
      console.log("STORAGE: Found council:", council);
      return council;
    } catch (error) {
      console.error("STORAGE: Error fetching council:", error);
      return undefined;
    }
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
  
  // Document methods
  async createDocument(document: InsertDocument): Promise<Document> {
    const [newDocument] = await db
      .insert(documents)
      .values({
        ...document,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newDocument;
  }
  
  async getDocument(id: number): Promise<Document | undefined> {
    const [document] = await db
      .select()
      .from(documents)
      .where(eq(documents.id, id));
    return document;
  }
  
  async getUserDocuments(userId: number): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.uploaderId, userId))
      .orderBy(desc(documents.updatedAt));
  }
  
  async getCouncilDocuments(councilId: string): Promise<Document[]> {
    return await db
      .select()
      .from(documents)
      .where(eq(documents.councilId, councilId))
      .orderBy(desc(documents.updatedAt));
  }
  
  async searchDocuments(query: string): Promise<Document[]> {
    // Simple search implementation - in a real app, we might use full-text search
    const lowercaseQuery = query.toLowerCase();
    const allDocuments = await db.select().from(documents);
    
    // Filter documents based on the search query
    return allDocuments.filter(doc => 
      doc.title.toLowerCase().includes(lowercaseQuery) || 
      (doc.description && doc.description.toLowerCase().includes(lowercaseQuery))
    );
  }
  
  async updateDocument(id: number, document: Partial<InsertDocument>): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set({
        ...document,
        updatedAt: new Date()
      })
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument;
  }
  
  async deleteDocument(id: number): Promise<boolean> {
    // First, delete any document sharing records
    await db
      .delete(documentSharing)
      .where(eq(documentSharing.documentId, id));
    
    // Then delete the document
    await db
      .delete(documents)
      .where(eq(documents.id, id));
    
    return true;
  }
  
  async shareDocument(sharing: InsertDocumentSharing): Promise<DocumentSharing> {
    const [newSharing] = await db
      .insert(documentSharing)
      .values({
        ...sharing,
        createdAt: new Date()
      })
      .returning();
    return newSharing;
  }
  
  async getDocumentSharing(documentId: number): Promise<DocumentSharing[]> {
    return await db
      .select()
      .from(documentSharing)
      .where(eq(documentSharing.documentId, documentId));
  }
  
  // Calendar methods
  async createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent> {
    const [newEvent] = await db
      .insert(calendarEvents)
      .values({
        ...event,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newEvent;
  }
  
  async getCalendarEvent(id: number): Promise<CalendarEvent | undefined> {
    const [event] = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.id, id));
    return event;
  }
  
  async getUserCalendarEvents(userId: number): Promise<CalendarEvent[]> {
    // Get events created by the user
    const createdEvents = await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.creatorId, userId));
    
    // Get events the user is attending
    const attendingEventIds = await db
      .select()
      .from(eventAttendees)
      .where(eq(eventAttendees.userId, userId));
    
    // Get the actual events the user is attending
    const attendingEvents = await Promise.all(
      attendingEventIds.map(async (attendee) => {
        const [event] = await db
          .select()
          .from(calendarEvents)
          .where(eq(calendarEvents.id, attendee.eventId));
        return event;
      })
    );
    
    // Combine and filter out duplicates
    const allEvents = [...createdEvents, ...attendingEvents.filter(Boolean)];
    const uniqueEvents = allEvents.filter((event, index, self) =>
      index === self.findIndex((e) => e.id === event.id)
    );
    
    return uniqueEvents.sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
  
  async getCouncilCalendarEvents(councilId: string): Promise<CalendarEvent[]> {
    return await db
      .select()
      .from(calendarEvents)
      .where(eq(calendarEvents.councilId, councilId))
      .orderBy(desc(calendarEvents.startTime));
  }
  
  async updateCalendarEvent(id: number, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const [updatedEvent] = await db
      .update(calendarEvents)
      .set({
        ...event,
        updatedAt: new Date()
      })
      .where(eq(calendarEvents.id, id))
      .returning();
    return updatedEvent;
  }
  
  async deleteCalendarEvent(id: number): Promise<boolean> {
    // First, delete any attendees
    await db
      .delete(eventAttendees)
      .where(eq(eventAttendees.eventId, id));
    
    // Then delete the event
    await db
      .delete(calendarEvents)
      .where(eq(calendarEvents.id, id));
    
    return true;
  }
  
  async addEventAttendee(attendee: InsertEventAttendee): Promise<EventAttendee> {
    const [newAttendee] = await db
      .insert(eventAttendees)
      .values({
        ...attendee,
        createdAt: new Date()
      })
      .returning();
    return newAttendee;
  }
  
  async getEventAttendees(eventId: number): Promise<EventAttendee[]> {
    return await db
      .select()
      .from(eventAttendees)
      .where(eq(eventAttendees.eventId, eventId));
  }
  
  async updateAttendeeResponse(id: number, responseStatus: string): Promise<EventAttendee | undefined> {
    const [updatedAttendee] = await db
      .update(eventAttendees)
      .set({ responseStatus })
      .where(eq(eventAttendees.id, id))
      .returning();
    return updatedAttendee;
  }
  
  // Messaging methods
  async sendDirectMessage(message: InsertDirectMessage): Promise<DirectMessage> {
    const [newMessage] = await db
      .insert(directMessages)
      .values({
        ...message,
        isRead: false,
        createdAt: new Date()
      })
      .returning();
    return newMessage;
  }
  
  async getUserDirectMessages(userId: number): Promise<DirectMessage[]> {
    // Get messages sent by or received by the user
    return await db
      .select()
      .from(directMessages)
      .where(
        or(
          eq(directMessages.senderId, userId),
          eq(directMessages.recipientId, userId)
        )
      )
      .orderBy(desc(directMessages.createdAt));
  }
  
  async getConversation(user1Id: number, user2Id: number): Promise<DirectMessage[]> {
    // Get messages between the two users
    return await db
      .select()
      .from(directMessages)
      .where(
        or(
          and(
            eq(directMessages.senderId, user1Id),
            eq(directMessages.recipientId, user2Id)
          ),
          and(
            eq(directMessages.senderId, user2Id),
            eq(directMessages.recipientId, user1Id)
          )
        )
      )
      .orderBy(directMessages.createdAt);
  }
  
  async markDirectMessageAsRead(id: number): Promise<DirectMessage | undefined> {
    const [updatedMessage] = await db
      .update(directMessages)
      .set({ isRead: true })
      .where(eq(directMessages.id, id))
      .returning();
    return updatedMessage;
  }
  
  async createGroup(group: InsertGroup): Promise<Group> {
    const [newGroup] = await db
      .insert(groups)
      .values({
        ...group,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newGroup;
  }
  
  async getGroup(id: number): Promise<Group | undefined> {
    const [group] = await db
      .select()
      .from(groups)
      .where(eq(groups.id, id));
    return group;
  }
  
  async getUserGroups(userId: number): Promise<Group[]> {
    // Get group IDs where the user is a member
    const membershipGroups = await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.userId, userId));
    
    // Get the actual groups
    const userGroups = await Promise.all(
      membershipGroups.map(async (membership) => {
        const [groupData] = await db
          .select()
          .from(groups)
          .where(eq(groups.id, membership.groupId));
        return groupData;
      })
    );
    
    return userGroups.filter((g): g is Group => Boolean(g)).sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  }
  
  async addGroupMember(member: InsertGroupMember): Promise<GroupMember> {
    const [newMember] = await db
      .insert(groupMembers)
      .values({
        ...member,
        joinedAt: new Date()
      })
      .returning();
    return newMember;
  }
  
  async getGroupMembers(groupId: number): Promise<GroupMember[]> {
    return await db
      .select()
      .from(groupMembers)
      .where(eq(groupMembers.groupId, groupId));
  }
  
  async removeGroupMember(groupId: number, userId: number): Promise<boolean> {
    const result = await db
      .delete(groupMembers)
      .where(
        and(
          eq(groupMembers.groupId, groupId),
          eq(groupMembers.userId, userId)
        )
      );
    
    return true; // Since delete doesn't return count in Drizzle
  }
  
  async sendGroupMessage(message: InsertGroupMessage): Promise<GroupMessage> {
    const [newMessage] = await db
      .insert(groupMessages)
      .values({
        ...message,
        createdAt: new Date()
      })
      .returning();
    return newMessage;
  }
  
  async getGroupMessages(groupId: number): Promise<GroupMessage[]> {
    return await db
      .select()
      .from(groupMessages)
      .where(eq(groupMessages.groupId, groupId))
      .orderBy(groupMessages.createdAt);
  }
  
  // Interest rates and forecasting methods
  async addInterestRate(rate: InsertInterestRate): Promise<InterestRate> {
    const [newRate] = await db
      .insert(interestRates)
      .values({
        ...rate,
        createdAt: new Date()
      })
      .returning();
    return newRate;
  }
  
  async getLatestInterestRates(): Promise<InterestRate[]> {
    // Get distinct rate names
    const allRates = await db.select().from(interestRates);
    const rateNamesSet = new Set<string>();
    allRates.forEach(rate => rateNamesSet.add(rate.rateName));
    const rateNames = Array.from(rateNamesSet);
    
    // For each rate name, get the latest rate
    const latestRates = await Promise.all(
      rateNames.map(async (rateName) => {
        const rates = await db
          .select()
          .from(interestRates)
          .where(eq(interestRates.rateName, rateName))
          .orderBy(desc(interestRates.effectiveDate));
        return rates[0];
      })
    );
    
    return latestRates.filter(Boolean);
  }
  
  async getInterestRateHistory(rateName: string): Promise<InterestRate[]> {
    return await db
      .select()
      .from(interestRates)
      .where(eq(interestRates.rateName, rateName))
      .orderBy(desc(interestRates.effectiveDate));
  }
  
  async createRateForecast(forecast: InsertRateForecast): Promise<RateForecast> {
    const [newForecast] = await db
      .insert(rateForecasts)
      .values({
        ...forecast,
        createdAt: new Date()
      })
      .returning();
    return newForecast;
  }
  
  async getRateForecasts(rateName: string): Promise<RateForecast[]> {
    return await db
      .select()
      .from(rateForecasts)
      .where(eq(rateForecasts.rateName, rateName))
      .orderBy(rateForecasts.forecastDate);
  }
  
  async createCashFlowForecast(forecast: InsertCashFlowForecast): Promise<CashFlowForecast> {
    const [newForecast] = await db
      .insert(cashFlowForecasts)
      .values({
        ...forecast,
        createdAt: new Date(),
        updatedAt: new Date()
      })
      .returning();
    return newForecast;
  }
  
  async getCashFlowForecast(id: number): Promise<CashFlowForecast | undefined> {
    const [forecast] = await db
      .select()
      .from(cashFlowForecasts)
      .where(eq(cashFlowForecasts.id, id));
    return forecast;
  }
  
  async getCouncilCashFlowForecasts(councilId: string): Promise<CashFlowForecast[]> {
    return await db
      .select()
      .from(cashFlowForecasts)
      .where(eq(cashFlowForecasts.councilId, councilId))
      .orderBy(desc(cashFlowForecasts.updatedAt));
  }
  
  async addCashFlowDataPoint(dataPoint: InsertCashFlowDataPoint): Promise<CashFlowDataPoint> {
    const [newDataPoint] = await db
      .insert(cashFlowDataPoints)
      .values(dataPoint)
      .returning();
    return newDataPoint;
  }
  
  async getCashFlowDataPoints(forecastId: number): Promise<CashFlowDataPoint[]> {
    return await db
      .select()
      .from(cashFlowDataPoints)
      .where(eq(cashFlowDataPoints.forecastId, forecastId))
      .orderBy(cashFlowDataPoints.date);
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
          email: "user@example.com",
          password: userPassword,
          role: "user",
          councilId: "BCC-001",
          isVerified: true
        })
        .returning();
      
      const [user2] = await db
        .insert(users)
        .values({
          username: "admin",
          email: "admin@example.com",
          password: adminPassword,
          role: "admin",
          councilId: "BCC-001",
          isVerified: true
        })
        .returning();
      
      const [user3] = await db
        .insert(users)
        .values({
          username: "super_user",
          email: "super@example.com",
          password: adminPassword,
          role: "super_user",
          councilId: "BCC-001",
          isVerified: true
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