import type { BuildMonthInputParams, MonthInput } from "./types";

const FIXED_BASELINE_DAYS = 20;
const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function buildMonthInput(params: BuildMonthInputParams): MonthInput {
  if (params.baselineDays !== FIXED_BASELINE_DAYS) {
    throw new Error("baselineDays must be fixed at 20");
  }

  if (params.allocationPercent < 0 || params.allocationPercent > 100) {
    throw new Error("allocationPercent must be between 0 and 100");
  }

  if (!YEAR_MONTH_PATTERN.test(params.yearMonth)) {
    throw new Error("yearMonth must match YYYY-MM");
  }

  return {
    computeKey: `${params.employeeId}|${params.projectId}|${params.yearMonth}`,
    expectedDays: (FIXED_BASELINE_DAYS * params.allocationPercent) / 100
  };
}
