import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { 
  ExternalLink, 
  Search, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Copy,
  ArrowUpRight,
  ArrowDownLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TransactionExplorer() {
  const [searchHash, setSearchHash] = useState("");
  const { toast } = useToast();

  const { data: company } = useQuery({
    queryKey: ["/api/company/current"],
  });

  const { data: xrplTransactions = [] } = useQuery({
    queryKey: ["/api/xrpl/transactions"],
    enabled: !!(company as any)?.xrplAddress,
    refetchInterval: 15000,
  });

  const { data: tokenTransactions = [] } = useQuery({
    queryKey: ["/api/token/transactions"],
    enabled: !!(company as any)?.xrplAddress,
    refetchInterval: 15000,
  });

  const { data: networkInfo } = useQuery({
    queryKey: ["/api/xrpl/network"],
  });

  const getExplorerUrl = (type: 'transaction' | 'account', identifier: string) => {
    const baseUrl = 'https://testnet.xrpl.org';
    return type === 'transaction' 
      ? `${baseUrl}/transactions/${identifier}`
      : `${baseUrl}/accounts/${identifier}`;
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Transaction hash copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const formatAmount = (amount: any) => {
    if (typeof amount === 'string') {
      return `${parseFloat(amount).toFixed(6)} XRP`;
    }
    if (typeof amount === 'object' && amount.value) {
      return `${parseFloat(amount.value).toFixed(2)} ${amount.currency}`;
    }
    return 'Unknown amount';
  };

  const getTransactionIcon = (type: string, direction: 'sent' | 'received') => {
    if (direction === 'sent') {
      return <ArrowUpRight className="w-4 h-4 text-red-500" />;
    } else {
      return <ArrowDownLeft className="w-4 h-4 text-green-500" />;
    }
  };

  const getTransactionStatus = (validated: boolean) => {
    return validated ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Validated
      </Badge>
    ) : (
      <Badge className="bg-yellow-100 text-yellow-800">
        <Clock className="w-3 h-3 mr-1" />
        Pending
      </Badge>
    );
  };

  // Combine and sort all transactions
  const allTransactions = [
    ...(xrplTransactions as any[]).map(tx => ({ ...tx, source: 'xrpl' })),
    ...(tokenTransactions as any[]).map(tx => ({ ...tx, source: 'token' }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="space-y-6">
      {/* Network Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ExternalLink className="w-5 h-5" />
            <span>XRPL Testnet Explorer</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">Network</Label>
              <p className="text-lg font-semibold">XRPL Testnet</p>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-700">Explorer URL</Label>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => window.open('https://testnet.xrpl.org', '_blank')}
                className="ml-2"
              >
                <ExternalLink className="w-4 h-4 mr-2" />
                Open Explorer
              </Button>
            </div>
          </div>

          {company && (company as any).xrplAddress && (
            <div>
              <Label className="text-sm font-medium text-gray-700">Your Account on Explorer</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input 
                  value={(company as any).xrplAddress} 
                  readOnly 
                  className="font-mono text-sm"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => copyToClipboard((company as any).xrplAddress)}
                >
                  <Copy className="w-4 h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => window.open(getExplorerUrl('account', (company as any).xrplAddress), '_blank')}
                >
                  <ExternalLink className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {networkInfo && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">Testnet Environment</h4>
                  <p className="text-sm text-blue-700 mt-1">
                    This is the XRPL testnet. All transactions and tokens are for testing purposes only and have no real-world value.
                    Network fee: {(networkInfo as any)?.fee || '0.00001'} XRP per transaction.
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="w-5 h-5" />
            <span>Transaction Lookup</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="searchHash">Transaction Hash</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input
                id="searchHash"
                placeholder="Enter transaction hash to view on explorer..."
                value={searchHash}
                onChange={(e) => setSearchHash(e.target.value)}
                className="font-mono"
              />
              <Button 
                variant="outline"
                onClick={() => window.open(getExplorerUrl('transaction', searchHash), '_blank')}
                disabled={!searchHash}
              >
                <Search className="w-4 h-4 mr-2" />
                View
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recent Transactions */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Blockchain Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {allTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No blockchain transactions yet</p>
              <p className="text-sm">Your XRPL transactions will appear here with direct explorer links</p>
            </div>
          ) : (
            <div className="space-y-3">
              {allTransactions.slice(0, 15).map((tx: any, index: number) => {
                const isOutgoing = tx.from === (company as any)?.xrplAddress || tx.account === (company as any)?.xrplAddress;
                const direction = isOutgoing ? 'sent' : 'received';
                
                return (
                  <div key={index} className="flex items-center justify-between p-4 bg-light-gray rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                        {getTransactionIcon(tx.type, direction)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <p className="font-medium text-dark-gray">{tx.type}</p>
                          {getTransactionStatus(tx.validated !== false)}
                          <Badge variant="outline" className="text-xs">
                            {tx.source === 'token' ? 'DEBT Token' : 'XRP'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-500">
                          {direction === 'sent' ? 'To: ' : 'From: '}
                          <span className="font-mono">
                            {direction === 'sent' 
                              ? (tx.to || tx.destination || 'Unknown').substring(0, 12) + '...'
                              : (tx.from || tx.account || 'Unknown').substring(0, 12) + '...'
                            }
                          </span>
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(tx.date).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${direction === 'sent' ? 'text-red-600' : 'text-green-600'}`}>
                          {direction === 'sent' ? '-' : '+'}{formatAmount(tx.amount || tx.Amount)}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">
                          {tx.hash?.substring(0, 8)}...
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => copyToClipboard(tx.hash)}
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(getExplorerUrl('transaction', tx.hash), '_blank')}
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        Explorer
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Explorer Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => window.open('https://testnet.xrpl.org/transactions', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              All Testnet Transactions
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => window.open('https://testnet.xrpl.org/accounts', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Account Directory
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => window.open('https://testnet.xrpl.org/network', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Network Statistics
            </Button>
            <Button 
              variant="outline" 
              className="justify-start"
              onClick={() => window.open('https://xrpl.org/xrp-testnet-faucet.html', '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              Testnet Faucet
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}