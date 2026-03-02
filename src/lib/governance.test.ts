import { getGovernanceConfig, getMode, snapToClosestBand } from "./governance";

describe("governance helpers", () => {
  it("maps percentage ranges to expected modes", () => {
    expect(getMode(0)).toBe("assist");
    expect(getMode(25)).toBe("assist");
    expect(getMode(50)).toBe("pair");
    expect(getMode(75)).toBe("pair");
    expect(getMode(76)).toBe("autopilot");
    expect(getMode(100)).toBe("autopilot");
  });

  it("snaps confidence values to the closest confidence band", () => {
    expect(snapToClosestBand(0)).toBe(0);
    expect(snapToClosestBand(24)).toBe(0);
    expect(snapToClosestBand(26)).toBe(50);
    expect(snapToClosestBand(73)).toBe(50);
    expect(snapToClosestBand(90)).toBe(100);
  });

  it("returns governance config with required fields", () => {
    const config = getGovernanceConfig(55);
    expect(config.mode).toBe("pair");
    expect(config.label).toBe("Pair Mode");
    expect(config.description.length).toBeGreaterThan(10);
    expect(config.permissions.length).toBeGreaterThan(0);
    expect(config.permissions[0]).toHaveProperty("category");
    expect(config.permissions[0]).toHaveProperty("state");
    expect(config.riskPolicy).toBe("review_first");
  });

  it("keeps autopilot mode for upper range", () => {
    expect(getMode(90)).toBe("autopilot");
    expect(getMode(95)).toBe("autopilot");
  });
});
