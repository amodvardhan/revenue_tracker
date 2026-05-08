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
