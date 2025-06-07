import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import XRPLWalletSetup from "@/components/xrpl-wallet-setup";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Coins, 
  TrendingUp, 
  TrendingDown, 
  ArrowUpRight, 
  ArrowDownLeft,
  History,
  Shield,
  Info,
  Zap
} from "lucide-react";

export default function Wallet() {
  const { data: company } = useQuery({
    queryKey: ["/api/company/current"],
  });

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: allLoops = [] } = useQuery({
    queryKey: ["/api/loops"],
  });

  const debtBalance = (company as any)?.debtBalance || 2500;
  const stakedAmount = 500; // Mock staked amount
  const availableBalance = debtBalance - stakedAmount;

  // Mock transaction history
  const transactions = [
    {
      id: 1,
      type: "stake",
      amount: 50,
      description: "Position recording stake",
      date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "completed"
    },
    {
      id: 2,
      type: "reward",
      amount: 25,
      description: "Loop settlement reward",
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: "completed"
    },
    {
      id: 3,
      type: "payment",
      amount: 85,
      description: "Loop breaking payment to LB-9482",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: "completed"
    },
    {
      id: 4,
      type: "stake",
      amount: 75,
      description: "Position recording stake",
      date: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      status: "completed"
    },
  ];

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case "stake":
        return <Shield className="w-4 h-4 text-accent" />;
      case "reward":
        return <ArrowUpRight className="w-4 h-4 text-secondary" />;
      case "payment":
        return <ArrowDownLeft className="w-4 h-4 text-error" />;
      default:
        return <History className="w-4 h-4 text-gray-400" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case "reward":
        return "text-secondary";
      case "payment":
        return "text-error";
      case "stake":
        return "text-accent";
      default:
        return "text-gray-600";
    }
  };

  return (
    <>
      <Header 
        title="Wallet & Blockchain" 
        subtitle="Manage DEBT tokens and XRPL blockchain integration" 
      />
      
      <main className="flex-1 p-6 overflow-y-auto">
        <Tabs defaultValue="xrpl" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="xrpl" className="flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>XRPL Blockchain</span>
            </TabsTrigger>
            <TabsTrigger value="debt" className="flex items-center space-x-2">
              <Coins className="w-4 h-4" />
              <span>DEBT Tokens</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="xrpl" className="space-y-6">
            <XRPLWalletSetup />
          </TabsContent>

          <TabsContent value="debt" className="space-y-6">
            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                      <Coins className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Total Balance</p>
                      <p className="text-3xl font-bold text-dark-gray">{debtBalance.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-4 h-4 text-secondary" />
                    <span className="text-sm text-secondary font-medium">+2.5% this month</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center">
                      <ArrowUpRight className="w-6 h-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Available</p>
                      <p className="text-3xl font-bold text-secondary">{availableBalance.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Ready for transactions</p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center">
                      <Shield className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Staked</p>
                      <p className="text-3xl font-bold text-accent">{stakedAmount.toLocaleString()}</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500">Locked in positions</p>
                </CardContent>
              </Card>
            </div>

            {/* Token Info */}
            <Card className="mb-6">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                    <Info className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-dark-gray mb-2">About DEBT Tokens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        <p className="mb-2">
                          <strong>Staking:</strong> DEBT tokens are required to record positions on the ledger. 
                          A minimum amount is staked for each position to ensure network integrity.
                        </p>
                        <p>
                          <strong>Loop Breaking:</strong> When you participate in a loop settlement, 
                          you pay DEBT tokens to the Loop-Breaker who discovered the opportunity.
                        </p>
                      </div>
                      <div>
                        <p className="mb-2">
                          <strong>Rewards:</strong> As positions are settled through loops, 
                          staked tokens may be returned along with potential rewards.
                        </p>
                        <p>
                          <strong>Network Value:</strong> DEBT tokens facilitate the automated 
                          settlement system and incentivize loop discovery.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Transaction History */}
              <Card>
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-dark-gray">Recent Transactions</h3>
                    <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm">
                      View All
                    </Button>
                  </div>
                </div>
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-200">
                    {transactions.map((transaction) => (
                      <div key={transaction.id} className="p-6 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              {getTransactionIcon(transaction.type)}
                            </div>
                            <div>
                              <p className="font-medium text-dark-gray capitalize">
                                {transaction.type === "stake" ? "Position Stake" : 
                                 transaction.type === "reward" ? "Settlement Reward" : 
                                 transaction.type === "payment" ? "Loop Payment" : transaction.type}
                              </p>
                              <p className="text-sm text-gray-500">{transaction.description}</p>
                              <p className="text-xs text-gray-400">
                                {transaction.date.toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${getTransactionColor(transaction.type)}`}>
                              {transaction.type === "reward" ? "+" : "-"}{transaction.amount} DEBT
                            </p>
                            <Badge 
                              variant="outline" 
                              className="text-xs"
                            >
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Token Allocation */}
              <Card>
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-dark-gray">Token Allocation</h3>
                </div>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-light-gray rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-secondary bg-opacity-10 rounded-full flex items-center justify-center">
                          <ArrowUpRight className="w-4 h-4 text-secondary" />
                        </div>
                        <div>
                          <p className="font-medium text-dark-gray">Available Balance</p>
                          <p className="text-sm text-gray-500">Ready for use</p>
                        </div>
                      </div>
                      <p className="font-bold text-secondary">{availableBalance.toLocaleString()}</p>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-light-gray rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-accent bg-opacity-10 rounded-full flex items-center justify-center">
                          <Shield className="w-4 h-4 text-accent" />
                        </div>
                        <div>
                          <p className="font-medium text-dark-gray">Staked Tokens</p>
                          <p className="text-sm text-gray-500">Locked in positions</p>
                        </div>
                      </div>
                      <p className="font-bold text-accent">{stakedAmount.toLocaleString()}</p>
                    </div>

                    <div className="mt-6 p-4 bg-primary bg-opacity-5 rounded-lg">
                      <h4 className="font-medium text-dark-gray mb-2">Usage Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Positions recorded</span>
                          <span className="font-medium">{(stats as any)?.activeLoops || 0}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Settlements participated</span>
                          <span className="font-medium">{(allLoops as any[]).filter((l: any) => l.status === "completed").length}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Total DEBT spent</span>
                          <span className="font-medium">
                            {transactions.filter(t => t.type === "payment").reduce((sum, t) => sum + t.amount, 0)} DEBT
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </>
  );
}
