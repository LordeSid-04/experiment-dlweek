# CodexGo Project Documentation (Draft for PDF Export)

## 1. Executive Summary

CodexGo is a governed AI engineering workspace that combines AI-assisted software generation with policy-based control and auditable execution. The platform is designed to improve delivery speed while preserving security, traceability, and human accountability.

The system routes user prompts through role-separated agents (architecture, development, verification, operations, and governance), applies scanner and risk checks at critical checkpoints, and records outcomes in an append-only ledger.

## 2. Problem Statement

AI-assisted coding can significantly accelerate implementation, but unmanaged autonomy introduces operational and security risks:

- unreviewed high-risk code changes
- policy drift and approval bypasses
- destructive diff patterns (for example unsafe SQL)
- weak auditability for post-action review

CodexGo addresses this by enforcing a confidence-based policy model where execution authority is gated by risk signals and approval requirements.

## 3. System Objectives

1. Provide practical AI acceleration for software work.
2. Enforce explicit governance controls across execution stages.
3. Prevent unsafe actions through scanner and policy gates.
4. Maintain end-to-end traceability with tamper-evident logs.
5. Support reproducible testing and evaluation.

## 4. Solution Architecture

### 4.1 Frontend

- Next.js application with routes:
  - `/auth`
  - `/confidence`
  - `/workspace`
- Workspace includes:
  - prompt submission
  - stream timeline
  - preview/editor/diff/logs/response views
  - approval + break-glass workflow UI

### 4.2 Backend

- Node.js control-plane server exposing:
  - orchestrator run endpoint
  - streaming endpoint
  - quick assist endpoint
  - ledger and project endpoints
- Core modules:
  - orchestrator
  - role agents
  - scanner engine
  - risk engine
  - policy engine
  - evidence ledger

## 5. Methodology

### 5.1 Confidence-driven governance

The confidence slider maps to execution mode:

- Assist: manual-first, strict controls
- Pair: collaborative execution with escalations
- Autopilot: broader automation with hard policy stops

### 5.2 Role-separated pipeline

Pipeline stages:

1. ARCHITECT
2. GOVERNOR (post-plan)
3. DEVELOPER
4. GOVERNOR (post-diff)
5. VERIFIER
6. OPERATOR
7. GOVERNOR (post-test)
8. GOVERNOR (final gate)

### 5.3 Safety and risk analysis

Scanner categories include:

- secret patterns
- dangerous SQL patterns
- auth bypass / policy drift signals
- trust-boundary signals

Risk output includes:

- score
- tier
- factors
- top drivers
- required controls
- reason codes

### 5.4 Evidence logging model

Every governed run appends event records with hash-link references for audit continuity:

- `prevEventHash`
- `eventHash`
- `diffHash`
- `testHashes`
- scanner/risk hashes

## 6. Implementation Notes

- frontend and backend are decoupled via typed API contracts
- stream-first UI for progressive feedback
- deterministic fallback behavior for continuity when external model calls are unavailable
- exact explicit name preservation for branded website generation in high-confidence mode

## 7. Testing and Evaluation Procedures

### 7.1 Automated suites

- Backend full suite
- Frontend full suite
- Governance-focused backend subset

### 7.2 Functional validation

- auth flow
- confidence mode transitions
- workspace run lifecycle
- gate and approval behavior
- ledger endpoint integrity checks

### 7.3 Evidence references

For exact commands/results, see:

- `Evaluation.md`
- `testbench/TEST_PLAN.md`
- `testbench/EVALUATION_EVIDENCE.md`

## 8. Results

Observed outcomes:

- complete backend and frontend test suites passing for evaluated revision
- governance scenarios behaving as expected for allow/gate/block paths
- scanner and policy drift checks triggered in targeted scenarios
- append-only ledger capturing reproducible run evidence

## 9. Observations and Key Findings

1. Governance checkpoints significantly improve operational safety without removing usability.
2. Streamed, explainable risk output improves reviewer confidence and decision speed.
3. Prompt-quality controls reduce drift in generated artifacts.
4. A documented testbench greatly improves reproducibility for independent reviewers.

## 10. Limitations

- Current persistence model uses local file storage, which is practical but not ideal for long-term production durability.
- Some governance summary paths can be deterministic for latency reasons rather than model-generated narrative detail.

## 11. Future Work

1. Move persistence to managed database/object storage.
2. Publish machine-readable CI artifacts per commit.
3. Add production synthetic probes for continuous evaluation drift detection.
4. Expand policy packs and scanner rules for additional domains.

## 12. References and Attribution

Include all external tools, APIs, and libraries used in implementation and evaluation.  
Use IEEE-style citations where required by submission guidelines.
