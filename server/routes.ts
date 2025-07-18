import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  generateReportSchema, 
  generateSectionSchema, 
  reviewReportSchema, 
  saveDraftSchema 
} from "@shared/schema";
import { generateMedicalReport, generateSoapSection, reviewSoapReport, generateSmartSuggestions } from "./services/ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Health check endpoint
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Generate SOAP section endpoint (requires credits)
  app.post("/api/generate-section", async (req, res) => {
    try {
      const { section, content, patientInfo, reportType } = req.body;
      
      // For now, use a default user ID of 1 (in a real app, this would come from authentication)
      const userId = 1;
      
      // Check if user has credits
      try {
        const userCredits = await storage.getUserCredits(userId);
        if (userCredits.credits < 1) {
          return res.status(402).json({ 
            message: "Insufficient credits. Please purchase more credits to continue.",
            credits: userCredits.credits
          });
        }
      } catch (error) {
        // If user doesn't exist, create one with default credits
        await storage.createUser({ username: "default_user", password: "temp" });
      }
      
      const generatedContent = await generateSoapSection(section, content, patientInfo, reportType || "soap");
      
      // Deduct 1 credit for AI generation
      await storage.deductCredits(userId, 1, `Generated ${section} section`);
      
      res.json({ content: generatedContent });
    } catch (error) {
      console.error("Error generating section:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate section" 
      });
    }
  });

  // Review SOAP report endpoint (requires credits)
  app.post("/api/review", async (req, res) => {
    try {
      const { subjective, objective, assessment, plan } = reviewReportSchema.parse(req.body);
      
      // For now, use a default user ID of 1 (in a real app, this would come from authentication)
      const userId = 1;
      
      // Check if user has credits
      const userCredits = await storage.getUserCredits(userId);
      if (userCredits.credits < 1) {
        return res.status(402).json({ 
          message: "Insufficient credits. Please purchase more credits to continue.",
          credits: userCredits.credits
        });
      }
      
      const review = await reviewSoapReport(subjective, objective, assessment, plan);
      
      // Deduct 1 credit for AI review
      await storage.deductCredits(userId, 1, "AI report review");
      
      res.json(review);
    } catch (error) {
      console.error("Error reviewing report:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to review report" 
      });
    }
  });

  // Smart suggestions endpoint for auto-fill functionality (free)
  app.post("/api/smart-suggestions", async (req, res) => {
    try {
      const { symptom, currentInfo, reportType } = req.body;
      
      const suggestions = await generateSmartSuggestions(symptom, currentInfo, reportType);
      
      res.json(suggestions);
    } catch (error) {
      console.error("Error generating smart suggestions:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate suggestions" 
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

  // Credit management endpoints
  app.get("/api/credits", async (req, res) => {
    try {
      // For now, use a default user ID of 1 (in a real app, this would come from authentication)
      const userId = 1;
      
      try {
        const userCredits = await storage.getUserCredits(userId);
        res.json(userCredits);
      } catch (error) {
        // If user doesn't exist, create one with default credits
        await storage.createUser({ username: "default_user", password: "temp" });
        const userCredits = await storage.getUserCredits(userId);
        res.json(userCredits);
      }
    } catch (error) {
      console.error("Error fetching credits:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch credits" 
      });
    }
  });

  app.post("/api/credits/purchase", async (req, res) => {
    try {
      const { package: packageType } = req.body;
      const userId = 1; // Default user for demo
      
      // Credit packages: small (5 credits, $2), medium (15 credits, $5), large (35 credits, $10)
      const packages = {
        small: { credits: 5, price: 200 }, // $2.00
        medium: { credits: 15, price: 500 }, // $5.00
        large: { credits: 35, price: 1000 } // $10.00
      };
      
      const selectedPackage = packages[packageType as keyof typeof packages];
      if (!selectedPackage) {
        return res.status(400).json({ message: "Invalid package type" });
      }
      
      // In a real app, you'd process payment here with Stripe
      // For demo purposes, we'll just add the credits
      await storage.addCredits(userId, selectedPackage.credits, `Purchased ${packageType} package`);
      
      const updatedCredits = await storage.getUserCredits(userId);
      res.json({ 
        success: true, 
        credits: updatedCredits.credits,
        purchased: selectedPackage.credits
      });
    } catch (error) {
      console.error("Error purchasing credits:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to purchase credits" 
      });
    }
  });

  app.get("/api/credits/transactions", async (req, res) => {
    try {
      const userId = 1; // Default user for demo
      const transactions = await storage.getCreditTransactions(userId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to fetch transactions" 
      });
    }
  });

  // Legacy endpoints for backward compatibility
  app.post("/api/generate", async (req, res) => {
    try {
      const { reportType, patientNotes } = generateReportSchema.parse(req.body);
      
      const report = await generateMedicalReport(patientNotes, reportType);
      
      // Save the report to storage
      await storage.createReport({
        reportType,
        patientNotes,
        generatedReport: report
      });
      
      res.json({ report });
    } catch (error) {
      console.error("Error generating report:", error);
      res.status(500).json({ 
        message: error instanceof Error ? error.message : "Failed to generate report" 
      });
    }
  });

  app.get("/api/reports", async (req, res) => {
    try {
      const reports = await storage.getReports();
      res.json(reports);
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
