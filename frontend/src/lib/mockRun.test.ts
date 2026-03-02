import { generateMockRun } from "./mockRun";

describe("mock run generator", () => {
  it("returns fixed 4-step timeline in expected order", () => {
    const run = generateMockRun("update auth flow", "pair");
    expect(run.timeline).toHaveLength(4);
    expect(run.timeline.map((step) => step.artifactType)).toEqual([
      "plan",
      "diff",
      "securityReport",
      "test",
    ]);
    expect(run.findings.length).toBeGreaterThan(0);
    expect(run.diffLines.length).toBeGreaterThan(0);
  });

  it("assist mode always requires approval for code apply steps", () => {
    const run = generateMockRun("deploy to production", "assist");
    expect(run.timeline[1].gateDecision).toBe("NEEDS_APPROVAL");
    expect(run.timeline[3].gateDecision).toBe("NEEDS_APPROVAL");
  });

  it("autopilot blocks critical risk and gates high", () => {
    const criticalRun = generateMockRun(
      "auth migration deploy production delete",
      "autopilot"
    );
    expect(criticalRun.timeline[3].gateDecision).toBe("BLOCKED");
  });
});
