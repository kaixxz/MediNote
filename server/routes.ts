import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateReportSchema, 
  generateSectionSchema, 
  reviewReportSchema, 
  saveDraftSchema 
} from "@shared/schema";
import { generateMedicalReport, generateSoapSection, reviewSoapReport } from "./services/ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Generate SOAP section endpoint
  app.post("/api/generate-section", async (req, res) => {
    try {
      const { section, content, patientInfo, reportType } = req.body;
      
      const generatedContent = await generateSoapSection(section, content, patientInfo, reportType || "soap");
      
      res.json({ content: generatedContent });
    } catch (error) {
      console.error("Error generating section:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate section" 
      });
    }
  });

  // Review SOAP report endpoint
  app.post("/api/review", async (req, res) => {
    try {
      const { subjective, objective, assessment, plan } = reviewReportSchema.parse(req.body);
      
      const review = await reviewSoapReport(subjective, objective, assessment, plan);
      
      res.json(review);
    } catch (error) {
      console.error("Error reviewing report:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to review report" 
      });
    }
  });

  // SOAP Draft endpoints
  app.post("/api/drafts", async (req, res) => {
    try {
      const draftData = saveDraftSchema.parse(req.body);
      
      const draft = await storage.createSoapDraft(draftData);
      
      res.json(draft);
    } catch (error) {
      console.error("Error saving draft:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to save draft" 
      });
    }
  });

  app.get("/api/drafts", async (req, res) => {
    try {
      const drafts = await storage.getSoapDrafts();
      res.json(drafts);
    } catch (error) {
      console.error("Error fetching drafts:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch drafts" 
      });
    }
  });

  app.get("/api/drafts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const draft = await storage.getSoapDraft(id);
      
      if (!draft) {
        return res.status(404).json({ message: "Draft not found" });
      }
      
      res.json(draft);
    } catch (error) {
      console.error("Error fetching draft:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch draft" 
      });
    }
  });

  app.put("/api/drafts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = saveDraftSchema.partial().parse(req.body);
      
      const draft = await storage.updateSoapDraft(id, updates);
      
      res.json(draft);
    } catch (error) {
      console.error("Error updating draft:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to update draft" 
      });
    }
  });

  app.delete("/api/drafts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSoapDraft(id);
      
      res.json({ message: "Draft deleted successfully" });
    } catch (error) {
      console.error("Error deleting draft:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to delete draft" 
      });
    }
  });

  // Legacy generate medical report endpoint
  app.post("/api/generate", async (req, res) => {
    try {
      const { reportType, patientNotes } = generateReportSchema.parse(req.body);
      
      const generatedReport = await generateMedicalReport(patientNotes, reportType);
      
      // Save the report to storage
      await storage.createReport({
        reportType,
        patientNotes,
        generatedReport,
      });
      
      res.json({ report: generatedReport });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate report" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
