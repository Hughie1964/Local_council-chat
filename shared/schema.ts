import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "super_user"]);

// Trade status enum
export const tradeStatusEnum = pgEnum("trade_status", ["negotiation", "pending", "approved", "rejected", "executed"]);

// Document type enum
export const documentTypeEnum = pgEnum("document_type", ["treasury_strategy", "investment_policy", "debt_agreement", "meeting_minutes", "report", "other"]);

// Document access level enum
export const accessLevelEnum = pgEnum("access_level", ["private", "council", "group", "public"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  councilId: text("council_id"),
  isVerified: boolean("is_verified").notNull().default(false),
  verificationToken: text("verification_token"),
  tokenExpiry: timestamp("token_expiry"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const councils = pgTable("councils", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  councilId: text("council_id").notNull().unique(),
  financialYear: text("financial_year").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Trade execution requests that need super user approval
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  sessionId: text("session_id").notNull(),
  messageId: integer("message_id").notNull(),
  tradeType: text("trade_type").notNull(), // e.g., "PWLB borrowing", "MMF investment"
  amount: text("amount").notNull(),
  details: text("details").notNull(),
  status: tradeStatusEnum("status").notNull().default("pending"),
  approvedBy: integer("approved_by"),
  approvalComment: text("approval_comment"),
  // Additional fields for the trade details
  rate: text("rate"), // Interest rate for the trade
  lender: text("lender"), // Name of the lender
  borrower: text("borrower"), // Name of the borrower
  startDate: text("start_date"), // Start date of the trade
  maturityDate: text("maturity_date"), // Maturity date of the trade
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull(),
  content: text("content").notNull(),
  isUser: boolean("is_user").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: serial("id").primaryKey(),
  sessionId: text("session_id").notNull().unique(),
  title: text("title").notNull(),
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

// Document management system
export const documents = pgTable("documents", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // e.g., "pdf", "docx", "xlsx"
  fileSize: integer("file_size").notNull(),
  filePath: text("file_path").notNull(),
  uploaderId: integer("uploader_id").notNull(),
  councilId: text("council_id").notNull(),
  documentType: documentTypeEnum("document_type").notNull(),
  accessLevel: accessLevelEnum("access_level").notNull().default("council"),
  version: integer("version").notNull().default(1),
  isLatestVersion: boolean("is_latest_version").notNull().default(true),
  parentDocumentId: integer("parent_document_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Document sharing
export const documentSharing = pgTable("document_sharing", {
  id: serial("id").primaryKey(),
  documentId: integer("document_id").notNull(),
  sharedWithUserId: integer("shared_with_user_id"),
  sharedWithCouncilId: text("shared_with_council_id"),
  sharedWithGroupId: integer("shared_with_group_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Calendar events
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  location: text("location"),
  eventType: text("event_type").notNull(), // "meeting", "deadline", "rate_announcement", "maturity"
  isAllDay: boolean("is_all_day").notNull().default(false),
  creatorId: integer("creator_id").notNull(),
  councilId: text("council_id").notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
  reminderTime: timestamp("reminder_time"),
  relatedDocumentId: integer("related_document_id"),
  relatedTradeId: integer("related_trade_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Calendar event attendees
export const eventAttendees = pgTable("event_attendees", {
  id: serial("id").primaryKey(),
  eventId: integer("event_id").notNull(),
  userId: integer("user_id").notNull(),
  responseStatus: text("response_status").notNull().default("pending"), // "pending", "accepted", "declined"
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Direct messages
export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  recipientId: integer("recipient_id").notNull(),
  content: text("content").notNull(),
  isRead: boolean("is_read").notNull().default(false),
  hasAttachment: boolean("has_attachment").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Groups for messaging and collaboration
export const groups = pgTable("groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  ownerId: integer("owner_id").notNull(),
  isPrivate: boolean("is_private").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Group members
export const groupMembers = pgTable("group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  userId: integer("user_id").notNull(),
  role: text("role").notNull().default("member"), // "admin", "member"
  joinedAt: timestamp("joined_at").notNull().defaultNow(),
});

// Group messages
export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").notNull(),
  senderId: integer("sender_id").notNull(),
  content: text("content").notNull(),
  hasAttachment: boolean("has_attachment").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Interest rate history for trending and analysis
export const interestRates = pgTable("interest_rates", {
  id: serial("id").primaryKey(),
  rateName: text("rate_name").notNull(), // "BoE Base Rate", "PWLB 5-year", etc.
  value: text("value").notNull(),
  effectiveDate: timestamp("effective_date").notNull(),
  source: text("source").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Interest rate forecasts
export const rateForecasts = pgTable("rate_forecasts", {
  id: serial("id").primaryKey(),
  rateName: text("rate_name").notNull(),
  forecastValue: text("forecast_value").notNull(),
  forecastDate: timestamp("forecast_date").notNull(),
  confidence: text("confidence"), // e.g., "high", "medium", "low" or numeric confidence score
  methodology: text("methodology").notNull(), // e.g., "ai_prediction", "consensus", "economist"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  createdById: integer("created_by_id").notNull(),
});

// Cash flow forecasts
export const cashFlowForecasts = pgTable("cash_flow_forecasts", {
  id: serial("id").primaryKey(),
  councilId: text("council_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  scenarioType: text("scenario_type").notNull(), // "base", "optimistic", "pessimistic"
  forecastPeriod: text("forecast_period").notNull(), // e.g., "1-month", "3-month", "6-month", "1-year"
  creatorId: integer("creator_id").notNull(),
  isPublished: boolean("is_published").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Cash flow forecast data points
export const cashFlowDataPoints = pgTable("cash_flow_data_points", {
  id: serial("id").primaryKey(),
  forecastId: integer("forecast_id").notNull(),
  date: timestamp("date").notNull(),
  inflow: text("inflow").notNull(),
  outflow: text("outflow").notNull(),
  netPosition: text("net_position").notNull(),
  category: text("category"), // e.g., "operational", "investment", "debt service"
  notes: text("notes"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  email: true,
  password: true,
  role: true,
  councilId: true,
});

export const insertCouncilSchema = createInsertSchema(councils).pick({
  name: true,
  councilId: true,
  financialYear: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  sessionId: true,
  content: true,
  isUser: true,
});

export const insertSessionSchema = createInsertSchema(sessions).pick({
  sessionId: true,
  title: true,
});

export const insertTradeSchema = createInsertSchema(trades).pick({
  userId: true,
  sessionId: true,
  messageId: true,
  tradeType: true,
  amount: true,
  details: true,
  status: true,
  rate: true,
  lender: true,
  borrower: true,
  startDate: true,
  maturityDate: true
});

export const updateTradeSchema = createInsertSchema(trades).pick({
  status: true,
  approvedBy: true,
  approvalComment: true,
  rate: true,
  lender: true,
  borrower: true,
  startDate: true,
  maturityDate: true
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCouncil = z.infer<typeof insertCouncilSchema>;
export type Council = typeof councils.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

// Document schemas
export const insertDocumentSchema = createInsertSchema(documents).pick({
  title: true,
  description: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  filePath: true,
  uploaderId: true,
  councilId: true,
  documentType: true,
  accessLevel: true,
  parentDocumentId: true,
});

export const insertDocumentSharingSchema = createInsertSchema(documentSharing).pick({
  documentId: true,
  sharedWithUserId: true,
  sharedWithCouncilId: true,
  sharedWithGroupId: true,
});

// Calendar schemas
export const insertCalendarEventSchema = createInsertSchema(calendarEvents).pick({
  title: true,
  description: true,
  startTime: true,
  endTime: true,
  location: true,
  eventType: true,
  isAllDay: true,
  creatorId: true,
  councilId: true,
  isPrivate: true,
  reminderTime: true,
  relatedDocumentId: true,
  relatedTradeId: true,
});

export const insertEventAttendeeSchema = createInsertSchema(eventAttendees).pick({
  eventId: true,
  userId: true,
  responseStatus: true,
});

// Messaging schemas
export const insertDirectMessageSchema = createInsertSchema(directMessages).pick({
  senderId: true,
  recipientId: true,
  content: true,
  hasAttachment: true,
});

export const insertGroupSchema = createInsertSchema(groups).pick({
  name: true,
  description: true,
  ownerId: true,
  isPrivate: true,
});

export const insertGroupMemberSchema = createInsertSchema(groupMembers).pick({
  groupId: true,
  userId: true,
  role: true,
});

export const insertGroupMessageSchema = createInsertSchema(groupMessages).pick({
  groupId: true,
  senderId: true,
  content: true,
  hasAttachment: true,
});

// Interest rate and forecasting schemas
export const insertInterestRateSchema = createInsertSchema(interestRates).pick({
  rateName: true,
  value: true,
  effectiveDate: true,
  source: true,
  notes: true,
});

export const insertRateForecastSchema = createInsertSchema(rateForecasts).pick({
  rateName: true,
  forecastValue: true,
  forecastDate: true,
  confidence: true,
  methodology: true,
  createdById: true,
});

export const insertCashFlowForecastSchema = createInsertSchema(cashFlowForecasts).pick({
  councilId: true,
  title: true,
  description: true,
  scenarioType: true,
  forecastPeriod: true,
  creatorId: true,
  isPublished: true,
});

export const insertCashFlowDataPointSchema = createInsertSchema(cashFlowDataPoints).pick({
  forecastId: true,
  date: true,
  inflow: true,
  outflow: true,
  netPosition: true,
  category: true,
  notes: true,
});

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type UpdateTrade = z.infer<typeof updateTradeSchema>;
export type Trade = typeof trades.$inferSelect;

// Document types
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocumentSharing = z.infer<typeof insertDocumentSharingSchema>;
export type DocumentSharing = typeof documentSharing.$inferSelect;

// Calendar types
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertEventAttendee = z.infer<typeof insertEventAttendeeSchema>;
export type EventAttendee = typeof eventAttendees.$inferSelect;

// Messaging types
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertGroup = z.infer<typeof insertGroupSchema>;
export type Group = typeof groups.$inferSelect;
export type InsertGroupMember = z.infer<typeof insertGroupMemberSchema>;
export type GroupMember = typeof groupMembers.$inferSelect;
export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;
export type GroupMessage = typeof groupMessages.$inferSelect;

// Interest rate and forecasting types
export type InsertInterestRate = z.infer<typeof insertInterestRateSchema>;
export type InterestRate = typeof interestRates.$inferSelect;
export type InsertRateForecast = z.infer<typeof insertRateForecastSchema>;
export type RateForecast = typeof rateForecasts.$inferSelect;
export type InsertCashFlowForecast = z.infer<typeof insertCashFlowForecastSchema>;
export type CashFlowForecast = typeof cashFlowForecasts.$inferSelect;
export type InsertCashFlowDataPoint = z.infer<typeof insertCashFlowDataPointSchema>;
export type CashFlowDataPoint = typeof cashFlowDataPoints.$inferSelect;
