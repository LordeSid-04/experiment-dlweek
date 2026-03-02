import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SectionProps extends HTMLAttributes<HTMLElement> {
  id?: string;
  snap?: boolean;
}

export const Section = forwardRef<HTMLElement, SectionProps>(function Section(
  { id, className, snap = true, children, ...props },
  ref
) {
  return (
    <section
      ref={ref}
      id={id}
      className={cn(snap && "scroll-section snap-start", className)}
      {...props}
    >
      {children}
    </section>
  );
});
