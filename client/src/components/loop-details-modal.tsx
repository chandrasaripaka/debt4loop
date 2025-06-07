import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Building, DollarSign, Coins, Percent, CheckCircle, Clock } from "lucide-react";

interface LoopDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loop: any;
}

export default function LoopDetailsModal({ open, onOpenChange, loop }: LoopDetailsModalProps) {
  if (!loop) return null;

  const settlements = JSON.parse(loop.settlements || "{}");
  const userSettlement = settlements["ANX-2847"] || 0;
  const savings = Math.abs(userSettlement) > 0 ? 94 : 0; // Mock calculation

  const participants = [
    { id: "ANX-2847", name: "You", settlement: userSettlement, isUser: true },
    { id: "ABC-1247", name: "ABC-1247", settlement: settlements["ABC-1247"] || 0, verified: true },
    { id: "XYZ-4821", name: "XYZ-4821", settlement: settlements["XYZ-4821"] || 0, verified: false },
    { id: "DEF-7395", name: "DEF-7395", settlement: settlements["DEF-7395"] || 0, verified: true },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-dark-gray">
            Loop {loop.loopId} Details
          </DialogTitle>
          <p className="text-gray-500 mt-1">Proposed by Loop-Breaker {loop.createdBy}</p>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Loop Visualization */}
          <div className="bg-light-gray rounded-xl p-6">
            <h4 className="font-semibold text-dark-gray mb-4">Settlement Flow</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {participants.map((participant) => (
                <div key={participant.id} className="text-center">
                  <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center mx-auto mb-2 ${
                    participant.isUser ? "border-primary bg-white" : "border-gray-300 bg-white"
                  }`}>
                    <Building className={`w-6 h-6 ${participant.isUser ? "text-primary" : "text-gray-400"}`} />
                  </div>
                  <p className="text-sm font-medium text-dark-gray">{participant.name}</p>
                  <p className={`text-xs ${participant.settlement > 0 ? "text-secondary" : "text-gray-500"}`}>
                    {participant.settlement > 0 ? "+" : ""}${Math.abs(participant.settlement).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
          
          {/* Settlement Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-secondary bg-opacity-10 rounded-lg p-4 text-center">
              <DollarSign className="w-8 h-8 text-secondary mx-auto mb-2" />
              <p className="text-lg font-bold text-secondary">${Math.abs(userSettlement).toLocaleString()}</p>
              <p className="text-sm text-gray-600">Your Net Benefit</p>
            </div>
            
            <div className="bg-accent bg-opacity-10 rounded-lg p-4 text-center">
              <Coins className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-lg font-bold text-accent">{loop.debtCost} DEBT</p>
              <p className="text-sm text-gray-600">Required Payment</p>
            </div>
            
            <div className="bg-primary bg-opacity-10 rounded-lg p-4 text-center">
              <Percent className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-lg font-bold text-primary">{savings}%</p>
              <p className="text-sm text-gray-600">Cash Flow Savings</p>
            </div>
          </div>
          
          {/* Verification Status */}
          <div className="bg-white border border-gray-200 rounded-lg p-4">
            <h4 className="font-semibold text-dark-gray mb-3">Verification Status</h4>
            <div className="space-y-2">
              {participants.slice(1).map((participant) => (
                <div key={participant.id} className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Company {participant.id}</span>
                  <span className="flex items-center text-sm">
                    {participant.verified ? (
                      <>
                        <CheckCircle className="w-4 h-4 text-secondary mr-1" />
                        <span className="text-secondary">Verified</span>
                      </>
                    ) : (
                      <>
                        <Clock className="w-4 h-4 text-accent mr-1" />
                        <span className="text-accent">Pending</span>
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-light-gray rounded-lg p-3">
              <p className="text-xs text-gray-500">
                2/3 companies have verified this loop. Settlement will proceed once verification is complete.
              </p>
            </div>
          </div>
          
          <div className="flex space-x-4 pt-4">
            <Button 
              variant="outline" 
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
            <Button 
              className="flex-1 bg-secondary text-white hover:bg-secondary/90"
            >
              Accept Settlement
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
