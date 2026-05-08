import { buildMonthInput } from "../../src/modules/financial/domain/buildMonthInput";

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
