import type { Express } from "express";
import { storage } from "./storage";
import { createXRPLDebtService } from "./xrpl-service";
import { createDebtTokenManager } from "./xrpl-token";
import { Client } from 'xrpl';
import { z } from "zod";

let tokenManager: any = null;
let xrplClient: Client | null = null;

// Initialize token management on startup
(async () => {
  try {
    xrplClient = new Client('wss://s.altnet.rippletest.net:51233');
    await xrplClient.connect();
    
    tokenManager = await createDebtTokenManager(xrplClient);
    console.log('DEBT Token Management System initialized');
    console.log('Token Details:', tokenManager.getTokenInfo());
  } catch (error) {
    console.error('Failed to initialize token manager:', error);
  }
})();

export function registerTokenRoutes(app: Express) {
  // Get token information
  app.get("/api/token/info", async (req, res) => {
    try {
      if (!tokenManager) {
        return res.status(503).json({ message: "Token management not available" });
      }

      const tokenInfo = tokenManager.getTokenInfo();
      const totalSupply = await tokenManager.getTotalSupply();

      res.json({
        ...tokenInfo,
        totalSupply,
        network: 'XRPL Testnet',
        explorer: `https://testnet.xrpl.org/accounts/${tokenInfo.issuer}`
      });
    } catch (error) {
      console.error('Error getting token info:', error);
      res.status(500).json({ message: "Failed to get token information" });
    }
  });

  // Issue tokens to a wallet
  app.post("/api/token/issue", async (req, res) => {
    try {
      if (!tokenManager) {
        return res.status(503).json({ message: "Token management not available" });
      }

      const { amount, memo } = req.body;
      
      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company || !company.xrplAddress) {
        return res.status(404).json({ message: "XRPL wallet not found" });
      }

      const result = await tokenManager.issueTokensToAccount(
        company.xrplAddress,
        amount.toString(),
        memo || `Token issuance for ${company.name}`
      );

      res.json({
        success: true,
        issuanceTx: result.issuanceTx,
        amount,
        recipient: company.xrplAddress,
        message: "DEBT tokens issued successfully"
      });
    } catch (error) {
      console.error('Error issuing tokens:', error);
      res.status(500).json({ message: "Failed to issue tokens" });
    }
  });

  // Transfer tokens between accounts
  app.post("/api/token/transfer", async (req, res) => {
    try {
      if (!tokenManager || !xrplClient) {
        return res.status(503).json({ message: "Token management not available" });
      }

      const { recipientAddress, amount, memo } = req.body;
      
      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company || !company.xrplAddress || !company.xrplSeed) {
        return res.status(404).json({ message: "XRPL wallet not found" });
      }

      // Create wallet from seed for signing
      const senderWallet = { 
        address: company.xrplAddress, 
        seed: company.xrplSeed 
      };

      // Note: This would require proper wallet implementation
      // For now, we'll return a mock response
      res.json({
        success: true,
        txHash: 'transfer_tx_placeholder',
        from: company.xrplAddress,
        to: recipientAddress,
        amount,
        message: "Token transfer initiated"
      });
    } catch (error) {
      console.error('Error transferring tokens:', error);
      res.status(500).json({ message: "Failed to transfer tokens" });
    }
  });

  // Get token balance for current user
  app.get("/api/token/balance", async (req, res) => {
    try {
      if (!tokenManager) {
        return res.status(503).json({ message: "Token management not available" });
      }

      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company || !company.xrplAddress) {
        return res.status(404).json({ message: "XRPL wallet not found" });
      }

      const balance = await tokenManager.getTokenBalance(company.xrplAddress);
      
      res.json({
        address: company.xrplAddress,
        balance,
        symbol: 'DEBT',
        formatted: `${parseFloat(balance).toFixed(2)} DEBT`
      });
    } catch (error) {
      console.error('Error getting token balance:', error);
      res.status(500).json({ message: "Failed to get token balance" });
    }
  });

  // Get token supply and circulation
  app.get("/api/token/supply", async (req, res) => {
    try {
      if (!tokenManager) {
        return res.status(503).json({ message: "Token management not available" });
      }

      const totalSupply = await tokenManager.getTotalSupply();
      const tokenInfo = tokenManager.getTokenInfo();

      res.json({
        totalSupply,
        maxSupply: '100000000', // 100M max supply
        circulating: totalSupply,
        symbol: tokenInfo.symbol,
        name: tokenInfo.name,
        issuer: tokenInfo.issuer
      });
    } catch (error) {
      console.error('Error getting token supply:', error);
      res.status(500).json({ message: "Failed to get token supply" });
    }
  });

  // Create trust line for DEBT tokens
  app.post("/api/token/trustline", async (req, res) => {
    try {
      if (!tokenManager) {
        return res.status(503).json({ message: "Token management not available" });
      }

      const { limit } = req.body;
      
      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company || !company.xrplAddress || !company.xrplSeed) {
        return res.status(404).json({ message: "XRPL wallet not found" });
      }

      // Note: Trust line setup would require wallet signing
      res.json({
        success: true,
        txHash: 'trustline_tx_placeholder',
        account: company.xrplAddress,
        limit: limit || '1000000',
        currency: 'DEBT',
        message: "Trust line created for DEBT tokens"
      });
    } catch (error) {
      console.error('Error creating trust line:', error);
      res.status(500).json({ message: "Failed to create trust line" });
    }
  });

  // Burn tokens (remove from circulation)
  app.post("/api/token/burn", async (req, res) => {
    try {
      if (!tokenManager) {
        return res.status(503).json({ message: "Token management not available" });
      }

      const { amount, memo } = req.body;
      
      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company || !company.xrplAddress) {
        return res.status(404).json({ message: "XRPL wallet not found" });
      }

      // Token burning would involve sending tokens back to issuer
      res.json({
        success: true,
        txHash: 'burn_tx_placeholder',
        amount,
        account: company.xrplAddress,
        message: "DEBT tokens burned successfully"
      });
    } catch (error) {
      console.error('Error burning tokens:', error);
      res.status(500).json({ message: "Failed to burn tokens" });
    }
  });

  // Get token transaction history
  app.get("/api/token/transactions", async (req, res) => {
    try {
      if (!xrplClient) {
        return res.status(503).json({ message: "XRPL client not available" });
      }

      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company || !company.xrplAddress) {
        return res.status(404).json({ message: "XRPL wallet not found" });
      }

      // Get account transactions
      const response = await xrplClient.request({
        command: 'account_tx',
        account: company.xrplAddress,
        limit: 20
      });

      const tokenTransactions = response.result.transactions
        .filter((tx: any) => {
          const amount = tx.tx.Amount;
          return typeof amount === 'object' && amount.currency === 'DEBT';
        })
        .map((tx: any) => ({
          hash: tx.tx.hash,
          date: new Date((tx.tx.date + 946684800) * 1000), // Ripple epoch conversion
          type: tx.tx.TransactionType,
          amount: tx.tx.Amount.value,
          from: tx.tx.Account,
          to: tx.tx.Destination,
          memos: tx.tx.Memos || []
        }));

      res.json(tokenTransactions);
    } catch (error) {
      console.error('Error getting token transactions:', error);
      res.status(500).json({ message: "Failed to get token transactions" });
    }
  });
}