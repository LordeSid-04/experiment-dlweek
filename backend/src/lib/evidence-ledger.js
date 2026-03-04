const fs = require("node:fs");
const path = require("node:path");
const { sha256 } = require("./hashing");

const ledgerPath = path.resolve(__dirname, "..", "..", "data", "evidence-ledger.jsonl");

function ensureLedgerFile() {
  const dir = path.dirname(ledgerPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(ledgerPath)) {
    fs.writeFileSync(ledgerPath, "", "utf8");
  }
}

function validateLedgerEvent(event) {
  const required = [
    "schemaVersion",
    "timestamp",
    "actor",
    "agentRole",
    "actionType",
    "resourcesTouched",
    "prevEventHash",
    "eventHash",
    "scannerSummaryHash",
    "riskCardHash",
    "diffHash",
    "testHashes",
    "approvals",
  ];
  if (!required.every((key) => Object.prototype.hasOwnProperty.call(event, key))) {
    return false;
  }
  const validRoles = new Set(["ARCHITECT", "DEVELOPER", "VERIFIER", "OPERATOR", "GOVERNOR"]);
  if (!validRoles.has(event.agentRole)) return false;
  if (typeof event.schemaVersion !== "string" || !event.schemaVersion.trim()) return false;
  if (typeof event.timestamp !== "string" || !event.timestamp.trim()) return false;
  if (typeof event.actor !== "string" || !event.actor.trim()) return false;
  if (typeof event.actionType !== "string" || !event.actionType.trim()) return false;
  if (!Array.isArray(event.resourcesTouched) || !event.resourcesTouched.every((item) => typeof item === "string")) {
    return false;
  }
  if (typeof event.prevEventHash !== "string" || !event.prevEventHash.trim()) return false;
  if (typeof event.eventHash !== "string" || !event.eventHash.trim()) return false;
  if (typeof event.scannerSummaryHash !== "string" || !event.scannerSummaryHash.trim()) return false;
  if (typeof event.riskCardHash !== "string" || !event.riskCardHash.trim()) return false;
  if (typeof event.diffHash !== "string" || !event.diffHash.trim()) return false;
  if (!Array.isArray(event.testHashes) || !event.testHashes.every((item) => typeof item === "string")) {
    return false;
  }
  if (!Array.isArray(event.approvals)) return false;
  if (!event.approvals.every((item) => item && typeof item.approverId === "string" && typeof item.approvedAt === "string")) {
    return false;
  }
  if (event.breakGlass !== undefined) {
    if (!event.breakGlass || typeof event.breakGlass !== "object") return false;
    if (typeof event.breakGlass.reason !== "string" || !event.breakGlass.reason.trim()) return false;
    if (typeof event.breakGlass.expiresAt !== "string" || !event.breakGlass.expiresAt.trim()) return false;
    if (event.breakGlass.postActionReviewRequired !== true) return false;
  }
  return true;
}

function hashEventPayload(event) {
  const payload = {
    schemaVersion: event.schemaVersion,
    timestamp: event.timestamp,
    actor: event.actor,
    agentRole: event.agentRole,
    actionType: event.actionType,
    resourcesTouched: event.resourcesTouched,
    diffHash: event.diffHash,
    testHashes: event.testHashes,
    approvals: event.approvals,
    breakGlass: event.breakGlass,
    scannerSummaryHash: event.scannerSummaryHash,
    riskCardHash: event.riskCardHash,
    prevEventHash: event.prevEventHash,
  };
  return sha256(JSON.stringify(payload));
}

function getLastEventHash() {
  ensureLedgerFile();
  const content = fs.readFileSync(ledgerPath, "utf8").trim();
  if (!content) return "GENESIS";
  const lines = content.split("\n");
  const last = lines[lines.length - 1];
  if (!last) return "GENESIS";
  try {
    const parsed = JSON.parse(last);
    return parsed.eventHash || "GENESIS";
  } catch {
    return "GENESIS";
  }
}

function appendLedgerEvent(event) {
  ensureLedgerFile();
  if (!event.prevEventHash) {
    event.prevEventHash = getLastEventHash();
  }
  if (!event.eventHash) {
    event.eventHash = hashEventPayload(event);
  }
  if (!validateLedgerEvent(event)) {
    throw new Error("Invalid ledger event payload.");
  }
  fs.appendFileSync(ledgerPath, `${JSON.stringify(event)}\n`, "utf8");
}

function buildLedgerEvent({
  actor,
  agentRole,
  actionType,
  resourcesTouched,
  diffText,
  testOutputs,
  approvals,
  breakGlass,
  scannerSummary,
  riskCard,
}) {
  const normalizedTestOutputs = Array.isArray(testOutputs)
    ? testOutputs.map((item) => (typeof item === "string" ? item : JSON.stringify(item)))
    : typeof testOutputs === "string"
      ? [testOutputs]
      : [];

  const event = {
    schemaVersion: "1.1",
    timestamp: new Date().toISOString(),
    actor,
    agentRole,
    actionType,
    resourcesTouched: resourcesTouched || [],
    prevEventHash: getLastEventHash(),
    diffHash: sha256(diffText || ""),
    testHashes: normalizedTestOutputs.map((line) => sha256(line)),
    approvals: approvals || [],
    breakGlass,
    scannerSummaryHash: sha256(JSON.stringify(scannerSummary || {})),
    riskCardHash: sha256(JSON.stringify(riskCard || {})),
  };
  event.eventHash = hashEventPayload(event);
  return event;
}

function readLedgerEvents(limit = 100) {
  ensureLedgerFile();
  const content = fs.readFileSync(ledgerPath, "utf8");
  return content
    .split("\n")
    .filter(Boolean)
    .slice(-limit)
    .map((line) => JSON.parse(line));
}

module.exports = {
  appendLedgerEvent,
  buildLedgerEvent,
  readLedgerEvents,
};
