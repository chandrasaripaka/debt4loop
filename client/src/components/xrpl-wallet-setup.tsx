import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  Shield, 
  Zap,
  CheckCircle,
  AlertCircle,
  Send,
  QrCode
} from "lucide-react";

export default function XRPLWalletSetup() {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [sendAmount, setSendAmount] = useState("");
  const [memo, setMemo] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ["/api/company/current"],
  });

  const { data: balance, isLoading: balanceLoading } = useQuery({
    queryKey: ["/api/xrpl/wallet/balance"],
    enabled: !!company?.xrplAddress,
    refetchInterval: 10000, // Refresh every 10 seconds
  });

  const { data: networkInfo } = useQuery({
    queryKey: ["/api/xrpl/network"],
  });

  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/xrpl/transactions"],
    enabled: !!company?.xrplAddress,
    refetchInterval: 15000, // Refresh every 15 seconds
  });

  const createWalletMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/xrpl/wallet/create");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/xrpl/wallet/balance"] });
      toast({
        title: "XRPL Wallet Created",
        description: `Wallet funded with initial DEBT tokens. Address: ${data.address.substring(0, 8)}...`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Wallet Creation Failed",
        description: error.message || "Failed to create XRPL wallet",
        variant: "destructive",
      });
    },
  });

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Address copied to clipboard",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive",
      });
    }
  };

  const hasWallet = company?.xrplAddress;

  if (!hasWallet) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Wallet className="w-5 h-5" />
            <span>XRPL Wallet Setup</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center py-8">
            <Wallet className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-dark-gray mb-2">
              No XRPL Wallet Found
            </h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create an XRPL wallet to enable blockchain-based debt settlement. 
              Your wallet will be funded with initial DEBT tokens.
            </p>
            <Button 
              onClick={() => createWalletMutation.mutate()}
              disabled={createWalletMutation.isPending}
              className="bg-primary text-white hover:bg-primary/90"
            >
              {createWalletMutation.isPending ? (
                <>
                  <Zap className="w-4 h-4 mr-2 animate-pulse" />
                  Creating Wallet...
                </>
              ) : (
                <>
                  <Wallet className="w-4 h-4 mr-2" />
                  Create XRPL Wallet
                </>
              )}
            </Button>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Secure & Anonymous</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Your XRPL wallet will be generated securely and linked to your anonymous company ID. 
                  All debt positions will be recorded on the XRP Ledger for transparency and immutability.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Wallet Info */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Wallet className="w-5 h-5" />
              <span>XRPL Wallet</span>
            </div>
            <Badge className="bg-secondary text-white">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="text-sm font-medium text-gray-700">Wallet Address</Label>
            <div className="flex items-center space-x-2 mt-1">
              <Input 
                value={company.xrplAddress} 
                readOnly 
                className="font-mono text-sm"
              />
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => copyToClipboard(company.xrplAddress)}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button 
                variant="outline" 
                size="icon"
                onClick={() => window.open(`https://testnet.xrpl.org/accounts/${company.xrplAddress}`, '_blank')}
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {networkInfo && (
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-500">Network:</span>
                <span className="ml-2 font-medium">XRPL Testnet</span>
              </div>
              <div>
                <span className="text-gray-500">Network Fee:</span>
                <span className="ml-2 font-medium">{networkInfo.fee} XRP</span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Balance */}
      <Card>
        <CardHeader>
          <CardTitle>Wallet Balance</CardTitle>
        </CardHeader>
        <CardContent>
          {balanceLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin w-4 h-4 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-gray-500">Loading balance...</span>
            </div>
          ) : balance ? (
            <div className="grid grid-cols-2 gap-6">
              <div className="text-center p-4 bg-light-gray rounded-lg">
                <div className="text-2xl font-bold text-dark-gray">{parseFloat(balance.xrp).toFixed(6)}</div>
                <div className="text-sm text-gray-500">XRP</div>
              </div>
              <div className="text-center p-4 bg-accent bg-opacity-10 rounded-lg">
                <div className="text-2xl font-bold text-accent">{parseFloat(balance.debtTokens || '0').toFixed(0)}</div>
                <div className="text-sm text-gray-500">DEBT Tokens</div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              Balance information unavailable
            </div>
          )}
        </CardContent>
      </Card>

      {/* Send XRP */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Send className="w-5 h-5" />
            <span>Send XRP</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="recipient">Recipient Address</Label>
            <Input
              id="recipient"
              placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
              value={recipientAddress}
              onChange={(e) => setRecipientAddress(e.target.value)}
              className="font-mono"
            />
          </div>
          
          <div>
            <Label htmlFor="amount">Amount (XRP)</Label>
            <Input
              id="amount"
              type="number"
              step="0.000001"
              placeholder="0.000000"
              value={sendAmount}
              onChange={(e) => setSendAmount(e.target.value)}
            />
          </div>

          <div>
            <Label htmlFor="memo">Memo (Optional)</Label>
            <Textarea
              id="memo"
              placeholder="Optional message or reference"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={2}
            />
          </div>

          <Button 
            className="w-full bg-primary text-white hover:bg-primary/90"
            disabled={!recipientAddress || !sendAmount || parseFloat(sendAmount) <= 0}
          >
            <Send className="w-4 h-4 mr-2" />
            Send XRP
          </Button>

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 mt-0.5" />
              <div className="text-sm text-amber-700">
                <strong>Testnet Only:</strong> This is the XRP Ledger testnet. 
                Transactions have no real-world value.
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <QrCode className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No transactions yet</p>
              <p className="text-sm">Your blockchain transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.slice(0, 5).map((tx: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-light-gray rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                      <ExternalLink className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-dark-gray capitalize">{tx.type}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => window.open(`https://testnet.xrpl.org/transactions/${tx.hash}`, '_blank')}
                    >
                      View
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}