import { Inject, Injectable } from "@nestjs/common";
import { MonthlyFactStatus, ProjectionStatus } from "@prisma/client";

import { PrismaService } from "../repository/prisma.service";
import { enumerateMonths, isMonthInRange, resolveRateForMonth } from "./monthly-facts.helpers";

@Injectable()
export class MonthlyFactsRecomputeService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  private async resolveBaselineDaysPerMonth(): Promise<number> {
    const row = await this.prisma.appSettings.findUnique({ where: { id: "global" } });
    return row?.defaultRevenueDays ?? 20;
  }

  async recomputeMonthlyFactsForAssignment(assignmentId: string): Promise<void> {
    const assignment = await this.prisma.assignment.findUniqueOrThrow({
      where: { id: assignmentId },
      include: {
        project: true,
        attendances: true,
        rateRevisions: true,
        projections: true
      }
    });

    const baselineDaysPerMonth = await this.resolveBaselineDaysPerMonth();

    const months = new Set<string>();
    for (const month of enumerateMonths(assignment.signedStartDate, assignment.signedEndDate)) {
      months.add(month);
    }
    for (const projection of assignment.projections) {
      for (const month of enumerateMonths(projection.startDate, projection.endDate)) {
        months.add(month);
      }
    }

    for (const month of [...months].sort()) {
      const expectedDays = (baselineDaysPerMonth * assignment.allocationPercent) / 100;
      const rate = resolveRateForMonth(assignment.dailyRate, assignment.rateRevisions, month);
      const attendance = assignment.attendances.find((item) => item.month === month);
      const actualDays = attendance?.actualDays ?? 0;

      const signedRevenue = isMonthInRange(month, assignment.signedStartDate, assignment.signedEndDate)
        ? expectedDays * rate
        : 0;
      const projectedRevenue = assignment.projections
        .filter((projection) => projection.status === ProjectionStatus.projected)
        .filter((projection) => isMonthInRange(month, projection.startDate, projection.endDate))
        .reduce((sum, projection) => sum + expectedDays * projection.projectionRate, 0);

      const plannedRevenue = signedRevenue + projectedRevenue;
      const plannedCost = expectedDays * rate;
      const actualRevenue = plannedRevenue;
      const actualCost = actualDays * rate;
      const plannedMargin = plannedRevenue - plannedCost;
      const actualMargin = actualRevenue - actualCost;
      const marginVariance = actualMargin - plannedMargin;
      const status: MonthlyFactStatus = actualDays > 0 ? MonthlyFactStatus.final : MonthlyFactStatus.provisional;

      await this.prisma.monthlyFact.upsert({
        where: {
          employeeId_projectId_month: {
            employeeId: assignment.employeeId,
            projectId: assignment.projectId,
            month
          }
        },
        update: {
          assignmentId: assignment.id,
          computeKey: `${assignment.employeeId}|${assignment.projectId}|${month}`,
          expectedDays,
          signedRevenue,
          projectedRevenue,
          totalRevenue: plannedRevenue,
          plannedRevenue,
          plannedCost,
          actualRevenue,
          actualCost,
          plannedMargin,
          actualMargin,
          marginVariance,
          status
        },
        create: {
          assignmentId: assignment.id,
          employeeId: assignment.employeeId,
          projectId: assignment.projectId,
          month,
          computeKey: `${assignment.employeeId}|${assignment.projectId}|${month}`,
          expectedDays,
          signedRevenue,
          projectedRevenue,
          totalRevenue: plannedRevenue,
          plannedRevenue,
          plannedCost,
          actualRevenue,
          actualCost,
          plannedMargin,
          actualMargin,
          marginVariance,
          status
        }
      });
    }

    await this.refreshAlertsForAccount(assignment.project.accountId);
  }

  private async refreshAlertsForAccount(accountId: string): Promise<void> {
    const facts = await this.prisma.monthlyFact.findMany({
      where: { assignment: { project: { accountId } } }
    });
    const planned = facts.reduce((acc, row) => acc + row.plannedRevenue, 0);
    const leakage = facts.reduce((acc, row) => acc + (row.plannedRevenue - row.actualCost), 0);
    const leakagePercent = planned <= 0 ? 0 : (leakage / planned) * 100;

    await this.prisma.alert.updateMany({
      where: { accountId, alertType: "leakage_threshold" },
      data: { isActive: false }
    });

    const account = await this.prisma.account.findUnique({ where: { id: accountId }, select: { code: true } });
    const label = account?.code ?? accountId;

    if (leakagePercent > 10) {
      await this.prisma.alert.create({
        data: {
          accountId,
          alertType: "leakage_threshold",
          message: `Revenue leakage is ${leakagePercent.toFixed(2)}% for account ${label}`
        }
      });
    }
  }
}
