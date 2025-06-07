import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Header from "@/components/header";
import LoopDetailsModal from "@/components/loop-details-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Search, 
  RefreshCw, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Clock,
  Building2,
  DollarSign,
  Coins
} from "lucide-react";

export default function Loops() {
  const [selectedLoop, setSelectedLoop] = useState<any>(null);
  const [loopDetailsModalOpen, setLoopDetailsModalOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: activeLoops = [], isLoading } = useQuery({
    queryKey: ["/api/loops/active"],
  });

  const { data: allLoops = [] } = useQuery({
    queryKey: ["/api/loops"],
  });

  const runLoopDetectionMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/loops/detect");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/loops/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/loops"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/loops"] });
      toast({
        title: `Settlement ${variables.action === 'accept' ? 'Accepted' : 'Declined'}`,
        description: data.message,
      });
    },
  });

  const viewLoopDetails = (loop: any) => {
    setSelectedLoop(loop);
    setLoopDetailsModalOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge className="bg-accent text-white">Pending</Badge>;
      case "verified":
        return <Badge className="bg-primary text-white">Verified</Badge>;
      case "completed":
        return <Badge className="bg-secondary text-white">Completed</Badge>;
      case "rejected":
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Header 
        title="Loop Detection" 
        subtitle="Find and manage settlement opportunities" 
      />
      
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Detection Controls */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Search className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-dark-gray">Automated Loop Detection</h3>
                  <p className="text-sm text-gray-500">
                    Scan the network for settlement opportunities involving your positions
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={() => runLoopDetectionMutation.mutate()}
                disabled={runLoopDetectionMutation.isPending}
                className="bg-primary text-white hover:bg-primary/90"
              >
                {runLoopDetectionMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 mr-2" />
                    Run Detection
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Detection Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6 text-center">
              <Building2 className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-dark-gray">1,247</p>
              <p className="text-sm text-gray-500">Companies Scanned</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <RefreshCw className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-dark-gray">8,934</p>
              <p className="text-sm text-gray-500">Positions Analyzed</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <CheckCircle className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-dark-gray">{activeLoops.length}</p>
              <p className="text-sm text-gray-500">Active Loops</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-2xl font-bold text-dark-gray">
                ${activeLoops.reduce((sum: number, loop: any) => {
                  const settlements = JSON.parse(loop.settlements || "{}");
                  return sum + Math.max(0, settlements["ANX-2847"] || 0);
                }, 0).toLocaleString()}
              </p>
              <p className="text-sm text-gray-500">Potential Savings</p>
            </CardContent>
          </Card>
        </div>

        {/* Active Loops */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-dark-gray mb-4">Active Loop Proposals</h3>
          
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading loops...</p>
              </CardContent>
            </Card>
          ) : activeLoops.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <RefreshCw className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Loops</h3>
                <p className="text-gray-500 mb-4">
                  Run loop detection to find settlement opportunities
                </p>
                <Button 
                  onClick={() => runLoopDetectionMutation.mutate()}
                  disabled={runLoopDetectionMutation.isPending}
                >
                  <Search className="w-4 h-4 mr-2" />
                  Start Detection
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {activeLoops.map((loop: any) => {
                const settlements = JSON.parse(loop.settlements || "{}");
                const userSettlement = settlements["ANX-2847"] || 0;
                const timeRemaining = "2h 15m"; // Mock time calculation
                
                return (
                  <Card key={loop.loopId}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-accent bg-opacity-10 rounded-lg flex items-center justify-center">
                            <RefreshCw className="w-6 h-6 text-accent" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-dark-gray">Loop {loop.loopId}</h4>
                            <p className="text-sm text-gray-500">
                              {loop.participantIds.length} companies • Created by {loop.createdBy}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(loop.status)}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
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
                          <p className="text-sm text-gray-500">Net Benefit</p>
                          <p className="text-lg font-bold text-primary">
                            ${(Math.abs(userSettlement) - (loop.debtCost * 10)).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-center p-3 bg-light-gray rounded-lg">
                          <p className="text-sm text-gray-500">Time Left</p>
                          <p className="text-lg font-bold text-accent">{timeRemaining}</p>
                        </div>
                      </div>
                      
                      <div className="flex space-x-3">
                        <Button 
                          className="flex-1 bg-secondary text-white hover:bg-secondary/90"
                          onClick={() => respondToLoopMutation.mutate({ loopId: loop.loopId, action: 'accept' })}
                          disabled={respondToLoopMutation.isPending}
                        >
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Accept Settlement
                        </Button>
                        <Button 
                          variant="outline"
                          className="flex-1"
                          onClick={() => respondToLoopMutation.mutate({ loopId: loop.loopId, action: 'reject' })}
                          disabled={respondToLoopMutation.isPending}
                        >
                          <XCircle className="w-4 h-4 mr-2" />
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
          )}
        </div>

        {/* Loop History */}
        <div>
          <h3 className="text-lg font-semibold text-dark-gray mb-4">Loop History</h3>
          
          <Card>
            <CardContent className="p-0">
              {allLoops.length === 0 ? (
                <div className="p-8 text-center">
                  <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No loop history yet</p>
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
                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                              <RefreshCw className="w-5 h-5 text-gray-400" />
                            </div>
                            <div>
                              <h4 className="font-medium text-dark-gray">Loop {loop.loopId}</h4>
                              <p className="text-sm text-gray-500">
                                {loop.participantIds.length} companies • {new Date(loop.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className="font-medium text-dark-gray">
                                ${Math.abs(userSettlement).toLocaleString()}
                              </p>
                              <p className="text-sm text-gray-500">Settlement</p>
                            </div>
                            {getStatusBadge(loop.status)}
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => viewLoopDetails(loop)}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      <LoopDetailsModal 
        open={loopDetailsModalOpen} 
        onOpenChange={setLoopDetailsModalOpen}
        loop={selectedLoop}
      />
    </>
  );
}
