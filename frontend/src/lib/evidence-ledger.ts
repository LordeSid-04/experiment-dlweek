export type AgentRole =
  | "ARCHITECT"
  | "DEVELOPER"
  | "VERIFIER"
  | "OPERATOR"
  | "GOVERNOR";

export interface ApprovalRecord {
  approverId: string;
  approvedAt: string;
}

export interface BreakGlassContext {
  reason: string;
  expiresAt: string;
  postActionReviewRequired: true;
}

export interface LedgerEvent {
  schemaVersion?: string;
  timestamp: string;
  actor: string;
  agentRole: AgentRole;
  actionType: string;
  resourcesTouched: string[];
  prevEventHash?: string;
  eventHash?: string;
  scannerSummaryHash?: string;
  riskCardHash?: string;
  diffHash: string;
  testHashes: string[];
  approvals: ApprovalRecord[];
  breakGlass?: BreakGlassContext;
}

const LEDGER_STORAGE_KEY = "evidence-ledger-events";

export function hashText(value: string): string {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return `fnv1a-${(hash >>> 0).toString(16).padStart(8, "0")}`;
}

export function hasTwoDistinctApprovals(approvals: ApprovalRecord[]): boolean {
  const distinctApprovers = new Set(approvals.map((item) => item.approverId));
  return distinctApprovers.size >= 2;
}

export function appendLedgerEvent(
  existingEvents: LedgerEvent[],
  newEvent: LedgerEvent
): LedgerEvent[] {
  return [...existingEvents, newEvent];
}

export function readLedgerEvents(): LedgerEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(LEDGER_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as LedgerEvent[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function persistLedgerEvents(events: LedgerEvent[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LEDGER_STORAGE_KEY, JSON.stringify(events));
}
