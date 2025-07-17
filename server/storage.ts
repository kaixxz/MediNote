import { 
  users, 
  reports, 
  soapDrafts,
  type User, 
  type InsertUser, 
  type Report, 
  type InsertReport,
  type SoapDraft,
  type InsertSoapDraft,
  type PatientInfo
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
    const user: User = { ...insertUser, id };
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
}

export const storage = new MemStorage();
