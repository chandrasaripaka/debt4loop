import type { Express } from "express";
import { storage } from "./storage";
import { createXRPLDebtService } from "./xrpl-service";
import { z } from "zod";

let xrplService: any = null;

// Initialize XRPL service on startup
(async () => {
  try {
    xrplService = await createXRPLDebtService('testnet');
    console.log('XRPL Debt Service initialized successfully');
    console.log('DEBT Token Issuer:', xrplService.getDebtTokenIssuer());
  } catch (error) {
    console.error('Failed to initialize XRPL service:', error);
  }
})();

export function registerXRPLRoutes(app: Express) {
  // Initialize XRPL wallet for company
  app.post("/api/xrpl/wallet/create", async (req, res) => {
    try {
      if (!xrplService) {
        return res.status(503).json({ message: "XRPL service not available" });
      }

      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      if (company.xrplAddress) {
        return res.status(400).json({ message: "XRPL wallet already exists" });
      }

      // Create new XRPL wallet
      const walletInfo = await xrplService.createCompanyWallet();
      
      // Set up DEBT token trust line
      const trustLineTx = await xrplService.setupDebtTrustLine(
        { address: walletInfo.address, seed: walletInfo.seed },
        '1000000'
      );

      // Issue initial DEBT tokens
      const issueTx = await xrplService.issueDebtTokens(walletInfo.address, '2500');

      // Update company with XRPL wallet info
      await storage.updateCompanyXRPLWallet(company.id, walletInfo.address, walletInfo.seed);

      res.json({
        address: walletInfo.address,
        trustLineTx,
        issueTx,
        message: "XRPL wallet created and funded with DEBT tokens"
      });
    } catch (error) {
      console.error('Error creating XRPL wallet:', error);
      res.status(500).json({ message: "Failed to create XRPL wallet" });
    }
  });

  // Get XRPL wallet balance
  app.get("/api/xrpl/wallet/balance", async (req, res) => {
    try {
      if (!xrplService) {
        return res.status(503).json({ message: "XRPL service not available" });
      }

      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company || !company.xrplAddress) {
        return res.status(404).json({ message: "XRPL wallet not found" });
      }

      const balance = await xrplService.getAccountBalance(company.xrplAddress);
      res.json(balance);
    } catch (error) {
      console.error('Error getting balance:', error);
      res.status(500).json({ message: "Failed to get wallet balance" });
    }
  });

  // Record position on XRPL
  app.post("/api/xrpl/position/record", async (req, res) => {
    try {
      if (!xrplService) {
        return res.status(503).json({ message: "XRPL service not available" });
      }

      const { positionId } = req.body;
      if (!positionId) {
        return res.status(400).json({ message: "Position ID required" });
      }

      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company || !company.xrplAddress || !company.xrplSeed) {
        return res.status(404).json({ message: "XRPL wallet not found" });
      }

      const position = await storage.getPosition(positionId);
      if (!position) {
        return res.status(404).json({ message: "Position not found" });
      }

      // Record position on XRPL
      const wallet = { address: company.xrplAddress, seed: company.xrplSeed };
      const txHash = await xrplService.recordDebtPosition(wallet, {
        debtor: position.type === 'debt' ? company.anonymousId : position.counterpartyId,
        creditor: position.type === 'credit' ? company.anonymousId : position.counterpartyId,
        amount: position.amount,
        currency: position.currency,
        dueDate: new Date(position.dueDate)
      });

      // Update position with XRPL transaction hash
      await storage.updatePositionXRPLHash(position.id, txHash);

      res.json({
        txHash,
        message: "Position recorded on XRPL"
      });
    } catch (error) {
      console.error('Error recording position on XRPL:', error);
      res.status(500).json({ message: "Failed to record position on XRPL" });
    }
  });

  // Execute loop settlement on XRPL
  app.post("/api/xrpl/loop/settle", async (req, res) => {
    try {
      if (!xrplService) {
        return res.status(503).json({ message: "XRPL service not available" });
      }

      const { loopId } = req.body;
      if (!loopId) {
        return res.status(400).json({ message: "Loop ID required" });
      }

      const loop = await storage.getLoop(loopId);
      if (!loop) {
        return res.status(404).json({ message: "Loop not found" });
      }

      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company || !company.xrplAddress || !company.xrplSeed) {
        return res.status(404).json({ message: "XRPL wallet not found" });
      }

      // For demo, we'll just execute the settlement for the main company
      const settlements = JSON.parse(loop.settlements);
      const userSettlement = settlements["ANX-2847"];

      if (userSettlement < 0) {
        // Company needs to pay DEBT tokens
        const wallet = { address: company.xrplAddress, seed: company.xrplSeed };
        const txHashes = await xrplService.executeLoopSettlement(
          [wallet],
          {
            loopId: loop.loopId,
            participants: loop.participantIds,
            settlements: [{
              account: company.xrplAddress,
              amount: userSettlement.toString(),
              currency: 'DEBT',
              issuer: xrplService.getDebtTokenIssuer()
            }]
          }
        );

        res.json({
          txHashes,
          message: "Loop settlement executed on XRPL"
        });
      } else {
        res.json({
          message: "No payment required for this settlement"
        });
      }
    } catch (error) {
      console.error('Error executing loop settlement:', error);
      res.status(500).json({ message: "Failed to execute loop settlement" });
    }
  });

  // Get XRPL transaction history
  app.get("/api/xrpl/transactions", async (req, res) => {
    try {
      if (!xrplService) {
        return res.status(503).json({ message: "XRPL service not available" });
      }

      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company || !company.xrplAddress) {
        return res.status(404).json({ message: "XRPL wallet not found" });
      }

      const transactions = await xrplService.getDebtTransactionHistory(company.xrplAddress);
      res.json(transactions);
    } catch (error) {
      console.error('Error getting transaction history:', error);
      res.status(500).json({ message: "Failed to get transaction history" });
    }
  });

  // Verify XRPL transaction
  app.get("/api/xrpl/transaction/:hash/verify", async (req, res) => {
    try {
      if (!xrplService) {
        return res.status(503).json({ message: "XRPL service not available" });
      }

      const { hash } = req.params;
      const isValid = await xrplService.verifyTransaction(hash);
      
      res.json({
        hash,
        valid: isValid,
        message: isValid ? "Transaction verified" : "Transaction not found or invalid"
      });
    } catch (error) {
      console.error('Error verifying transaction:', error);
      res.status(500).json({ message: "Failed to verify transaction" });
    }
  });

  // Get XRPL network info
  app.get("/api/xrpl/network", async (req, res) => {
    try {
      if (!xrplService) {
        return res.status(503).json({ message: "XRPL service not available" });
      }

      const fee = await xrplService.getNetworkFee();
      const issuer = xrplService.getDebtTokenIssuer();

      res.json({
        network: 'testnet',
        server: 'wss://s.altnet.rippletest.net:51233',
        fee,
        debtTokenIssuer: issuer,
        connected: true
      });
    } catch (error) {
      console.error('Error getting network info:', error);
      res.status(500).json({ message: "Failed to get network info" });
    }
  });
}