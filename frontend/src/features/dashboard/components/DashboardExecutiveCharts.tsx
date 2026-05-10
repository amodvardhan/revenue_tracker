import React, { useCallback, useMemo } from "react";
import { Box, Paper, Typography, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

import { useFormatMoney } from "../../../app/AppSettingsContext";
import { surfaceRadiusPx } from "../../../app/theme";
import type { MonthlyFinancialFact } from "../../financial/models/financial";
import {
  aggregateByProject,
  aggregateByTeamMember,
  aggregateRevenueByMonth,
  projectTotalsAsPieSlices
} from "../utils/dashboardAggregates";

interface DashboardExecutiveChartsProps {
  facts: MonthlyFinancialFact[];
}

export function DashboardExecutiveCharts({ facts }: DashboardExecutiveChartsProps): JSX.Element {
  const theme = useTheme();
  const { formatAmount, formatCompact } = useFormatMoney();

  const formatAxisAmount = useCallback(
    (value: number) => {
      const abs = Math.abs(value);
      if (abs >= 1000) {
        return formatCompact(value);
      }
      return formatAmount(value);
    },
    [formatAmount, formatCompact]
  );

  const formatTooltipAmount = useCallback((value: number) => formatAmount(value), [formatAmount]);

  const palette = useMemo(() => {
    const accent = theme.palette.secondary?.main ?? "#9c27b0";
    return [
      theme.palette.primary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      alpha(accent, 0.95),
      theme.palette.info.main,
      alpha(theme.palette.error.main, 0.85)
    ];
  }, [theme]);

  const monthly = useMemo(() => aggregateRevenueByMonth(facts), [facts]);
  const byProject = useMemo(() => aggregateByProject(facts), [facts]);
  const byTeam = useMemo(() => aggregateByTeamMember(facts).slice(0, 10), [facts]);
  const pieSlices = useMemo(() => projectTotalsAsPieSlices(byProject, 5), [byProject]);

  const chartPaperSx = {
    p: { xs: 2, sm: 2.5 },
    borderRadius: `${surfaceRadiusPx}px`,
    border: "1px solid",
    borderColor: "divider",
    bgcolor: alpha(theme.palette.background.paper, 1)
  } as const;

  const tooltipStyles = {
    backgroundColor: alpha(theme.palette.background.paper, 0.96),
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: 10,
    boxShadow: theme.shadows[4]
  };

  return (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: "-0.02em", mb: 0.5 }}>
        Executive overview
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5, maxWidth: 720 }}>
        Trends and distributions respect your current search filter. Figures mirror the detail grid below.
      </Typography>

      <Box
        sx={{
          display: "grid",
          gap: 2.5,
          gridTemplateColumns: { xs: "1fr", lg: "1fr 1fr" }
        }}
      >
        <Paper elevation={0} sx={{ ...chartPaperSx, gridColumn: { lg: "1 / -1" } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Revenue trend by month
          </Typography>
          <Box sx={{ width: "100%", height: 320 }}>
            <ResponsiveContainer>
              <AreaChart data={monthly} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillSigned" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={palette[0]} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={palette[0]} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="fillProjected" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={palette[1]} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={palette[1]} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.9)} vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke={theme.palette.text.secondary} />
                <YAxis
                  tickFormatter={formatAxisAmount}
                  tick={{ fontSize: 12 }}
                  stroke={theme.palette.text.secondary}
                  width={52}
                />
                <Tooltip
                  formatter={(value: number) => formatTooltipAmount(value)}
                  contentStyle={tooltipStyles}
                  labelFormatter={(label) => `Month ${label}`}
                />
                <Legend wrapperStyle={{ paddingTop: 12 }} />
                <Area
                  type="monotone"
                  dataKey="signedRevenue"
                  name="Signed revenue"
                  stackId="1"
                  stroke={palette[0]}
                  fill="url(#fillSigned)"
                />
                <Area
                  type="monotone"
                  dataKey="projectedRevenue"
                  name="Projected revenue"
                  stackId="1"
                  stroke={palette[1]}
                  fill="url(#fillProjected)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper elevation={0} sx={chartPaperSx}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Revenue share by project
          </Typography>
          <Box sx={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={pieSlices}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={54}
                  outerRadius={88}
                  paddingAngle={2}
                  label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {pieSlices.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => formatTooltipAmount(value)}
                  contentStyle={tooltipStyles}
                />
                <Legend wrapperStyle={{ paddingTop: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper elevation={0} sx={chartPaperSx}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Top team members by revenue
          </Typography>
          <Box sx={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart
                data={[...byTeam].reverse()}
                layout="vertical"
                margin={{ top: 4, right: 12, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.9)} horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={formatAxisAmount}
                  tick={{ fontSize: 12 }}
                  stroke={theme.palette.text.secondary}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={120}
                  tick={{ fontSize: 11 }}
                  stroke={theme.palette.text.secondary}
                />
                <Tooltip
                  formatter={(value: number) => formatTooltipAmount(value)}
                  contentStyle={tooltipStyles}
                />
                <Bar dataKey="totalRevenue" name="Total revenue" radius={[0, 6, 6, 0]}>
                  {byTeam.map((row, index) => (
                    <Cell key={row.id} fill={palette[index % palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>

        <Paper elevation={0} sx={{ ...chartPaperSx, gridColumn: { lg: "1 / -1" } }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
            Projects ranked by total revenue
          </Typography>
          <Box sx={{ width: "100%", height: Math.min(420, 56 + byProject.length * 36) }}>
            <ResponsiveContainer>
              <BarChart
                data={[...byProject].reverse()}
                layout="vertical"
                margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke={alpha(theme.palette.divider, 0.9)} horizontal={false} />
                <XAxis
                  type="number"
                  tickFormatter={formatAxisAmount}
                  tick={{ fontSize: 12 }}
                  stroke={theme.palette.text.secondary}
                />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={140}
                  tick={{ fontSize: 11 }}
                  stroke={theme.palette.text.secondary}
                />
                <Tooltip
                  formatter={(value: number) => formatTooltipAmount(value)}
                  contentStyle={tooltipStyles}
                />
                <Bar dataKey="totalRevenue" name="Total revenue" radius={[0, 6, 6, 0]} fill={palette[0]} />
              </BarChart>
            </ResponsiveContainer>
          </Box>
        </Paper>
      </Box>
    </Box>
  );
}
