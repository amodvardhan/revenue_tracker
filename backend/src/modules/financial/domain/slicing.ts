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
  businessDays: number;
}

const YEAR_MONTH_PATTERN = /^(\d{4})-(0[1-9]|1[0-2])$/;

export function sliceMonthByEvents(params: SliceMonthByEventsParams): CostSlice[] {
  const { year, month } = parseYearMonth(params.yearMonth);
  const lastDay = getLastDayOfMonth(year, month);
  const monthStartDate = `${params.yearMonth}-01`;
  const monthEndDate = `${params.yearMonth}-${to2Digits(lastDay)}`;

  const monthEvents = params.events
    .filter((event) => event.effectiveDate >= monthStartDate && event.effectiveDate <= monthEndDate)
    .sort((left, right) => left.effectiveDate.localeCompare(right.effectiveDate));

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

function getDayFromDate(date: string): number {
  return Number(date.slice(8, 10));
}

function buildSlice(yearMonth: string, startDay: number, endDay: number, costPerDay: number): CostSlice {
  return {
    startDate: `${yearMonth}-${to2Digits(startDay)}`,
    endDate: `${yearMonth}-${to2Digits(endDay)}`,
    costPerDay,
    businessDays: endDay - startDay + 1
  };
}

function to2Digits(day: number): string {
  return day.toString().padStart(2, "0");
}
