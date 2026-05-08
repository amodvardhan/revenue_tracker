import { buildMonthInput } from "../../src/modules/financial/domain/types";

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
});
