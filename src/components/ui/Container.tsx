import type { HTMLAttributes } from "react";
import { spacing } from "@/lib/design-system";
import { cn } from "@/lib/utils";

type ContainerProps = HTMLAttributes<HTMLDivElement>;

export function Container({ className, ...props }: ContainerProps) {
  return <div className={cn(spacing.container, className)} {...props} />;
}
