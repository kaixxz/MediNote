import { 
  users, 
  reports, 
  soapDrafts,
  creditTransactions,
  creditPackages,
  type User, 
  type InsertUser, 
  type Report, 
  type InsertReport,
  type SoapDraft,
  type InsertSoapDraft,
  type PatientInfo,
  type CreditTransaction,
  type InsertCreditTransaction,
  type CreditPackage
} from "@shared/schema";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  createReport(report: InsertReport): Promise<Report>;
  getReports(): Promise<Report[]>;
  
  // SOAP Draft methods
  createSoapDraft(draft: InsertSoapDraft): Promise<SoapDraft>;
  updateSoapDraft(id: number, draft: Partial<InsertSoapDraft>): Promise<SoapDraft>;
  getSoapDraft(id: number): Promise<SoapDraft | undefined>;
  getSoapDrafts(): Promise<SoapDraft[]>;
  deleteSoapDraft(id: number): Promise<void>;
  
  // Credit management methods
  getUserCredits(userId: number): Promise<{ credits: number; totalCreditsUsed: number }>;
  deductCredits(userId: number, amount: number, description: string): Promise<void>;
  addCredits(userId: number, amount: number, description: string): Promise<void>;
  getCreditTransactions(userId: number): Promise<CreditTransaction[]>;
  getCreditPackages(): Promise<CreditPackage[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private reports: Map<number, Report>;
  private soapDrafts: Map<number, SoapDraft>;
  private currentUserId: number;
  private currentReportId: number;
  private currentDraftId: number;

  constructor() {
    this.users = new Map();
    this.reports = new Map();
    this.soapDrafts = new Map();
    this.currentUserId = 1;
    this.currentReportId = 1;
    this.currentDraftId = 1;
  }

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
    const user: User = { 
      ...insertUser, 
      id, 
      credits: 3,
      totalCreditsUsed: 0,
      createdAt: new Date(),
      lastCreditPurchase: null
    };
    this.users.set(id, user);
    return user;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const id = this.currentReportId++;
    const report: Report = { 
      ...insertReport, 
      id,
      createdAt: new Date()
    };
    this.reports.set(id, report);
    return report;
  }

  async getReports(): Promise<Report[]> {
    return Array.from(this.reports.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async createSoapDraft(insertDraft: InsertSoapDraft): Promise<SoapDraft> {
    const id = this.currentDraftId++;
    const now = new Date();
    const draft: SoapDraft = {
      id,
      title: insertDraft.title,
      patientInfo: (insertDraft.patientInfo as PatientInfo) || null,
      subjective: insertDraft.subjective || null,
      objective: insertDraft.objective || null,
      assessment: insertDraft.assessment || null,
      plan: insertDraft.plan || null,
      completedSections: (insertDraft.completedSections as string[]) || [],
      createdAt: now,
      updatedAt: now,
    };
    this.soapDrafts.set(id, draft);
    return draft;
  }

  async updateSoapDraft(id: number, updates: Partial<InsertSoapDraft>): Promise<SoapDraft> {
    const existing = this.soapDrafts.get(id);
    if (!existing) {
      throw new Error(`SOAP draft with id ${id} not found`);
    }
    
    const updated: SoapDraft = {
      ...existing,
      updatedAt: new Date(),
    };

    // Update only provided fields
    if (updates.title !== undefined) updated.title = updates.title;
    if (updates.patientInfo !== undefined) updated.patientInfo = updates.patientInfo as PatientInfo;
    if (updates.subjective !== undefined) updated.subjective = updates.subjective;
    if (updates.objective !== undefined) updated.objective = updates.objective;
    if (updates.assessment !== undefined) updated.assessment = updates.assessment;
    if (updates.plan !== undefined) updated.plan = updates.plan;
    if (updates.completedSections !== undefined) updated.completedSections = updates.completedSections as string[];

    this.soapDrafts.set(id, updated);
    return updated;
  }

  async getSoapDraft(id: number): Promise<SoapDraft | undefined> {
    return this.soapDrafts.get(id);
  }

  async getSoapDrafts(): Promise<SoapDraft[]> {
    return Array.from(this.soapDrafts.values()).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()
    );
  }

  async deleteSoapDraft(id: number): Promise<void> {
    this.soapDrafts.delete(id);
  }

  async getUserCredits(userId: number): Promise<{ credits: number; totalCreditsUsed: number }> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    return { credits: user.credits, totalCreditsUsed: user.totalCreditsUsed };
  }

  async deductCredits(userId: number, amount: number, description: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    if (user.credits < amount) {
      throw new Error('Insufficient credits');
    }
    user.credits -= amount;
    user.totalCreditsUsed += amount;
    this.users.set(userId, user);
  }

  async addCredits(userId: number, amount: number, description: string): Promise<void> {
    const user = this.users.get(userId);
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    user.credits += amount;
    user.lastCreditPurchase = new Date();
    this.users.set(userId, user);
  }

  async getCreditTransactions(userId: number): Promise<CreditTransaction[]> {
    return []; // In-memory storage doesn't track transactions
  }

  async getCreditPackages(): Promise<CreditPackage[]> {
    return []; // In-memory storage doesn't have packages
  }
}

import { db } from "./db";
import { eq } from "drizzle-orm";

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async createReport(insertReport: InsertReport): Promise<Report> {
    const [report] = await db.insert(reports).values(insertReport).returning();
    return report;
  }

  async getReports(): Promise<Report[]> {
    return await db.select().from(reports).orderBy(reports.createdAt);
  }

  async createSoapDraft(insertDraft: InsertSoapDraft): Promise<SoapDraft> {
    const [draft] = await db.insert(soapDrafts).values(insertDraft).returning();
    return draft;
  }

  async updateSoapDraft(id: number, updateData: Partial<InsertSoapDraft>): Promise<SoapDraft> {
    const setValues: any = { updatedAt: new Date() };
    if (updateData.title !== undefined) setValues.title = updateData.title;
    if (updateData.patientInfo !== undefined) setValues.patientInfo = updateData.patientInfo;
    if (updateData.subjective !== undefined) setValues.subjective = updateData.subjective;
    if (updateData.objective !== undefined) setValues.objective = updateData.objective;
    if (updateData.assessment !== undefined) setValues.assessment = updateData.assessment;
    if (updateData.plan !== undefined) setValues.plan = updateData.plan;
    if (updateData.completedSections !== undefined) setValues.completedSections = updateData.completedSections;
    
    const [draft] = await db.update(soapDrafts)
      .set(setValues)
      .where(eq(soapDrafts.id, id))
      .returning();
    return draft;
  }

  async getSoapDraft(id: number): Promise<SoapDraft | undefined> {
    const [draft] = await db.select().from(soapDrafts).where(eq(soapDrafts.id, id));
    return draft || undefined;
  }

  async getSoapDrafts(): Promise<SoapDraft[]> {
    return await db.select().from(soapDrafts).orderBy(soapDrafts.updatedAt);
  }

  async deleteSoapDraft(id: number): Promise<void> {
    await db.delete(soapDrafts).where(eq(soapDrafts.id, id));
  }

  async getUserCredits(userId: number): Promise<{ credits: number; totalCreditsUsed: number }> {
    const [user] = await db.select({ credits: users.credits, totalCreditsUsed: users.totalCreditsUsed })
      .from(users)
      .where(eq(users.id, userId));
    
    if (!user) {
      throw new Error(`User with id ${userId} not found`);
    }
    return user;
  }

  async deductCredits(userId: number, amount: number, description: string): Promise<void> {
    // Check if user has enough credits
    const userCredits = await this.getUserCredits(userId);
    if (userCredits.credits < amount) {
      throw new Error('Insufficient credits');
    }
    
    // Deduct credits from user
    await db.update(users)
      .set({ 
        credits: userCredits.credits - amount,
        totalCreditsUsed: userCredits.totalCreditsUsed + amount
      })
      .where(eq(users.id, userId));
    
    // Record transaction
    await db.insert(creditTransactions).values({
      userId: userId,
      type: 'usage',
      amount: -amount,
      description: description
    });
  }

  async addCredits(userId: number, amount: number, description: string): Promise<void> {
    const userCredits = await this.getUserCredits(userId);
    
    // Add credits to user
    await db.update(users)
      .set({ 
        credits: userCredits.credits + amount,
        lastCreditPurchase: new Date()
      })
      .where(eq(users.id, userId));
    
    // Record transaction
    await db.insert(creditTransactions).values({
      userId: userId,
      type: 'purchase',
      amount: amount,
      description: description
    });
  }

  async getCreditTransactions(userId: number): Promise<CreditTransaction[]> {
    return await db.select().from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(creditTransactions.createdAt);
  }

  async getCreditPackages(): Promise<CreditPackage[]> {
    return await db.select().from(creditPackages).orderBy(creditPackages.popular);
  }
}

export const storage = new DatabaseStorage();
