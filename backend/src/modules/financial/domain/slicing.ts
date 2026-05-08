interface CostPerDayEvent {
  effectiveDate: string;
  costPerDay: number;
}

interface SliceMonthByEventsParams {
  yearMonth: string;
  startingCostPerDay: number;
  events: CostPerDayEvent[];
}

interface CostSlice {
  startDate: string;
  endDate: string;
  costPerDay: number;
  calendarDays: number;
}

const YEAR_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;
const ISO_DATE_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/;

export function sliceMonthByEvents(params: SliceMonthByEventsParams): CostSlice[] {
  const { year, month } = parseYearMonth(params.yearMonth);
  const lastDay = getLastDayOfMonth(year, month);
  const monthStart = Date.UTC(year, month - 1, 1);
  const monthEnd = Date.UTC(year, month - 1, lastDay);

  const deduplicatedByDate = new Map<number, CostPerDayEvent>();
  for (const event of params.events) {
    const eventDate = parseEffectiveDate(event.effectiveDate);
    const eventTimestamp = Date.UTC(eventDate.year, eventDate.month - 1, eventDate.day);

    if (eventTimestamp < monthStart || eventTimestamp > monthEnd) {
      throw new Error("effectiveDate must fall within target yearMonth");
    }

    // Explicit rule for duplicates: later input event for same date wins.
    deduplicatedByDate.set(eventTimestamp, event);
  }

  const monthEvents = Array.from(deduplicatedByDate.entries())
    .sort(([leftTimestamp], [rightTimestamp]) => leftTimestamp - rightTimestamp)
    .map(([, event]) => event);

  const slices: CostSlice[] = [];
  let currentStartDay = 1;
  let currentCostPerDay = params.startingCostPerDay;

  for (const event of monthEvents) {
    const eventDay = getDayFromDate(event.effectiveDate);

    if (eventDay > currentStartDay) {
      slices.push(buildSlice(params.yearMonth, currentStartDay, eventDay - 1, currentCostPerDay));
    }

    currentStartDay = eventDay;
    currentCostPerDay = event.costPerDay;
  }

  slices.push(buildSlice(params.yearMonth, currentStartDay, lastDay, currentCostPerDay));

  return slices;
}

function parseYearMonth(yearMonth: string): { year: number; month: number } {
  const match = YEAR_MONTH_PATTERN.exec(yearMonth);
  if (!match) {
    throw new Error("yearMonth must match YYYY-MM");
  }

  return {
    year: Number(match[1]),
    month: Number(match[2])
  };
}

function getLastDayOfMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseEffectiveDate(effectiveDate: string): { year: number; month: number; day: number } {
  const match = ISO_DATE_PATTERN.exec(effectiveDate);
  if (!match) {
    throw new Error("effectiveDate must match YYYY-MM-DD");
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const candidateDate = new Date(Date.UTC(year, month - 1, day));
  if (
    candidateDate.getUTCFullYear() !== year ||
    candidateDate.getUTCMonth() + 1 !== month ||
    candidateDate.getUTCDate() !== day
  ) {
    throw new Error("effectiveDate must be a real calendar date");
  }

  return { year, month, day };
}

function getDayFromDate(date: string): number {
  return parseEffectiveDate(date).day;
}

function buildSlice(yearMonth: string, startDay: number, endDay: number, costPerDay: number): CostSlice {
  return {
    startDate: `${yearMonth}-${to2Digits(startDay)}`,
    endDate: `${yearMonth}-${to2Digits(endDay)}`,
    costPerDay,
    calendarDays: endDay - startDay + 1
  };
}

function to2Digits(day: number): string {
  return day.toString().padStart(2, "0");
}
