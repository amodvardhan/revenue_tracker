# Revenue Tracker Professional Rewrite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace prototype-grade implementation with a professional DOCX-aligned architecture, naming, security baseline, and dashboard UX.

**Architecture:** Split backend into domain modules (`auth`, `projects`, `assignments`, `attendance`, `rate-revisions`, `projections`, `dashboard`, `alerts`, `reports`) with dedicated controllers/services and a shared revenue computation service. Replace `phase1.*`/monolith service patterns with focused files. Upgrade frontend dashboard to a proper app shell with summary cards, filter bar, and richer grid.

**Tech Stack:** NestJS, Prisma/PostgreSQL, React + TypeScript + Vite, Jest, Vitest

---

### Task 1: Backend Module and Naming Refactor

**Files:**
- Create: `backend/src/modules/core/core.module.ts`
- Create: `backend/src/modules/dashboard/dashboard.controller.ts`
- Create: `backend/src/modules/dashboard/dashboard.service.ts`
- Create: `backend/src/modules/auth/auth.controller.ts`
- Create: `backend/src/modules/auth/auth.service.ts`
- Modify: `backend/src/app.module.ts`
- Modify: `backend/src/modules/financial/financial.module.ts`
- Test: `backend/test/financial/recompute.e2e-spec.ts`

- [ ] **Step 1: Write failing test**

```ts
it("exposes dashboard route via dedicated module", async () => {
  await request(app.getHttpServer()).get("/api/dashboard/project/not-found").expect(404);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- recompute.e2e-spec.ts`
Expected: FAIL due to missing dedicated module route.

- [ ] **Step 3: Implement modular controllers/services**

```ts
// dashboard.controller.ts
@Controller("dashboard")
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test -- recompute.e2e-spec.ts`
Expected: PASS.

### Task 2: Security Baseline (JWT + RBAC Guard)

**Files:**
- Create: `backend/src/modules/auth/jwt.guard.ts`
- Create: `backend/src/modules/auth/roles.guard.ts`
- Create: `backend/src/modules/auth/roles.decorator.ts`
- Modify: `backend/src/modules/auth/auth.service.ts`
- Modify: `backend/src/modules/auth/auth.controller.ts`
- Test: `backend/test/financial/recompute.e2e-spec.ts`

- [ ] **Step 1: Write failing auth test**

```ts
it("rejects protected routes without bearer token", async () => {
  await request(app.getHttpServer()).post("/api/projects").send({}).expect(401);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- recompute.e2e-spec.ts`
Expected: FAIL due to route currently open.

- [ ] **Step 3: Implement guards and apply decorators**

```ts
@UseGuards(JwtGuard, RolesGuard)
@Roles("delivery_manager", "account_manager", "project_manager")
@Post("projects")
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test`
Expected: PASS.

### Task 3: Revenue Computation Service Split

**Files:**
- Create: `backend/src/modules/revenue/revenue-computation.service.ts`
- Create: `backend/src/modules/revenue/revenue-recompute.service.ts`
- Modify: `backend/src/modules/financial/service/phase1.service.ts` (remove/retire)
- Modify: `backend/src/modules/financial/bootstrap.service.ts`
- Test: `backend/test/financial/recompute.e2e-spec.ts`

- [ ] **Step 1: Write failing regression test for monthly fact fields**

```ts
it("returns signed/projected/total fields from facts", async () => {
  const facts = await request(app.getHttpServer()).get("/api/financial/facts").expect(200);
  expect(facts.body[0]).toHaveProperty("totalRevenue");
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd backend && npm test -- recompute.e2e-spec.ts`
Expected: FAIL if fields disappear during refactor.

- [ ] **Step 3: Extract and wire computation services**

```ts
export class RevenueComputationService {
  recomputeAssignmentFacts(assignment: AssignmentAggregate): MonthlyFactInput[] {}
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd backend && npm test`
Expected: PASS.

### Task 4: Frontend Dashboard Professional UI

**Files:**
- Create: `frontend/src/features/dashboard/components/DashboardSummaryCards.tsx`
- Create: `frontend/src/features/dashboard/components/DashboardFilters.tsx`
- Modify: `frontend/src/features/dashboard/pages/DashboardPage.tsx`
- Modify: `frontend/src/features/financial/components/FinancialGrid.tsx`
- Modify: `frontend/src/features/dashboard/pages/DashboardPage.test.tsx`
- Test: `frontend/src/features/dashboard/pages/DashboardPage.test.tsx`

- [ ] **Step 1: Write failing UI test**

```tsx
expect(await screen.findByText("Total Revenue")).toBeInTheDocument();
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- DashboardPage.test.tsx`
Expected: FAIL due to missing summary cards.

- [ ] **Step 3: Implement app-shell dashboard widgets**

```tsx
<DashboardSummaryCards totals={totals} />
<DashboardFilters />
<FinancialGrid facts={facts} ... />
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test`
Expected: PASS.

### Task 5: Verification Sweep Against DOCX Critical Paths

**Files:**
- Modify: `docs/superpowers/specs/2026-05-08-financial-calculation-correctness-design.md`
- Modify: `docs/superpowers/plans/2026-05-08-approach-a-professional-rewrite.md`

- [ ] **Step 1: Execute backend verification commands**

Run:
```bash
cd backend && npm run prisma:migrate && npm test
```
Expected: all tests pass and migrations are clean.

- [ ] **Step 2: Execute frontend verification commands**

Run:
```bash
cd frontend && npm test
```
Expected: all tests pass.

- [ ] **Step 3: Execute runtime smoke tests**

Run:
```bash
curl -sS http://localhost:4000/api/financial/facts
curl -sS http://localhost:4000/api/dashboard/account/ACME
```
Expected: non-empty facts and dashboard payloads.

