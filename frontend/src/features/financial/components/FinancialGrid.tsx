import React from "react";
import type { MonthlyFinancialFact, MonthlyFactStatus } from "../models/financial";

interface FinancialGridProps {
  facts: MonthlyFinancialFact[];
  isLoading: boolean;
  error: string | null;
}

function formatVariance(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}`;
}

function formatStatus(status: MonthlyFactStatus): string {
  if (status === "blocked") {
    return "Blocked";
  }

  if (status === "provisional") {
    return "Provisional";
  }

  return "Final";
}

export function FinancialGrid({ facts, isLoading, error }: FinancialGridProps): JSX.Element {
  if (isLoading) {
    return <p>Loading financial facts...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (facts.length === 0) {
    return <p>No monthly facts available.</p>;
  }

  return (
    <table aria-label="Monthly financial facts">
      <thead>
        <tr>
          <th>Month</th>
          <th>Status</th>
          <th>Margin Variance</th>
        </tr>
      </thead>
      <tbody>
        {facts.map((fact) => (
          <tr key={fact.month}>
            <td>{fact.month}</td>
            <td>{formatStatus(fact.status)}</td>
            <td>{formatVariance(fact.marginVariance)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
