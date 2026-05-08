import { RecomputeService } from "../../src/modules/financial/service/recompute.service";

describe("reconciliation rollups", () => {
  it("keeps project total equal to sum of employee-month facts", async () => {
    const listFactsForReconciliation = jest.fn(async () => {
      return [
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
    });

    const service = new RecomputeService({
      upsertMonthlyFact: jest.fn(),
      listFactsForReconciliation
    } as never);

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
});
