import { pgTable, text, serial, integer, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User roles enum
export const userRoleEnum = pgEnum("user_role", ["user", "admin", "super_user"]);

// Trade status enum
export const tradeStatusEnum = pgEnum("trade_status", ["negotiation", "pending", "approved", "rejected", "executed"]);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: userRoleEnum("role").notNull().default("user"),
  councilId: text("council_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const councils = pgTable("councils", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  councilId: text("council_id").notNull().unique(),
  financialYear: text("financial_year").notNull(),
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

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
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
});

export const updateTradeSchema = createInsertSchema(trades).pick({
  status: true,
  approvedBy: true,
  approvalComment: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertCouncil = z.infer<typeof insertCouncilSchema>;
export type Council = typeof councils.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertSession = z.infer<typeof insertSessionSchema>;
export type Session = typeof sessions.$inferSelect;

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type UpdateTrade = z.infer<typeof updateTradeSchema>;
export type Trade = typeof trades.$inferSelect;
