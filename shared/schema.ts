import { pgTable, text, serial, timestamp, json, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Patient info type
export type PatientInfo = {
  // Patient Demographics
  patientName?: string;
  age?: number;
  gender?: string;
  dateOfBirth?: string;
  mrn?: string; // Medical Record Number
  
  // Medical Information
  medicalHistory?: string;
  symptoms?: string[];
  affectedSystem?: string;
  allergies?: string;
  currentMedications?: string;
  
  // Healthcare Provider Info
  doctorName?: string;
  hospitalName?: string;
  department?: string;
  
  // Visit Information
  visitDate?: string;
  chiefComplaint?: string;
};

// Updated SOAP drafts table for structured reports
export const soapDrafts = pgTable("soap_drafts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  patientInfo: json("patient_info").$type<PatientInfo>(),
  subjective: text("subjective"),
  objective: text("objective"),
  assessment: text("assessment"),
  plan: text("plan"),
  completedSections: json("completed_sections").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});





// Keep existing reports table for backward compatibility
export const reports = pgTable("reports", {
  id: serial("id").primaryKey(),
  reportType: text("report_type").notNull(),
  patientNotes: text("patient_notes").notNull(),
  generatedReport: text("generated_report").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// SOAP section generation schemas
// Patient info schema
export const patientInfoSchema = z.object({
  // Patient Demographics
  patientName: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  mrn: z.string().optional(),
  
  // Medical Information
  medicalHistory: z.string().optional(),
  symptoms: z.array(z.string()).optional(),
  affectedSystem: z.string().optional(),
  allergies: z.string().optional(),
  currentMedications: z.string().optional(),
  
  // Healthcare Provider Info
  doctorName: z.string().optional(),
  hospitalName: z.string().optional(),
  department: z.string().optional(),
  
  // Visit Information
  visitDate: z.string().optional(),
  chiefComplaint: z.string().optional(),
});

export const generateSectionSchema = z.object({
  section: z.enum(["subjective", "objective", "assessment", "plan"]),
  content: z.string().min(1).max(2000),
  patientInfo: patientInfoSchema.optional(),
});

export const reviewReportSchema = z.object({
  subjective: z.string(),
  objective: z.string(),
  assessment: z.string(),
  plan: z.string(),
});

export const saveDraftSchema = z.object({
  title: z.string().min(1).max(100),
  patientInfo: patientInfoSchema.optional(),
  subjective: z.string().optional(),
  objective: z.string().optional(),
  assessment: z.string().optional(),
  plan: z.string().optional(),
  completedSections: z.array(z.string()).default([]),
});

// Legacy schemas
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

// New schema exports
export const insertSoapDraftSchema = createInsertSchema(soapDrafts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertReport = z.infer<typeof insertReportSchema>;
export type Report = typeof reports.$inferSelect;
export type GenerateReportRequest = z.infer<typeof generateReportSchema>;
export type GenerateReportResponse = {
  report: string;
};

export type SoapDraft = typeof soapDrafts.$inferSelect;
export type InsertSoapDraft = z.infer<typeof insertSoapDraftSchema>;
export type GenerateSectionRequest = z.infer<typeof generateSectionSchema>;
export type ReviewReportRequest = z.infer<typeof reviewReportSchema>;
export type SaveDraftRequest = z.infer<typeof saveDraftSchema>;

export type GenerateSectionResponse = {
  content: string;
};

export type ReviewReportResponse = {
  suggestions: {
    section: string;
    issues: string[];
    suggestions: string[];
  }[];
};
