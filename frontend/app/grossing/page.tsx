/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useMemo, useState } from "react";
import PageShell from "../components/PageShell";

const MODELS = [
  { name: "Apex Alpha", maker: "NovaLabs", params: "N/A", tier: "S", category: "overall", mmlu: 91.0, gpqa: 91.3, code: 95.0, math: 100.0, price: "$15 / $75" },
  { name: "Apex Sigma", maker: "NovaLabs", params: "N/A", tier: "A", category: "overall", mmlu: 89.3, gpqa: 89.9, code: 92.1, math: 52.8, price: "$3 / $15" },
  { name: "Helio R1", maker: "BrightMind", tier: "S", params: "671B", category: "reasoning", mmlu: 90.8, gpqa: 71.5, code: 90.2, math: 87.5, price: "$0.28 / $0.42" },
  { name: "Helio V3.2", maker: "BrightMind", tier: "S", params: "685B", category: "agentic", mmlu: 88.5, gpqa: 79.9, code: 74.1, math: 89.3, price: "$0.28 / $0.42" },
  { name: "Lumen Pro", maker: "Aurora AI", tier: "A", params: "N/A", category: "coding", mmlu: 91.8, gpqa: 91.9, code: 93.0, math: 100.0, price: "$2 / $12" },
  { name: "Quartz 5", maker: "Pinecone Labs", tier: "S", params: "744B", category: "agentic", mmlu: 85.0, gpqa: 86.0, code: 90.0, math: 84.0, price: "N/A" },
  { name: "Forge 5.4", maker: "Vertex Systems", tier: "S", params: "N/A", category: "coding", mmlu: 0, gpqa: 92.8, code: 0, math: 0, price: "$2.50 / $15" },
  { name: "Mesh 120B", maker: "Vertex Systems", tier: "B", params: "117B", category: "chat", mmlu: 90.0, gpqa: 80.9, code: 88.3, math: 97.9, price: "N/A" },
  { name: "Tempo X3", maker: "Skyforge", tier: "C", params: "N/A", category: "chat", mmlu: 0, gpqa: 84.6, code: 94.5, math: 93.3, price: "$3 / $15" },
  { name: "Echo K2.5", maker: "Moonbeam", tier: "S", params: "1T", category: "agentic", mmlu: 92.0, gpqa: 87.6, code: 99.0, math: 96.1, price: "N/A" },
  { name: "Driftwood 4", maker: "Glacier AI", tier: "C", params: "400B", category: "chat", mmlu: 85.5, gpqa: 69.8, code: 62.0, math: 0, price: "N/A" },
  { name: "Pulse Flash", maker: "Redfox", tier: "A", params: "309B", category: "agentic", mmlu: 86.7, gpqa: 83.7, code: 84.8, math: 94.1, price: "N/A" },
  { name: "Cobalt M2.5", maker: "Halcyon", tier: "A", params: "230B", category: "agentic", mmlu: 85.0, gpqa: 85.2, code: 89.6, math: 86.3, price: "$0.30 / $1.20" },
  { name: "Granite L", maker: "Stonewell", tier: "A", params: "675B", category: "math", mmlu: 85.5, gpqa: 43.9, code: 92.0, math: 88.0, price: "N/A" },
  { name: "Beacon 253B", maker: "Hyperion", tier: "B", params: "253B", category: "reasoning", mmlu: 0, gpqa: 76.0, code: 0, math: 72.5, price: "N/A" },
  { name: "Solace 3.5", maker: "Aether", tier: "A", params: "397B", category: "reasoning", mmlu: 88.5, gpqa: 88.4, code: 0, math: 0, price: "N/A" },
  { name: "Flicker Flash", maker: "Driftcore", tier: "A", params: "196B", category: "coding", mmlu: 0, gpqa: 0, code: 81.1, math: 99.8, price: "$0.10 / $0.30" },
];

const TIERS = ["S", "A", "B", "C", "D"];
const CATEGORIES = ["overall", "coding", "math", "chat", "reasoning", "agentic"];

const TIER_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  S: { bg: "hsl(0, 72%, 59%)", border: "hsl(0, 72%, 59%)", text: "hsl(0, 59%, 30%)" },
  A: { bg: "hsl(36, 86%, 55%)", border: "hsl(36, 86%, 55%)", text: "hsl(33, 85%, 28%)" },
  B: { bg: "hsl(210, 71%, 54%)", border: "hsl(210, 71%, 54%)", text: "hsl(210, 82%, 27%)" },
  C: { bg: "hsl(53, 3%, 52%)", border: "hsl(53, 3%, 52%)", text: "hsl(60, 2%, 26%)" },
  D: { bg: "hsl(49, 7%, 68%)", border: "hsl(49, 7%, 68%)", text: "hsl(48, 3%, 36%)" },
};

function ModelChip({ model, onClick }: { model: any; onClick: (m: any) => void }) {
  return (
    <button
      onClick={() => onClick(model)}
      className="px-3 py-2 text-left hover:opacity-80 transition-opacity border border-input"
    >
      <div className="text-sm font-medium">{model.name}</div>
      <div className="text-xs opacity-70">
        {model.maker}{model.params !== "N/A" ? ` · ${model.params}` : ""}
      </div>
    </button>
  );
}

function TierRow({ tier, models, onSelect }: { tier: string; models: any[]; onSelect: (m: any) => void }) {
  const c = TIER_COLORS[tier];
  return (
    <div className="flex border-b border-border last:border-b-0">
      <div style={{ background: c?.bg }} className="flex items-center justify-center w-20 shrink-0 text-3xl font-bold">
        {tier}
      </div>
      <div className="flex-1 flex flex-wrap gap-2 py-4 px-6 bg-muted">
        {models.length === 0 ? (
          <span className="text-sm text-muted-foreground py-2">No models</span>
        ) : (
          models.map((m: any) => <ModelChip key={m.name} model={m} onClick={onSelect} />)
        )}
      </div>
    </div>
  );
}

export default function Grossing() {
  const [category, setCategory] = useState("overall");
  const [, setDetail] = useState<any>(null);

  const filteredByCategory = category === "overall" ? MODELS : MODELS.filter((m: any) => m.category === category);

  const tierGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    TIERS.forEach((t) => (groups[t] = []));
    filteredByCategory.forEach((m: any) => groups[m.tier]?.push(m));
    return groups;
  }, [filteredByCategory]);

  return (
    <PageShell>
      <div className="max-w-xl">
        <h4 className="text-secondary">Best LLMs - 2026 Rankings</h4>
        <h3>Top Grossing Leaderboard</h3>
        <p>The definitive ranking of LLMs and hardware for retail — compared across quality, speed, hardware requirements, and cost. Find the best for your local AI infrastructure.</p>
      </div>

      <div className="flex gap-1 flex-wrap mt-6 mb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategory(cat)}
            className="px-3 py-1.5 text-sm capitalize transition-colors bg-muted hover:cursor-pointer"
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="border border-border overflow-hidden mb-6">
        {TIERS.map((tier) => (
          <TierRow key={tier} tier={tier} models={tierGroups[tier]} onSelect={setDetail} />
        ))}
      </div>
    </PageShell>
  );
}
