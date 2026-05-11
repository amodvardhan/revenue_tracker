import React from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { useFormatMoney } from "../../../app/AppSettingsContext";
import { surfaceRadiusPx } from "../../../app/theme";
import { friendlyError } from "../../../lib/friendlyError";
import type { MonthlyFinancialFact, MonthlyFactStatus } from "../models/financial";
import type { FinancialApiError } from "../services/financialApi";

interface FinancialGridProps {
  facts: MonthlyFinancialFact[];
  isLoading: boolean;
  error: FinancialApiError | null;
}

const numericCellSx = {
  fontVariantNumeric: "tabular-nums" as const,
  whiteSpace: "nowrap" as const
};

function formatStatus(status: MonthlyFactStatus): string {
  if (status === "blocked") {
    return "Blocked";
  }

  if (status === "provisional") {
    return "Provisional";
  }

  return "Final";
}

function statusChipProps(status: MonthlyFactStatus): { color: "default" | "warning" | "success"; variant: "filled" | "outlined" } {
  if (status === "blocked") {
    return { color: "default", variant: "outlined" };
  }
  if (status === "provisional") {
    return { color: "warning", variant: "filled" };
  }
  return { color: "success", variant: "outlined" };
}

export function FinancialGrid({ facts, isLoading, error }: FinancialGridProps): JSX.Element {
  const { formatAmount, formatSigned } = useFormatMoney();

  if (isLoading) {
    return (
      <Box sx={{ display: "flex", alignItems: "center", gap: 2, py: 6, justifyContent: "center" }}>
        <CircularProgress size={22} thickness={5} />
        <Typography color="text.secondary">Loading financial facts...</Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Paper elevation={0} sx={{ p: 3, borderStyle: "dashed" }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
          Couldn’t load figures
        </Typography>
        <Typography color="error" variant="body2">
          {friendlyError(error.message)}
        </Typography>
      </Paper>
    );
  }

  if (facts.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: 5, textAlign: "center", maxWidth: 480, mx: "auto" }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
          No monthly facts yet
        </Typography>
        <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.6 }}>
          Once attendance and assignments exist in the system, recomputed totals will appear here automatically.
        </Typography>
      </Paper>
    );
  }

  return (
    <Stack spacing={1.5} sx={{ mt: 1 }}>
      <Box sx={{ px: { xs: 0, sm: 0.5 } }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, letterSpacing: "-0.02em" }}>
          Monthly performance
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25, maxWidth: 560 }}>
          Scroll horizontally on narrow screens—amount columns stay aligned. Status uses color; margin variance highlights plan vs. actual.
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        elevation={0}
        sx={{
          borderRadius: `${surfaceRadiusPx}px`,
          border: 1,
          borderColor: "divider",
          overflow: "auto",
          maxWidth: "100%",
          WebkitOverflowScrolling: "touch",
          "& .MuiTableCell-root": {
            borderColor: "divider"
          }
        }}
      >
        <Table
          size="small"
          stickyHeader
          aria-label="Monthly financial facts"
          sx={{
            minWidth: 1040,
            tableLayout: "fixed",
            "& .MuiTableCell-head": {
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
              fontWeight: 700,
              fontSize: "0.75rem",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              whiteSpace: "nowrap"
            }
          }}
        >
          <colgroup>
            <col style={{ width: "7%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "14%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "9%" }} />
            <col style={{ width: "10%" }} />
            <col style={{ width: "10%" }} />
          </colgroup>
          <TableHead>
            <TableRow>
              <TableCell>Month</TableCell>
              <TableCell>Project</TableCell>
              <TableCell>Team</TableCell>
              <TableCell align="right">Cost</TableCell>
              <TableCell align="right">Signed</TableCell>
              <TableCell align="right">Projected</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Leakage</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Margin Δ</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {facts.map((fact, index) => {
              const leakage = fact.plannedRevenue - fact.actualCost;
              const muted = index % 2 === 1;
              const st = statusChipProps(fact.status);
              return (
                <TableRow
                  key={fact.computeKey}
                  sx={{
                    bgcolor: muted ? alpha("#000000", 0.025) : "transparent",
                    "&:last-child td": { borderBottom: 0 },
                    transition: "background-color 0.15s ease"
                  }}
                >
                  <TableCell sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>{fact.month}</TableCell>
                  <TableCell sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.35 }} noWrap title={fact.projectName}>
                      {fact.projectName}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      display="block"
                      noWrap
                      title={[fact.account, fact.businessUnitCode].filter(Boolean).join(" · ")}
                    >
                      {[fact.account, fact.businessUnitCode].filter(Boolean).join(" · ")}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500 }} noWrap title={fact.teamMemberName}>
                      {fact.teamMemberName}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" display="block" noWrap title={fact.employeeId}>
                      {fact.employeeId}
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={numericCellSx}>
                    {formatAmount(fact.actualCost)}
                  </TableCell>
                  <TableCell align="right" sx={numericCellSx}>
                    {formatAmount(fact.signedRevenue)}
                  </TableCell>
                  <TableCell align="right" sx={numericCellSx}>
                    {formatAmount(fact.projectedRevenue)}
                  </TableCell>
                  <TableCell align="right" sx={{ ...numericCellSx, fontWeight: 600 }}>
                    {formatAmount(fact.totalRevenue)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      ...numericCellSx,
                      fontWeight: 600,
                      color: leakage < 0 ? "error.main" : "success.main"
                    }}
                  >
                    {formatSigned(leakage)}
                  </TableCell>
                  <TableCell sx={{ py: 1 }}>
                    <Chip label={formatStatus(fact.status)} size="small" {...st} sx={{ fontWeight: 600 }} />
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      ...numericCellSx,
                      fontWeight: 600,
                      minWidth: "7.5rem",
                      pr: 2,
                      color:
                        fact.marginVariance < 0 ? "error.main" : fact.marginVariance > 0 ? "success.main" : "text.primary"
                    }}
                  >
                    {formatSigned(fact.marginVariance)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
    </Stack>
  );
}
