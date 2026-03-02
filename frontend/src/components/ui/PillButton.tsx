import type { ButtonHTMLAttributes } from "react";
import { buttons } from "@/lib/design-system";
import { cn } from "@/lib/utils";

type PillVariant = "primary" | "outline";
type PillSize = "sm" | "md" | "lg";

interface PillButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PillVariant;
  size?: PillSize;
  active?: boolean;
}

const variantClasses: Record<PillVariant, string> = {
  primary: buttons.primary,
  outline: buttons.outline,
};

const sizeClasses: Record<PillSize, string> = {
  sm: buttons.sizeSm,
  md: buttons.sizeMd,
  lg: buttons.sizeLg,
};

export function PillButton({
  variant = "outline",
  size = "md",
  active = false,
  className,
  children,
  ...props
}: PillButtonProps) {
  return (
    <button
      className={cn(
        buttons.base,
        sizeClasses[size],
        variantClasses[variant],
        active && "bg-white text-black",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
