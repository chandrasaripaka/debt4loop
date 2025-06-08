import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertPositionSchema, insertLoopSchema } from "@shared/schema";
import { registerXRPLRoutes } from "./xrpl-routes";
import { registerTokenRoutes } from "./xrpl-token-routes";
import { registerExplorerRoutes } from "./xrpl-explorer-routes";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get current company (main user)
  app.get("/api/company/current", async (req, res) => {
    try {
      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      res.status(500).json({ message: "Failed to get company" });
    }
  });

  // Get all companies
  app.get("/api/companies", async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      res.json(companies);
    } catch (error) {
      res.status(500).json({ message: "Failed to get companies" });
    }
  });

  // Get positions for current company
  app.get("/api/positions", async (req, res) => {
    try {
      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      const positions = await storage.getPositionsByCompany(company.id);
      res.json(positions);
    } catch (error) {
      res.status(500).json({ message: "Failed to get positions" });
    }
  });

  // Create new position
  app.post("/api/positions", async (req, res) => {
    try {
      const validatedData = insertPositionSchema.parse(req.body);
      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Verify counterparty exists
      const counterparty = await storage.getCompanyByAnonymousId(validatedData.counterpartyId);
      if (!counterparty) {
        return res.status(400).json({ message: "Counterparty company not found" });
      }

      const position = await storage.createPosition(company.id, validatedData);
      res.json(position);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation failed", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create position" });
    }
  });

  // Get all loops
  app.get("/api/loops", async (req, res) => {
    try {
      const loops = await storage.getAllLoops();
      res.json(loops);
    } catch (error) {
      res.status(500).json({ message: "Failed to get loops" });
    }
  });

  // Get active loops for current company
  app.get("/api/loops/active", async (req, res) => {
    try {
      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      const allLoops = await storage.getLoopsByStatus("pending");
      const activeLoops = allLoops.filter(loop => 
        loop.participantIds.includes(company.anonymousId)
      );

      res.json(activeLoops);
    } catch (error) {
      res.status(500).json({ message: "Failed to get active loops" });
    }
  });

  // Accept/reject loop
  app.post("/api/loops/:loopId/respond", async (req, res) => {
    try {
      const { loopId } = req.params;
      const { action } = req.body; // 'accept' or 'reject'
      
      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      const loop = await storage.getLoop(loopId);
      if (!loop) {
        return res.status(404).json({ message: "Loop not found" });
      }

      await storage.updateParticipantAcceptance(loopId, company.id, action === 'accept');
      
      res.json({ message: `Loop ${action}ed successfully` });
    } catch (error) {
      res.status(500).json({ message: "Failed to respond to loop" });
    }
  });

  // Run loop detection
  app.post("/api/loops/detect", async (req, res) => {
    try {
      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Simple loop detection simulation
      const allPositions = await storage.getAllPositions();
      const companyPositions = allPositions.filter(p => p.companyId === company.id);
      
      // Create a mock loop for demonstration
      const loopId = `LP-${Date.now()}`;
      const mockLoop = {
        loopId,
        participantIds: ["ANX-2847", "ABC-1247", "XYZ-4821"],
        settlements: JSON.stringify({
          "ANX-2847": 2100,
          "ABC-1247": -500,
          "XYZ-4821": -1600
        }),
        debtCost: 85,
        createdBy: "LB-9482",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      };

      const loop = await storage.createLoop(mockLoop);
      
      // Create participants
      await storage.createLoopParticipant({
        loopId,
        companyId: company.id,
        settlementAmount: "2100",
        hasAccepted: false,
        hasVerified: false,
      });

      res.json({ message: "Loop detection completed", loopsFound: 1, loop });
    } catch (error) {
      res.status(500).json({ message: "Failed to run loop detection" });
    }
  });

  // Get dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      const positions = await storage.getPositionsByCompany(company.id);
      const activeLoops = await storage.getLoopsByStatus("pending");
      
      const totalCredit = positions
        .filter(p => p.type === 'credit' && !p.isSettled)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);
        
      const totalDebt = positions
        .filter(p => p.type === 'debt' && !p.isSettled)
        .reduce((sum, p) => sum + parseFloat(p.amount), 0);

      const netPosition = totalCredit - totalDebt;
      
      // Calculate potential savings from active loops
      const userActiveLoops = activeLoops.filter(loop => 
        loop.participantIds.includes(company.anonymousId)
      );
      
      const potentialSavings = userActiveLoops.reduce((sum, loop) => {
        const settlements = JSON.parse(loop.settlements);
        const userSettlement = settlements[company.anonymousId] || 0;
        return sum + Math.max(0, userSettlement);
      }, 0);

      res.json({
        totalCredit,
        totalDebt,
        netPosition,
        potentialSavings,
        activeLoops: userActiveLoops.length,
        debtBalance: company.debtBalance,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Register XRPL routes
  registerXRPLRoutes(app);
  
  // Register token management routes
  registerTokenRoutes(app);
  
  // Register explorer routes
  registerExplorerRoutes(app);

  const httpServer = createServer(app);
  return httpServer;
}
