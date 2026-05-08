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
            status: "final",
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
        status: "final",
        plannedMargin: 1000,
        actualMargin: 1200,
        marginVariance: 200
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
});
