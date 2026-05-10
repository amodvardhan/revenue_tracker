# Financial Calculation Correctness Design

Date: 2026-05-08  
Project: T&M Revenue Management System (Phase 1)  
Source requirements: `T&M_Revenue_Management_SRS_FRS_Phase1.docx`

## 1) Goal and Scope

Define a deterministic, auditable financial calculation model for Phase 1 that prioritizes margin correctness at monthly granularity.

This design focuses on:
- margin variance as the primary KPI
- extra-day handling and temporary fallback pricing
- employee-level cost/day handling with mid-month proration
- recalculation behavior and traceability

## 2) Chosen Approach

Recommended approach: **Event-sliced financial engine**.

Why:
- Handles effective-dated rate and cost changes without hidden ambiguity
- Produces audit-friendly calculations for stakeholder reconciliation
- Supports incremental recompute on impacted employee-month windows

## 3) Financial Formula Contract (Approved)

Compute unit: `employee x project x month`.

### 3.1 Revenue

- **Planned Revenue** = `expected_days * planned_bill_rate`
- **Actual Revenue** =
  - `regular_actual_days * applicable_bill_rate`
  - `+ extra_actual_days * extra_day_rate_effective`

Extra-day rule:
- Extra days are treated separately from planned allocation.
- If extra-day client rate is missing, use base daily bill rate temporarily.
- Mark row as provisional and auto-recompute when extra-day rate is updated.

### 3.2 Cost

- **Planned Cost** = `expected_days * planned_cost_per_day`
- **Actual Cost** = `actual_days * effective_cost_per_day`

Cost basis:
- Primary source is **employee-level `cost/day`**.
- Mid-month cost/day changes are **prorated by effective date**.

### 3.3 Margin and KPI

- **Planned Margin** = `planned_revenue - planned_cost`
- **Actual Margin** = `actual_revenue - actual_cost`
- **Margin Variance (primary KPI)** = `actual_margin - planned_margin`

### 3.4 Calendar and Precision

- Expected-day and proration baseline: **fixed 20 days/month**.
- Precision policy: keep full precision internally; round only in UI/export outputs.

## 4) Calculation Workflow

1. Resolve assignment context and signed/projected period for month.
2. Derive `expected_days` from fixed 20-day baseline and allocation %.
3. Slice month by effective dates (billing rate, extra-day rate, cost/day).
4. Compute planned revenue/cost.
5. Compute actual revenue/cost (regular and extra days separately).
6. Derive planned margin, actual margin, and margin variance.
7. Persist row-level outputs with trace metadata.

## 5) Recompute Triggers and Impact

Recompute is triggered by:
- attendance create/update/delete
- billing rate revision
- extra-day rate revision
- employee cost/day revision
- projection-to-signed conversion affecting monthly bucketing

Recompute scope:
- only impacted employee-month rows and impacted rollups (project/account)
- no full-account full-history recompute unless explicitly requested

## 6) Data Quality and Status Model

Per employee-project-month row:
- `final`: fully priced and validated
- `provisional`: fallback pricing used (missing extra-day rate)
- `blocked`: mandatory pricing/cost inputs missing or invalid date windows

Blocking rules:
- Missing mandatory base bill rate or missing cost/day -> `blocked`.
- Missing extra-day rate -> `provisional` (not blocked).

## 7) Validation and Error Handling

Hard validations:
- no overlapping effective-date windows for same metric type
- no negative day values
- allocation percent within allowed bounds
- effective date boundaries inside valid assignment timeline

Operational behavior:
- reject invalid revisions with explicit reason
- store adjustment reason for manual corrections
- keep audit trail for before/after values on recompute-triggering edits

## 8) Auditability and Explainability

Persist with each calculation row:
- calculation timestamp
- calculation engine version
- trigger source (for example: `attendance_update`, `rate_revision`)
- input snapshot hash/signature

This allows complete reconstruction and explanation of any dashboard/export value.

## 9) Test and Acceptance Matrix

Must-pass scenarios:
1. Mid-month `cost/day` revision prorates correctly.
2. Mid-month billing revision applies from effective date only.
3. Extra days are priced separately from regular days.
4. Missing extra-day rate uses base rate and row is marked provisional.
5. Later extra-day rate update auto-recomputes and clears provisional state.
6. Signed/projected transitions avoid double counting.
7. Aggregates match: employee-month sums equal project/account totals.
8. Recompute touches only impacted rows.
9. Dashboard and export values match for same filters.
10. Margin variance sign is consistent as `actual - planned`.

## 10) Out-of-Scope for This Design

- advanced predictive forecasting
- multi-currency valuation
- account/project-level cost basis fallback hierarchy (future enhancement)
- automated report scheduling

## 11) Implementation Notes for Next Planning Step

For implementation planning, define:
- effective-dated tables or event logs for bill/cost revisions
- deterministic recompute service with idempotent job keys
- row status transitions (`provisional` to `final`) on pricing updates
- regression tests for financial edge cases and reconciliation exports
