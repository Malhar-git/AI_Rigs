"use client";

import { Suspense, useEffect, useState } from "react";
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
              <p className="mt-1 font-secondary text-xs text-secondary">{specLine(gpu)}</p>
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
    <div className="flex items-center gap-4 rounded border border-border bg-background px-4 py-3.5 transition-colors hover:border-muted-foreground/40">
      <div className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded border border-border bg-muted font-secondary text-[11px] font-semibold tracking-wide text-secondary">
        {codeFor(part.category)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-secondary text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
          {cap(part.category)}
        </p>
        <p className="mt-0.5 text-[15.5px] font-semibold tracking-tight">{part.name}</p>
        <p className="mt-1 font-secondary text-[11.5px] text-secondary">{specLine(part)}</p>
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
        <span className="font-secondary text-xs font-semibold uppercase tracking-[0.16em] text-secondary">
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

// ─── upgrade path ────────────────────────────────────────────────────────────────
type Phase = { label: string; delta: string; title: string; description: string; active: boolean };

function UpgradePath({ phases }: { phases: Phase[] }) {
  const lastIndex = phases.length - 1;
  return (
    <aside className="sticky top-21 overflow-hidden rounded-md border border-border bg-background">
      <div className="p-5">
        <div className="mb-4 flex items-center gap-2">
          <span className="font-secondary text-[11px] font-semibold uppercase tracking-[0.14em] text-secondary">
            Upgrade Path
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>

        <div className="relative pl-7">
          <div className="absolute bottom-2 left-1.75 top-[7px] w-0.5 bg-border" />

          {phases.map((phase, i) => (
            <div key={phase.label} className={i < lastIndex ? "relative mb-5" : "relative"}>
              <div
                className={`absolute -left-7 top-0.5 h-4 w-4 rounded-full border-2 ${
                  phase.active ? "border-accent bg-accent" : "border-border bg-background"
                }`}
              />

              {phase.active ? (
                <p className="font-secondary text-[9.5px] font-semibold uppercase tracking-[0.14em] text-accent">
                  {phase.label}
                </p>
              ) : (
                <div className="flex items-center justify-between gap-2">
                  <span className="font-secondary text-[9.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                    {phase.label}
                  </span>
                  {phase.delta && (
                    <span className="rounded-sm bg-muted px-1.5 py-0.5 font-secondary text-[10px] font-semibold text-secondary">
                      {phase.delta}
                    </span>
                  )}
                </div>
              )}

              <p className="mt-1 text-sm font-semibold">{phase.title}</p>
              <p className="mt-0.5 text-[12.5px] leading-snug text-secondary">{phase.description}</p>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="mt-5 w-full rounded border border-border bg-background py-2.5 font-secondary text-[11px] font-semibold uppercase tracking-[0.1em] text-foreground transition-colors hover:bg-muted"
        >
          Plan an upgrade ↗
        </button>
      </div>
    </aside>
  );
}

// ─── total build bar ─────────────────────────────────────────────────────────────
type BuildStat = { value: string; unit: string; label: string; accent: boolean };

function TotalBuildBar({ total, parts, stats }: { total: number; parts: number; stats: BuildStat[] }) {
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
      <div className={`py-24 text-center ${tone === "error" ? "text-red-500" : "text-secondary"}`}>
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

  const upgrades = build.upgradePaths ?? [];
  const hasGpuUpgrade = upgrades.some((u) => (u.target ?? "").toLowerCase() === "gpu");
  const vramNow = gpu?.vramGb ?? 0;
  const vramMax = hasGpuUpgrade ? vramNow * 2 : vramNow;

  // upgrade timeline: a live "now" node, then any backend-provided upgrade paths
  const phases: Phase[] = [
    {
      label: "Now · Live",
      delta: "",
      title: gpu ? `${gpu.name}${vramNow ? ` · ${vramNow} GB` : ""}` : build.buildName,
      description: build.modelName
        ? `Runs ${build.modelName} today.`
        : build.summaryReasoning ?? "Your configured build.",
      active: true,
    },
    ...upgrades.map((u, i) => ({
      label: `Phase 0${i + 2}`,
      delta: u.maxPossible ?? "",
      title: `Expand ${cap(u.target)}`,
      description:
        [u.currentSpec, u.maxPossible].filter(Boolean).join(" → ") +
        (u.slotsFree ? ` · ${u.slotsFree} free` : ""),
      active: false,
    })),
  ];

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
      <PageShell>
        <div className="py-2.5">
          <h1 className="m-0 max-w-[16ch] text-[clamp(2.5rem,5vw,4rem)] font-semibold leading-[0.98] tracking-[-0.035em]">
            {build.buildName}
          </h1>
          {build.summaryReasoning ? (
            <p className="mt-4 max-w-[52ch] text-[17px] leading-relaxed text-secondary">
              {build.summaryReasoning}
            </p>
          ) : null}
        </div>

        <div className="mt-7 grid grid-cols-1 items-start gap-6 lg:grid-cols-[1fr_326px]">
          <ComponentManifest gpu={gpu} parts={parts} vramMax={vramMax} />
          <UpgradePath phases={phases} />
        </div>

        <div className="h-36" />
      </PageShell>

      <TotalBuildBar total={build.totalPriceInr} parts={components.length} stats={stats} />
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
