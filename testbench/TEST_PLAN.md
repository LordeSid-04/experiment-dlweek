# CodexGo Test Plan

This plan focuses on reproducible coverage of functionality, governance, and safety behavior.

## A. Automated test suites

### A1) Backend full suite

```bash
cd backend
npm test
```

Expected outcome:

- all tests pass
- includes auth, orchestrator, policy engine, scanner, project store, quick assist, and developer quality tests

### A2) Frontend full suite

```bash
cd frontend
npm test
```

Expected outcome:

- all tests pass
- includes governance helpers, backend-run parsing, utility tests, and UI component tests

### A3) Governance-focused backend subset

```bash
cd backend
npm test -- --test-name-pattern "policy|scanner|orchestrator|autopilot|break-glass|approval"
```

Expected outcome:

- all focused governance/safety tests pass

## B. Functional workflow checks (manual)

### B1) Auth and session

1. Open `/auth`.
2. Sign up and login.
3. Confirm redirect to `/confidence`.

Expected:

- valid session stored
- authenticated user can continue to workspace

### B2) Confidence mode behavior

1. Set confidence to `0` (assist), run prompt.
2. Set confidence to `50` (pair), run prompt.
3. Set confidence to `100` (autopilot), run prompt.

Expected:

- mode-specific behavior and permission visualization changes
- gate outcomes align with policy expectations

### B3) Governance controls

Trigger a riskier prompt (for example auth/deploy/destructive intent keywords).

Expected:

- gate result becomes `NEEDS_APPROVAL` or `BLOCKED`
- approval modal appears where required
- break-glass fields required when policy demands

### B4) Ledger verification

Open:

- `GET /api/ledger/events`

Expected:

- latest events present
- includes `eventHash`, `prevEventHash`, `diffHash`, and test hash fields

## C. Website generation quality check (100% mode)

1. Set confidence to `100`.
2. Enter prompt with explicit brand/entity name.
3. Generate website scaffold.

Expected:

- generated content includes exact provided name
- output includes richer structure (hero/services/about/contact, optional requested sections)
- timeline and governance evidence visible in UI
