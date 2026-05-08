export interface BuildMonthInputParams {
  employeeId: string;
  projectId: string;
  yearMonth: string;
  baselineDays: number;
  allocationPercent: number;
}

export interface MonthInput {
  computeKey: string;
  expectedDays: number;
}

export function buildMonthInput(params: BuildMonthInputParams): MonthInput {
  const expectedDays = (params.baselineDays * params.allocationPercent) / 100;

  return {
    computeKey: `${params.employeeId}|${params.projectId}|${params.yearMonth}`,
    expectedDays
  };
}
