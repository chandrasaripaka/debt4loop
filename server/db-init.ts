import { db } from "./db";
import { companies, positions, loops, loopParticipants } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function initializeDatabase() {
  try {
    // Check if main company already exists
    const existingCompany = await db.select().from(companies).where(eq(companies.anonymousId, "ANX-2847"));
    
    if (existingCompany.length === 0) {
      // Create main company
      const [mainCompany] = await db
        .insert(companies)
        .values({
          name: "Acme Corp",
          anonymousId: "ANX-2847",
          debtBalance: 2500,
        })
        .returning();

      console.log('Database initialized with main company:', mainCompany.anonymousId);

      // Create sample companies for demonstration
      const sampleCompanies = [
        { name: "Beta Industries", anonymousId: "BTA-5791", debtBalance: 1800 },
        { name: "Gamma Solutions", anonymousId: "GMA-9234", debtBalance: 3200 },
        { name: "Delta Corp", anonymousId: "DLT-1567", debtBalance: 2100 },
        { name: "Echo Enterprises", anonymousId: "ECH-8902", debtBalance: 2800 },
      ];

      for (const company of sampleCompanies) {
        await db.insert(companies).values(company);
      }

      console.log('Sample companies created for loop demonstration');
    } else {
      console.log('Database already initialized');
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
  }
}