import { RecomputeService } from "../../src/modules/financial/service/recompute.service";
import { FinancialRepository, ReconciliationFactRow } from "../../src/modules/financial/repository/financial.repository";

type ReconciliationRepositoryMock = Pick<FinancialRepository, "upsertMonthlyFact" | "listFactsForReconciliation">;
type FinancialFactsRepositoryMock = Pick<FinancialRepository, "listFinancialFacts">;
type FinancialRepositoryMock = ReconciliationRepositoryMock & FinancialFactsRepositoryMock;

describe("reconciliation rollups", () => {
  it("keeps project total equal to sum of employee-month facts", async () => {
    const listFactsForReconciliation: jest.MockedFunction<
      ReconciliationRepositoryMock["listFactsForReconciliation"]
    > = jest.fn(async () => {
      const rows: ReconciliationFactRow[] = [
        {
          employeeId: "emp-1",
          projectId: "prj-1",
          month: "2026-05",
          plannedMargin: 100,
          actualMargin: 110,
          marginVariance: 10
        },
        {
          employeeId: "emp-2",
          projectId: "prj-1",
          month: "2026-05",
          plannedMargin: 300,
          actualMargin: 290,
          marginVariance: -10
        },
        {
          employeeId: "emp-3",
          projectId: "prj-2",
          month: "2026-05",
          plannedMargin: 200,
          actualMargin: 220,
          marginVariance: 20
        }
      ];
      return rows;
    });
    const repositoryMock: FinancialRepositoryMock = {
      upsertMonthlyFact: jest.fn(async () => "unused"),
      listFactsForReconciliation,
      listFinancialFacts: jest.fn(async () => [])
    };

    const service = new RecomputeService(repositoryMock);

    const report = await service.getReconciliationReport();

    expect(report.projectTotals).toEqual([
      {
        projectId: "prj-1",
        plannedMargin: 400,
        actualMargin: 400,
        marginVariance: 0
      },
      {
        projectId: "prj-2",
        plannedMargin: 200,
        actualMargin: 220,
        marginVariance: 20
      }
    ]);
    expect(report.totals).toEqual({
      plannedMargin: 600,
      actualMargin: 620,
      marginVariance: 20
    });
    expect(listFactsForReconciliation).toHaveBeenCalledTimes(1);
  });

  it("returns zero totals for empty datasets", async () => {
    const repositoryMock: FinancialRepositoryMock = {
      upsertMonthlyFact: jest.fn(async () => "unused"),
      listFactsForReconciliation: jest.fn(async () => []),
      listFinancialFacts: jest.fn(async () => [])
    };

    const service = new RecomputeService(repositoryMock);
    const report = await service.getReconciliationReport();

    expect(report.rows).toEqual([]);
    expect(report.projectTotals).toEqual([]);
    expect(report.totals).toEqual({
      plannedMargin: 0,
      actualMargin: 0,
      marginVariance: 0
    });
  });

  it("aggregates mixed-sign decimal values accurately", async () => {
    const repositoryMock: FinancialRepositoryMock = {
      upsertMonthlyFact: jest.fn(async () => "unused"),
      listFactsForReconciliation: jest.fn(async () => [
        {
          employeeId: "emp-10",
          projectId: "prj-a",
          month: "2026-05",
          plannedMargin: 10.25,
          actualMargin: -2.5,
          marginVariance: -12.75
        },
        {
          employeeId: "emp-11",
          projectId: "prj-a",
          month: "2026-05",
          plannedMargin: -0.25,
          actualMargin: 4.75,
          marginVariance: 5
        },
        {
          employeeId: "emp-12",
          projectId: "prj-b",
          month: "2026-05",
          plannedMargin: 3.1,
          actualMargin: 1.1,
          marginVariance: -2
        }
      ]),
      listFinancialFacts: jest.fn(async () => [])
    };

    const service = new RecomputeService(repositoryMock);
    const report = await service.getReconciliationReport();

    expect(report.projectTotals).toEqual([
      {
        projectId: "prj-a",
        plannedMargin: 10,
        actualMargin: 2.25,
        marginVariance: -7.75
      },
      {
        projectId: "prj-b",
        plannedMargin: 3.1,
        actualMargin: 1.1,
        marginVariance: -2
      }
    ]);
    expect(report.totals).toEqual({
      plannedMargin: 13.1,
      actualMargin: 3.35,
      marginVariance: -9.75
    });
  });
});
