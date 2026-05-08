import React from "react";
import { FinancialGrid } from "../../financial/components/FinancialGrid";
import { useFinancialFacts } from "../../financial/hooks/useFinancialFacts";

export function DashboardPage(): JSX.Element {
  const { facts, isLoading, error } = useFinancialFacts();

  return (
    <section>
      <h1>Dashboard</h1>
      <FinancialGrid facts={facts} isLoading={isLoading} error={error} />
    </section>
  );
}
