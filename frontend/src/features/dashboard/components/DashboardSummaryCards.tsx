import React from "react";
import { Box, Paper, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import { useFormatMoney } from "../../../app/AppSettingsContext";
import { surfaceRadiusPx } from "../../../app/theme";

interface DashboardTotals {
  totalRevenue: number;
  signedRevenue: number;
  projectedRevenue: number;
  actualCost: number;
  actualMargin: number;
  leakage: number;
}

interface DashboardSummaryCardsProps {
  totals: DashboardTotals;
}

export function DashboardSummaryCards({ totals }: DashboardSummaryCardsProps): JSX.Element {
  const { formatAmount } = useFormatMoney();

  const cards = [
    { label: "Total Revenue", value: totals.totalRevenue },
    { label: "Signed Revenue", value: totals.signedRevenue },
    { label: "Projected Revenue", value: totals.projectedRevenue },
    { label: "Actual Cost", value: totals.actualCost },
    { label: "Actual Margin", value: totals.actualMargin },
    { label: "Leakage", value: totals.leakage }
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          md: "repeat(3, minmax(0, 1fr))",
          lg: "repeat(6, minmax(0, 1fr))"
        },
        gap: 2,
        mb: 3
      }}
    >
      {cards.map((card) => (
        <Paper
          key={card.label}
          elevation={0}
          sx={{
            p: 2.5,
            borderRadius: `${surfaceRadiusPx}px`,
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
            "&:hover": {
              transform: "translateY(-1px)",
              boxShadow: (theme) => `0 8px 24px ${alpha(theme.palette.common.black, 0.06)}`
            }
          }}
        >
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, letterSpacing: "0.04em" }}>
            {card.label}
          </Typography>
          <Typography variant="h6" component="p" sx={{ mt: 1, mb: 0, fontWeight: 600, letterSpacing: "-0.02em" }}>
            {formatAmount(card.value)}
          </Typography>
        </Paper>
      ))}
    </Box>
  );
}
