export interface HeroMotionConfig {
  initial: { opacity: number; y: number };
  animate: { opacity: number; y: number };
  transition: { duration: number; delay: number; ease: "easeOut" };
}

export function getHeroMotion(
  shouldReduceMotion: boolean,
  delay: number,
  yOffset = 14
): HeroMotionConfig {
  if (shouldReduceMotion) {
    return {
      initial: { opacity: 1, y: 0 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0, delay: 0, ease: "easeOut" },
    };
  }

  return {
    initial: { opacity: 0, y: yOffset },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: "easeOut" },
  };
}
