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
  const plannedRevenue = input.expectedDays * input.plannedBillRate;
  const plannedCost = input.expectedDays * input.plannedCostPerDay;
  const plannedMargin = plannedRevenue - plannedCost;

  const status = resolveMonthlyFactStatus(input);
  if (status === "blocked") {
    const actualRevenue = 0;
    const actualCost = 0;
    const actualMargin = 0;
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

  const billRate = input.billRate as number;
  const costPerDay = input.costPerDay as number;

  const actualRevenue =
    input.actualRegularDays * billRate + input.actualExtraDays * (input.extraDayRate ?? billRate);
  const actualCost = (input.actualRegularDays + input.actualExtraDays) * costPerDay;

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
