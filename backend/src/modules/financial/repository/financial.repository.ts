import { Inject, Injectable } from "@nestjs/common";
import { MonthlyFactStatus, PrismaClient } from "@prisma/client";

import { isMonthInRange } from "../service/monthly-facts.helpers";

export const PRISMA_CLIENT = Symbol("PRISMA_CLIENT");

export interface ReconciliationFactRow {
  employeeId: string;
  projectId: string;
  month: string;
  plannedMargin: number;
  actualMargin: number;
  marginVariance: number;
}

export interface MonthlyFinancialFactRow {
  computeKey: string;
  month: string;
  status: "blocked" | "provisional" | "final";
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

    const assignments = await this.prismaClient.assignment.findMany({
      where: {
        employeeId: input.employeeId,
        projectId: input.projectId
      }
    });

    const assignment = assignments.find((row) =>
      isMonthInRange(input.month, row.signedStartDate, row.signedEndDate)
    );

    if (!assignment) {
      throw new Error(
        `No assignment covers ${input.month} for employee ${input.employeeId} on project ${input.projectId}`
      );
    }

    await this.prismaClient.monthlyFact.upsert({
      where: {
        employeeId_projectId_month: {
          employeeId: input.employeeId,
          projectId: input.projectId,
          month: input.month
        }
      },
      update: {
        status: MonthlyFactStatus.final,
        assignmentId: assignment.id
      },
      create: {
        assignmentId: assignment.id,
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

  async listFinancialFacts(): Promise<MonthlyFinancialFactRow[]> {
    return this.prismaClient.monthlyFact.findMany({
      select: {
        computeKey: true,
        month: true,
        status: true,
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
