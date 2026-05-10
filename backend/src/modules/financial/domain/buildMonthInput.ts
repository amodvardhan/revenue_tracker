import type { BuildMonthInputParams, MonthInput } from "./types";

const YEAR_MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

export function buildMonthInput(params: BuildMonthInputParams): MonthInput {
  if (params.baselineDays < 1 || params.baselineDays > 31) {
    throw new Error("baselineDays must be between 1 and 31");
  }

  if (params.allocationPercent < 0 || params.allocationPercent > 100) {
    throw new Error("allocationPercent must be between 0 and 100");
  }

  if (!YEAR_MONTH_PATTERN.test(params.yearMonth)) {
    throw new Error("yearMonth must match YYYY-MM");
  }

  return {
    computeKey: `${params.employeeId}|${params.projectId}|${params.yearMonth}`,
    expectedDays: (params.baselineDays * params.allocationPercent) / 100
  };
}
