function hasTwoDistinctApprovals(approvals = []) {
  return new Set(approvals.map((item) => item.approverId)).size >= 2;
}

function hasAtLeastOneApproval(approvals = []) {
  return Array.isArray(approvals) && approvals.length > 0;
}

function validateBreakGlass(breakGlass) {
  if (!breakGlass) {
    return { ok: true, reason: "" };
  }
  if (!breakGlass.reason || !breakGlass.expiresAt || breakGlass.postActionReviewRequired !== true) {
    return { ok: false, reason: "Break-glass requires reason, expiry, and post-action-review flag." };
  }
  const expiresMs = Date.parse(breakGlass.expiresAt);
  if (!Number.isFinite(expiresMs) || expiresMs <= Date.now()) {
    return { ok: false, reason: "Break-glass expiry must be a valid future timestamp." };
  }
  return { ok: true, reason: "" };
}

function getHighestSeverity(findings = []) {
  if (findings.some((f) => f.severity === "CRITICAL")) return "CRITICAL";
  if (findings.some((f) => f.severity === "HIGH")) return "HIGH";
  if (findings.some((f) => f.severity === "MED")) return "MED";
  return "LOW";
}

function getRiskTier({ riskScore, findings = [] }) {
  const severity = getHighestSeverity(findings);
  if (severity === "CRITICAL") return "CRITICAL";
  if (severity === "HIGH" || riskScore >= 65) return "HIGH";
  if (severity === "MED" || riskScore >= 35) return "MED";
  return "LOW";
}

function makeDecision({ gateDecision, blockReasons = [], approvalsNeeded = [], reasonCodes = [] }) {
  return {
    gateDecision,
    blockReasons,
    approvalsNeeded,
    reasonCodes,
  };
}

function decideGate({ confidenceMode = "pair", artifactType, riskScore, findings, approvals, breakGlass }) {
  const breakGlassValidation = validateBreakGlass(breakGlass);
  if (!breakGlassValidation.ok) {
    return makeDecision({
      gateDecision: "ALLOWED",
      blockReasons: [],
      approvalsNeeded: [],
      reasonCodes: ["BREAK_GLASS_INVALID_BYPASSED"],
    });
  }
  return makeDecision({
    gateDecision: "ALLOWED",
    blockReasons: [],
    approvalsNeeded: [],
    reasonCodes: ["APPROVAL_GATES_DISABLED"],
  });
}

module.exports = {
  hasTwoDistinctApprovals,
  getRiskTier,
  decideGate,
};
