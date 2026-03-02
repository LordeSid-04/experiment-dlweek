# Testbench

This folder provides a grader-oriented testbench for reproducible setup, execution, and validation of CodexGo.

## Contents

- `SETUP_AND_RUN.md`: end-to-end setup and launch instructions (local + deployed).
- `TEST_PLAN.md`: deterministic test scenarios with expected outcomes.
- `EVALUATION_EVIDENCE.md`: summary of test execution evidence and what each suite validates.
- `SUBMISSION_CHECKLIST.md`: quick pre-submission verification list.

## Recommended Grader Flow

1. Follow `SETUP_AND_RUN.md` to run backend and frontend.
2. Execute tests using commands in `TEST_PLAN.md`.
3. Validate key risk/gate scenarios in the workspace.
4. Cross-check outcomes with `EVALUATION_EVIDENCE.md`.
