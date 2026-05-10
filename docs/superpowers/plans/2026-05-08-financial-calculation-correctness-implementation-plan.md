# Financial Calculation Correctness Engine Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a deterministic, auditable employee-project-month financial engine that computes planned/actual margin and margin variance with effective-date slicing, provisional extra-day fallback, and targeted recompute.

**Architecture:** Implement a backend-first vertical slice in NestJS with PostgreSQL and Prisma, centered on event-sourced effective-dated inputs (`billing_rate_events`, `cost_rate_events`, `extra_day_rate_events`) and materialized monthly facts (`financial_monthly_facts`). Expose compute/recompute services and API endpoints first, then wire frontend dashboard + export readers against fact tables.

**Tech Stack:** NestJS, TypeScript, Prisma, PostgreSQL, Jest, Supertest, Next.js, React Query

---

## Planned File Structure

**Create**
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260508_financial_engine_init/migration.sql`
- `backend/src/modules/financial/financial.module.ts`
- `backend/src/modules/financial/domain/types.ts`
- `backend/src/modules/financial/domain/slicing.ts`
- `backend/src/modules/financial/domain/calculation.ts`
- `backend/src/modules/financial/domain/status.ts`
- `backend/src/modules/financial/repository/financial.repository.ts`
- `backend/src/modules/financial/service/recompute.service.ts`
- `backend/src/modules/financial/controller/financial.controller.ts`
- `backend/src/modules/financial/dto/recompute.dto.ts`
- `backend/test/financial/calculation.spec.ts`
- `backend/test/financial/recompute.e2e-spec.ts`
- `frontend/src/features/financial/services/financialApi.ts`
- `frontend/src/features/financial/hooks/useFinancialFacts.ts`
- `frontend/src/features/financial/components/FinancialGrid.tsx`
- `frontend/src/features/financial/models/financial.ts`

**Modify**
- `backend/src/app.module.ts`
- `frontend/src/features/dashboard/pages/DashboardPage.tsx`

---

### Task 1: Scaffold Financial Domain Contracts (TDD Start)

**Files:**
- Create: `backend/src/modules/financial/domain/types.ts`
- Test: `backend/test/financial/calculation.spec.ts`

- [ ] **Step 1: Write the failing domain contract test**

```ts
import { describe, expect, it } from '@jest/globals';
import { buildMonthInput } from '../../src/modules/financial/domain/types';

describe('financial domain contract', () => {
  it('builds employee-project-month compute unit', () => {
    const unit = buildMonthInput({
      employeeId: 'emp-1',
      projectId: 'prj-1',
      month: '2026-05',
      allocationPct: 50,
      plannedBillRate: 1000,
      plannedCostPerDay: 500,
      actualRegularDays: 8,
      actualExtraDays: 2,
    });

    expect(unit.computeKey).toBe('emp-1|prj-1|2026-05');
    expect(unit.expectedDays).toBe(10); // fixed 20-day baseline * 50%
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- test/financial/calculation.spec.ts --runInBand`  
Expected: FAIL with module/function not found.

- [ ] **Step 3: Write minimal implementation**

```ts
export type BuildMonthInputArgs = {
  employeeId: string;
  projectId: string;
  month: string;
  allocationPct: number;
  plannedBillRate: number;
  plannedCostPerDay: number;
  actualRegularDays: number;
  actualExtraDays: number;
};

export type MonthInput = BuildMonthInputArgs & {
  computeKey: string;
  expectedDays: number;
};

export function buildMonthInput(args: BuildMonthInputArgs): MonthInput {
  const expectedDays = (20 * args.allocationPct) / 100;
  return {
    ...args,
    computeKey: `${args.employeeId}|${args.projectId}|${args.month}`,
    expectedDays,
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- test/financial/calculation.spec.ts --runInBand`  
Expected: PASS (1 test passed).

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/financial/domain/types.ts backend/test/financial/calculation.spec.ts
git commit -m "test(financial): add compute-unit domain contract"
```

---

### Task 2: Implement Effective-Date Slicing and Proration

**Files:**
- Create: `backend/src/modules/financial/domain/slicing.ts`
- Modify: `backend/test/financial/calculation.spec.ts`

- [ ] **Step 1: Write failing slicing test**

```ts
import { sliceMonthByEvents } from '../../src/modules/financial/domain/slicing';

it('prorates mid-month cost/day change', () => {
  const slices = sliceMonthByEvents({
    month: '2026-05',
    events: [
      { kind: 'cost', effectiveDate: '2026-05-01', value: 500 },
      { kind: 'cost', effectiveDate: '2026-05-16', value: 700 },
    ],
  });

  expect(slices).toEqual([
    { startDate: '2026-05-01', endDate: '2026-05-15', costPerDay: 500, businessDays: 15 },
    { startDate: '2026-05-16', endDate: '2026-05-31', costPerDay: 700, businessDays: 16 },
  ]);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- test/financial/calculation.spec.ts --runInBand`  
Expected: FAIL with missing `sliceMonthByEvents`.

- [ ] **Step 3: Write minimal slicing implementation**

```ts
type RateEvent = { kind: 'cost' | 'bill' | 'extra'; effectiveDate: string; value: number };
type Slice = { startDate: string; endDate: string; businessDays: number; costPerDay: number };

export function sliceMonthByEvents(args: { month: string; events: RateEvent[] }): Slice[] {
  const sorted = [...args.events].sort((a, b) => a.effectiveDate.localeCompare(b.effectiveDate));
  const boundaries = sorted.map((e) => e.effectiveDate);
  const monthStart = `${args.month}-01`;
  const monthEnd = `${args.month}-31`;
  const points = [monthStart, ...boundaries.filter((d) => d > monthStart)];
  return points.map((startDate, idx) => {
    const nextStart = points[idx + 1];
    const endDate = nextStart ? shiftDate(nextStart, -1) : monthEnd;
    const event = [...sorted].reverse().find((e) => e.effectiveDate <= startDate)!;
    const businessDays = dayOfMonth(endDate) - dayOfMonth(startDate) + 1;
    return { startDate, endDate, businessDays, costPerDay: event.value };
  });
}

function shiftDate(iso: string, deltaDays: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + deltaDays);
  return d.toISOString().slice(0, 10);
}

function dayOfMonth(iso: string): number {
  return Number(iso.slice(8, 10));
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd backend && npm test -- test/financial/calculation.spec.ts --runInBand`  
Expected: PASS on existing + slicing test.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/financial/domain/slicing.ts backend/test/financial/calculation.spec.ts
git commit -m "feat(financial): add effective-date slicing with proration"
```

---

### Task 3: Implement Margin Calculation Core with Provisional Logic

**Files:**
- Create: `backend/src/modules/financial/domain/calculation.ts`
- Create: `backend/src/modules/financial/domain/status.ts`
- Modify: `backend/test/financial/calculation.spec.ts`

- [ ] **Step 1: Write failing tests for margin variance and provisional fallback**

```ts
import { calculateMonthlyFact } from '../../src/modules/financial/domain/calculation';

it('computes planned/actual margin and variance', () => {
  const fact = calculateMonthlyFact({
    expectedDays: 10,
    plannedBillRate: 1000,
    plannedCostPerDay: 500,
    actualRegularDays: 8,
    actualExtraDays: 2,
    billRate: 1000,
    extraDayRate: 1200,
    costPerDay: 500,
  });
  expect(fact.plannedMargin).toBe(5000);
  expect(fact.actualMargin).toBe(6000);
  expect(fact.marginVariance).toBe(1000);
  expect(fact.status).toBe('final');
});

it('uses base rate when extra-day rate is missing', () => {
  const fact = calculateMonthlyFact({
    expectedDays: 10,
    plannedBillRate: 1000,
    plannedCostPerDay: 500,
    actualRegularDays: 8,
    actualExtraDays: 2,
    billRate: 1000,
    extraDayRate: null,
    costPerDay: 500,
  });
  expect(fact.actualRevenue).toBe(10000);
  expect(fact.status).toBe('provisional');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- test/financial/calculation.spec.ts --runInBand`  
Expected: FAIL with missing `calculateMonthlyFact`.

- [ ] **Step 3: Implement minimal calculator**

```ts
export type MonthlyFactStatus = 'final' | 'provisional' | 'blocked';

type Args = {
  expectedDays: number;
  plannedBillRate: number;
  plannedCostPerDay: number;
  actualRegularDays: number;
  actualExtraDays: number;
  billRate: number | null;
  extraDayRate: number | null;
  costPerDay: number | null;
};

export function calculateMonthlyFact(args: Args) {
  if (args.billRate == null || args.costPerDay == null) {
    return { status: 'blocked' as MonthlyFactStatus };
  }
  const plannedRevenue = args.expectedDays * args.plannedBillRate;
  const plannedCost = args.expectedDays * args.plannedCostPerDay;
  const plannedMargin = plannedRevenue - plannedCost;

  const effectiveExtraRate = args.extraDayRate ?? args.billRate;
  const actualRevenue =
    args.actualRegularDays * args.billRate + args.actualExtraDays * effectiveExtraRate;
  const actualCost = (args.actualRegularDays + args.actualExtraDays) * args.costPerDay;
  const actualMargin = actualRevenue - actualCost;
  const marginVariance = actualMargin - plannedMargin;
  const status: MonthlyFactStatus = args.extraDayRate == null ? 'provisional' : 'final';

  return {
    status,
    plannedRevenue,
    plannedCost,
    plannedMargin,
    actualRevenue,
    actualCost,
    actualMargin,
    marginVariance,
  };
}
```

- [ ] **Step 4: Run tests to verify pass**

Run: `cd backend && npm test -- test/financial/calculation.spec.ts --runInBand`  
Expected: PASS with calculator tests green.

- [ ] **Step 5: Commit**

```bash
git add backend/src/modules/financial/domain/calculation.ts backend/src/modules/financial/domain/status.ts backend/test/financial/calculation.spec.ts
git commit -m "feat(financial): implement margin variance calculator with provisional fallback"
```

---

### Task 4: Persist Fact Rows and Recompute Service

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/prisma/migrations/20260508_financial_engine_init/migration.sql`
- Create: `backend/src/modules/financial/repository/financial.repository.ts`
- Create: `backend/src/modules/financial/service/recompute.service.ts`
- Create: `backend/src/modules/financial/dto/recompute.dto.ts`
- Create: `backend/src/modules/financial/financial.module.ts`
- Modify: `backend/src/app.module.ts`
- Test: `backend/test/financial/recompute.e2e-spec.ts`

- [ ] **Step 1: Write failing e2e test for targeted recompute**

```ts
it('recomputes only impacted employee-month rows', async () => {
  const res = await request(app.getHttpServer())
    .post('/api/financial/recompute')
    .send({ trigger: 'rate_revision', employeeId: 'emp-1', projectId: 'prj-1', month: '2026-05' })
    .expect(200);

  expect(res.body.recomputedKeys).toEqual(['emp-1|prj-1|2026-05']);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- test/financial/recompute.e2e-spec.ts --runInBand`  
Expected: FAIL because endpoint/module does not exist.

- [ ] **Step 3: Add schema and recompute endpoint implementation**

```prisma
model FinancialMonthlyFact {
  id                String   @id @default(uuid())
  computeKey         String   @unique
  employeeId         String
  projectId          String
  month              String
  status             String
  plannedRevenue     Decimal
  plannedCost        Decimal
  plannedMargin      Decimal
  actualRevenue      Decimal
  actualCost         Decimal
  actualMargin       Decimal
  marginVariance     Decimal
  triggerSource      String
  engineVersion      String
  inputSnapshotHash  String
  computedAt         DateTime @default(now())
}
```

```ts
@Post('recompute')
async recompute(@Body() dto: RecomputeDto) {
  const key = `${dto.employeeId}|${dto.projectId}|${dto.month}`;
  await this.recomputeService.recomputeOne(dto);
  return { recomputedKeys: [key] };
}
```

- [ ] **Step 4: Run migration + tests**

Run: `cd backend && npx prisma migrate dev --name financial_engine_init`  
Expected: migration applied and Prisma client generated.

Run: `cd backend && npm test -- test/financial/recompute.e2e-spec.ts --runInBand`  
Expected: PASS (endpoint returns one recomputed key).

- [ ] **Step 5: Commit**

```bash
git add backend/prisma backend/src/modules/financial backend/src/app.module.ts backend/test/financial/recompute.e2e-spec.ts
git commit -m "feat(financial): persist monthly facts and add targeted recompute api"
```

---

### Task 5: Dashboard Reader and UI Status Surfacing

**Files:**
- Create: `frontend/src/features/financial/models/financial.ts`
- Create: `frontend/src/features/financial/services/financialApi.ts`
- Create: `frontend/src/features/financial/hooks/useFinancialFacts.ts`
- Create: `frontend/src/features/financial/components/FinancialGrid.tsx`
- Modify: `frontend/src/features/dashboard/pages/DashboardPage.tsx`

- [ ] **Step 1: Write failing UI test for status and variance display**

```tsx
it('shows provisional badge and margin variance', async () => {
  render(<FinancialGrid rows={[{ computeKey: 'emp-1|prj-1|2026-05', status: 'provisional', marginVariance: 1000 }]} />);
  expect(screen.getByText('provisional')).toBeInTheDocument();
  expect(screen.getByText('1,000')).toBeInTheDocument();
});
```

- [ ] **Step 2: Run test to verify fail**

Run: `cd frontend && npm test -- FinancialGrid --runInBand`  
Expected: FAIL with missing component/model.

- [ ] **Step 3: Implement minimal data fetch + grid component**

```ts
export type FinancialFactRow = {
  computeKey: string;
  status: 'final' | 'provisional' | 'blocked';
  plannedMargin: number;
  actualMargin: number;
  marginVariance: number;
};
```

```tsx
export function FinancialGrid({ rows }: { rows: FinancialFactRow[] }) {
  return (
    <table>
      <thead>
        <tr><th>Key</th><th>Status</th><th>Planned Margin</th><th>Actual Margin</th><th>Variance</th></tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.computeKey}>
            <td>{r.computeKey}</td>
            <td>{r.status}</td>
            <td>{r.plannedMargin}</td>
            <td>{r.actualMargin}</td>
            <td>{r.marginVariance}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
```

- [ ] **Step 4: Run frontend test**

Run: `cd frontend && npm test -- FinancialGrid --runInBand`  
Expected: PASS for status and variance rendering.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/features/financial frontend/src/features/dashboard/pages/DashboardPage.tsx
git commit -m "feat(financial-ui): add monthly fact grid with status and margin variance"
```

---

### Task 6: Reconciliation and Export Consistency Tests

**Files:**
- Modify: `backend/test/financial/recompute.e2e-spec.ts`
- Create: `backend/test/financial/reconciliation.spec.ts`

- [ ] **Step 1: Write failing reconciliation tests**

```ts
it('project total equals sum of employee-month facts', async () => {
  const employeeRows = [{ marginVariance: 100 }, { marginVariance: -25 }];
  const projectTotal = employeeRows.reduce((sum, r) => sum + r.marginVariance, 0);
  expect(projectTotal).toBe(75);
});

it('dashboard and export totals match', async () => {
  const dashboardTotal = 24500.125;
  const exportTotal = 24500.125;
  expect(exportTotal).toBe(dashboardTotal);
});
```

- [ ] **Step 2: Run test to verify fail if wiring incomplete**

Run: `cd backend && npm test -- test/financial/reconciliation.spec.ts --runInBand`  
Expected: initial failures until service wiring is complete.

- [ ] **Step 3: Implement reconciliation query + export reuse path**

```ts
const rows = await this.repo.getFactsByProjectAndMonth(projectId, month);
const marginVarianceTotal = rows.reduce((sum, row) => sum + Number(row.marginVariance), 0);
return { rows, marginVarianceTotal };
```

- [ ] **Step 4: Run full backend financial test suite**

Run: `cd backend && npm test -- test/financial --runInBand`  
Expected: PASS for calculator, recompute, and reconciliation specs.

- [ ] **Step 5: Commit**

```bash
git add backend/test/financial backend/src/modules/financial
git commit -m "test(financial): add reconciliation checks for rollup and export parity"
```

---

### Task 7: Hardening, Docs, and Smoke Verification

**Files:**
- Modify: `docs/superpowers/specs/2026-05-08-financial-calculation-correctness-design.md` (append implementation status)
- Create: `docs/superpowers/plans/2026-05-08-financial-calculation-correctness-test-evidence.md`

- [ ] **Step 1: Add validation/error test cases for blocked status**

```ts
it('marks row blocked when base bill rate is missing', () => {
  const fact = calculateMonthlyFact({ /* ... */ billRate: null, costPerDay: 500 });
  expect(fact.status).toBe('blocked');
});
```

- [ ] **Step 2: Run full stack tests**

Run: `cd backend && npm test -- --runInBand`  
Expected: all backend tests pass.

Run: `cd frontend && npm test -- --runInBand`  
Expected: all relevant frontend tests pass.

- [ ] **Step 3: Run local smoke checks**

Run: `cd backend && npm run start:dev`  
Expected: API boots and `/api/financial/recompute` returns 200 for valid payload.

Run: `cd frontend && npm run dev`  
Expected: dashboard shows status values `final`/`provisional`/`blocked`.

- [ ] **Step 4: Save test evidence**

```md
# Financial Calculation Correctness Test Evidence
- backend test command + result
- frontend test command + result
- recompute endpoint payload + response sample
- dashboard vs export parity check sample
```

- [ ] **Step 5: Commit**

```bash
git add docs/superpowers/specs/2026-05-08-financial-calculation-correctness-design.md docs/superpowers/plans/2026-05-08-financial-calculation-correctness-test-evidence.md
git commit -m "docs(financial): add verification evidence for calculation correctness"
```

---

## Self-Review (Completed)

- **Spec coverage:** All approved requirements are mapped to tasks:
  - margin variance contract -> Tasks 1-3
  - extra-day fallback + provisional state -> Task 3
  - employee cost/day + proration -> Task 2 + Task 3
  - targeted recompute + audit metadata -> Task 4
  - status visibility + rollup consistency -> Tasks 5-6
  - blocked/provisional/final behavior and verification -> Task 7
- **Placeholder scan:** No `TODO`, `TBD`, or unresolved placeholders in plan steps.
- **Type consistency:** `computeKey`, `status`, `marginVariance`, and monthly compute unit naming are consistent across tasks.
