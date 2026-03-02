import { getHeroMotion } from "./hero-motion";

describe("hero motion config", () => {
  it("returns non-animated state when reduced motion is preferred", () => {
    const config = getHeroMotion(true, 0.2);
    expect(config.initial).toEqual({ opacity: 1, y: 0 });
    expect(config.animate).toEqual({ opacity: 1, y: 0 });
    expect(config.transition.duration).toBe(0);
  });

  it("returns entrance animation for standard motion", () => {
    const config = getHeroMotion(false, 0.15, 18);
    expect(config.initial).toEqual({ opacity: 0, y: 18 });
    expect(config.animate).toEqual({ opacity: 1, y: 0 });
    expect(config.transition.delay).toBe(0.15);
    expect(config.transition.duration).toBeGreaterThan(0);
  });
});
