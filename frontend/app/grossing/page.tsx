"use client";

import { useEffect, useMemo, useState } from "react";
import PageShell from "../components/PageShell";
import { getModelLeaderboard } from "@/lib/models";
import type { ModelBenchmark } from "@/lib/types";

// Categories the arena scraper may populate. Only "coding" has data today,
// so chat, reasoning, and agentic map to the coding leaderboard for now.
const CATEGORIES = ["coding", "math", "chat", "reasoning", "agentic"];
const BACKEND_CATEGORY_MAP: Record<string, string> = {
  coding: "coding",
  math: "math",
  chat: "coding",
  reasoning: "coding",
  agentic: "coding",
};
const TIERS = ["S", "A", "B", "C", "D"];

// Show the top N ranked models and bucket them into tiers by Elo position.
const DISPLAY_LIMIT = 60;

const TIER_COLORS: Record<string, { bg: string }> = {
  S: { bg: "hsl(0, 72%, 59%)" },
  A: { bg: "hsl(36, 86%, 55%)" },
  B: { bg: "hsl(210, 71%, 54%)" },
  C: { bg: "hsl(53, 3%, 52%)" },
  D: { bg: "hsl(49, 7%, 68%)" },
};

// Tier from 1-based position in the Elo-sorted, displayed set.
function tierForPosition(pos: number): string {
  if (pos <= 5) return "S";
  if (pos <= 15) return "A";
  if (pos <= 30) return "B";
  if (pos <= 45) return "C";
  return "D";
}

const num = (n?: number | null) => (n == null ? "—" : n.toLocaleString("en-IN"));

// ─── presentational pieces ────────────────────────────────────────────────────
function ModelChip({ model, rank }: { model: ModelBenchmark; rank: number }) {
  return (
    <div className="border border-(--text-secondary) bg-primary px-3 py-2 text-left" title={model.priceRaw ?? undefined}>
      <div className="text-sm font-medium">{model.modelName}</div>
      <div className="text-xs text-(--text-primary) opacity-70">
        #{model.arenaRank ?? rank} · {model.eloScore ?? "—"} Elo
      </div>
      <div className="text-[0.65rem] uppercase tracking-wide text-(--text-secondary)">
        {num(model.votes)} votes{model.license ? ` · ${model.license}` : ""}
      </div>
    </div>
  );
}

function TierRow({ tier, models }: { tier: string; models: { model: ModelBenchmark; rank: number }[] }) {
  const c = TIER_COLORS[tier];
  return (
    <div className="flex border-b border-border last:border-b-0">
      <div style={{ background: c?.bg }} className="flex items-center justify-center w-20 shrink-0 text-3xl font-bold">
        {tier}
      </div>
      <div className="flex-1 flex flex-wrap gap-2 py-3 px-4 bg-muted">
        {models.length === 0 ? (
          <span className="text-sm text-muted-foreground py-2">No models</span>
        ) : (
          models.map(({ model, rank }) => <ModelChip key={model.id} model={model} rank={rank} />)
        )}
      </div>
    </div>
  );
}

// ─── page ─────────────────────────────────────────────────────────────────────
export default function Grossing() {
  const [category, setCategory] = useState("coding");
  const [license, setLicense] = useState<string | null>(null);
  const [rows, setRows] = useState<ModelBenchmark[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const backendCategory = BACKEND_CATEGORY_MAP[category] ?? category;

  // (Re)fetch whenever the category changes. License is filtered client-side so
  // the license options stay derived from the full category set.
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setLicense(null);
    getModelLeaderboard(backendCategory)
      .then((data) => {
        if (!cancelled) setRows(data);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load leaderboard");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [backendCategory]);

  // distinct licenses in this category, for the filter row
  const licenses = useMemo(
    () => Array.from(new Set(rows.map((r) => r.license).filter((l): l is string => !!l))).sort(),
    [rows],
  );

  // sort by Elo desc, filter by license, take the top slice, bucket into tiers
  const tierGroups = useMemo(() => {
    const ranked = [...rows]
      .sort((a, b) => (b.eloScore ?? 0) - (a.eloScore ?? 0))
      .filter((r) => !license || r.license === license)
      .slice(0, DISPLAY_LIMIT)
      .map((model, i) => ({ model, rank: i + 1 }));

    const groups: Record<string, { model: ModelBenchmark; rank: number }[]> = {};
    TIERS.forEach((t) => (groups[t] = []));
    ranked.forEach((entry) => groups[tierForPosition(entry.rank)]?.push(entry));
    return groups;
  }, [rows, license]);

  const lastSynced = useMemo(() => {
    const dates = rows.map((r) => r.syncedAt).filter((d): d is string => !!d);
    return dates.length ? dates.sort().at(-1) : null;
  }, [rows]);

  return (
    <PageShell width="wide">
      <div className="mt-6">
        <h3>Model Leaderboard</h3>
        <h4 className="text-muted-foreground">Best LLMs — 2026 Rankings</h4>
        <h5 className="max-w-2xl">
          Live LMArena Elo rankings for local and hosted LLMs — ordered by community votes across head-to-head
          matchups.Tiers are derived from Elo standing.
        </h5>
        {lastSynced ? (
          <small className="font-secondary uppercase tracking-wide text-muted-foreground">
            Data from LMArena · updated {new Date(lastSynced).toLocaleDateString("en-IN")}
          </small>
        ) : null}
      </div>

      {/* category tabs */}
      <div className="flex gap-1 flex-wrap mt-6 mb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className={`px-3 py-1 text-sm capitalize transition-colors hover:cursor-pointer ${cat === category ? "bg-accent text-primary" : "bg-muted hover:bg-border"
              }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* license filter — only shown when there's data with licenses */}
      {licenses.length > 0 ? (
        <div className="flex gap-1 flex-wrap mb-4 items-center">
          <small className="font-secondary uppercase tracking-wide text-muted-foreground mr-1">License</small>
          <button
            onClick={() => setLicense(null)}
            className={`px-2.5 py-1 text-xs transition-colors hover:cursor-pointer ${license === null ? "bg-secondary text-secondary-foreground" : "bg-muted hover:bg-border"
              }`}
          >
            All
          </button>
          {licenses.map((l) => (
            <button
              key={l}
              onClick={() => setLicense(l)}
              className={`px-2.5 py-1 text-xs transition-colors hover:cursor-pointer ${license === l ? "bg-secondary text-secondary-foreground" : "bg-muted hover:bg-border"
                }`}
            >
              {l}
            </button>
          ))}
        </div>
      ) : null}

      {loading ? (
        <div className="py-16 text-center text-muted-foreground">Loading leaderboard…</div>
      ) : error ? (
        <div className="py-16 text-center text-red-500">{error}</div>
      ) : rows.length === 0 ? (
        <div className="py-16 text-center text-muted-foreground">
          No benchmark data for <span className="capitalize">{category}</span> yet.
        </div>
      ) : (
        <div className="border border-border overflow-hidden mb-6">
          {TIERS.map((tier) => (
            <TierRow key={tier} tier={tier} models={tierGroups[tier]} />
          ))}
        </div>
      )}
    </PageShell>
  );
}
