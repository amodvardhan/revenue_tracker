import { resolveMonthlyFactStatus, type MonthlyFactStatus } from "./status";

export interface CalculateMonthlyFactInput {
  expectedDays: number;
  plannedBillRate: number;
  plannedCostPerDay: number;
  actualRegularDays: number;
  actualExtraDays: number;
  billRate: number | null;
  extraDayRate: number | null;
  costPerDay: number | null;
}

export interface MonthlyFactResult {
  status: MonthlyFactStatus;
  plannedRevenue: number;
  plannedCost: number;
  actualRevenue: number;
  actualCost: number;
  plannedMargin: number;
  actualMargin: number;
  marginVariance: number;
}

export function calculateMonthlyFact(input: CalculateMonthlyFactInput): MonthlyFactResult {
  const status = resolveMonthlyFactStatus(input);
  if (status === "blocked") {
    return {
      status,
      plannedRevenue: 0,
      plannedCost: 0,
      actualRevenue: 0,
      actualCost: 0,
      plannedMargin: 0,
      actualMargin: 0,
      marginVariance: 0
    };
  }

  const billRate = input.billRate as number;
  const costPerDay = input.costPerDay as number;

  const plannedRevenue = input.expectedDays * input.plannedBillRate;
  const plannedCost = input.expectedDays * input.plannedCostPerDay;
  const actualRevenue =
    input.actualRegularDays * billRate + input.actualExtraDays * (input.extraDayRate ?? billRate);
  const actualCost = (input.actualRegularDays + input.actualExtraDays) * costPerDay;

  const plannedMargin = plannedRevenue - plannedCost;
  const actualMargin = actualRevenue - actualCost;
  const marginVariance = actualMargin - plannedMargin;

  return {
    status,
    plannedRevenue,
    plannedCost,
    actualRevenue,
    actualCost,
    plannedMargin,
    actualMargin,
    marginVariance
  };
}
