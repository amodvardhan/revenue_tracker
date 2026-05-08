import { resolveMonthlyFactStatus, type MonthlyFactStatus } from "./status";

export interface CalculateMonthlyFactInput {
  expectedDays: number;
  actualDays: number;
  extraDays: number;
  billRate?: number;
  extraDayRate?: number;
  costPerDay?: number;
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
  const effectiveExtraDayRate = input.extraDayRate ?? billRate;
  const regularActualDays = input.actualDays - input.extraDays;

  const plannedRevenue = input.expectedDays * billRate;
  const plannedCost = input.expectedDays * costPerDay;
  const actualRevenue = regularActualDays * billRate + input.extraDays * effectiveExtraDayRate;
  const actualCost = input.actualDays * costPerDay;

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
