export type MonthlyFactStatus = "blocked" | "provisional" | "final";

export interface MonthlyFinancialFact {
  month: string;
  status: MonthlyFactStatus;
  plannedMargin: number;
  actualMargin: number;
  marginVariance: number;
}
