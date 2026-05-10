export function enumerateMonths(startDate: Date, endDate: Date): string[] {
  const start = new Date(Date.UTC(startDate.getUTCFullYear(), startDate.getUTCMonth(), 1));
  const end = new Date(Date.UTC(endDate.getUTCFullYear(), endDate.getUTCMonth(), 1));
  const out: string[] = [];

  const cursor = new Date(start);
  while (cursor <= end) {
    out.push(`${cursor.getUTCFullYear()}-${String(cursor.getUTCMonth() + 1).padStart(2, "0")}`);
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return out;
}

export function resolveRateForMonth(
  baseRate: number,
  revisions: Array<{ effectiveDate: Date; newRate: number }>,
  month: string
): number {
  const monthEnd = new Date(`${month}-28T00:00:00.000Z`);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
  monthEnd.setUTCDate(0);
  let rate = baseRate;
  const sorted = [...revisions].sort((a, b) => a.effectiveDate.getTime() - b.effectiveDate.getTime());
  for (const revision of sorted) {
    if (revision.effectiveDate <= monthEnd) {
      rate = revision.newRate;
    }
  }
  return rate;
}

export function isMonthInRange(month: string, startDate: Date, endDate: Date): boolean {
  const monthStart = new Date(`${month}-01T00:00:00.000Z`);
  const monthEnd = new Date(`${month}-28T00:00:00.000Z`);
  monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
  monthEnd.setUTCDate(0);
  return monthEnd >= startDate && monthStart <= endDate;
}
