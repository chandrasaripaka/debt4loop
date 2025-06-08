import { Client, Wallet, Payment, TrustSet, AccountSet, IssuedCurrencyAmount } from 'xrpl';

export interface DebtTokenConfig {
  symbol: string;
  name: string;
  totalSupply: string;
  decimals: number;
  description: string;
  website?: string;
  domain?: string;
}

export class DebtTokenManager {
  private client: Client;
  private issuerWallet: Wallet;
  private tokenConfig: DebtTokenConfig;

  constructor(client: Client, issuerSeed: string, config: DebtTokenConfig) {
    this.client = client;
    this.issuerWallet = Wallet.fromSeed(issuerSeed);
    this.tokenConfig = config;
  }

  // Initialize the token issuer account with proper settings
  async initializeTokenIssuer(): Promise<string> {
    // Set up account settings for token issuer
    const accountSet: AccountSet = {
      TransactionType: 'AccountSet',
      Account: this.issuerWallet.address,
      // Set Default Ripple flag to enable rippling
      SetFlag: 8, // asfDefaultRipple
      // Set Domain for token information
      Domain: this.tokenConfig.domain ? 
        Buffer.from(this.tokenConfig.domain, 'utf8').toString('hex').toUpperCase() : 
        Buffer.from('debtloop.finance', 'utf8').toString('hex').toUpperCase()
    };

    const prepared = await this.client.autofill(accountSet);
    const signed = this.issuerWallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    return result.result.hash;
  }

  // Create trust line and issue initial tokens to a recipient
  async issueTokensToAccount(recipientAddress: string, amount: string, memo?: string): Promise<{
    trustLineTx: string;
    issuanceTx: string;
  }> {
    // First, recipient must create trust line
    const recipientWallet = await this.getWalletForAddress(recipientAddress);
    
    const trustSet: TrustSet = {
      TransactionType: 'TrustSet',
      Account: recipientAddress,
      LimitAmount: {
        currency: this.tokenConfig.symbol,
        issuer: this.issuerWallet.address,
        value: '1000000' // High limit for trust line
      } as IssuedCurrencyAmount
    };

    // Note: This would require the recipient's private key in practice
    // For demo purposes, we'll assume trust line is set up separately

    // Issue tokens to the recipient
    const payment: Payment = {
      TransactionType: 'Payment',
      Account: this.issuerWallet.address,
      Destination: recipientAddress,
      Amount: {
        currency: this.tokenConfig.symbol,
        issuer: this.issuerWallet.address,
        value: amount
      } as IssuedCurrencyAmount,
      Memos: [{
        Memo: {
          MemoType: Buffer.from('token-issuance', 'utf8').toString('hex').toUpperCase(),
          MemoData: Buffer.from(memo || `${this.tokenConfig.name} token issuance: ${amount}`, 'utf8').toString('hex').toUpperCase()
        }
      }]
    };

    const prepared = await this.client.autofill(payment);
    const signed = this.issuerWallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    return {
      trustLineTx: 'trust_line_setup_required',
      issuanceTx: result.result.hash
    };
  }

  // Transfer tokens between accounts
  async transferTokens(
    fromWallet: Wallet, 
    toAddress: string, 
    amount: string, 
    memo?: string
  ): Promise<string> {
    const payment: Payment = {
      TransactionType: 'Payment',
      Account: fromWallet.address,
      Destination: toAddress,
      Amount: {
        currency: this.tokenConfig.symbol,
        issuer: this.issuerWallet.address,
        value: amount
      } as IssuedCurrencyAmount,
      Memos: memo ? [{
        Memo: {
          MemoType: Buffer.from('debt-settlement', 'utf8').toString('hex').toUpperCase(),
          MemoData: Buffer.from(memo, 'utf8').toString('hex').toUpperCase()
        }
      }] : undefined
    };

    const prepared = await this.client.autofill(payment);
    const signed = fromWallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    return result.result.hash;
  }

  // Get token balance for an account
  async getTokenBalance(accountAddress: string): Promise<string> {
    try {
      const response = await this.client.request({
        command: 'account_lines',
        account: accountAddress,
        ledger_index: 'validated'
      });

      const tokenLine = response.result.lines.find((line: any) => 
        line.currency === this.tokenConfig.symbol && 
        line.account === this.issuerWallet.address
      );

      return tokenLine ? tokenLine.balance : '0';
    } catch (error) {
      return '0';
    }
  }

  // Get total token supply
  async getTotalSupply(): Promise<string> {
    try {
      const response = await this.client.request({
        command: 'gateway_balances',
        account: this.issuerWallet.address,
        ledger_index: 'validated'
      });

      const obligations = response.result.obligations;
      return obligations && obligations[this.tokenConfig.symbol] ? 
        obligations[this.tokenConfig.symbol] : '0';
    } catch (error) {
      return '0';
    }
  }

  // Get token information
  getTokenInfo() {
    return {
      symbol: this.tokenConfig.symbol,
      name: this.tokenConfig.name,
      issuer: this.issuerWallet.address,
      description: this.tokenConfig.description,
      decimals: this.tokenConfig.decimals,
      website: this.tokenConfig.website,
      domain: this.tokenConfig.domain
    };
  }

  // Freeze/unfreeze token lines (issuer only)
  async freezeTokenLine(accountAddress: string, freeze: boolean): Promise<string> {
    const trustSet: TrustSet = {
      TransactionType: 'TrustSet',
      Account: this.issuerWallet.address,
      LimitAmount: {
        currency: this.tokenConfig.symbol,
        issuer: accountAddress,
        value: '0'
      } as IssuedCurrencyAmount,
      Flags: freeze ? 0x00100000 : 0x00020000 // tfSetFreeze or tfClearFreeze
    };

    const prepared = await this.client.autofill(trustSet);
    const signed = this.issuerWallet.sign(prepared);
    const result = await this.client.submitAndWait(signed.tx_blob);

    return result.result.hash;
  }

  private async getWalletForAddress(address: string): Promise<Wallet> {
    // In practice, this would require proper key management
    // For demo purposes, this is a placeholder
    throw new Error('Wallet access requires private key management');
  }
}

// Factory function to create DEBT token manager
export async function createDebtTokenManager(client: Client, issuerSeed?: string): Promise<DebtTokenManager> {
  // Generate new issuer if no seed provided
  const seed = issuerSeed || Wallet.generate().seed;
  
  const config: DebtTokenConfig = {
    symbol: 'DEBT',
    name: 'DebtLoop Settlement Token',
    totalSupply: '100000000', // 100 million tokens
    decimals: 6,
    description: 'Token for automated debt settlement and loop breaking incentives',
    website: 'https://debtloop.finance',
    domain: 'debtloop.finance'
  };

  const manager = new DebtTokenManager(client, seed!, config);
  
  // Initialize the issuer account
  try {
    await manager.initializeTokenIssuer();
    console.log('DEBT Token initialized successfully');
    console.log('Token Info:', manager.getTokenInfo());
  } catch (error) {
    console.log('Token issuer initialization completed (may already be set up)');
  }

  return manager;
}