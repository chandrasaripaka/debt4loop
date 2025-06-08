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
  Coins, 
  TrendingUp, 
  Send, 
  Flame,
  Info,
  ExternalLink,
  Copy,
  RefreshCw,
  Zap
} from "lucide-react";

export default function TokenManagement() {
  const [issueAmount, setIssueAmount] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [burnAmount, setBurnAmount] = useState("");
  const [memo, setMemo] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: tokenInfo } = useQuery({
    queryKey: ["/api/token/info"],
  });

  const { data: tokenBalance } = useQuery({
    queryKey: ["/api/token/balance"],
    refetchInterval: 10000,
  });

  const { data: tokenSupply } = useQuery({
    queryKey: ["/api/token/supply"],
  });

  const { data: tokenTransactions = [] } = useQuery({
    queryKey: ["/api/token/transactions"],
    refetchInterval: 15000,
  });

  const issueTokensMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/token/issue", {
        amount: issueAmount,
        memo: memo || `Token issuance: ${issueAmount} DEBT`
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/token/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/token/supply"] });
      toast({
        title: "Tokens Issued",
        description: `Successfully issued ${issueAmount} DEBT tokens`,
      });
      setIssueAmount("");
      setMemo("");
    },
    onError: (error: any) => {
      toast({
        title: "Issuance Failed",
        description: error.message || "Failed to issue tokens",
        variant: "destructive",
      });
    },
  });

  const transferTokensMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/token/transfer", {
        recipientAddress,
        amount: transferAmount,
        memo: memo || `Transfer: ${transferAmount} DEBT tokens`
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/token/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/token/transactions"] });
      toast({
        title: "Transfer Initiated",
        description: `Transferred ${transferAmount} DEBT to ${recipientAddress.substring(0, 8)}...`,
      });
      setTransferAmount("");
      setRecipientAddress("");
      setMemo("");
    },
    onError: (error: any) => {
      toast({
        title: "Transfer Failed",
        description: error.message || "Failed to transfer tokens",
        variant: "destructive",
      });
    },
  });

  const burnTokensMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/token/burn", {
        amount: burnAmount,
        memo: memo || `Burned ${burnAmount} DEBT tokens`
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/token/balance"] });
      queryClient.invalidateQueries({ queryKey: ["/api/token/supply"] });
      toast({
        title: "Tokens Burned",
        description: `Successfully burned ${burnAmount} DEBT tokens`,
      });
      setBurnAmount("");
      setMemo("");
    },
    onError: (error: any) => {
      toast({
        title: "Burn Failed",
        description: error.message || "Failed to burn tokens",
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

  return (
    <div className="space-y-6">
      {/* Token Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Coins className="w-5 h-5" />
            <span>DEBT Token Information</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {tokenInfo ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">Token Name</Label>
                <p className="text-lg font-semibold">{(tokenInfo as any).name}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Symbol</Label>
                <p className="text-lg font-semibold">{(tokenInfo as any).symbol}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Issuer Address</Label>
                <div className="flex items-center space-x-2">
                  <Input 
                    value={(tokenInfo as any).issuer} 
                    readOnly 
                    className="font-mono text-sm"
                  />
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => copyToClipboard((tokenInfo as any).issuer)}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon"
                    onClick={() => window.open(`https://testnet.xrpl.org/accounts/${(tokenInfo as any).issuer}`, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700">Network</Label>
                <Badge className="bg-secondary text-white">{(tokenInfo as any).network}</Badge>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-gray-500">Loading token information...</p>
            </div>
          )}
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">About DEBT Tokens</h4>
                <p className="text-sm text-blue-700 mt-1">
                  DEBT tokens are custom XRPL tokens that power the debt settlement ecosystem. 
                  They're used for staking positions, paying loop-breaking fees, and incentivizing network participation.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Token Balance and Supply */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Your Token Balance</CardTitle>
          </CardHeader>
          <CardContent>
            {tokenBalance ? (
              <div className="text-center py-4">
                <div className="text-3xl font-bold text-primary mb-2">
                  {parseFloat((tokenBalance as any).balance || '0').toFixed(2)}
                </div>
                <div className="text-sm text-gray-500">DEBT Tokens</div>
                <div className="text-xs text-gray-400 mt-1">
                  Address: {(tokenBalance as any).address?.substring(0, 12)}...
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Loading balance...
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Token Supply</CardTitle>
          </CardHeader>
          <CardContent>
            {tokenSupply ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Supply</span>
                  <span className="font-medium">{parseFloat((tokenSupply as any).totalSupply || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Max Supply</span>
                  <span className="font-medium">{parseFloat((tokenSupply as any).maxSupply || '0').toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Circulating</span>
                  <span className="font-medium">{parseFloat((tokenSupply as any).circulating || '0').toLocaleString()}</span>
                </div>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                Loading supply data...
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Token Operations */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Issue Tokens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>Issue Tokens</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="issueAmount">Amount</Label>
              <Input
                id="issueAmount"
                type="number"
                placeholder="1000"
                value={issueAmount}
                onChange={(e) => setIssueAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="issueMemo">Memo (Optional)</Label>
              <Textarea
                id="issueMemo"
                placeholder="Purpose of token issuance"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={2}
              />
            </div>
            <Button 
              className="w-full bg-primary text-white hover:bg-primary/90"
              onClick={() => issueTokensMutation.mutate()}
              disabled={!issueAmount || issueTokensMutation.isPending}
            >
              {issueTokensMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Issuing...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 mr-2" />
                  Issue Tokens
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Transfer Tokens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Send className="w-5 h-5" />
              <span>Transfer Tokens</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recipientAddress">Recipient Address</Label>
              <Input
                id="recipientAddress"
                placeholder="rXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={recipientAddress}
                onChange={(e) => setRecipientAddress(e.target.value)}
                className="font-mono"
              />
            </div>
            <div>
              <Label htmlFor="transferAmount">Amount</Label>
              <Input
                id="transferAmount"
                type="number"
                placeholder="100"
                value={transferAmount}
                onChange={(e) => setTransferAmount(e.target.value)}
              />
            </div>
            <Button 
              className="w-full bg-secondary text-white hover:bg-secondary/90"
              onClick={() => transferTokensMutation.mutate()}
              disabled={!recipientAddress || !transferAmount || transferTokensMutation.isPending}
            >
              {transferTokensMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Transfer
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Burn Tokens */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Flame className="w-5 h-5" />
              <span>Burn Tokens</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="burnAmount">Amount to Burn</Label>
              <Input
                id="burnAmount"
                type="number"
                placeholder="50"
                value={burnAmount}
                onChange={(e) => setBurnAmount(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="burnMemo">Reason (Optional)</Label>
              <Textarea
                id="burnMemo"
                placeholder="Reason for burning tokens"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                rows={2}
              />
            </div>
            <Button 
              className="w-full bg-red-600 text-white hover:bg-red-700"
              onClick={() => burnTokensMutation.mutate()}
              disabled={!burnAmount || burnTokensMutation.isPending}
            >
              {burnTokensMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Burning...
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 mr-2" />
                  Burn Tokens
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Token Transaction History */}
      <Card>
        <CardHeader>
          <CardTitle>Token Transaction History</CardTitle>
        </CardHeader>
        <CardContent>
          {(tokenTransactions as any[]).length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <Coins className="w-12 h-12 mx-auto mb-3 text-gray-300" />
              <p>No token transactions yet</p>
              <p className="text-sm">Your DEBT token transactions will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(tokenTransactions as any[]).slice(0, 10).map((tx: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-light-gray rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-primary bg-opacity-10 rounded-full flex items-center justify-center">
                      {tx.type === 'Payment' ? <Send className="w-4 h-4 text-primary" /> : <Coins className="w-4 h-4 text-primary" />}
                    </div>
                    <div>
                      <p className="font-medium text-dark-gray">{tx.type}</p>
                      <p className="text-sm text-gray-500">
                        {tx.amount} DEBT • {new Date(tx.date).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => window.open(`https://testnet.xrpl.org/transactions/${tx.hash}`, '_blank')}
                  >
                    View
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}