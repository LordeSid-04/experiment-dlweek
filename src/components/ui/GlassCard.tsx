import type { HTMLAttributes } from "react";
import { cards } from "@/lib/design-system";
import { cn } from "@/lib/utils";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  hoverGlow?: boolean;
}

export function GlassCard({
  hoverGlow = true,
  className,
  children,
  ...props
}: GlassCardProps) {
  return (
    <div className={cn(cards.glass, hoverGlow && cards.hoverGlow, className)} {...props}>
      {children}
    </div>
  );
}
