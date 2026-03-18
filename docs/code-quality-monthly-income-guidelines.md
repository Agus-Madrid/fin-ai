# Code Quality Notes - Monthly Income Cycle

## Naming and reuse rules applied
- Use explicit method names that describe intent and side effects.
- Centralize monthly calculations in a reusable service (`MonthlyFinancialsService`) to avoid duplicated logic.
- Keep business rules in backend services and keep controllers thin.
- Keep form mapping and payload construction isolated in dedicated UI modal components.

## Data integrity rules applied
- Validate period format with `YYYY-MM` before mutating monthly data.
- Normalize monetary values to 2 decimals in backend services.
- Prevent mutations on closed months for monthly savings confirmations.
- Store monthly snapshots in `monthly_summary` to preserve historical results.
- Snapshot monthly income entries in `income_month_entries` with source metadata.

## Separation of concerns rules applied
- `incomes` manages income rule CRUD.
- `monthly-financials` manages monthly entry sync, summary calculation, and month closing.
- `budgets` consumes monthly snapshots for overview/planner view models.
- Frontend forms only collect and validate user input; backend enforces final domain validation.

## UI and API consistency rules applied
- Income form explicitly supports two modes:
  - `MONTHLY_RECURRING`
  - `ONE_TIME`
- Backend DTOs and frontend request models share the same rule fields (`ruleType`, `startPeriod`, `targetPeriod`, `isActive`).
- Planner blocks monthly save/confirm actions when the month is closed.
- In dashboard category card, keep `Registro/Consumo` as criterion-only controls and expose history navigation as an explicit separate action (`Ver historico`) to avoid mixed affordances.

## Traceability and maintainability rules applied
- Add dedicated tables for monthly traceability:
  - `income_rules`
  - `income_month_entries`
  - `monthly_summary`
- Use deterministic recalculation methods for open months after income/fixed-commitment changes.
- Preserve closed-month snapshots to keep historical statistics stable.
