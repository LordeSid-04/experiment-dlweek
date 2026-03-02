# Evaluation Evidence (Testbench Summary)

Use this file as a quick verifier summary. Detailed write-up is in root `Evaluation.md`.

## Recorded execution reference

- Commit: `07e8723`
- Backend governance-focused: `10/10` passed
- Backend full suite: `36/36` passed
- Frontend full suite: `28/28` passed

## What the evidence supports

1. **Governance correctness**
   - mode-aware allow/gate/block logic validated
   - approval and break-glass enforcement validated

2. **Security scanner coverage**
   - dangerous SQL, policy drift, trust boundary, and secret patterns detected

3. **Pipeline reliability**
   - orchestrator run and stream paths validated
   - generated artifact and gate metadata consistency validated

4. **Frontend reliability**
   - governance/UI helper logic validated
   - backend-run integration parsing validated

## Suggested screenshot set

Capture:

- backend focused run output
- backend full run output
- frontend full run output
- workspace risk card + gate decision
- `/api/ledger/events` hash-link fields
