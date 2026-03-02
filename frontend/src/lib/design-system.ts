export const typography = {
  hero: "text-3xl md:text-5xl font-extrabold leading-[1.05] uppercase tracking-normal",
  h2: "text-3xl md:text-4xl font-bold leading-tight tracking-tight",
  body: "text-sm md:text-base leading-relaxed text-white/85",
  eyebrow: "text-xs tracking-[0.25em] uppercase text-white/80",
} as const;

export const spacing = {
  container: "mx-auto w-full max-w-6xl px-6",
  heroSection: "min-h-[80vh] pt-14 pb-12",
  contentSection: "min-h-[78vh] py-12 scroll-mt-28",
} as const;

export const buttons = {
  base: "rounded-full transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60",
  sizeSm: "px-4 py-2 text-xs font-medium",
  sizeMd: "px-6 py-2 text-sm font-medium",
  sizeLg: "px-8 py-3 text-sm font-medium",
  primary: "bg-white text-black hover:bg-white/85",
  outline: "border border-white/25 text-white/90 hover:bg-white/10",
} as const;

export const cards = {
  glass:
    "rounded-3xl border border-white/20 bg-black/35 p-10 backdrop-blur-sm transition",
  hoverGlow: "hover:border-blue-300/35 hover:shadow-[0_0_18px_rgba(56,189,248,0.14)]",
} as const;
