import type { MonthlyFinancialFact } from "../../financial/models/financial";

export interface RevenueByMonthRow {
  month: string;
  signedRevenue: number;
  projectedRevenue: number;
  totalRevenue: number;
}

export interface NamedTotalRow {
  id: string;
  label: string;
  totalRevenue: number;
  actualMargin: number;
}

/** Chronological monthly sums for trend charts. */
export function aggregateRevenueByMonth(facts: MonthlyFinancialFact[]): RevenueByMonthRow[] {
  const map = new Map<string, { signedRevenue: number; projectedRevenue: number; totalRevenue: number }>();
  for (const fact of facts) {
    const bucket =
      map.get(fact.month) ?? { signedRevenue: 0, projectedRevenue: 0, totalRevenue: 0 };
    bucket.signedRevenue += fact.signedRevenue;
    bucket.projectedRevenue += fact.projectedRevenue;
    bucket.totalRevenue += fact.totalRevenue;
    map.set(fact.month, bucket);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([month, values]) => ({ month, ...values }));
}

/** One row per project (aggregated across months). */
export function aggregateByProject(facts: MonthlyFinancialFact[]): NamedTotalRow[] {
  const map = new Map<string, { label: string; totalRevenue: number; actualMargin: number }>();
  for (const fact of facts) {
    const label = fact.projectName.trim() || fact.projectId;
    const bucket = map.get(fact.projectId) ?? { label, totalRevenue: 0, actualMargin: 0 };
    bucket.totalRevenue += fact.totalRevenue;
    bucket.actualMargin += fact.actualMargin;
    map.set(fact.projectId, bucket);
  }
  return [...map.entries()]
    .map(([id, row]) => ({ id, label: row.label, totalRevenue: row.totalRevenue, actualMargin: row.actualMargin }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

/** One row per team member (aggregated across projects and months). */
export function aggregateByTeamMember(facts: MonthlyFinancialFact[]): NamedTotalRow[] {
  const map = new Map<string, { label: string; totalRevenue: number; actualMargin: number }>();
  for (const fact of facts) {
    const label = fact.teamMemberName.trim() || fact.employeeId;
    const bucket = map.get(fact.employeeId) ?? { label, totalRevenue: 0, actualMargin: 0 };
    bucket.totalRevenue += fact.totalRevenue;
    bucket.actualMargin += fact.actualMargin;
    map.set(fact.employeeId, bucket);
  }
  return [...map.entries()]
    .map(([id, row]) => ({ id, label: row.label, totalRevenue: row.totalRevenue, actualMargin: row.actualMargin }))
    .sort((a, b) => b.totalRevenue - a.totalRevenue);
}

export interface PieSlice {
  name: string;
  value: number;
}

/** Collapse long tails into “Other” for pie readability. */
export function projectTotalsAsPieSlices(rows: NamedTotalRow[], maxNamed: number): PieSlice[] {
  if (rows.length <= maxNamed) {
    return rows.map((row) => ({ name: row.label, value: row.totalRevenue }));
  }
  const head = rows.slice(0, maxNamed);
  const tail = rows.slice(maxNamed);
  const otherValue = tail.reduce((sum, row) => sum + row.totalRevenue, 0);
  const slices: PieSlice[] = head.map((row) => ({ name: row.label, value: row.totalRevenue }));
  if (otherValue > 0) {
    slices.push({ name: "Other projects", value: otherValue });
  }
  return slices;
}

/** Per-project totals for margin variance (actual vs planned margin drift across rows). */
export interface ProjectMarginVarianceRow {
  id: string;
  label: string;
  marginVarianceTotal: number;
}

export function aggregateProjectMarginVariance(facts: MonthlyFinancialFact[]): ProjectMarginVarianceRow[] {
  const map = new Map<string, { label: string; marginVarianceTotal: number }>();
  for (const fact of facts) {
    const label = fact.projectName.trim() || fact.projectId;
    const bucket = map.get(fact.projectId) ?? { label, marginVarianceTotal: 0 };
    bucket.marginVarianceTotal += fact.marginVariance;
    map.set(fact.projectId, bucket);
  }
  return [...map.entries()].map(([id, row]) => ({
    id,
    label: row.label,
    marginVarianceTotal: row.marginVarianceTotal
  }));
}

/** Projects with positive summed variance only — best vs plan first (no overlap with losers). */
export function topProjectGainers(rows: ProjectMarginVarianceRow[], limit: number): ProjectMarginVarianceRow[] {
  return rows
    .filter((row) => row.marginVarianceTotal > 0)
    .sort((a, b) =>
      b.marginVarianceTotal !== a.marginVarianceTotal
        ? b.marginVarianceTotal - a.marginVarianceTotal
        : a.label.localeCompare(b.label)
    )
    .slice(0, limit);
}

/** Projects with negative summed variance only — worst vs plan first. */
export function topProjectLosers(rows: ProjectMarginVarianceRow[], limit: number): ProjectMarginVarianceRow[] {
  return rows
    .filter((row) => row.marginVarianceTotal < 0)
    .sort((a, b) =>
      a.marginVarianceTotal !== b.marginVarianceTotal
        ? a.marginVarianceTotal - b.marginVarianceTotal
        : a.label.localeCompare(b.label)
    )
    .slice(0, limit);
}
