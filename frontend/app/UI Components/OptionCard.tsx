"use client"

interface OptionCardProps {
  title: string;
  sub?: string;
  badge?: string;
  selected?: boolean;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

export default function OptionCard({
  title,
  sub,
  badge,
  selected = false,
  onClick,
  disabled = false,
  className = "",
}: OptionCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "w-fit max-w-full justify-self-start rounded-2xl border px-5 py-4 text-left transition-colors flex flex-col items-start",
        selected
          ? "border-foreground bg-primary"
          : "border-border bg-primary hover:bg-muted",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      ].join(" ")}
    >
      <p className="font-primary tracking-tight text-foreground">{title}</p>

      {sub && (
        <small className="max-w-[36ch] text-secondary">
          {sub}
        </small>
      )}

      {badge && (
        <span className="mt-2 rounded-md border border-border px-2 py-0 leading-none text-secondary">
          <small>{badge}</small>
        </span>
      )}
    </button>
  );
}