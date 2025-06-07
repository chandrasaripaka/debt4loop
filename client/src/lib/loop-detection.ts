interface Position {
  id: number;
  companyId: number;
  counterpartyId: string;
  amount: string;
  currency: string;
  type: 'credit' | 'debt';
  dueDate: string;
  isSettled: boolean;
}

interface Company {
  id: number;
  name: string;
  anonymousId: string;
  debtBalance: number;
}

interface LoopNode {
  companyId: string;
  positions: Position[];
  balance: number;
}

interface DetectedLoop {
  participants: string[];
  settlements: Record<string, number>;
  totalValue: number;
  efficiency: number;
}

export class LoopDetectionEngine {
  private companies: Map<string, Company> = new Map();
  private positions: Position[] = [];
  private adjacencyGraph: Map<string, Map<string, number>> = new Map();

  constructor(companies: Company[], positions: Position[]) {
    this.companies = new Map(companies.map(c => [c.anonymousId, c]));
    this.positions = positions.filter(p => !p.isSettled);
    this.buildGraph();
  }

  private buildGraph(): void {
    this.adjacencyGraph.clear();
    
    // Initialize graph nodes
    for (const company of this.companies.values()) {
      this.adjacencyGraph.set(company.anonymousId, new Map());
    }

    // Build edges from positions
    for (const position of this.positions) {
      const company = Array.from(this.companies.values()).find(c => c.id === position.companyId);
      if (!company) continue;

      const fromId = company.anonymousId;
      const toId = position.counterpartyId;
      
      if (!this.adjacencyGraph.has(fromId)) {
        this.adjacencyGraph.set(fromId, new Map());
      }
      if (!this.adjacencyGraph.has(toId)) {
        this.adjacencyGraph.set(toId, new Map());
      }

      const amount = parseFloat(position.amount);
      const currentEdge = this.adjacencyGraph.get(fromId)!;
      
      if (position.type === 'debt') {
        // Company owes money to counterparty
        currentEdge.set(toId, (currentEdge.get(toId) || 0) + amount);
      } else {
        // Company is owed money by counterparty (reverse edge)
        const reverseEdge = this.adjacencyGraph.get(toId)!;
        reverseEdge.set(fromId, (reverseEdge.get(fromId) || 0) + amount);
      }
    }
  }

  public detectLoops(maxDepth: number = 4): DetectedLoop[] {
    const loops: DetectedLoop[] = [];
    const visited = new Set<string>();

    for (const startNode of this.adjacencyGraph.keys()) {
      if (visited.has(startNode)) continue;
      
      const foundLoops = this.findLoopsFromNode(startNode, maxDepth);
      loops.push(...foundLoops);
      
      // Mark all nodes in found loops as visited to avoid duplicates
      foundLoops.forEach(loop => {
        loop.participants.forEach(participant => visited.add(participant));
      });
    }

    return this.rankLoopsByValue(loops);
  }

  private findLoopsFromNode(startNode: string, maxDepth: number): DetectedLoop[] {
    const loops: DetectedLoop[] = [];
    const path: string[] = [startNode];
    const pathSet = new Set<string>([startNode]);

    this.dfsForLoops(startNode, startNode, path, pathSet, loops, maxDepth);
    return loops;
  }

  private dfsForLoops(
    currentNode: string,
    startNode: string,
    path: string[],
    pathSet: Set<string>,
    loops: DetectedLoop[],
    remainingDepth: number
  ): void {
    if (remainingDepth <= 0) return;

    const neighbors = this.adjacencyGraph.get(currentNode);
    if (!neighbors) return;

    for (const [neighbor, amount] of neighbors.entries()) {
      if (amount <= 0) continue;

      if (neighbor === startNode && path.length >= 3) {
        // Found a loop back to start
        const loop = this.calculateLoopSettlement([...path]);
        if (loop && loop.totalValue > 0) {
          loops.push(loop);
        }
      } else if (!pathSet.has(neighbor)) {
        // Continue exploring
        path.push(neighbor);
        pathSet.add(neighbor);
        this.dfsForLoops(neighbor, startNode, path, pathSet, loops, remainingDepth - 1);
        path.pop();
        pathSet.delete(neighbor);
      }
    }
  }

  private calculateLoopSettlement(participants: string[]): DetectedLoop | null {
    if (participants.length < 3) return null;

    const settlements: Record<string, number> = {};
    let totalValue = 0;
    let isValidLoop = true;

    // Calculate net flow for each participant in the loop
    for (let i = 0; i < participants.length; i++) {
      const current = participants[i];
      const next = participants[(i + 1) % participants.length];
      
      const currentEdges = this.adjacencyGraph.get(current);
      const amountOwed = currentEdges?.get(next) || 0;
      
      if (amountOwed <= 0) {
        isValidLoop = false;
        break;
      }

      settlements[current] = (settlements[current] || 0) - amountOwed;
      settlements[next] = (settlements[next] || 0) + amountOwed;
      totalValue += amountOwed;
    }

    if (!isValidLoop || totalValue <= 0) return null;

    // Find the minimum flow in the loop to determine settlement amount
    const minFlow = this.findMinimumFlow(participants);
    if (minFlow <= 0) return null;

    // Adjust settlements based on minimum flow
    const adjustedSettlements: Record<string, number> = {};
    for (const participant of participants) {
      adjustedSettlements[participant] = Math.round((settlements[participant] || 0) * minFlow / totalValue * 100) / 100;
    }

    // Calculate efficiency (how much of the loop can be settled)
    const efficiency = minFlow / totalValue;

    return {
      participants: [...participants],
      settlements: adjustedSettlements,
      totalValue: minFlow,
      efficiency
    };
  }

  private findMinimumFlow(participants: string[]): number {
    let minFlow = Infinity;

    for (let i = 0; i < participants.length; i++) {
      const current = participants[i];
      const next = participants[(i + 1) % participants.length];
      
      const currentEdges = this.adjacencyGraph.get(current);
      const flow = currentEdges?.get(next) || 0;
      
      if (flow < minFlow) {
        minFlow = flow;
      }
    }

    return minFlow === Infinity ? 0 : minFlow;
  }

  private rankLoopsByValue(loops: DetectedLoop[]): DetectedLoop[] {
    return loops
      .filter(loop => loop.totalValue > 0)
      .sort((a, b) => {
        // Sort by total value descending, then by efficiency descending
        if (Math.abs(b.totalValue - a.totalValue) > 0.01) {
          return b.totalValue - a.totalValue;
        }
        return b.efficiency - a.efficiency;
      })
      .slice(0, 10); // Return top 10 loops
  }

  public validateLoop(participants: string[]): boolean {
    if (participants.length < 3) return false;

    for (let i = 0; i < participants.length; i++) {
      const current = participants[i];
      const next = participants[(i + 1) % participants.length];
      
      const currentEdges = this.adjacencyGraph.get(current);
      const hasEdge = currentEdges?.has(next) && (currentEdges.get(next) || 0) > 0;
      
      if (!hasEdge) return false;
    }

    return true;
  }

  public calculateDebtCost(loop: DetectedLoop): number {
    // Cost calculation based on loop complexity and value
    const baseCost = 10; // Base DEBT cost
    const participantMultiplier = loop.participants.length * 5;
    const valueMultiplier = Math.min(loop.totalValue / 1000, 10); // Cap at 10x
    
    return Math.round(baseCost + participantMultiplier + valueMultiplier);
  }

  public getCompanyPositions(companyId: string): Position[] {
    const company = this.companies.get(companyId);
    if (!company) return [];
    
    return this.positions.filter(p => p.companyId === company.id);
  }

  public getNetPosition(companyId: string): number {
    const positions = this.getCompanyPositions(companyId);
    
    const credits = positions
      .filter(p => p.type === 'credit')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
    const debts = positions
      .filter(p => p.type === 'debt')
      .reduce((sum, p) => sum + parseFloat(p.amount), 0);
      
    return credits - debts;
  }
}

export function createMockLoop(
  userCompanyId: string,
  participantIds: string[],
  userBenefit: number
): DetectedLoop {
  const settlements: Record<string, number> = {};
  
  // User gets the benefit
  settlements[userCompanyId] = userBenefit;
  
  // Distribute the cost among other participants
  const otherParticipants = participantIds.filter(id => id !== userCompanyId);
  const costPerParticipant = userBenefit / otherParticipants.length;
  
  otherParticipants.forEach(id => {
    settlements[id] = -costPerParticipant;
  });

  return {
    participants: participantIds,
    settlements,
    totalValue: userBenefit,
    efficiency: 0.85 + Math.random() * 0.1 // 85-95% efficiency
  };
}

export default LoopDetectionEngine;
