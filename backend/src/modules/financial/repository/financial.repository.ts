import { Injectable } from "@nestjs/common";

interface MonthlyFactRecord {
  employeeId: string;
  projectId: string;
  month: string;
  computeKey: string;
}

@Injectable()
export class FinancialRepository {
  private readonly monthlyFacts = new Map<string, MonthlyFactRecord>();

  upsertMonthlyFact(input: {
    employeeId: string;
    projectId: string;
    month: string;
  }): string {
    const computeKey = this.buildComputeKey(input.employeeId, input.projectId, input.month);

    this.monthlyFacts.set(computeKey, {
      employeeId: input.employeeId,
      projectId: input.projectId,
      month: input.month,
      computeKey
    });

    return computeKey;
  }

  private buildComputeKey(employeeId: string, projectId: string, month: string): string {
    return `${employeeId}|${projectId}|${month}`;
  }
}
