import { 
  companies, 
  positions, 
  loops, 
  loopParticipants,
  type Company, 
  type InsertCompany, 
  type Position, 
  type InsertPosition,
  type Loop,
  type InsertLoop,
  type LoopParticipant 
} from "@shared/schema";

export interface IStorage {
  // Company methods
  getCompany(id: number): Promise<Company | undefined>;
  getCompanyByAnonymousId(anonymousId: string): Promise<Company | undefined>;
  createCompany(company: InsertCompany): Promise<Company>;
  getAllCompanies(): Promise<Company[]>;
  updateCompanyDebtBalance(id: number, balance: number): Promise<Company | undefined>;

  // Position methods
  getPosition(id: number): Promise<Position | undefined>;
  getPositionsByCompany(companyId: number): Promise<Position[]>;
  getAllPositions(): Promise<Position[]>;
  createPosition(companyId: number, position: InsertPosition): Promise<Position>;
  updatePositionSettled(id: number, isSettled: boolean): Promise<Position | undefined>;

  // Loop methods
  getLoop(loopId: string): Promise<Loop | undefined>;
  getAllLoops(): Promise<Loop[]>;
  getLoopsByStatus(status: string): Promise<Loop[]>;
  createLoop(loop: InsertLoop): Promise<Loop>;
  updateLoopStatus(loopId: string, status: string): Promise<Loop | undefined>;

  // Loop participant methods
  getLoopParticipants(loopId: string): Promise<LoopParticipant[]>;
  createLoopParticipant(participant: Omit<LoopParticipant, 'id'>): Promise<LoopParticipant>;
  updateParticipantAcceptance(loopId: string, companyId: number, hasAccepted: boolean): Promise<LoopParticipant | undefined>;
  updateParticipantVerification(loopId: string, companyId: number, hasVerified: boolean): Promise<LoopParticipant | undefined>;
}

export class MemStorage implements IStorage {
  private companies: Map<number, Company>;
  private positions: Map<number, Position>;
  private loops: Map<string, Loop>;
  private loopParticipants: Map<string, LoopParticipant[]>;
  private currentCompanyId: number;
  private currentPositionId: number;
  private currentLoopParticipantId: number;

  constructor() {
    this.companies = new Map();
    this.positions = new Map();
    this.loops = new Map();
    this.loopParticipants = new Map();
    this.currentCompanyId = 1;
    this.currentPositionId = 1;
    this.currentLoopParticipantId = 1;

    // Initialize with some sample companies
    this.initializeSampleData();
  }

  private initializeSampleData() {
    // Create the main company (user's company)
    const mainCompany: Company = {
      id: this.currentCompanyId++,
      name: "Acme Corp",
      anonymousId: "ANX-2847",
      debtBalance: 2500,
      xrplAddress: null,
      xrplSeed: null,
      createdAt: new Date(),
    };
    this.companies.set(mainCompany.id, mainCompany);

    // Create other companies for testing
    const companies = [
      { name: "Beta Industries", anonymousId: "ABC-1247" },
      { name: "Gamma Solutions", anonymousId: "XYZ-4821" },
      { name: "Delta Enterprises", anonymousId: "DEF-7395" },
      { name: "Echo Systems", anonymousId: "GHI-9512" },
    ];

    companies.forEach(comp => {
      const company: Company = {
        id: this.currentCompanyId++,
        name: comp.name,
        anonymousId: comp.anonymousId,
        debtBalance: Math.floor(Math.random() * 5000) + 1000,
        xrplAddress: null,
        xrplSeed: null,
        createdAt: new Date(),
      };
      this.companies.set(company.id, company);
    });
  }

  async getCompany(id: number): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompanyByAnonymousId(anonymousId: string): Promise<Company | undefined> {
    return Array.from(this.companies.values()).find(
      (company) => company.anonymousId === anonymousId,
    );
  }

  async createCompany(insertCompany: InsertCompany): Promise<Company> {
    const id = this.currentCompanyId++;
    const company: Company = {
      ...insertCompany,
      id,
      debtBalance: 2500,
      createdAt: new Date(),
    };
    this.companies.set(id, company);
    return company;
  }

  async getAllCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values());
  }

  async updateCompanyDebtBalance(id: number, balance: number): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (company) {
      company.debtBalance = balance;
      this.companies.set(id, company);
      return company;
    }
    return undefined;
  }

  async getPosition(id: number): Promise<Position | undefined> {
    return this.positions.get(id);
  }

  async getPositionsByCompany(companyId: number): Promise<Position[]> {
    return Array.from(this.positions.values()).filter(
      (position) => position.companyId === companyId,
    );
  }

  async getAllPositions(): Promise<Position[]> {
    return Array.from(this.positions.values());
  }

  async createPosition(companyId: number, insertPosition: InsertPosition): Promise<Position> {
    const id = this.currentPositionId++;
    const position: Position = {
      ...insertPosition,
      id,
      companyId,
      currency: insertPosition.currency || "USD",
      description: insertPosition.description || null,
      isSettled: false,
      createdAt: new Date(),
    };
    this.positions.set(id, position);
    return position;
  }

  async updatePositionSettled(id: number, isSettled: boolean): Promise<Position | undefined> {
    const position = this.positions.get(id);
    if (position) {
      position.isSettled = isSettled;
      this.positions.set(id, position);
      return position;
    }
    return undefined;
  }

  async getLoop(loopId: string): Promise<Loop | undefined> {
    return this.loops.get(loopId);
  }

  async getAllLoops(): Promise<Loop[]> {
    return Array.from(this.loops.values());
  }

  async getLoopsByStatus(status: string): Promise<Loop[]> {
    return Array.from(this.loops.values()).filter(loop => loop.status === status);
  }

  async createLoop(insertLoop: InsertLoop): Promise<Loop> {
    const loop: Loop = {
      ...insertLoop,
      id: this.loops.size + 1,
      status: "pending",
      createdAt: new Date(),
    };
    this.loops.set(loop.loopId, loop);
    return loop;
  }

  async updateLoopStatus(loopId: string, status: string): Promise<Loop | undefined> {
    const loop = this.loops.get(loopId);
    if (loop) {
      loop.status = status;
      this.loops.set(loopId, loop);
      return loop;
    }
    return undefined;
  }

  async getLoopParticipants(loopId: string): Promise<LoopParticipant[]> {
    return this.loopParticipants.get(loopId) || [];
  }

  async createLoopParticipant(participant: Omit<LoopParticipant, 'id'>): Promise<LoopParticipant> {
    const id = this.currentLoopParticipantId++;
    const loopParticipant: LoopParticipant = {
      ...participant,
      id,
    };
    
    const existing = this.loopParticipants.get(participant.loopId) || [];
    existing.push(loopParticipant);
    this.loopParticipants.set(participant.loopId, existing);
    
    return loopParticipant;
  }

  async updateParticipantAcceptance(loopId: string, companyId: number, hasAccepted: boolean): Promise<LoopParticipant | undefined> {
    const participants = this.loopParticipants.get(loopId) || [];
    const participant = participants.find(p => p.companyId === companyId);
    if (participant) {
      participant.hasAccepted = hasAccepted;
      return participant;
    }
    return undefined;
  }

  async updateParticipantVerification(loopId: string, companyId: number, hasVerified: boolean): Promise<LoopParticipant | undefined> {
    const participants = this.loopParticipants.get(loopId) || [];
    const participant = participants.find(p => p.companyId === companyId);
    if (participant) {
      participant.hasVerified = hasVerified;
      return participant;
    }
    return undefined;
  }
}

export const storage = new MemStorage();
