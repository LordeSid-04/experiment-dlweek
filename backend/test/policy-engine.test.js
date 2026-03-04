const test = require("node:test");
const assert = require("node:assert/strict");
const { decideGate } = require("../src/lib/policy-engine");

const noFindings = [];

test("assist mode allows without approval", () => {
  const decision = decideGate({
    confidenceMode: "assist",
    riskScore: 10,
    findings: noFindings,
    approvals: [],
  });
  assert.equal(decision.gateDecision, "ALLOWED");
  assert.ok(decision.reasonCodes.includes("APPROVAL_GATES_DISABLED"));
});

test("pair mode always allows while returning bypass reason code", () => {
  const low = decideGate({
    confidenceMode: "pair",
    riskScore: 20,
    findings: noFindings,
    approvals: [],
  });
  assert.equal(low.gateDecision, "ALLOWED");

  const medium = decideGate({
    confidenceMode: "pair",
    riskScore: 50,
    findings: [{ severity: "MED" }],
    approvals: [],
  });
  assert.equal(medium.gateDecision, "ALLOWED");

  const high = decideGate({
    confidenceMode: "pair",
    riskScore: 80,
    findings: [{ severity: "HIGH" }],
    approvals: [{ approverId: "human-a", approvedAt: new Date().toISOString() }],
  });
  assert.equal(high.gateDecision, "ALLOWED");
});

test("autopilot mode allows high and critical findings", () => {
  const high = decideGate({
    confidenceMode: "autopilot",
    riskScore: 82,
    findings: [{ severity: "HIGH" }],
    approvals: [],
  });
  assert.equal(high.gateDecision, "ALLOWED");

  const criticalAllowed = decideGate({
    confidenceMode: "autopilot",
    riskScore: 95,
    findings: [{ severity: "CRITICAL" }],
    approvals: [{ approverId: "human-a", approvedAt: new Date().toISOString() }],
  });
  assert.equal(criticalAllowed.gateDecision, "ALLOWED");
});

test("break-glass invalid no longer blocks", () => {
  const decision = decideGate({
    confidenceMode: "autopilot",
    riskScore: 95,
    findings: [{ severity: "CRITICAL" }],
    approvals: [
      { approverId: "human-a", approvedAt: new Date().toISOString() },
      { approverId: "human-b", approvedAt: new Date().toISOString() },
    ],
    breakGlass: {
      reason: "Urgent incident response",
      expiresAt: new Date(Date.now() - 60_000).toISOString(),
      postActionReviewRequired: true,
    },
  });
  assert.equal(decision.gateDecision, "ALLOWED");
  assert.ok(decision.reasonCodes.includes("BREAK_GLASS_INVALID_BYPASSED"));
});
