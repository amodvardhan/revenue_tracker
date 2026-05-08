import React from "react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardPage } from "./DashboardPage";
import { FinancialApiError, getFinancialFacts } from "../../financial/services/financialApi";

vi.mock("../../financial/services/financialApi", () => ({
  FinancialApiError: class FinancialApiError extends Error {
    kind: string;

    constructor(kind: string, message: string) {
      super(message);
      this.name = "FinancialApiError";
      this.kind = kind;
    }
  },
  getFinancialFacts: vi.fn()
}));

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

afterEach(() => {
  vi.clearAllMocks();
});

const getFinancialFactsMock = vi.mocked(getFinancialFacts);

describe("DashboardPage", () => {
  it("renders loading state while facts are pending", () => {
    const pending = deferred<never[]>();
    getFinancialFactsMock.mockReturnValueOnce(pending.promise);

    render(<DashboardPage />);

    expect(screen.getByText("Loading financial facts...")).toBeInTheDocument();
  });

  it("renders success state with status and margin variance", async () => {
    getFinancialFactsMock.mockResolvedValueOnce([
      {
        computeKey: "emp-1::proj-1::2026-01",
        month: "2026-01",
        status: "final",
        plannedMargin: 1000,
        actualMargin: 1200,
        marginVariance: 200
      }
    ]);

    render(<DashboardPage />);

    expect(await screen.findByText("Final")).toBeInTheDocument();
    expect(screen.getByText("+200.00")).toBeInTheDocument();
  });

  it("renders error state for non-2xx failures from service", async () => {
    getFinancialFactsMock.mockRejectedValueOnce(
      new FinancialApiError("http_error", "Financial facts request failed with status 503")
    );

    render(<DashboardPage />);

    expect(await screen.findByText("Financial facts request failed with status 503")).toBeInTheDocument();
  });

  it("renders error state for malformed payload failures from service", async () => {
    getFinancialFactsMock.mockRejectedValueOnce(
      new FinancialApiError("validation_error", "Financial facts response has invalid shape")
    );

    render(<DashboardPage />);

    expect(await screen.findByText("Financial facts response has invalid shape")).toBeInTheDocument();
  });
});
