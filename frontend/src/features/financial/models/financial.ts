export type MonthlyFactStatus = "blocked" | "provisional" | "final";

export interface MonthlyFinancialFact {
  computeKey: string;
  month: string;
  employeeId: string;
  projectId: string;
  projectName: string;
  account: string;
  clientName: string;
  teamMemberName: string;
  status: MonthlyFactStatus;
  signedRevenue: number;
  projectedRevenue: number;
  totalRevenue: number;
  actualCost: number;
  plannedRevenue: number;
  plannedMargin: number;
  actualMargin: number;
  marginVariance: number;
}
