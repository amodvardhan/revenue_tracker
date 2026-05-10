import React, { useMemo } from "react";
import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { MonthlyFinancialFact } from "../../financial/models/financial";
import {
  aggregateProjectMarginVariance,
  topProjectGainers,
  topProjectLosers
} from "../utils/dashboardAggregates";

const MOVER_LIMIT = 5;

function formatAmount(value: number): string {
  return value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

interface DashboardProjectMoversProps {
  facts: MonthlyFinancialFact[];
}

export function DashboardProjectMovers({ facts }: DashboardProjectMoversProps): JSX.Element | null {
  const { gainers, losers } = useMemo(() => {
    const rows = aggregateProjectMarginVariance(facts);
    return {
      gainers: topProjectGainers(rows, MOVER_LIMIT),
      losers: topProjectLosers(rows, MOVER_LIMIT)
    };
  }, [facts]);

  if (facts.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 3 }} data-testid="dashboard-project-movers">
      <Typography variant="subtitle1" sx={{ fontWeight: 600, letterSpacing: "-0.02em", mb: 0.5 }}>
        Project movers
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
        Gainers are projects with positive total margin variance vs plan in this filtered view; losers are projects
        with negative total margin variance. Neutral (zero) projects are omitted from both lists.
      </Typography>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
          gap: 2
        }}
      >
        <MoverColumn
          title="Top gainers"
          subtitle="Positive margin variance (outperforming plan)"
          rows={gainers}
          variant="gain"
          emptyHint="No projects are ahead of plan on margin variance in this view."
        />
        <MoverColumn
          title="Top losers"
          subtitle="Negative margin variance (behind plan)"
          rows={losers}
          variant="loss"
          emptyHint="No projects are behind plan on margin variance in this view."
        />
      </Box>
    </Box>
  );
}

interface MoverColumnProps {
  title: string;
  subtitle: string;
  rows: Array<{ id: string; label: string; marginVarianceTotal: number }>;
  variant: "gain" | "loss";
  emptyHint: string;
}

function MoverColumn({ title, subtitle, rows, variant, emptyHint }: MoverColumnProps): JSX.Element {
  const accent =
    variant === "gain" ? { bg: alpha("#34c759", 0.08), bar: "#34c759" } : { bg: alpha("#ff3b30", 0.07), bar: "#ff3b30" };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.25,
        borderRadius: "14px",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: accent.bg
      }}
    >
      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.25 }}>
        {title}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.75 }}>
        {subtitle}
      </Typography>
      {rows.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          {emptyHint}
        </Typography>
      ) : (
        <Box component="ol" sx={{ m: 0, pl: 2.25, listStyle: "decimal" }}>
          {rows.map((row, index) => (
            <Box
              component="li"
              key={row.id}
              sx={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 2,
                py: 0.75,
                borderBottom:
                  index < rows.length - 1 ? (theme) => `1px solid ${alpha(theme.palette.divider, 0.6)}` : "none"
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500, minWidth: 0 }} noWrap title={row.label}>
                {row.label}
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  fontWeight: 600,
                  flexShrink: 0,
                  color: accent.bar,
                  fontVariantNumeric: "tabular-nums"
                }}
              >
                {row.marginVarianceTotal >= 0 ? "+" : ""}
                {formatAmount(row.marginVarianceTotal)}
              </Typography>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
}
