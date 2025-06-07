import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Handshake, 
  CheckCircle, 
  Clock, 
  XCircle, 
  DollarSign,
  Calendar,
  TrendingUp,
  Eye
} from "lucide-react";

export default function Settlements() {
  const { data: allLoops = [], isLoading } = useQuery({
    queryKey: ["/api/loops"],
  });

  const completedSettlements = allLoops.filter((loop: any) => loop.status === "completed");
  const pendingSettlements = allLoops.filter((loop: any) => loop.status === "pending");
  const rejectedSettlements = allLoops.filter((loop: any) => loop.status === "rejected");

  const totalSavings = completedSettlements.reduce((sum: number, loop: any) => {
    const settlements = JSON.parse(loop.settlements || "{}");
    return sum + Math.max(0, settlements["ANX-2847"] || 0);
  }, 0);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="w-5 h-5 text-secondary" />;
      case "pending":
        return <Clock className="w-5 h-5 text-accent" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-error" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-secondary text-white">Completed</Badge>;
      case "pending":
        return <Badge className="bg-accent text-white">Pending</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Header 
        title="Settlements" 
        subtitle="Review completed and pending settlements" 
      />
      
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Savings</p>
                  <p className="text-2xl font-bold text-secondary">${totalSavings.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-accent" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pending</p>
                  <p className="text-2xl font-bold text-accent">{pendingSettlements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Handshake className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Completed</p>
                  <p className="text-2xl font-bold text-primary">{completedSettlements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-error bg-opacity-10 rounded-lg flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-error" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rejected</p>
                  <p className="text-2xl font-bold text-error">{rejectedSettlements.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mb-6">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-dark-gray">Settlement Activity</h3>
          </div>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading settlements...</p>
              </div>
            ) : allLoops.length === 0 ? (
              <div className="p-8 text-center">
                <Handshake className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Settlements Yet</h3>
                <p className="text-gray-500 mb-4">
                  Settlement history will appear here once you participate in loop settlements
                </p>
                <Button variant="outline">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  View Positions
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {allLoops.map((loop: any) => {
                  const settlements = JSON.parse(loop.settlements || "{}");
                  const userSettlement = settlements["ANX-2847"] || 0;
                  
                  return (
                    <div key={loop.loopId} className="p-6 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                            {getStatusIcon(loop.status)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-dark-gray">Loop {loop.loopId}</h4>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center">
                                <Calendar className="w-4 h-4 mr-1" />
                                {new Date(loop.createdAt).toLocaleDateString()}
                              </span>
                              <span>{loop.participantIds.length} companies</span>
                              <span>by {loop.createdBy}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className={`font-bold ${
                              userSettlement > 0 ? 'text-secondary' : 'text-error'
                            }`}>
                              {userSettlement > 0 ? '+' : ''}${Math.abs(userSettlement).toLocaleString()}
                            </p>
                            <p className="text-sm text-gray-500">
                              {loop.debtCost} DEBT cost
                            </p>
                          </div>
                          
                          {getStatusBadge(loop.status)}
                          
                          <Button variant="ghost" size="icon">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      {loop.status === "completed" && (
                        <div className="mt-4 p-3 bg-secondary bg-opacity-5 rounded-lg">
                          <div className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="w-4 h-4 text-secondary" />
                            <span className="text-secondary font-medium">Settlement completed successfully</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Positions have been automatically settled and DEBT tokens transferred
                          </p>
                        </div>
                      )}

                      {loop.status === "pending" && (
                        <div className="mt-4 p-3 bg-accent bg-opacity-5 rounded-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2 text-sm">
                              <Clock className="w-4 h-4 text-accent" />
                              <span className="text-accent font-medium">Awaiting verification</span>
                            </div>
                            <span className="text-xs text-gray-500">2h 15m remaining</span>
                          </div>
                        </div>
                      )}

                      {loop.status === "rejected" && (
                        <div className="mt-4 p-3 bg-error bg-opacity-5 rounded-lg">
                          <div className="flex items-center space-x-2 text-sm">
                            <XCircle className="w-4 h-4 text-error" />
                            <span className="text-error font-medium">Settlement declined</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Not enough participants accepted the settlement proposal
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Settlement Analytics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-dark-gray">Monthly Savings</h3>
            </div>
            <CardContent className="p-6">
              <div className="text-center py-8">
                <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Analytics coming soon</p>
                <p className="text-sm text-gray-400">Track your settlement savings over time</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-dark-gray">Settlement Metrics</h3>
            </div>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Average Settlement Size</span>
                  <span className="font-semibold text-dark-gray">
                    ${totalSavings > 0 ? Math.round(totalSavings / Math.max(completedSettlements.length, 1)).toLocaleString() : '0'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-semibold text-dark-gray">
                    {allLoops.length > 0 ? Math.round((completedSettlements.length / allLoops.length) * 100) : 0}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Total DEBT Spent</span>
                  <span className="font-semibold text-dark-gray">
                    {completedSettlements.reduce((sum: number, loop: any) => sum + loop.debtCost, 0)} DEBT
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Cash Flow Improvement</span>
                  <span className="font-semibold text-secondary">
                    +${totalSavings.toLocaleString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
