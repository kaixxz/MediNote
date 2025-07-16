import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(),
  patientNotes: text("patient_notes").notNull(),
  generatedReport: text("generated_report").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertReportSchema = createInsertSchema(reports).pick({
  reportType: true,
  patientNotes: true,
  generatedReport: true,
});

export const generateReportSchema = z.object({
  reportType: z.enum(["soap", "progress", "discharge"]),
  patientNotes: z.string().min(1).max(2000),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type GenerateReportRequest = z.infer<typeof generateReportSchema>;
export type GenerateReportResponse = {
  report: string;
};
