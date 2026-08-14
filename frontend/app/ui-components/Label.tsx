import clsx from "clsx";

type Variant = "default" | "active" | "special" | "specialCompact" | "error";

type LabelProps = {
  children: React.ReactNode;
  htmlFor?: string;
  variant?: Variant;
  required?: boolean;
  className?: string;
  uppercase?: boolean;
  tooltip?: React.ReactNode;
  tooltipPosition?: "top" | "bottom";
  tooltipClassName?: string;
};

const baseStyles =
  "inline-flex font-secondary items-center rounded-0 border border-border px-3 py-1 text-xs font-medium tracking-wide select-none";

const variants: Record<Variant, string> = {
  default: "bg-muted text-foreground",
  active: "bg-accent text-background border-accent",
  special: "bg-accent text-primary",
  specialCompact: "bg-accent text-primary px-2! text-[12px]! leading-none!",
  error: "bg-danger text-primary-foreground",
};

export default function Label({
  children,
  htmlFor,
  variant = "default",
  required = false,
  className = "",
  uppercase = true,
  tooltip,
  tooltipPosition = "top",
  tooltipClassName = "",
}: LabelProps) {
  const positionClass =
    tooltipPosition === "top" ? "top-full mt-1" : "bottom-full mb-1";

  const classes = clsx(
    baseStyles,
    variants[variant],
    uppercase && "uppercase",
    className,
  );

  const tooltipClasses = clsx(
    "pointer-events-none absolute left-0 z-20 max-w-xs rounded border border-border bg-background px-2 py-1 text-xs text-foreground opacity-0 transition-opacity duration-150 delay-500 group-hover:opacity-100 group-focus-within:opacity-100",
    positionClass,
    tooltipClassName,
  );

  const content = (
    <>
      {children}
      {required && <span className="ml-1">*</span>}
    </>
  );

  if (htmlFor) {
    return (
      <span className="group relative inline-flex">
        <label htmlFor={htmlFor} className={classes}>
          {content}
        </label>
        {tooltip && (
          <span role="tooltip" className={tooltipClasses}>
            {tooltip}
          </span>
        )}
      </span>
    );
  }

  return (
    <span className="group relative inline-flex">
      <span className={classes}>{content}</span>
      {tooltip && (
        <span role="tooltip" className={tooltipClasses}>
          {tooltip}
        </span>
      )}
    </span>
  );
}