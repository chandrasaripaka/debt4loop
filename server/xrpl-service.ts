import { Client, Wallet, xrpToDrops, dropsToXrp, Payment, TrustSet, IssuedCurrencyAmount } from 'xrpl';

export interface XRPLConfig {
  server: string;
  network: 'testnet' | 'mainnet' | 'devnet';
}

export interface DebtPosition {
  id: string;
  debtor: string;
  creditor: string;
  amount: string;
  currency: string;
  issuer?: string;
  dueDate: Date;
  status: 'active' | 'settled' | 'expired';
}

export interface LoopSettlement {
  loopId: string;
  participants: string[];
  settlements: Array<{
    account: string;
    amount: string;
    currency: string;
    issuer?: string;
  }>;
  totalValue: string;
  timestamp: Date;
}

export class XRPLDebtService {
  private client: Client;
  private config: XRPLConfig;
  private debtTokenIssuer: Wallet | null = null;

  constructor(config: XRPLConfig) {
    this.config = config;
    this.client = new Client(config.server);
  }

  async initialize(issuerSeed?: string): Promise<void> {
    await this.client.connect();
    
    // Initialize or load the DEBT token issuer
    if (issuerSeed) {
      this.debtTokenIssuer = Wallet.fromSeed(issuerSeed);
    } else {
      // Generate new issuer for demo (in production, use existing issuer)
      this.debtTokenIssuer = Wallet.generate();
      console.log('Generated DEBT Token Issuer:', this.debtTokenIssuer.address);
      console.log('Issuer Seed (save this):', this.debtTokenIssuer.seed);
    }
  }

  async disconnect(): Promise<void> {
    await this.client.disconnect();
  }

  // Create a company wallet for debt settlement
  async createCompanyWallet(): Promise<{ wallet: Wallet; address: string; seed: string }> {
    const wallet = Wallet.generate();
    
    // Fund the wallet with some XRP for transaction fees (testnet only)
    if (this.config.network === 'testnet') {
      await this.client.fundWallet(wallet);
    }

    return {
      wallet,
      address: wallet.address,
      seed: wallet.seed
    };
  }

  // Issue DEBT tokens to a company
  async issueDebtTokens(recipientAddress: string, amount: string): Promise<string> {
    if (!this.debtTokenIssuer) {
      throw new Error('DEBT token issuer not initialized');
    }

    const payment: Payment = {
      TransactionType: 'Payment',
      Account: this.debtTokenIssuer.address,
      Destination: recipientAddress,
      Amount: {
        currency: 'DEBT',
        value: amount,
        issuer: this.debtTokenIssuer.address
      } as IssuedCurrencyAmount
    };

    const prepared = await this.client.autofill(payment);
    const signed = this.debtTokenIssuer.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        return result.result.hash;
      }
    }
    
    throw new Error('Failed to issue DEBT tokens');
  }

  // Set up trust line for DEBT tokens
  async setupDebtTrustLine(wallet: Wallet, limit: string = '1000000'): Promise<string> {
    if (!this.debtTokenIssuer) {
      throw new Error('DEBT token issuer not initialized');
    }

    const trustSet: TrustSet = {
      TransactionType: 'TrustSet',
      Account: wallet.address,
      LimitAmount: {
        currency: 'DEBT',
        issuer: this.debtTokenIssuer.address,
        value: limit
      } as IssuedCurrencyAmount
    };

    const prepared = await this.client.autofill(trustSet);
    const signed = wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        return result.result.hash;
      }
    }
    
    throw new Error('Failed to set up DEBT trust line');
  }

  // Record a debt position on the ledger using memo field
  async recordDebtPosition(
    wallet: Wallet, 
    position: Omit<DebtPosition, 'id' | 'status'>
  ): Promise<string> {
    // Create a minimal XRP payment with memo containing debt position data
    const memoData = JSON.stringify({
      type: 'debt_position',
      debtor: position.debtor,
      creditor: position.creditor,
      amount: position.amount,
      currency: position.currency,
      dueDate: position.dueDate.toISOString(),
      timestamp: new Date().toISOString()
    });

    const payment: Payment = {
      TransactionType: 'Payment',
      Account: wallet.address,
      Destination: wallet.address, // Self-payment to record data
      Amount: xrpToDrops('0.000001'), // Minimal amount
      Memos: [{
        Memo: {
          MemoType: Buffer.from('debt_position', 'utf8').toString('hex').toUpperCase(),
          MemoData: Buffer.from(memoData, 'utf8').toString('hex').toUpperCase()
        }
      }]
    };

    const prepared = await this.client.autofill(payment);
    const signed = wallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
      if (result.result.meta.TransactionResult === 'tesSUCCESS') {
        return result.result.hash;
      }
    }
    
    throw new Error('Failed to record debt position');
  }

  // Execute loop settlement on XRPL
  async executeLoopSettlement(
    participantWallets: Wallet[],
    settlement: Omit<LoopSettlement, 'timestamp'>
  ): Promise<string[]> {
    const txHashes: string[] = [];

    // Execute DEBT token transfers for each settlement
    for (const settlementItem of settlement.settlements) {
      const participantWallet = participantWallets.find(w => w.address === settlementItem.account);
      if (!participantWallet) continue;

      if (parseFloat(settlementItem.amount) > 0) {
        // This participant receives DEBT tokens (payment from loop breaker)
        const payment: Payment = {
          TransactionType: 'Payment',
          Account: this.debtTokenIssuer!.address,
          Destination: settlementItem.account,
          Amount: {
            currency: 'DEBT',
            value: settlementItem.amount,
            issuer: this.debtTokenIssuer!.address
          } as IssuedCurrencyAmount,
          Memos: [{
            Memo: {
              MemoType: Buffer.from('loop_settlement', 'utf8').toString('hex').toUpperCase(),
              MemoData: Buffer.from(JSON.stringify({
                loopId: settlement.loopId,
                type: 'reward'
              }), 'utf8').toString('hex').toUpperCase()
            }
          }]
        };

        const prepared = await this.client.autofill(payment);
        const signed = this.debtTokenIssuer!.sign(prepared);
        const result = await this.client.submitAndWait(signed.tx_blob);

        if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
          if (result.result.meta.TransactionResult === 'tesSUCCESS') {
            txHashes.push(result.result.hash);
          }
        }
      } else if (parseFloat(settlementItem.amount) < 0) {
        // This participant pays DEBT tokens
        const payment: Payment = {
          TransactionType: 'Payment',
          Account: settlementItem.account,
          Destination: this.debtTokenIssuer!.address,
          Amount: {
            currency: 'DEBT',
            value: Math.abs(parseFloat(settlementItem.amount)).toString(),
            issuer: this.debtTokenIssuer!.address
          } as IssuedCurrencyAmount,
          Memos: [{
            Memo: {
              MemoType: Buffer.from('loop_settlement', 'utf8').toString('hex').toUpperCase(),
              MemoData: Buffer.from(JSON.stringify({
                loopId: settlement.loopId,
                type: 'payment'
              }), 'utf8').toString('hex').toUpperCase()
            }
          }]
        };

        const prepared = await this.client.autofill(payment);
        const signed = participantWallet.sign(prepared);
        const result = await this.client.submitAndWait(signed.tx_blob);

        if (result.result.meta && typeof result.result.meta === 'object' && 'TransactionResult' in result.result.meta) {
          if (result.result.meta.TransactionResult === 'tesSUCCESS') {
            txHashes.push(result.result.hash);
          }
        }
      }
    }

    return txHashes;
  }

  // Get account balance including DEBT tokens
  async getAccountBalance(address: string): Promise<{
    xrp: string;
    debtTokens: string;
  }> {
    const accountInfo = await this.client.request({
      command: 'account_info',
      account: address
    });

    const xrpBalance = dropsToXrp(accountInfo.result.account_data.Balance);

    // Get DEBT token balance
    let debtBalance = '0';
    try {
      const accountLines = await this.client.request({
        command: 'account_lines',
        account: address
      });

      const debtLine = accountLines.result.lines.find(
        (line: any) => line.currency === 'DEBT' && line.account === this.debtTokenIssuer?.address
      );

      if (debtLine) {
        debtBalance = debtLine.balance;
      }
    } catch (error) {
      // No trust lines or DEBT tokens
    }

    return {
      xrp: xrpBalance,
      debtTokens: debtBalance
    };
  }

  // Get transaction history for debt positions and settlements
  async getDebtTransactionHistory(address: string): Promise<any[]> {
    const transactions = await this.client.request({
      command: 'account_tx',
      account: address,
      limit: 50
    });

    return transactions.result.transactions
      .filter((tx: any) => {
        // Filter for transactions with debt-related memos
        return tx.tx.Memos && tx.tx.Memos.some((memo: any) => {
          const memoType = Buffer.from(memo.Memo.MemoType, 'hex').toString('utf8');
          return memoType === 'debt_position' || memoType === 'loop_settlement';
        });
      })
      .map((tx: any) => ({
        hash: tx.tx.hash,
        date: new Date((tx.tx.date + 946684800) * 1000), // XRPL epoch adjustment
        type: tx.tx.TransactionType,
        memos: tx.tx.Memos?.map((memo: any) => ({
          type: Buffer.from(memo.Memo.MemoType, 'hex').toString('utf8'),
          data: JSON.parse(Buffer.from(memo.Memo.MemoData, 'hex').toString('utf8'))
        }))
      }));
  }

  // Verify a transaction on the ledger
  async verifyTransaction(txHash: string): Promise<boolean> {
    try {
      const tx = await this.client.request({
        command: 'tx',
        transaction: txHash
      });

      return tx.result.meta && 
             typeof tx.result.meta === 'object' && 
             'TransactionResult' in tx.result.meta &&
             tx.result.meta.TransactionResult === 'tesSUCCESS';
    } catch (error) {
      return false;
    }
  }

  // Get network fee for transactions
  async getNetworkFee(): Promise<string> {
    const serverInfo = await this.client.request({
      command: 'server_info'
    });

    // Use base fee from closed ledger info
    const baseFee = serverInfo.result.info.closed_ledger?.base_fee_xrp || 0.00001;
    return baseFee.toString();
  }

  // Get DEBT token issuer address
  getDebtTokenIssuer(): string | null {
    return this.debtTokenIssuer?.address || null;
  }

  // Check if account exists and is funded
  async isAccountFunded(address: string): Promise<boolean> {
    try {
      const accountInfo = await this.client.request({
        command: 'account_info',
        account: address
      });
      return !!accountInfo.result.account_data;
    } catch (error) {
      return false;
    }
  }
}

// Factory function to create and initialize the service
export async function createXRPLDebtService(
  network: 'testnet' | 'mainnet' | 'devnet' = 'testnet',
  issuerSeed?: string
): Promise<XRPLDebtService> {
  const config: XRPLConfig = {
    server: network === 'testnet' 
      ? 'wss://s.altnet.rippletest.net:51233'
      : network === 'devnet'
      ? 'wss://s.devnet.rippletest.net:51233'
      : 'wss://xrplcluster.com',
    network
  };

  const service = new XRPLDebtService(config);
  await service.initialize(issuerSeed);
  return service;
}

export default XRPLDebtService;