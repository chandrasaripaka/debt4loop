import type { Express } from "express";
import { storage } from "./storage";
import { createXRPLDebtService } from "./xrpl-service";

let xrplService: any = null;

// Initialize XRPL service
(async () => {
  try {
    xrplService = await createXRPLDebtService('testnet');
    console.log('XRPL Explorer Service initialized');
  } catch (error) {
    console.error('Failed to initialize XRPL explorer service:', error);
  }
})();

export function registerExplorerRoutes(app: Express) {
  // Get real transaction history from XRPL
  app.get("/api/explorer/transactions", async (req, res) => {
    try {
      if (!xrplService) {
        return res.status(503).json({ message: "XRPL service not available" });
      }

      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company || !company.xrplAddress) {
        return res.status(404).json({ message: "XRPL wallet not found" });
      }

      // Get real transaction history from XRPL
      const txHistory = await xrplService.getDebtTransactionHistory(company.xrplAddress);
      
      // Format transactions for explorer links
      const formattedTransactions = txHistory.map((tx: any) => ({
        hash: tx.hash,
        type: tx.TransactionType || tx.type,
        date: tx.date ? new Date((tx.date + 946684800) * 1000) : new Date(),
        amount: tx.Amount,
        account: tx.Account,
        destination: tx.Destination,
        validated: tx.validated !== false,
        ledgerIndex: tx.ledger_index,
        fee: tx.Fee,
        memos: tx.Memos || [],
        explorerUrl: `https://testnet.xrpl.org/transactions/${tx.hash}`
      }));

      res.json(formattedTransactions);
    } catch (error) {
      console.error('Error getting explorer transactions:', error);
      res.status(500).json({ message: "Failed to get transaction history" });
    }
  });

  // Get account information with explorer link
  app.get("/api/explorer/account", async (req, res) => {
    try {
      if (!xrplService) {
        return res.status(503).json({ message: "XRPL service not available" });
      }

      const company = await storage.getCompanyByAnonymousId("ANX-2847");
      if (!company || !company.xrplAddress) {
        return res.status(404).json({ message: "XRPL wallet not found" });
      }

      // Get account info from XRPL
      const accountInfo = await xrplService.getAccountBalance(company.xrplAddress);
      
      res.json({
        address: company.xrplAddress,
        balance: accountInfo,
        explorerUrl: `https://testnet.xrpl.org/accounts/${company.xrplAddress}`,
        network: 'testnet',
        networkUrl: 'https://testnet.xrpl.org'
      });
    } catch (error) {
      console.error('Error getting account info:', error);
      res.status(500).json({ message: "Failed to get account information" });
    }
  });

  // Verify transaction on explorer
  app.get("/api/explorer/verify/:hash", async (req, res) => {
    try {
      if (!xrplService) {
        return res.status(503).json({ message: "XRPL service not available" });
      }

      const { hash } = req.params;
      const isValid = await xrplService.verifyTransaction(hash);
      
      res.json({
        hash,
        valid: isValid,
        explorerUrl: `https://testnet.xrpl.org/transactions/${hash}`,
        message: isValid ? "Transaction verified on XRPL" : "Transaction not found"
      });
    } catch (error) {
      console.error('Error verifying transaction:', error);
      res.status(500).json({ message: "Failed to verify transaction" });
    }
  });

  // Get token issuer information
  app.get("/api/explorer/token-issuer", async (req, res) => {
    try {
      if (!xrplService) {
        return res.status(503).json({ message: "XRPL service not available" });
      }

      const issuerAddress = xrplService.getDebtTokenIssuer();
      if (!issuerAddress) {
        return res.status(404).json({ message: "Token issuer not found" });
      }

      res.json({
        address: issuerAddress,
        currency: 'DEBT',
        name: 'DebtLoop Settlement Token',
        explorerUrl: `https://testnet.xrpl.org/accounts/${issuerAddress}`,
        tokenUrl: `https://testnet.xrpl.org/tokens/${issuerAddress}.DEBT`
      });
    } catch (error) {
      console.error('Error getting token issuer info:', error);
      res.status(500).json({ message: "Failed to get token issuer information" });
    }
  });

  // Get network statistics
  app.get("/api/explorer/network", async (req, res) => {
    try {
      const networkFee = await xrplService?.getNetworkFee() || '0.00001';
      
      res.json({
        network: 'XRPL Testnet',
        explorerUrl: 'https://testnet.xrpl.org',
        faucetUrl: 'https://xrpl.org/xrp-testnet-faucet.html',
        networkFee,
        server: 'wss://s.altnet.rippletest.net:51233',
        status: 'connected'
      });
    } catch (error) {
      console.error('Error getting network info:', error);
      res.status(500).json({ message: "Failed to get network information" });
    }
  });
}