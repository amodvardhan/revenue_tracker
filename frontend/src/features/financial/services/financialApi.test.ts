import { afterEach, describe, expect, it, vi } from "vitest";

import { FinancialApiError, getFinancialFacts } from "./financialApi";

describe("getFinancialFacts", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("parses facts payload compatible with backend contract", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          {
            computeKey: "emp-1|prj-1|2026-05",
            month: "2026-05",
            employeeId: "emp-1",
            projectId: "prj-1",
            projectName: "Alpha",
            account: "ACME",
            clientName: "Acme",
            teamMemberName: "Jane",
            status: "final",
            signedRevenue: 1000,
            projectedRevenue: 200,
            totalRevenue: 1200,
            actualCost: 900,
            plannedRevenue: 1200,
            plannedMargin: 1000,
            actualMargin: 1200,
            marginVariance: 200
          }
        ]
      }))
    );

    await expect(getFinancialFacts()).resolves.toEqual([
      {
        computeKey: "emp-1|prj-1|2026-05",
        month: "2026-05",
        employeeId: "emp-1",
        projectId: "prj-1",
        projectName: "Alpha",
        account: "ACME",
        clientName: "Acme",
        teamMemberName: "Jane",
        status: "final",
        signedRevenue: 1000,
        projectedRevenue: 200,
        totalRevenue: 1200,
        actualCost: 900,
        plannedRevenue: 1200,
        plannedMargin: 1000,
        actualMargin: 1200,
        marginVariance: 200
      }
    ]);
  });

  it("accepts blocked status payloads", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          {
            computeKey: "emp-1|prj-1|2026-05",
            month: "2026-05",
            employeeId: "emp-1",
            projectId: "prj-1",
            projectName: "Alpha",
            account: "ACME",
            clientName: "Acme",
            teamMemberName: "Jane",
            status: "blocked",
            signedRevenue: 1000,
            projectedRevenue: 0,
            totalRevenue: 1000,
            actualCost: 0,
            plannedRevenue: 1000,
            plannedMargin: 1000,
            actualMargin: 0,
            marginVariance: -1000
          }
        ]
      }))
    );

    await expect(getFinancialFacts()).resolves.toEqual([
      {
        computeKey: "emp-1|prj-1|2026-05",
        month: "2026-05",
        employeeId: "emp-1",
        projectId: "prj-1",
        projectName: "Alpha",
        account: "ACME",
        clientName: "Acme",
        teamMemberName: "Jane",
        status: "blocked",
        signedRevenue: 1000,
        projectedRevenue: 0,
        totalRevenue: 1000,
        actualCost: 0,
        plannedRevenue: 1000,
        plannedMargin: 1000,
        actualMargin: 0,
        marginVariance: -1000
      }
    ]);
  });

  it("rejects payloads that do not match contract fields", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          {
            computeKey: "emp-1|prj-1|2026-05",
            month: "2026-05",
            status: "final",
            plannedMargin: 1000,
            actualMargin: 1200
          }
        ]
      }))
    );

    await expect(getFinancialFacts()).rejects.toEqual(
      expect.objectContaining<Partial<FinancialApiError>>({
        name: "FinancialApiError",
        kind: "validation_error"
      })
    );
  });

  it("rejects payloads that use unsupported status values", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: true,
        status: 200,
        json: async () => [
          {
            computeKey: "emp-1|prj-1|2026-05",
            month: "2026-05",
            employeeId: "emp-1",
            projectId: "prj-1",
            projectName: "Alpha",
            account: "ACME",
            clientName: "Acme",
            teamMemberName: "Jane",
            status: "in_review",
            signedRevenue: 1000,
            projectedRevenue: 0,
            totalRevenue: 1000,
            actualCost: 1000,
            plannedRevenue: 1000,
            plannedMargin: 1000,
            actualMargin: 1200,
            marginVariance: 200
          }
        ]
      }))
    );

    await expect(getFinancialFacts()).rejects.toEqual(
      expect.objectContaining<Partial<FinancialApiError>>({
        name: "FinancialApiError",
        kind: "validation_error"
      })
    );
  });
});
