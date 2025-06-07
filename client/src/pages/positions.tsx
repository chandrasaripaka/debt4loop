import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/header";
import PositionModal from "@/components/position-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, ArrowUp, ArrowDown, Calendar, Building2 } from "lucide-react";

export default function Positions() {
  const [positionModalOpen, setPositionModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  const { data: positions = [], isLoading } = useQuery({
    queryKey: ["/api/positions"],
  });

  const filteredPositions = positions.filter((position: any) => {
    const matchesSearch = position.counterpartyId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (position.description || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "all" || position.type === filterType;
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "settled" && position.isSettled) ||
                         (filterStatus === "active" && !position.isSettled);
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const totalCredit = positions
    .filter((p: any) => p.type === 'credit' && !p.isSettled)
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

  const totalDebt = positions
    .filter((p: any) => p.type === 'debt' && !p.isSettled)
    .reduce((sum: number, p: any) => sum + parseFloat(p.amount), 0);

  const netPosition = totalCredit - totalDebt;

  return (
    <>
      <Header 
        title="Positions" 
        subtitle="Manage your debt and credit positions" 
      />
      
      <main className="flex-1 p-6 overflow-y-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-secondary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <ArrowUp className="w-6 h-6 text-secondary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Credit</p>
                  <p className="text-2xl font-bold text-secondary">${totalCredit.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-error bg-opacity-10 rounded-lg flex items-center justify-center">
                  <ArrowDown className="w-6 h-6 text-error" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Debt</p>
                  <p className="text-2xl font-bold text-error">${totalDebt.toLocaleString()}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-primary bg-opacity-10 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Net Position</p>
                  <p className={`text-2xl font-bold ${netPosition >= 0 ? 'text-secondary' : 'text-error'}`}>
                    ${Math.abs(netPosition).toLocaleString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Actions */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search by company ID or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="credit">Credit</SelectItem>
              <SelectItem value="debt">Debt</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="settled">Settled</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            onClick={() => setPositionModalOpen(true)}
            className="bg-primary text-white hover:bg-primary/90"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Position
          </Button>
        </div>

        {/* Positions List */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-6 h-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading positions...</p>
              </div>
            ) : filteredPositions.length === 0 ? (
              <div className="p-8 text-center">
                <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No positions found</h3>
                <p className="text-gray-500 mb-4">
                  {searchTerm || filterType !== "all" || filterStatus !== "all"
                    ? "Try adjusting your filters"
                    : "Start by recording your first debt or credit position"
                  }
                </p>
                <Button onClick={() => setPositionModalOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Record Position
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredPositions.map((position: any) => (
                  <div key={position.id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${
                          position.type === 'credit' 
                            ? 'bg-secondary bg-opacity-10' 
                            : 'bg-error bg-opacity-10'
                        }`}>
                          {position.type === 'credit' ? (
                            <ArrowUp className="w-6 h-6 text-secondary" />
                          ) : (
                            <ArrowDown className="w-6 h-6 text-error" />
                          )}
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="font-semibold text-dark-gray">
                              Company {position.counterpartyId}
                            </h3>
                            <Badge 
                              variant={position.isSettled ? "secondary" : "default"}
                              className={position.isSettled ? "bg-gray-100 text-gray-700" : ""}
                            >
                              {position.isSettled ? "Settled" : "Active"}
                            </Badge>
                          </div>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              Due: {new Date(position.dueDate).toLocaleDateString()}
                            </span>
                            <span>{position.currency}</span>
                            {position.description && (
                              <span className="max-w-xs truncate">{position.description}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className={`text-xl font-bold ${
                          position.type === 'credit' ? 'text-secondary' : 'text-error'
                        }`}>
                          {position.type === 'credit' ? '+' : '-'}${parseFloat(position.amount).toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-500 capitalize">
                          {position.type} Position
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      <PositionModal 
        open={positionModalOpen} 
        onOpenChange={setPositionModalOpen} 
      />
    </>
  );
}
