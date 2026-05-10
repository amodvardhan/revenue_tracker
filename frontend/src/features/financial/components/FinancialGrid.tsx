import React from "react";
import {
  Box,
  CircularProgress,
  Paper,
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
    <TableContainer
      component={Paper}
      elevation={0}
      sx={{
        borderRadius: `${surfaceRadiusPx}px`,
        overflow: "hidden",
        "& .MuiTableCell-root": {
          borderColor: "divider"
        }
      }}
    >
      <Table size="small" stickyHeader aria-label="Monthly financial facts">
        <TableHead>
          <TableRow>
            <TableCell>Month</TableCell>
            <TableCell>Project</TableCell>
            <TableCell>Team member</TableCell>
            <TableCell align="right">Actual Cost</TableCell>
            <TableCell align="right">Signed Revenue</TableCell>
            <TableCell align="right">Projected Revenue</TableCell>
            <TableCell align="right">Total Revenue</TableCell>
            <TableCell align="right">Leakage</TableCell>
            <TableCell>Status</TableCell>
            <TableCell align="right">Margin Variance</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {facts.map((fact, index) => {
            const leakage = fact.plannedRevenue - fact.actualCost;
            const muted = index % 2 === 1;
            return (
              <TableRow
                key={fact.computeKey}
                sx={{
                  bgcolor: muted ? alpha("#000000", 0.02) : "transparent",
                  "&:last-child td": { borderBottom: 0 }
                }}
              >
                <TableCell sx={{ fontWeight: 500 }}>{fact.month}</TableCell>
                <TableCell sx={{ maxWidth: 200 }}>
                  <Typography variant="body2" noWrap title={fact.projectName}>
                    {fact.projectName}
                  </Typography>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    noWrap
                    title={[fact.account, fact.businessUnitCode].filter(Boolean).join(" · ")}
                  >
                    {[fact.account, fact.businessUnitCode].filter(Boolean).join(" · ")}
                  </Typography>
                </TableCell>
                <TableCell sx={{ maxWidth: 180 }}>
                  <Typography variant="body2" noWrap title={fact.teamMemberName}>
                    {fact.teamMemberName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {fact.employeeId}
                  </Typography>
                </TableCell>
                <TableCell align="right">{formatAmount(fact.actualCost)}</TableCell>
                <TableCell align="right">{formatAmount(fact.signedRevenue)}</TableCell>
                <TableCell align="right">{formatAmount(fact.projectedRevenue)}</TableCell>
                <TableCell align="right">{formatAmount(fact.totalRevenue)}</TableCell>
                <TableCell
                  align="right"
                  sx={{
                    fontWeight: 600,
                    color: leakage < 0 ? "error.main" : "success.main"
                  }}
                >
                  {formatSigned(leakage)}
                </TableCell>
                <TableCell>{formatStatus(fact.status)}</TableCell>
                <TableCell align="right">{formatSigned(fact.marginVariance)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
