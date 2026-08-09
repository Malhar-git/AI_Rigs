"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import PageShell from "../components/PageShell";
import { getBuild } from "@/lib/builds";
import type { BuildItem, BuildResponse } from "@/lib/types";

// ─── helpers ────────────────────────────────────────────────────────────────
// INR with Indian digit grouping, e.g. 320490 -> "₹3,20,490"
const inr = (n?: number) =>
  n == null ? "—" : `₹${Math.round(n).toLocaleString("en-IN")}`;

// The backend doesn't store product buy-links, so we point at an Amazon.in
// search for the part name, keeping the affiliate tag.
const amazonSearch = (name: string) =>
  `https://www.amazon.in/s?k=${encodeURIComponent(name)}&tag=airigs-21`;

// category (e.g. "motherboard") -> short badge code (e.g. "MB")
const CATEGORY_CODE: Record<string, string> = {
  gpu: "GPU", cpu: "CPU", motherboard: "MB", ram: "RAM", memory: "RAM",
  storage: "SSD", ssd: "SSD", psu: "PSU", power: "PSU",
  cooling: "COOL", cooler: "COOL", case: "CASE", chassis: "CASE", rack: "RACK",
};
const codeFor = (cat?: string) =>
  CATEGORY_CODE[(cat ?? "").toLowerCase()] ?? (cat ?? "—").slice(0, 4).toUpperCase();

const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : "");

// short descriptive line for a component: prefer Gemini's reason, else specs
const specLine = (item: BuildItem) =>
  item.reason ??
  [item.vramGb ? `${item.vramGb} GB` : null, item.brand].filter(Boolean).join(" · ");

// ─── buy button ──────────────────────────────────────────────────────────────
function AmazonBuyButton({ href, small }: { href: string; small?: boolean }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-1.5 rounded-md bg-[#ffd814] font-semibold text-[#0f1111] no-underline transition-colors hover:bg-[#f3c400] ${
        small ? "px-3 py-1.5 text-xs" : "px-3.5 py-2 text-xs"
      }`}
    >
      Buy on Amazon{" "}
      <span className="font-secondary text-[10px]">↗</span>
    </a>
  );
}

// ─── featured GPU ──────────────────────────────────────────────────────────────
function FeaturedGPU({ gpu, vramMax }: { gpu: BuildItem; vramMax: number }) {
  const vramNow = gpu.vramGb ?? 0;
  const vramFill = vramMax > 0 ? (vramNow / vramMax) * 100 : 100;

  return (
    <div className="mb-2.5 rounded border-2 border-accent bg-background">
      <div className="flex gap-4 p-5">
        <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded border border-border bg-muted font-secondary text-sm font-semibold tracking-wide text-accent">
          GPU
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="font-secondary text-[10.5px] font-semibold uppercase tracking-[0.14em] text-accent">
                Graphics · Centerpiece
              </p>
              <h3 className="mt-1 text-[19px] font-semibold tracking-tight leading-snug">
                {gpu.name}
              </h3>
              <p className="mt-1 font-secondary text-xs text-muted-foreground">{specLine(gpu)}</p>
            </div>

            <div className="shrink-0 text-right">
              <p className="font-secondary text-[17px] font-semibold whitespace-nowrap">
                {inr(gpu.priceInr)}
              </p>
              <div className="mt-2">
                <AmazonBuyButton href={amazonSearch(gpu.name)} />
              </div>
            </div>
          </div>

          {vramNow > 0 ? (
            <div className="mt-3">
              <div className="mb-1.5 flex justify-between font-secondary text-[10.5px] text-muted-foreground">
                <span className="uppercase tracking-[0.1em]">VRAM Pool</span>
                <span>
                  <strong className="text-foreground">{vramNow} GB</strong>
                  {vramMax > vramNow ? <> now → {vramMax} w/ upgrade</> : null}
                </span>
              </div>
              <div className="relative h-2.5 overflow-hidden rounded-sm border border-border bg-muted">
                <div className="absolute inset-y-0 left-0 bg-accent" style={{ width: `${vramFill}%` }} />
                <div className="absolute inset-y-0 bg-muted-foreground/20" style={{ left: `${vramFill}%`, right: 0 }} />
                <div className="absolute inset-y-0 w-px bg-border" style={{ left: `${vramFill}%` }} />
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

// ─── part row ──────────────────────────────────────────────────────────────────
function PartRow({ part }: { part: BuildItem }) {
  return (
    <div className="flex items-center gap-4 rounded border border-border bg-background px-4 py-3.5 transition-colors hover:border-accent border-2">
      <div className="flex h-13 w-13 shrink-0 items-center justify-center rounded border border-border bg-muted font-secondary tracking-wide text-muted-foreground">
        {codeFor(part.category)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-secondary text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {cap(part.category)}
        </p>
        <h6 className="mt-0.5 text-[15.5px] font-semibold tracking-tight">{part.name}</h6>
        <p className="mt-1 font-secondary text-[11.5px] text-muted-foreground">{specLine(part)}</p>
      </div>
      <div className="shrink-0 text-right">
        <p className="font-secondary text-[15px] font-semibold whitespace-nowrap">{inr(part.priceInr)}</p>
        <div className="mt-2">
          <AmazonBuyButton href={amazonSearch(part.name)} small />
        </div>
      </div>
    </div>
  );
}

// ─── component manifest ──────────────────────────────────────────────────────────
function ComponentManifest({ gpu, parts, vramMax }: { gpu?: BuildItem; parts: BuildItem[]; vramMax: number }) {
  const total = (gpu ? 1 : 0) + parts.length;
  return (
    <section className="min-w-0">
      <div className="mb-3.5 flex items-center gap-2.5">
        <span className="font-secondary text-xs font-semibold uppercase tracking-widest text-(--text-secondary)">
          Component Manifest
        </span>
        <span className="h-px flex-1 bg-border" />
        <span className="font-secondary text-[11px] uppercase tracking-[0.1em] text-muted-foreground">
          {total} Parts
        </span>
      </div>

      {gpu ? <FeaturedGPU gpu={gpu} vramMax={vramMax} /> : null}

      <div className="flex flex-col gap-2">
        {parts.map((part) => (
          <PartRow key={part.productId} part={part} />
        ))}
      </div>

      <p className="ml-0.5 mt-3.5 font-secondary text-[10.5px] leading-relaxed tracking-wide text-muted-foreground/70">
        As an Amazon Associate, AI Rigs earns from qualifying purchases. Prices indicative · Amazon.in.
      </p>
    </section>
  );
}

// ─── upgrade advisor ─────────────────────────────────────────────────────────────

type UpgradeTier = {
  rank: "current" | "good" | "better" | "best";
  label: string;          // "Now · Live" | "Good" | "Better" | "Best"
  gpuName: string;
  vramGb: number;
  costDeltaInr?: number;  // upgrade spend relative to current GPU
  models: string[];       // models this VRAM tier unlocks
  highlight?: string;     // one-liner selling point
  tag?: string;           // e.g. "Recommended"
};

/** Build a set of upgrade tiers from what the build tells us. */
function deriveUpgradeTiers(
  currentGpuName: string,
  currentVramGb: number,
  task: string | undefined,
): UpgradeTier[] {
  const isFine = (task ?? "").includes("fine");

  // ── model capability map: VRAM floor → model list ──────────────────────────
  const MODEL_UNLOCKS: { vram: number; models: string[] }[] = [
    { vram: 8,  models: ["Llama 3.1 7B", "Mistral 7B", "Phi-3 Mini"] },
    { vram: 16, models: ["Llama 3.1 13B", "Gemma 2 9B", "Qwen2 14B"] },
    { vram: 24, models: ["Llama 3.1 34B", "Codestral 22B", "Yi-34B"] },
    { vram: 48, models: ["Llama 3.1 70B", "Mixtral 8×7B", "Qwen2 72B"] },
    { vram: 80, models: ["Llama 3.1 405B", "DeepSeek-V3", "Mixtral 8×22B"] },
  ];
  const modelsFor = (vram: number) =>
    MODEL_UNLOCKS.filter((m) => m.vram <= vram).flatMap((m) => m.models).slice(-4);

  // ── GPU tiers above current VRAM ──────────────────────────────────────────
  type GpuSpec = { name: string; vramGb: number; priceInr: number; highlight: string };
  const GPU_LADDER: GpuSpec[] = [
    { name: "Radeon RX 7900 XTX",         vramGb: 24,  priceInr: 89_000,  highlight: "24 GB GDDR6 — runs 34B models natively" },
    { name: "NVIDIA RTX 4090",             vramGb: 24,  priceInr: 175_000, highlight: "CUDA ecosystem, fastest local inference" },
    { name: "NVIDIA RTX 4090 + 4090",      vramGb: 48,  priceInr: 350_000, highlight: "Dual-GPU NVLink — 70B at full precision" },
    { name: "NVIDIA RTX 6000 Ada",         vramGb: 48,  priceInr: 520_000, highlight: "Workstation-grade, ECC VRAM, PCIe 5" },
    { name: "NVIDIA H100 80GB SXM",        vramGb: 80,  priceInr: 3_500_000, highlight: "Data-centre class — 405B at fp16" },
  ];

  const aboveCurrent = GPU_LADDER.filter((g) => g.vramGb > currentVramGb);
  // Pick three evenly-spaced steps: VRAM jump categories 24, 48, 80+
  const good   = aboveCurrent.find((g) => g.vramGb === 24) ?? aboveCurrent[0];
  const better = aboveCurrent.find((g) => g.vramGb === 48) ?? aboveCurrent[1];
  const best   = aboveCurrent.find((g) => g.vramGb >= 80)  ?? aboveCurrent[aboveCurrent.length - 1];

  const tiers: UpgradeTier[] = [
    {
      rank: "current",
      label: "Now · Live",
      gpuName: currentGpuName,
      vramGb: currentVramGb,
      models: modelsFor(currentVramGb),
      highlight: isFine
        ? `LoRA fine-tuning up to 13B at Q8 — solid start`
        : `Inference at 16 GB VRAM — runs 13B models`,
    },
    ...(good ? [{
      rank: "good" as const,
      label: "Good",
      gpuName: good.name,
      vramGb: good.vramGb,
      costDeltaInr: good.priceInr,
      models: modelsFor(good.vramGb),
      highlight: good.highlight,
      tag: "Most popular",
    }] : []),
    ...(better && better !== good ? [{
      rank: "better" as const,
      label: "Better",
      gpuName: better.name,
      vramGb: better.vramGb,
      costDeltaInr: better.priceInr,
      models: modelsFor(better.vramGb),
      highlight: better.highlight,
      tag: "Recommended",
    }] : []),
    ...(best && best !== better ? [{
      rank: "best" as const,
      label: "Best",
      gpuName: best.name,
      vramGb: best.vramGb,
      costDeltaInr: best.priceInr,
      models: modelsFor(best.vramGb),
      highlight: best.highlight,
    }] : []),
  ];

  return tiers;
}

/** Mini horizontal VRAM bar */
function VramBar({ value, max }: { value: number; max: number }) {
  const pct = Math.round((value / max) * 100);
  return (
    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
      <div
        className="h-full rounded-full bg-accent transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

/** Rank → colour mapping for tier pills */
const RANK_STYLE: Record<string, string> = {
  current: "bg-accent/10 text-accent border border-accent/25",
  good:    "bg-muted text-muted-foreground border border-border",
  better:  "bg-highlight/10 text-highlight border border-highlight/25",
  best:    "bg-warning/10 text-warning border border-warning/25",
};

function UpgradeAdvisor({
  build,
}: {
  build: BuildResponse;
}) {
  const components = build.components ?? [];
  const gpu =
    components.find((c) => c.isPrimary) ??
    components.find((c) => (c.category ?? "").toLowerCase() === "gpu");

  const currentVram  = gpu?.vramGb ?? 0;
  const currentName  = gpu?.name   ?? "Current GPU";
  const task         = build.task;
  const modelName    = build.modelName;

  const tiers    = deriveUpgradeTiers(currentName, currentVram, task);
  const maxVram  = tiers.at(-1)?.vramGb ?? currentVram;

  // Bottleneck feedback line
  const isFine   = (task ?? "").includes("fine");
  const feedback = isFine
    ? `${currentVram} GB VRAM supports Q8 LoRA fine-tuning up to ~13B. Full-precision (fp16) fine-tuning of 30B+ models needs ≥48 GB.`
    : `${currentVram} GB handles inference for models up to 13B. Larger models require more VRAM — see tiers below.`;

  return (
    <aside className="sticky top-21 overflow-hidden rounded-md border border-border bg-background">
      {/* Header */}
      <div className="flex items-center gap-2 border-b border-border px-5 py-3.5">
        <span className="font-secondary text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
          Upgrade Path
        </span>
        <span className="h-px flex-1 bg-border" />
        <span className="rounded-sm bg-muted px-2 py-0.5 font-secondary text-[10px] font-semibold text-muted-foreground">
          {tiers.length - 1} options
        </span>
      </div>

      {/* Bottleneck callout */}
      <div className="mx-4 mt-4 rounded-md border border-warning/30 bg-warning/5 px-3.5 py-3">
        <p className="font-secondary text-[9.5px] font-semibold uppercase tracking-[0.12em] text-warning">
          ⚠ Current Bottleneck
        </p>
        <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">
          {feedback}
        </p>
      </div>

      {/* Tier cards */}
      <div className="flex flex-col gap-0 divide-y divide-border">
        {tiers.map((tier) => (
          <div
            key={tier.rank}
            className={`relative px-5 py-4 ${
              tier.rank === "current"
                ? "bg-accent/[0.03]"
                : "transition-colors hover:bg-muted/50"
            }`}
          >
            {/* Tier label row */}
            <div className="flex items-center gap-2">
              <span
                className={`inline-flex items-center rounded-sm px-1.5 py-0.5 font-secondary text-[9.5px] font-semibold uppercase tracking-[0.1em] ${
                  RANK_STYLE[tier.rank]
                }`}
              >
                {tier.label}
              </span>
              {tier.tag && (
                <span className="rounded-sm bg-accent/10 px-1.5 py-0.5 font-secondary text-[9px] font-semibold uppercase tracking-[0.1em] text-accent">
                  {tier.tag}
                </span>
              )}
              {tier.rank !== "current" && tier.costDeltaInr != null && (
                <span className="ml-auto font-secondary text-[11px] font-semibold text-muted-foreground">
                  {inr(tier.costDeltaInr)}
                </span>
              )}
            </div>

            {/* GPU name */}
            <p className="mt-1.5 text-[13.5px] font-semibold leading-snug tracking-tight">
              {tier.gpuName}
            </p>

            {/* Highlight line */}
            {tier.highlight && (
              <p className="mt-0.5 font-secondary text-[11px] leading-relaxed text-muted-foreground">
                {tier.highlight}
              </p>
            )}

            {/* VRAM bar */}
            <div className="mt-2 flex items-center gap-2">
              <span className="font-secondary text-[10px] text-muted-foreground">
                VRAM
              </span>
              <span className="font-secondary text-[11px] font-semibold text-foreground">
                {tier.vramGb} GB
              </span>
              <div className="flex-1">
                <VramBar value={tier.vramGb} max={maxVram} />
              </div>
            </div>

            {/* Models unlocked */}
            <div className="mt-2.5 flex flex-wrap gap-1">
              {tier.models.map((m) => (
                <span
                  key={m}
                  className={`rounded px-1.5 py-0.5 font-secondary text-[9.5px] font-medium ${
                    modelName && m.toLowerCase().includes(modelName.split(" ")[1]?.toLowerCase() ?? "")
                      ? "bg-accent/15 text-accent"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {m}
                </span>
              ))}
            </div>

            {/* Amazon search link for upgrades */}
            {tier.rank !== "current" && (
              <a
                href={amazonSearch(tier.gpuName)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex items-center gap-1 rounded-md bg-[#ffd814] px-3 py-1.5 font-secondary text-[10.5px] font-semibold text-[#0f1111] transition-colors hover:bg-[#f3c400]"
              >
                Shop {tier.gpuName.split(" ").slice(-2).join(" ")} ↗
              </a>
            )}
          </div>
        ))}
      </div>

      {/* Footer note */}
      <p className="px-5 py-3 font-secondary text-[9.5px] leading-relaxed tracking-wide text-muted-foreground/60">
        Prices indicative · Amazon.in. VRAM requirements shown at Q8 quantization unless noted.
      </p>
    </aside>
  );
}

// ─── build sheet modal ───────────────────────────────────────────────────────────
function BuildSheetModal({
  build,
  onClose,
}: {
  build: BuildResponse;
  onClose: () => void;
}) {
  const components = build.components ?? [];
  const [copied, setCopied] = useState(false);
  const [shopping, setShopping] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  // Staggered "open all" — opens each Amazon search tab 500 ms apart so
  // browsers don't collapse them. The first window.open fires from within the
  // click handler (trusted user gesture), so it's never blocked.
  const handleShopAll = useCallback(() => {
    setShopping(true);
    components.forEach((part, i) => {
      setTimeout(() => {
        window.open(amazonSearch(part.name), `_ai_rig_${i}`);
        if (i === components.length - 1) setShopping(false);
      }, i * 500);
    });
  }, [components]);

  const handleCopy = useCallback(() => {
    const lines = [
      `# ${build.buildName}`,
      `Total: ${inr(build.totalPriceInr)} · ${components.length} parts`,
      "",
      ...components.map(
        (c) =>
          `${(c.category ?? "Part").padEnd(14)} ${c.name.padEnd(46)} ${inr(c.priceInr)}`,
      ),
      "",
      build.summaryReasoning ?? "",
      "",
      `Built with AI Rigs · airigs.in`,
    ];
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [build, components]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Sheet */}
      <div className="relative z-10 flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-border bg-background shadow-2xl sm:rounded-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="font-secondary text-[10.5px] font-semibold uppercase tracking-[0.14em] text-accent">
              Build Sheet
            </p>
            <h3 className="mt-0.5 text-lg font-semibold tracking-tight">{build.buildName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Component list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <div className="flex flex-col divide-y divide-border">
            {components.map((part) => (
              <div key={part.productId} className="flex items-center gap-4 py-3.5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded border border-border bg-muted font-secondary text-[10px] font-semibold tracking-wide text-muted-foreground">
                  {codeFor(part.category)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-secondary text-[9.5px] uppercase tracking-[0.12em] text-muted-foreground">
                    {cap(part.category)}
                  </p>
                  <p className="mt-0.5 truncate text-sm font-semibold">{part.name}</p>
                  {part.reason && (
                    <p className="mt-0.5 font-secondary text-[10.5px] text-muted-foreground line-clamp-1">
                      {part.reason}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="font-secondary text-sm font-semibold">{inr(part.priceInr)}</p>
                  <a
                    href={amazonSearch(part.name)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1.5 inline-flex items-center gap-1 rounded bg-[#ffd814] px-2.5 py-1 font-secondary text-[9.5px] font-semibold text-[#0f1111] transition-colors hover:bg-[#f3c400]"
                  >
                    Buy ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-muted/30 px-6 py-4">
          {/* Total */}
          <div className="mb-4 flex items-baseline justify-between">
            <span className="font-secondary text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Total Build Cost
            </span>
            <span className="font-secondary text-2xl font-semibold tracking-tight">
              {inr(build.totalPriceInr)}
            </span>
          </div>

          {/* Note about multi-tab */}
          <p className="mb-3 font-secondary text-[10.5px] leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">"Shop All on Amazon"</span> opens a separate Amazon.in
            search tab for each part, staggered to avoid popup-blocker issues. Allow popups for this
            site if asked.
          </p>

          {/* Actions */}
          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={handleShopAll}
              disabled={shopping}
              className="flex-1 rounded-md bg-[#ffd814] px-5 py-2.5 font-secondary text-sm font-semibold text-[#0f1111] transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {shopping
                ? `Opening ${components.length} tabs…`
                : `🛒 Shop All on Amazon (${components.length} parts)`}
            </button>
            <button
              type="button"
              onClick={handleCopy}
              className="rounded-md border border-border bg-background px-5 py-2.5 font-secondary text-sm font-semibold transition-colors hover:bg-muted"
            >
              {copied ? "✓ Copied!" : "Copy build"}
            </button>
          </div>

          <p className="mt-3 font-secondary text-[9px] text-muted-foreground/60">
            As an Amazon Associate, AI Rigs earns from qualifying purchases.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── total build bar ─────────────────────────────────────────────────────────────
type BuildStat = { value: string; unit: string; label: string; accent: boolean };

function TotalBuildBar({
  total,
  parts,
  stats,
  onExport,
}: {
  total: number;
  parts: number;
  stats: BuildStat[];
  onExport: () => void;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-background/90 shadow-[0_-8px_24px_rgba(0,0,0,0.07)] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-3.5 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center gap-7">
          <div className="shrink-0">
            <p className="font-secondary text-[11px] uppercase tracking-[0.14em] text-muted-foreground">
              Total Build Cost
            </p>
            <div className="mt-1.5 flex items-baseline gap-2.5">
              <span className="font-secondary text-4xl font-semibold leading-none tracking-tight">
                {inr(total)}
              </span>
              <span className="text-sm text-muted-foreground">{parts} parts</span>
            </div>
          </div>

          <div className="flex min-w-[280px] flex-1 gap-2.5">
            {stats.map((stat) => (
              <div key={stat.label} className="flex-1 rounded border border-border bg-background px-3 py-3">
                <p className={`font-secondary text-xl font-semibold ${stat.accent ? "text-accent" : "text-foreground"}`}>
                  {stat.value}
                  <span className="text-[11px] text-muted-foreground">{stat.unit}</span>
                </p>
                <p className="mt-1 font-secondary text-[9.5px] uppercase tracking-[0.1em] text-muted-foreground">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>

          <div className="flex shrink-0 flex-col items-stretch gap-2.5">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-success" />
              <span className="text-sm text-success">All compatibility checks passed</span>
            </div>
            <button
              type="button"
              onClick={onExport}
              className="h-11 rounded bg-accent px-7 font-primary text-[15px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              Export build sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── page states ────────────────────────────────────────────────────────────────
function CenteredMessage({ children, tone }: { children: React.ReactNode; tone?: "error" }) {
  return (
    <PageShell>
      <div className={`py-24 text-center ${tone === "error" ? "text-red-500" : "text-muted-foreground"}`}>
        {children}
      </div>
    </PageShell>
  );
}

// ─── data-driven content ─────────────────────────────────────────────────────────
function RigOverviewContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [build, setBuild] = useState<BuildResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  useEffect(() => {
    if (!id) {
      setError("No build id in the URL. Generate a build from the wizard first.");
      setLoading(false);
      return;
    }
    let cancelled = false; // guard against setting state after unmount
    setLoading(true);
    getBuild(id)
      .then((b) => {
        if (!cancelled) setBuild(b);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load build");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <CenteredMessage>Loading your build…</CenteredMessage>;
  if (error) return <CenteredMessage tone="error">{error}</CenteredMessage>;
  if (!build) return null;

  // ─── derive view data from the response ─────────────────────
  const components = build.components ?? [];
  const gpu =
    components.find((c) => c.isPrimary) ??
    components.find((c) => (c.category ?? "").toLowerCase() === "gpu");
  const parts = components.filter((c) => c !== gpu);

  const vramNow = gpu?.vramGb ?? 0;

  const perf = build.performanceEstimate;
  const stats: BuildStat[] = [
    { value: vramNow ? String(vramNow) : "—", unit: " GB", label: "VRAM", accent: false },
    { value: String(components.length), unit: "", label: "Components", accent: false },
    perf?.generationTps != null
      ? { value: perf.generationTps.toFixed(0), unit: " tok/s", label: "Gen speed", accent: true }
      : { value: build.vramFloorGb != null ? String(build.vramFloorGb) : "—", unit: " GB", label: "VRAM floor", accent: false },
    { value: cap(build.budgetTier) || "—", unit: "", label: "Budget tier", accent: false },
  ];

  return (
    <>
      <PageShell width="wide">
        <div className="mt-6 flex justify-between">
          <h2 className="max-w-[14ch] text-[clamp(2.5rem,5vw,4rem)] text-(--text-primary) tracking-tight">
            {build.buildName}
          </h2>
          {build.summaryReasoning ? (
            <h4 className="mt-4 max-w-[42ch] line-clamp-5 text-base text-(--text-secondary) mr-18 leading-relaxed">
              {build.summaryReasoning}
            </h4>
          ) : null}
        </div>

        <div className="mt-7 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_326px]">
          <ComponentManifest gpu={gpu} parts={parts} vramMax={vramNow} />
          <UpgradeAdvisor build={build} />
        </div>

        <div className="h-36" />
      </PageShell>

      <TotalBuildBar
        total={build.totalPriceInr}
        parts={components.length}
        stats={stats}
        onExport={() => setSheetOpen(true)}
      />

      {sheetOpen && (
        <BuildSheetModal build={build} onClose={() => setSheetOpen(false)} />
      )}
    </>
  );
}

// useSearchParams requires a Suspense boundary in the App Router.
export default function RigOverview() {
  return (
    <Suspense fallback={<CenteredMessage>Loading…</CenteredMessage>}>
      <RigOverviewContent />
    </Suspense>
  );
}
