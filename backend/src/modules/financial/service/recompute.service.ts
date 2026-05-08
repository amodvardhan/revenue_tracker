import { Inject, Injectable } from "@nestjs/common";

import { RecomputeDto } from "../dto/recompute.dto";
import { FinancialRepository, ReconciliationFactRow } from "../repository/financial.repository";

interface MarginTotals {
  plannedMargin: number;
  actualMargin: number;
  marginVariance: number;
}

interface ProjectMarginTotals extends MarginTotals {
  projectId: string;
}

interface ReconciliationReport {
  rows: ReconciliationFactRow[];
  projectTotals: ProjectMarginTotals[];
  totals: MarginTotals;
}

@Injectable()
export class RecomputeService {
  constructor(
    @Inject(FinancialRepository)
    private readonly financialRepository: FinancialRepository
  ) {}

  async recomputeTarget(input: RecomputeDto): Promise<string[]> {
    const recomputedKey = await this.financialRepository.upsertMonthlyFact(input);
    return [recomputedKey];
  }

  async getDashboardSummary(): Promise<{ totals: MarginTotals }> {
    const report = await this.getReconciliationReport();
    return { totals: report.totals };
  }

  async getExportSnapshot(): Promise<{ rows: ReconciliationFactRow[]; totals: MarginTotals }> {
    const report = await this.getReconciliationReport();
    return {
      rows: report.rows,
      totals: report.totals
    };
  }

  async getReconciliationReport(): Promise<ReconciliationReport> {
    const rows = await this.financialRepository.listFactsForReconciliation();
    const projectTotalsById = new Map<string, ProjectMarginTotals>();

    for (const row of rows) {
      const existing = projectTotalsById.get(row.projectId);
      if (existing) {
        existing.plannedMargin += row.plannedMargin;
        existing.actualMargin += row.actualMargin;
        existing.marginVariance += row.marginVariance;
        continue;
      }

      projectTotalsById.set(row.projectId, {
        projectId: row.projectId,
        plannedMargin: row.plannedMargin,
        actualMargin: row.actualMargin,
        marginVariance: row.marginVariance
      });
    }

    const projectTotals = [...projectTotalsById.values()].sort((left, right) =>
      left.projectId.localeCompare(right.projectId)
    );
    const totals = projectTotals.reduce<MarginTotals>(
      (accumulator, projectTotal) => ({
        plannedMargin: accumulator.plannedMargin + projectTotal.plannedMargin,
        actualMargin: accumulator.actualMargin + projectTotal.actualMargin,
        marginVariance: accumulator.marginVariance + projectTotal.marginVariance
      }),
      {
        plannedMargin: 0,
        actualMargin: 0,
        marginVariance: 0
      }
    );

    return {
      rows,
      projectTotals,
      totals
    };
  }
}
