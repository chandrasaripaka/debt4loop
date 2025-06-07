import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import PositionModal from "@/components/position-modal";
import LoopDetailsModal from "@/components/loop-details-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  DollarSign, 
  MinusCircle, 
  CheckCircle, 
  RefreshCw, 
  Plus, 
  Search, 
  Handshake,
  ArrowUp,
  ArrowDown,
  Eye,
  TrendingUp
} from "lucide-react";

export default function Dashboard() {
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [loopDetailsModalOpen, setLoopDetailsModalOpen] = useState(false);
  const [selectedLoop, setSelectedLoop] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const { data: activeLoops = [] } = useQuery({
    queryKey: ["/api/loops/active"],
  });

  const { data: positions = [] } = useQuery({
    queryKey: ["/api/positions"],
  });

  const runLoopDetectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/loops/detect");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loops/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Loop Detection Completed",
        description: `${data.loopsFound} new settlement opportunities discovered`,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to run loop detection",
        variant: "destructive",
      });
    },
  });

  const respondToLoopMutation = useMutation({
    mutationFn: async ({ loopId, action }: { loopId: string; action: string }) => {
      const response = await apiRequest("POST", `/api/loops/${loopId}/respond`, { action });
      return response.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loops/active"] });
      toast({
        title: `Settlement ${variables.action === 'accept' ? 'Accepted' : 'Declined'}`,
        description: data.message,
      });
    },
  });

  const recentPositions = positions.slice(0, 3);

  const overviewCards = [
    {
      title: "Total Credit Positions",
      value: `$${stats?.totalCredit?.toLocaleString() || "0"}`,
      icon: DollarSign,
      change: "+5.2%",
      changeType: "positive",
      bgColor: "bg-primary",
    },
    {
      title: "Total Debt Positions", 
      value: `$${stats?.totalDebt?.toLocaleString() || "0"}`,
      icon: MinusCircle,
      change: "+2.1%",
      changeType: "negative",
      bgColor: "bg-error",
    },
    {
      title: "Net Position",
      value: `$${stats?.netPosition?.toLocaleString() || "0"}`,
      icon: CheckCircle,
      change: "+12.3%",
      changeType: "positive",
      bgColor: "bg-secondary",
    },
    {
      title: "Potential Savings",
      value: `$${stats?.potentialSavings?.toLocaleString() || "0"}`,
      icon: RefreshCw,
      change: `${stats?.activeLoops || 0} Active`,
      changeType: "neutral",
      bgColor: "bg-accent",
    },
  ];

  const viewLoopDetails = (loop: any) => {
    setSelectedLoop(loop);
    setLoopDetailsModalOpen(true);
  };

  return (
    <>
      <Header 
        title="Dashboard" 
        subtitle="Manage your debt and credit positions" 
      />
      
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {overviewCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index} className="border border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`w-12 h-12 ${card.bgColor} bg-opacity-10 rounded-lg flex items-center justify-center`}>
                      <Icon className={`w-6 h-6 ${card.bgColor.replace('bg-', 'text-')}`} />
                    </div>
                    <span className={`text-xs font-medium ${
                      card.changeType === 'positive' ? 'text-secondary' : 
                      card.changeType === 'negative' ? 'text-error' : 'text-accent'
                    }`}>
                      {card.change}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-dark-gray mb-2">{card.value}</h3>
                  <p className="text-gray-500 text-sm">{card.title}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-dark-gray mb-4">Quick Actions</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              className="bg-primary text-white p-4 h-auto hover:bg-primary/90 flex items-center space-x-3 justify-start"
              onClick={() => setPositionModalOpen(true)}
            >
              <Plus className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">Record Position</p>
                <p className="text-sm opacity-90">Add new debt/credit</p>
              </div>
            </Button>
            
            <Button 
              className="bg-accent text-white p-4 h-auto hover:bg-accent/90 flex items-center space-x-3 justify-start"
              onClick={() => runLoopDetectionMutation.mutate()}
              disabled={runLoopDetectionMutation.isPending}
            >
              <Search className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">
                  {runLoopDetectionMutation.isPending ? "Detecting..." : "Detect Loops"}
                </p>
                <p className="text-sm opacity-90">Find settlement opportunities</p>
              </div>
            </Button>
            
            <Button 
              className="bg-secondary text-white p-4 h-auto hover:bg-secondary/90 flex items-center space-x-3 justify-start"
              onClick={() => {/* Navigate to settlements */}}
            >
              <Handshake className="w-5 h-5" />
              <div className="text-left">
                <p className="font-medium">View Settlements</p>
                <p className="text-sm opacity-90">Review proposals</p>
              </div>
            </Button>
          </div>
        </div>

        {/* Active Loop Notifications */}
        {activeLoops.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-dark-gray mb-4">Active Loop Proposals</h3>
            <div className="space-y-4">
              {activeLoops.map((loop: any) => {
                const settlements = JSON.parse(loop.settlements || "{}");
                const userSettlement = settlements["ANX-2847"] || 0;
                const timeRemaining = "2h 15m"; // Mock time calculation
                
                return (
                  <Card key={loop.loopId} className="border border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center">
                            <RefreshCw className="w-5 h-5 text-accent" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-dark-gray">Loop {loop.loopId}</h4>
                            <p className="text-sm text-gray-500">{loop.participantIds.length} companies involved</p>
                          </div>
                        </div>
                        <span className="bg-accent bg-opacity-10 text-accent px-3 py-1 rounded-full text-sm font-medium">
                          Pending Approval
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <div className="text-center p-3 bg-light-gray rounded-lg">
                          <p className="text-sm text-gray-500">Your Settlement</p>
                          <p className="text-lg font-bold text-secondary">
                            +${Math.abs(userSettlement).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-light-gray rounded-lg">
                          <p className="text-sm text-gray-500">DEBT Cost</p>
                          <p className="text-lg font-bold text-dark-gray">{loop.debtCost} DEBT</p>
                        </div>
                        <div className="text-center p-3 bg-light-gray rounded-lg">
                          <p className="text-sm text-gray-500">Deadline</p>
                          <p className="text-lg font-bold text-accent">{timeRemaining}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button 
                          className="flex-1 bg-secondary text-white hover:bg-secondary/90"
                          onClick={() => respondToLoopMutation.mutate({ loopId: loop.loopId, action: 'accept' })}
                          disabled={respondToLoopMutation.isPending}
                        >
                          Accept Settlement
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1"
                          onClick={() => respondToLoopMutation.mutate({ loopId: loop.loopId, action: 'reject' })}
                          disabled={respondToLoopMutation.isPending}
                        >
                          Decline
                        </Button>
                        <Button 
                          variant="outline"
                          size="icon"
                          onClick={() => viewLoopDetails(loop)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Positions Overview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Positions */}
          <Card className="border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-dark-gray">Recent Positions</h3>
                <Button variant="ghost" className="text-primary hover:text-primary/80 text-sm font-medium">
                  View All
                </Button>
              </div>
            </div>
            <CardContent className="p-6">
              {recentPositions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <TrendingUp className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No positions recorded yet</p>
                  <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={() => setPositionModalOpen(true)}
                  >
                    Record Your First Position
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentPositions.map((position: any) => (
                    <div key={position.id} className="flex items-center justify-between p-4 bg-light-gray rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          position.type === 'credit' 
                            ? 'bg-secondary bg-opacity-10' 
                            : 'bg-error bg-opacity-10'
                        }`}>
                          {position.type === 'credit' ? (
                            <ArrowUp className="w-4 h-4 text-secondary" />
                          ) : (
                            <ArrowDown className="w-4 h-4 text-error" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-dark-gray">Company {position.counterpartyId}</p>
                          <p className="text-sm text-gray-500">
                            Due: {new Date(position.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          position.type === 'credit' ? 'text-secondary' : 'text-error'
                        }`}>
                          {position.type === 'credit' ? '+' : '-'}${parseFloat(position.amount).toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-500 capitalize">{position.type}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Loop Detection Status */}
          <Card className="border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-dark-gray">Loop Detection Status</h3>
            </div>
            <CardContent className="p-6">
              <div className="space-y-6">
                <div className="text-center p-6 bg-gradient-to-r from-primary to-blue-600 rounded-lg text-white">
                  <RefreshCw className={`w-8 h-8 mx-auto mb-3 ${runLoopDetectionMutation.isPending ? 'animate-spin' : ''}`} />
                  <h4 className="font-semibold mb-2">
                    {runLoopDetectionMutation.isPending ? 'Scanning Network' : 'Ready to Scan'}
                  </h4>
                  <p className="text-sm opacity-90">
                    {runLoopDetectionMutation.isPending 
                      ? 'Looking for settlement opportunities...' 
                      : 'Click detect loops to find opportunities'
                    }
                  </p>
                  {runLoopDetectionMutation.isPending && (
                    <div className="mt-4 bg-white bg-opacity-20 rounded-full h-2">
                      <div className="bg-white h-2 rounded-full w-3/4 transition-all duration-1000"></div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Companies Scanned</span>
                    <span className="font-medium text-dark-gray">1,247</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Positions Analyzed</span>
                    <span className="font-medium text-dark-gray">8,934</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Potential Loops Found</span>
                    <span className="font-medium text-accent">{activeLoops.length}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <PositionModal 
        open={positionModalOpen} 
        onOpenChange={setPositionModalOpen} 
      />
      
      <LoopDetailsModal 
        open={loopDetailsModalOpen} 
        onOpenChange={setLoopDetailsModalOpen}
        loop={selectedLoop}
      />
    </>
  );
}
