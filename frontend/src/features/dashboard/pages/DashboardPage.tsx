import React from "react";
import { Box, Button, Paper, Typography } from "@mui/material";
import { useMemo, useState } from "react";

import { PageHeader } from "../../../app/PageHeader";
import { useSession } from "../../../app/SessionContext";
import { DashboardExecutiveCharts } from "../components/DashboardExecutiveCharts";
import { DashboardProjectMovers } from "../components/DashboardProjectMovers";
import { DashboardFilters } from "../components/DashboardFilters";
import { DashboardSummaryCards } from "../components/DashboardSummaryCards";
import { FinancialGrid } from "../../financial/components/FinancialGrid";
import { useFinancialFacts } from "../../financial/hooks/useFinancialFacts";

export function DashboardPage(): JSX.Element {
  const { session } = useSession();
  const { facts, isLoading, error } = useFinancialFacts();
  const [accountFilter, setAccountFilter] = useState("");

  const showProjectMovers =
    session?.role === "delivery_manager" || session?.role === "account_manager";

  const filteredFacts = useMemo(() => {
    const normalized = accountFilter.trim().toLowerCase();
    if (!normalized) {
      return facts;
    }
    return facts.filter((fact) => {
      const haystack = [
        fact.computeKey,
        fact.projectName,
        fact.clientName,
        fact.account,
        fact.accountDisplayName,
        fact.businessUnitCode,
        fact.businessUnitName,
        fact.teamMemberName,
        fact.employeeId
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalized);
    });
  }, [facts, accountFilter]);

  const totals = useMemo(() => {
    return filteredFacts.reduce(
      (accumulator, fact) => {
        accumulator.totalRevenue += fact.totalRevenue;
        accumulator.signedRevenue += fact.signedRevenue;
        accumulator.projectedRevenue += fact.projectedRevenue;
        accumulator.actualCost += fact.actualCost;
        accumulator.actualMargin += fact.actualMargin;
        accumulator.leakage += fact.plannedRevenue - fact.actualCost;
        return accumulator;
      },
      {
        totalRevenue: 0,
        signedRevenue: 0,
        projectedRevenue: 0,
        actualCost: 0,
        actualMargin: 0,
        leakage: 0
      }
    );
  }, [filteredFacts]);

  const filterActive = accountFilter.trim().length > 0;
  const filterHasNoMatches =
    !isLoading && !error && facts.length > 0 && filteredFacts.length === 0 && filterActive;

  return (
    <Box component="section">
      <PageHeader
        title="Dashboard"
        description="Portfolio totals, executive charts, then monthly rows by project and team member. Search narrows every section consistently."
      />
      <DashboardFilters account={accountFilter} onAccountChange={setAccountFilter} />
      {!isLoading && !error ? <DashboardSummaryCards totals={totals} /> : null}

      {!filterHasNoMatches && !isLoading && !error && showProjectMovers && filteredFacts.length > 0 ? (
        <DashboardProjectMovers facts={filteredFacts} />
      ) : null}

      {filterHasNoMatches ? (
        <Paper
          elevation={0}
          sx={{
            p: 4,
            mb: 2,
            textAlign: "center",
            borderStyle: "dashed"
          }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            No rows match your search
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 420, mx: "auto" }}>
            Nothing in the current dataset contains “{accountFilter.trim()}”. Try a shorter fragment or clear the
            filter to see everything again.
          </Typography>
          <Button variant="contained" onClick={() => setAccountFilter("")}>
            Clear search
          </Button>
        </Paper>
      ) : null}

      {!filterHasNoMatches && !isLoading && !error && filteredFacts.length > 0 ? (
        <DashboardExecutiveCharts facts={filteredFacts} />
      ) : null}

      {!filterHasNoMatches ? (
        <FinancialGrid facts={filteredFacts} isLoading={isLoading} error={error} />
      ) : null}
    </Box>
  );
}
