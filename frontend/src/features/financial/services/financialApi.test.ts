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
            status: "blocked",
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
        status: "blocked",
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
            status: "in_review",
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
