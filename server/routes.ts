import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateReportSchema } from "@shared/schema";
import { generateSOAPNote } from "./services/ai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Generate medical report endpoint
  app.post("/api/generate", async (req, res) => {
    try {
      const { reportType, patientNotes } = generateReportSchema.parse(req.body);
      
      let generatedReport: string;
      
      if (reportType === "soap") {
        generatedReport = await generateSOAPNote(patientNotes);
      } else {
        return res.status(400).json({ 
          message: "Report type not supported yet" 
        });
      }
      
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
