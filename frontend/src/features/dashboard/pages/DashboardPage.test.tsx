import React from "react";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { AppSession } from "../../../app/session";
import { DashboardPage } from "./DashboardPage";
import { FinancialApiError, getFinancialFacts } from "../../financial/services/financialApi";

const sessionTestState = vi.hoisted(() => ({
  session: null as AppSession | null
}));

vi.mock("../../../app/SessionContext", () => ({
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useSession: () => ({
    get session() {
      return sessionTestState.session;
    },
    login: vi.fn(),
    logout: vi.fn().mockResolvedValue(undefined)
  })
}));

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
  sessionTestState.session = null;
  vi.clearAllMocks();
});

function renderDashboard(ui: React.ReactElement): ReturnType<typeof render> {
  return render(ui, {
    wrapper: ({ children }) => <MemoryRouter>{children}</MemoryRouter>
  });
}

const getFinancialFactsMock = vi.mocked(getFinancialFacts);

describe("DashboardPage", () => {
  beforeEach(() => {
    sessionTestState.session = null;
  });

  it("renders loading state while facts are pending", () => {
    const pending = deferred<never[]>();
    getFinancialFactsMock.mockReturnValueOnce(pending.promise);

    renderDashboard(<DashboardPage />);

    expect(screen.getByText("Loading financial facts...")).toBeInTheDocument();
  });

  it("renders success state with status and margin variance", async () => {
    sessionTestState.session = {
      token: "test-token",
      userId: "u1",
      role: "delivery_manager"
    };
    getFinancialFactsMock.mockResolvedValueOnce([
      {
        computeKey: "emp-1::proj-1::2026-01",
        month: "2026-01",
        employeeId: "emp-1",
        projectId: "proj-1",
        projectName: "Alpha",
        account: "ACME",
        clientName: "Acme Corp",
        teamMemberName: "Jane Doe",
        status: "final",
        signedRevenue: 2000,
        projectedRevenue: 0,
        totalRevenue: 2000,
        actualCost: 1800,
        plannedRevenue: 2000,
        plannedMargin: 1000,
        actualMargin: 1200,
        marginVariance: 200
      }
    ]);

    renderDashboard(<DashboardPage />);

    expect(await screen.findByText("Final")).toBeInTheDocument();
    expect(screen.getAllByText("Total Revenue").length).toBeGreaterThan(0);
    expect(screen.getAllByText("+200.00").length).toBeGreaterThan(0);
    expect(screen.getByText("Project movers")).toBeInTheDocument();
    expect(screen.getByTestId("dashboard-project-movers")).toContainHTML("Alpha");
    expect(
      screen.getByText("No projects are behind plan on margin variance in this view.")
    ).toBeInTheDocument();
  });

  it("renders error state for non-2xx failures from service", async () => {
    getFinancialFactsMock.mockRejectedValueOnce(
      new FinancialApiError("http_error", "Financial facts request failed with status 503")
    );

    renderDashboard(<DashboardPage />);

    expect(await screen.findByText("Financial facts request failed with status 503")).toBeInTheDocument();
  });

  it("renders error state for malformed payload failures from service", async () => {
    getFinancialFactsMock.mockRejectedValueOnce(
      new FinancialApiError("validation_error", "Financial facts response has invalid shape")
    );

    renderDashboard(<DashboardPage />);

    expect(await screen.findByText("Financial facts response has invalid shape")).toBeInTheDocument();
  });
});
