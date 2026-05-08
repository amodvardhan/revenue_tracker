import { buildMonthInput } from "../../src/modules/financial/domain/buildMonthInput";
import { calculateMonthlyFact } from "../../src/modules/financial/domain/calculation";
import { sliceMonthByEvents } from "../../src/modules/financial/domain/slicing";

describe("buildMonthInput domain contract", () => {
  it("builds computeKey and expectedDays for a monthly allocation", () => {
    const result = buildMonthInput({
      employeeId: "emp-1",
      projectId: "prj-1",
      yearMonth: "2026-05",
      baselineDays: 20,
      allocationPercent: 50
    });

    expect(result.computeKey).toBe("emp-1|prj-1|2026-05");
    expect(result.expectedDays).toBe(10);
  });

  it("computes decimal allocation using close comparison", () => {
    const result = buildMonthInput({
      employeeId: "emp-1",
      projectId: "prj-1",
      yearMonth: "2026-05",
      baselineDays: 20,
      allocationPercent: 33.3333
    });

    expect(result.expectedDays).toBeCloseTo(6.66666, 5);
  });

  it("throws when allocationPercent is out of bounds", () => {
    expect(() =>
      buildMonthInput({
        employeeId: "emp-1",
        projectId: "prj-1",
        yearMonth: "2026-05",
        baselineDays: 20,
        allocationPercent: 150
      })
    ).toThrow("allocationPercent must be between 0 and 100");
  });

  it("throws when yearMonth format is malformed", () => {
    expect(() =>
      buildMonthInput({
        employeeId: "emp-1",
        projectId: "prj-1",
        yearMonth: "2026/05",
        baselineDays: 20,
        allocationPercent: 50
      })
    ).toThrow("yearMonth must match YYYY-MM");
  });

  it("throws when baselineDays drifts from fixed 20-day contract", () => {
    expect(() =>
      buildMonthInput({
        employeeId: "emp-1",
        projectId: "prj-1",
        yearMonth: "2026-05",
        baselineDays: 21,
        allocationPercent: 50
      })
    ).toThrow("baselineDays must be fixed at 20");
  });
});

describe("sliceMonthByEvents domain contract", () => {
  it("splits month when cost/day changes mid-month", () => {
    const result = sliceMonthByEvents({
      yearMonth: "2026-05",
      startingCostPerDay: 500,
      events: [{ effectiveDate: "2026-05-16", costPerDay: 700 }]
    });

    expect(result).toEqual([
      {
        startDate: "2026-05-01",
        endDate: "2026-05-15",
        costPerDay: 500,
        businessDays: 15
      },
      {
        startDate: "2026-05-16",
        endDate: "2026-05-31",
        costPerDay: 700,
        businessDays: 16
      }
    ]);
    expectContiguousCoverage(result, "2026-05");
  });

  it("returns one full-month slice when there are no events", () => {
    const result = sliceMonthByEvents({
      yearMonth: "2026-05",
      startingCostPerDay: 500,
      events: []
    });

    expect(result).toEqual([
      {
        startDate: "2026-05-01",
        endDate: "2026-05-31",
        costPerDay: 500,
        businessDays: 31
      }
    ]);
  });

  it("applies a day-1 event to the whole month", () => {
    const result = sliceMonthByEvents({
      yearMonth: "2026-05",
      startingCostPerDay: 500,
      events: [{ effectiveDate: "2026-05-01", costPerDay: 700 }]
    });

    expect(result).toEqual([
      {
        startDate: "2026-05-01",
        endDate: "2026-05-31",
        costPerDay: 700,
        businessDays: 31
      }
    ]);
  });

  it("creates a single-day tail slice for last-day event", () => {
    const result = sliceMonthByEvents({
      yearMonth: "2026-05",
      startingCostPerDay: 500,
      events: [{ effectiveDate: "2026-05-31", costPerDay: 700 }]
    });

    expect(result).toEqual([
      {
        startDate: "2026-05-01",
        endDate: "2026-05-30",
        costPerDay: 500,
        businessDays: 30
      },
      {
        startDate: "2026-05-31",
        endDate: "2026-05-31",
        costPerDay: 700,
        businessDays: 1
      }
    ]);
  });

  it("sorts unsorted events before slicing", () => {
    const result = sliceMonthByEvents({
      yearMonth: "2026-05",
      startingCostPerDay: 500,
      events: [
        { effectiveDate: "2026-05-20", costPerDay: 800 },
        { effectiveDate: "2026-05-10", costPerDay: 600 }
      ]
    });

    expect(result).toEqual([
      {
        startDate: "2026-05-01",
        endDate: "2026-05-09",
        costPerDay: 500,
        businessDays: 9
      },
      {
        startDate: "2026-05-10",
        endDate: "2026-05-19",
        costPerDay: 600,
        businessDays: 10
      },
      {
        startDate: "2026-05-20",
        endDate: "2026-05-31",
        costPerDay: 800,
        businessDays: 12
      }
    ]);
  });

  it("uses the later input event when two events share the same day", () => {
    const result = sliceMonthByEvents({
      yearMonth: "2026-05",
      startingCostPerDay: 500,
      events: [
        { effectiveDate: "2026-05-16", costPerDay: 700 },
        { effectiveDate: "2026-05-16", costPerDay: 750 }
      ]
    });

    expect(result).toEqual([
      {
        startDate: "2026-05-01",
        endDate: "2026-05-15",
        costPerDay: 500,
        businessDays: 15
      },
      {
        startDate: "2026-05-16",
        endDate: "2026-05-31",
        costPerDay: 750,
        businessDays: 16
      }
    ]);
  });

  it("rejects invalid effectiveDate format", () => {
    expect(() =>
      sliceMonthByEvents({
        yearMonth: "2026-05",
        startingCostPerDay: 500,
        events: [{ effectiveDate: "2026-5-16", costPerDay: 700 }]
      })
    ).toThrow("effectiveDate must match YYYY-MM-DD");
  });

  it("rejects impossible effectiveDate values", () => {
    expect(() =>
      sliceMonthByEvents({
        yearMonth: "2026-02",
        startingCostPerDay: 500,
        events: [{ effectiveDate: "2026-02-30", costPerDay: 700 }]
      })
    ).toThrow("effectiveDate must be a real calendar date");
  });

  it("rejects malformed yearMonth values", () => {
    expect(() =>
      sliceMonthByEvents({
        yearMonth: "2026/05",
        startingCostPerDay: 500,
        events: []
      })
    ).toThrow("yearMonth must match YYYY-MM");
  });

  it("handles leap-year February correctly", () => {
    const result = sliceMonthByEvents({
      yearMonth: "2024-02",
      startingCostPerDay: 500,
      events: [{ effectiveDate: "2024-02-29", costPerDay: 700 }]
    });

    expect(result).toEqual([
      {
        startDate: "2024-02-01",
        endDate: "2024-02-28",
        costPerDay: 500,
        businessDays: 28
      },
      {
        startDate: "2024-02-29",
        endDate: "2024-02-29",
        costPerDay: 700,
        businessDays: 1
      }
    ]);
  });

  it("rejects events that fall outside the target month", () => {
    expect(() =>
      sliceMonthByEvents({
        yearMonth: "2026-05",
        startingCostPerDay: 500,
        events: [{ effectiveDate: "2026-06-01", costPerDay: 700 }]
      })
    ).toThrow("effectiveDate must fall within target yearMonth");
  });

  it("produces contiguous coverage without gaps or overlaps", () => {
    const result = sliceMonthByEvents({
      yearMonth: "2026-05",
      startingCostPerDay: 500,
      events: [
        { effectiveDate: "2026-05-20", costPerDay: 800 },
        { effectiveDate: "2026-05-10", costPerDay: 600 },
        { effectiveDate: "2026-05-10", costPerDay: 650 }
      ]
    });

    expectContiguousCoverage(result, "2026-05");
  });
});

interface SliceLike {
  startDate: string;
  endDate: string;
  businessDays: number;
}

function expectContiguousCoverage(slices: SliceLike[], yearMonth: string): void {
  expect(slices.length).toBeGreaterThan(0);
  expect(slices[0].startDate).toBe(`${yearMonth}-01`);

  const expectedLastDay = daysInMonth(yearMonth);
  expect(slices[slices.length - 1].endDate).toBe(`${yearMonth}-${to2Digits(expectedLastDay)}`);

  for (let index = 1; index < slices.length; index += 1) {
    const prevEnd = getDay(slices[index - 1].endDate);
    const nextStart = getDay(slices[index].startDate);
    expect(nextStart).toBe(prevEnd + 1);
  }

  const coveredDays = slices.reduce((sum, slice) => sum + slice.businessDays, 0);
  expect(coveredDays).toBe(expectedLastDay);
}

function daysInMonth(yearMonth: string): number {
  const [year, month] = yearMonth.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function getDay(date: string): number {
  return Number(date.slice(8, 10));
}

function to2Digits(day: number): string {
  return day.toString().padStart(2, "0");
}

describe("calculateMonthlyFact domain contract", () => {
  it("computes planned/actual margin and variance", () => {
    const result = calculateMonthlyFact({
      expectedDays: 10,
      plannedBillRate: 1000,
      plannedCostPerDay: 500,
      actualRegularDays: 8,
      actualExtraDays: 2,
      billRate: 1000,
      extraDayRate: 1200,
      costPerDay: 500
    });

    expect(result.status).toBe("final");
    expect(result.plannedRevenue).toBe(10000);
    expect(result.plannedCost).toBe(5000);
    expect(result.actualRevenue).toBe(10400);
    expect(result.actualCost).toBe(5000);
    expect(result.plannedMargin).toBe(5000);
    expect(result.actualMargin).toBe(5400);
    expect(result.marginVariance).toBe(400);
  });

  it("uses base rate when extra-day rate missing and marks provisional", () => {
    const result = calculateMonthlyFact({
      expectedDays: 10,
      plannedBillRate: 1000,
      plannedCostPerDay: 500,
      actualRegularDays: 8,
      actualExtraDays: 2,
      billRate: 1000,
      extraDayRate: null,
      costPerDay: 500
    });

    expect(result.status).toBe("provisional");
    expect(result.actualRevenue).toBe(10000);
    expect(result.plannedMargin).toBe(5000);
    expect(result.actualMargin).toBe(5000);
    expect(result.marginVariance).toBe(0);
  });
});
