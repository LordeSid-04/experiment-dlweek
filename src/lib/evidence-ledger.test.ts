import {
  appendLedgerEvent,
  hasTwoDistinctApprovals,
  hashText,
  type LedgerEvent,
} from "./evidence-ledger";

describe("evidence ledger utility", () => {
  it("returns deterministic hashes for the same input", () => {
    expect(hashText("hero-cta")).toBe(hashText("hero-cta"));
    expect(hashText("hero-cta")).not.toBe(hashText("hero-cta-v2"));
  });

  it("appends events without mutating existing history", () => {
    const firstEvent: LedgerEvent = {
      timestamp: "2026-03-02T00:00:00.000Z",
      actor: "tester-a",
      agentRole: "VERIFIER",
      actionType: "test-run",
      resourcesTouched: ["src/lib/evidence-ledger.ts"],
      diffHash: "fnv1a-11111111",
      testHashes: ["fnv1a-22222222"],
      approvals: [],
    };

    const secondEvent: LedgerEvent = {
      timestamp: "2026-03-02T00:01:00.000Z",
      actor: "tester-b",
      agentRole: "GOVERNOR",
      actionType: "safety-case-check",
      resourcesTouched: ["README.md"],
      diffHash: "fnv1a-33333333",
      testHashes: ["fnv1a-44444444"],
      approvals: [],
    };

    const original = [firstEvent];
    const appended = appendLedgerEvent(original, secondEvent);

    expect(original).toHaveLength(1);
    expect(appended).toHaveLength(2);
    expect(appended[1]).toEqual(secondEvent);
  });

  it("requires two distinct approvers for high risk actions", () => {
    expect(
      hasTwoDistinctApprovals([
        { approverId: "alex", approvedAt: "2026-03-02T00:00:00.000Z" },
        { approverId: "alex", approvedAt: "2026-03-02T00:05:00.000Z" },
      ])
    ).toBe(false);

    expect(
      hasTwoDistinctApprovals([
        { approverId: "alex", approvedAt: "2026-03-02T00:00:00.000Z" },
        { approverId: "sam", approvedAt: "2026-03-02T00:05:00.000Z" },
      ])
    ).toBe(true);
  });
});
