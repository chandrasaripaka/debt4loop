import { pgTable, text, serial, integer, boolean, timestamp, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const companies = pgTable("companies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  anonymousId: text("anonymous_id").notNull().unique(),
  debtBalance: integer("debt_balance").notNull().default(2500),
  xrplAddress: text("xrpl_address"),
  xrplSeed: text("xrpl_seed"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const positions = pgTable("positions", {
  id: serial("id").primaryKey(),
  companyId: integer("company_id").notNull(),
  counterpartyId: text("counterparty_id").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  type: text("type").notNull(), // 'credit' or 'debt'
  dueDate: timestamp("due_date").notNull(),
  description: text("description"),
  isSettled: boolean("is_settled").notNull().default(false),
  xrplTxHash: text("xrpl_tx_hash"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loops = pgTable("loops", {
  id: serial("id").primaryKey(),
  loopId: text("loop_id").notNull().unique(),
  status: text("status").notNull().default("pending"), // 'pending', 'verified', 'completed', 'rejected'
  participantIds: text("participant_ids").array().notNull(),
  settlements: text("settlements").notNull(), // JSON string
  debtCost: integer("debt_cost").notNull(),
  createdBy: text("created_by").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const loopParticipants = pgTable("loop_participants", {
  id: serial("id").primaryKey(),
  loopId: text("loop_id").notNull(),
  companyId: integer("company_id").notNull(),
  settlementAmount: decimal("settlement_amount", { precision: 12, scale: 2 }).notNull(),
  hasAccepted: boolean("has_accepted").default(false),
  hasVerified: boolean("has_verified").default(false),
});

export const insertCompanySchema = createInsertSchema(companies).pick({
  name: true,
  anonymousId: true,
});

export const insertPositionSchema = createInsertSchema(positions).pick({
  counterpartyId: true,
  amount: true,
  currency: true,
  type: true,
  dueDate: true,
  description: true,
});

export const insertLoopSchema = createInsertSchema(loops).pick({
  loopId: true,
  participantIds: true,
  settlements: true,
  debtCost: true,
  createdBy: true,
  expiresAt: true,
});

export type Company = typeof companies.$inferSelect;
export type InsertCompany = z.infer<typeof insertCompanySchema>;
export type Position = typeof positions.$inferSelect;
export type InsertPosition = z.infer<typeof insertPositionSchema>;
export type Loop = typeof loops.$inferSelect;
export type InsertLoop = z.infer<typeof insertLoopSchema>;
export type LoopParticipant = typeof loopParticipants.$inferSelect;
