import { Inject, Injectable } from "@nestjs/common";
import { MonthlyFactStatus, PrismaClient } from "@prisma/client";

export const PRISMA_CLIENT = Symbol("PRISMA_CLIENT");

export interface ReconciliationFactRow {
  employeeId: string;
  projectId: string;
  month: string;
  plannedMargin: number;
  actualMargin: number;
  marginVariance: number;
}

@Injectable()
export class FinancialRepository {
  constructor(
    @Inject(PRISMA_CLIENT)
    private readonly prismaClient: PrismaClient
  ) {}

  async upsertMonthlyFact(input: {
    employeeId: string;
    projectId: string;
    month: string;
  }): Promise<string> {
    const computeKey = this.buildComputeKey(input.employeeId, input.projectId, input.month);

    await this.prismaClient.monthlyFact.upsert({
      where: { computeKey },
      update: {
        status: MonthlyFactStatus.final
      },
      create: {
        employeeId: input.employeeId,
        projectId: input.projectId,
        month: input.month,
        computeKey,
        status: MonthlyFactStatus.final
      }
    });

    return computeKey;
  }

  async listFactsForReconciliation(): Promise<ReconciliationFactRow[]> {
    return this.prismaClient.monthlyFact.findMany({
      select: {
        employeeId: true,
        projectId: true,
        month: true,
        plannedMargin: true,
        actualMargin: true,
        marginVariance: true
      }
    });
  }

  private buildComputeKey(employeeId: string, projectId: string, month: string): string {
    return `${employeeId}|${projectId}|${month}`;
  }
}
