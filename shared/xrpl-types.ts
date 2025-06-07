export interface XRPLWallet {
  address: string;
  seed: string;
  publicKey: string;
  privateKey: string;
}

export interface XRPLBalance {
  xrp: string;
  debtTokens: string;
}

export interface XRPLTransaction {
  hash: string;
  date: Date;
  type: string;
  amount?: string;
  currency?: string;
  destination?: string;
  source?: string;
  memos?: Array<{
    type: string;
    data: any;
  }>;
  status: 'success' | 'failed' | 'pending';
}

export interface DebtPositionOnChain {
  txHash: string;
  debtor: string;
  creditor: string;
  amount: string;
  currency: string;
  dueDate: string;
  timestamp: string;
  blockIndex?: number;
}

export interface LoopSettlementOnChain {
  loopId: string;
  participantTxHashes: string[];
  totalValue: string;
  settlements: Array<{
    account: string;
    amount: string;
    txHash: string;
  }>;
  timestamp: string;
  blockIndex?: number;
}

export interface XRPLNetworkInfo {
  server: string;
  network: 'testnet' | 'mainnet' | 'devnet';
  fee: string;
  debtTokenIssuer: string;
  connected: boolean;
}