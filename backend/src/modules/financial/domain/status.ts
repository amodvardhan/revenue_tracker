export type MonthlyFactStatus = "blocked" | "provisional" | "final";

interface ResolveMonthlyFactStatusParams {
  billRate?: number;
  costPerDay?: number;
  extraDayRate?: number;
}

export function resolveMonthlyFactStatus(params: ResolveMonthlyFactStatusParams): MonthlyFactStatus {
  if (params.billRate == null || params.costPerDay == null) {
    return "blocked";
  }

  if (params.extraDayRate == null) {
    return "provisional";
  }

  return "final";
}
