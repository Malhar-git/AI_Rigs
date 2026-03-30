import type { HTMLAttributes } from "react";

type ProgressVariant = "default" | "neutral" | "warning" | "error" | "success";

type ProgressBarProps = Omit<HTMLAttributes<HTMLDivElement>, "children"> & {
  value?: number;
  max?: number;
  showAnimation?: boolean;
  label?: string;
  variant?: ProgressVariant;
};

const variantStyles: Record<ProgressVariant, { background: string; bar: string }> = {
  default: {
    background: "bg-muted",
    bar: "bg-accent",
  },
  neutral: {
    background: "bg-border",
    bar: "bg-secondary",
  },
  warning: {
    background: "bg-warning/20",
    bar: "bg-warning",
  },
  error: {
    background: "bg-danger/20",
    bar: "bg-danger",
  },
  success: {
    background: "bg-success/20",
    bar: "bg-success",
  },
};

export function ProgressBar({
  value = 0,
  max = 100,
  showAnimation = false,
  label,
  variant = "default",
  className = "",
  ...props
}: ProgressBarProps) {
  const safeValue = Math.min(max, Math.max(value, 0));
  const width = max ? `${(safeValue / max) * 100}%` : `${safeValue}%`;
  const styles = variantStyles[variant];

  return (
    <div
      className={`flex w-full items-center ${className}`.trim()}
      role="progressbar"
      aria-label="Progress bar"
      aria-valuenow={safeValue}
      aria-valuemax={max}
      {...props}
    >
      <div className={`relative flex h-2 w-full items-center rounded-full ${styles.background}`}>
        <div
          className={`h-full rounded-full ${styles.bar} ${showAnimation ? "transform-gpu transition-all duration-300 ease-in-out" : ""}`.trim()}
          style={{ width }}
        />
      </div>
      {label ? (
        <span className="ml-2 whitespace-nowrap text-sm font-medium leading-none text-foreground">
          {label}
        </span>
      ) : null}
    </div>
  );
}
