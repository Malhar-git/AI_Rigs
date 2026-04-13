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
        "w-fit max-w-full justify-self-start rounded-2xl border px-3 py-2 text-left transition-colors flex flex-col items-start",
        selected
          ? "border-zinc-500 bg-[#f4f4f4]"
          : "border-zinc-300 bg-[#f1f1f1] hover:bg-[#f5f5f5]",
        disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer",
        className,
      ].join(" ")}
    >
      <p className="font-primary tracking-tight text-zinc-800">{title}</p>

      {sub && (
        <small className="max-w-[34ch] text-zinc-500">
          {sub}
        </small>
      )}

      {badge && (
        <span className="mt-2 rounded-md border border-zinc-300 px-2 py-0 leading-none text-zinc-500">
          <small>{badge}</small>
        </span>
      )}
    </button>
  );
}