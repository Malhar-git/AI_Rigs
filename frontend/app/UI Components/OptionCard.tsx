"use client"

type CheckIconProps = {
  selected?: boolean;
  className?: string;
};

export function CheckIcon({ selected = true, className = "" }: CheckIconProps) {
  return (
    <span
      aria-hidden="true"
      className={[
        "flex h-4 w-4 shrink-0 items-center justify-center rounded-full border transition-colors",
        selected ? "border-accent bg-accent text-accent-foreground" : "border-border text-transparent",
        className,
      ].join(" ")}
    >
      <svg aria-hidden="true" viewBox="0 0 12 12" className="h-full w-full" fill="none">
        <path d="M4.75 8.25 2.5 6l-.75.75 3 3 5-5-.75-.75z" fill="currentColor" />
      </svg>
    </span>
  );
}

interface OptionCardProps {
  title: string;
  sub?: string;
  badge?: string;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
  /** Render the sub-line in the orange emphasis colour (e.g. VRAM floor). */
  highlightSub?: boolean;
  /** Render the badge as an orange emphasis chip (e.g. "Recommended"). */
  highlightBadge?: boolean;
  className?: string;
}

export default function OptionCard({
  title,
  sub,
  badge,
  selected = false,
  onClick,
  disabled = false,
  highlightSub = false,
  highlightBadge = false,
  className = "",
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={[
        "group relative flex w-full flex-col items-start rounded-card border px-5 py-4 text-left transition-colors",
        selected
          ? "border-accent border-2 "
          : "border-border bg-primary hover:border-secondary/50 hover:bg-muted",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      ].join(" ")}
    >
      <div className="flex w-full items-start justify-between gap-3">
        <p className="font-primary text-primary-foreground">
          {title}
        </p>

        <CheckIcon selected={selected} className="mt-0.5" />
      </div>

      {sub && (
        <small className={`mt-1 max-w-[36ch] ${highlightSub ? "font-medium text-accent" : "text-(--text-secondary)"}`}>
          {sub}
        </small>
      )}

      {badge && (
        <span
          className={[
            "mt-2 rounded-full px-2 py-0.5 leading-none",
            highlightBadge ? "bg-highlight/10 text-highlight" : "border border-border text-muted-foreground",
          ].join(" ")}
        >
          <small>{badge}</small>
        </span>
      )}
    </button>
  );
}
