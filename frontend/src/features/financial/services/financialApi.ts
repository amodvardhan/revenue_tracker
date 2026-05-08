import type { MonthlyFinancialFact } from "../models/financial";

const FALLBACK_FACTS: MonthlyFinancialFact[] = [
  {
    month: "2026-01",
    status: "final",
    plannedMargin: 1000,
    actualMargin: 1200,
    marginVariance: 200
  }
];

export async function getFinancialFacts(): Promise<MonthlyFinancialFact[]> {
  try {
    const response = await fetch("/api/financial/facts");
    if (!response.ok) {
      throw new Error("Failed to load financial facts");
    }

    return (await response.json()) as MonthlyFinancialFact[];
  } catch {
    // Keep dashboard usable while API wiring is in progress.
    return FALLBACK_FACTS;
  }
}
