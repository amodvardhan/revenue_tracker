# Financial Calculation Correctness - Task 7 Test Evidence

Date: 2026-05-08
Worktree: `/Users/amod/Documents/Products/revenue-tracker/.worktrees/financial-calculation-correctness`

## Scope

- Added blocked status validation/error hardening tests in frontend API contract tests.
- Ran full backend test suite.
- Ran relevant frontend test suites for financial facts and dashboard rendering.

## Code Changes Verified

- `frontend/src/features/financial/services/financialApi.test.ts`

## Commands and Outputs

### 1) Backend (full suite)

Command:

```bash
npm test -- --runInBand
```

Working directory:

```bash
/Users/amod/Documents/Products/revenue-tracker/.worktrees/financial-calculation-correctness/backend
```

Output:

```text
npm warn Unknown env config "devdir". This will stop working in the next major version of npm.

> financial-backend@1.0.0 test
> jest --runInBand

PASS test/financial/recompute.e2e-spec.ts
PASS test/financial/calculation.spec.ts
PASS test/financial/reconciliation.spec.ts

Test Suites: 3 passed, 3 total
Tests:       29 passed, 29 total
Snapshots:   0 total
Time:        3.595 s, estimated 5 s
Ran all test suites.
```

### 2) Frontend (relevant suites)

Command:

```bash
npm test -- src/features/financial/services/financialApi.test.ts src/features/dashboard/pages/DashboardPage.test.tsx
```

Working directory:

```bash
/Users/amod/Documents/Products/revenue-tracker/.worktrees/financial-calculation-correctness/frontend
```

Output:

```text
npm warn Unknown env config "devdir". This will stop working in the next major version of npm.

> financial-frontend@1.0.0 test
> vitest run src/features/financial/services/financialApi.test.ts src/features/dashboard/pages/DashboardPage.test.tsx


 RUN  v2.1.9 /Users/amod/Documents/Products/revenue-tracker/.worktrees/financial-calculation-correctness/frontend

 ✓ src/features/financial/services/financialApi.test.ts (4 tests) 6ms
 ✓ src/features/dashboard/pages/DashboardPage.test.tsx (4 tests) 62ms

 Test Files  2 passed (2)
      Tests  8 passed (8)
   Start at  17:44:32
   Duration  2.07s (transform 151ms, setup 318ms, collect 223ms, tests 68ms, environment 2.12s, prepare 292ms)
```

## Notes

- Task 7 hardening objective for blocked status validation/error behavior is covered by:
  - acceptance test for `"blocked"` status payload
  - rejection test for unsupported status value with `validation_error`
- No additional spec note appended because no Task 7 spec markdown file was found in this worktree.
