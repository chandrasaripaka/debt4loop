import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface Company {
  id: number;
  name: string;
  anonymousId: string;
  debtBalance: number;
  createdAt: string;
}

interface Position {
  id: number;
  companyId: number;
  counterpartyId: string;
  amount: string;
  currency: string;
  type: 'credit' | 'debt';
  dueDate: string;
  description?: string;
  isSettled: boolean;
  createdAt: string;
}

interface DashboardStats {
  totalCredit: number;
  totalDebt: number;
  netPosition: number;
  potentialSavings: number;
  activeLoops: number;
  debtBalance: number;
}

export function useCompany() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get current company data
  const {
    data: company,
    isLoading: isLoadingCompany,
    error: companyError,
  } = useQuery<Company>({
    queryKey: ["/api/company/current"],
    retry: 1,
  });

  // Get company positions
  const {
    data: positions = [],
    isLoading: isLoadingPositions,
    error: positionsError,
  } = useQuery<Position[]>({
    queryKey: ["/api/positions"],
    enabled: !!company,
    retry: 1,
  });

  // Get dashboard statistics
  const {
    data: stats,
    isLoading: isLoadingStats,
    error: statsError,
  } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: !!company,
    retry: 1,
  });

  // Update company DEBT balance
  const updateDebtBalanceMutation = useMutation({
    mutationFn: async (newBalance: number) => {
      const response = await apiRequest("PATCH", "/api/company/debt-balance", {
        balance: newBalance,
      });
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/company/current"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      toast({
        title: "Balance Updated",
        description: `DEBT balance updated to ${data.debtBalance}`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update DEBT balance",
        variant: "destructive",
      });
    },
  });

  // Computed values
  const activePositions = positions.filter(p => !p.isSettled);
  const creditPositions = activePositions.filter(p => p.type === 'credit');
  const debtPositions = activePositions.filter(p => p.type === 'debt');
  
  const totalCredit = creditPositions.reduce(
    (sum, p) => sum + parseFloat(p.amount), 
    0
  );
  
  const totalDebt = debtPositions.reduce(
    (sum, p) => sum + parseFloat(p.amount), 
    0
  );
  
  const netPosition = totalCredit - totalDebt;

  // Helper functions
  const getPositionsByCounterparty = (counterpartyId: string) => {
    return positions.filter(p => p.counterpartyId === counterpartyId);
  };

  const getPositionsByType = (type: 'credit' | 'debt') => {
    return positions.filter(p => p.type === type);
  };

  const getOverduePositions = () => {
    const now = new Date();
    return activePositions.filter(p => new Date(p.dueDate) < now);
  };

  const getPositionsByCurrency = (currency: string) => {
    return positions.filter(p => p.currency === currency);
  };

  const refreshCompanyData = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/company/current"] });
    queryClient.invalidateQueries({ queryKey: ["/api/positions"] });
    queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
  };

  // Calculate potential savings from current positions
  const calculatePotentialSavings = () => {
    if (!company) return 0;
    
    // Simple calculation: assume 10-15% of net position could be saved through loops
    const savingsRate = 0.125; // 12.5% average
    return Math.max(0, Math.abs(netPosition) * savingsRate);
  };

  // Get company financial health score
  const getFinancialHealthScore = (): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (!stats) return 'fair';
    
    const ratio = stats.totalCredit / Math.max(stats.totalDebt, 1);
    
    if (ratio >= 2) return 'excellent';
    if (ratio >= 1.5) return 'good';
    if (ratio >= 0.8) return 'fair';
    return 'poor';
  };

  return {
    // Data
    company,
    positions,
    stats,
    activePositions,
    creditPositions,
    debtPositions,
    
    // Computed values
    totalCredit,
    totalDebt,
    netPosition,
    
    // Loading states
    isLoading: isLoadingCompany || isLoadingPositions || isLoadingStats,
    isLoadingCompany,
    isLoadingPositions,
    isLoadingStats,
    
    // Errors
    error: companyError || positionsError || statsError,
    companyError,
    positionsError,
    statsError,
    
    // Mutations
    updateDebtBalance: updateDebtBalanceMutation.mutate,
    isUpdatingBalance: updateDebtBalanceMutation.isPending,
    
    // Helper functions
    getPositionsByCounterparty,
    getPositionsByType,
    getOverduePositions,
    getPositionsByCurrency,
    refreshCompanyData,
    calculatePotentialSavings,
    getFinancialHealthScore,
    
    // Utility values
    hasPositions: positions.length > 0,
    hasActivePositions: activePositions.length > 0,
    isCreditor: totalCredit > totalDebt,
    isDebtor: totalDebt > totalCredit,
    isBalanced: Math.abs(netPosition) < 100, // Within $100 is considered balanced
  };
}

export default useCompany;
