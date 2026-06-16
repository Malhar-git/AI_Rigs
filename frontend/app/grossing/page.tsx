/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useMemo, useState } from "react"
import Header from "../components/Header";
import Footer from "../components/Footer";

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
  S: {
    bg: "hsl(0, 72%, 59%)",
    border: "hsl(0, 72%, 59%)",
    text: "hsl(0, 59%, 30%)"
  },
  A: {
    bg: "hsl(36, 86%, 55%)",
    border: "hsl(36, 86%, 55%)",
    text: "hsl(33, 85%, 28%)"
  },
  B: {
    bg: "hsl(210, 71%, 54%)",
    border: "hsl(210, 71%, 54%)",
    text: "hsl(210, 82%, 27%)"
  },
  C: {
    bg: "hsl(53, 3%, 52%)",
    border: "hsl(53, 3%, 52%)",
    text: "hsl(60, 2%, 26%)"
  },
  D: {
    bg: "hsl(49, 7%, 68%)",
    border: "hsl(49, 7%, 68%)",
    text: "hsl(48, 3%, 36%)"
  }
};

// ============================================================
// ModelChip
// ============================================================
function ModelChip({ model, onClick }: { model: any; onClick: (m: any) => void }) {
  const c = TIER_COLORS[model.tier]; // fixed: was TIERS_COLORS

  return (
    <button
      onClick={() => onClick(model)}
      className="px-3 py-2 text-left hover:opacity-80 transition-opacity border border-gray-400"
    >
      <div className="text-sm font-medium">{model.name}</div>
      <div className="text-xs opacity-70">
        {model.maker}{model.params !== "N/A" ? ` · ${model.params}` : ""}
      </div>
    </button>
  )
}

// ============================================================
// TierRow
// ============================================================
function TierRow({ tier, models, onSelect }: { tier: string; models: any[]; onSelect: (m: any) => void }) {
  const c = TIER_COLORS[tier]; // fixed: was TIER_COLOR
  return (
    <div className="flex border-b border-gray-200 starting:border-0  last:border-b-0">
      <div style={{ background: c?.bg }} className="flex items-center justify-center w-20 shrink-0 text-3xl font-bold">
        {tier}
      </div>

      <div className="flex-1 flex flex-wrap gap-2 py-4 px-6 bg-gray-100">
        {models.length === 0 ? (
          <span className="text-sm text-(--color-text-tertiary) py-2">No models</span>
        ) : (
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          models.map((m: any) => <ModelChip key={m.name} model={m} onClick={onSelect} />)
        )}
      </div>
    </div>
  )
}

// ============================================================
// SortableHeader
// ============================================================
function SortableHeader({ label, sortKey, sortConfig, onSort }: {
  label: string;
  sortKey: string;
  sortConfig: { key: string; dir: "asc" | "desc" };
  onSort: (key: string) => void;
}) {
  const active = sortConfig.key === sortKey;

  return (
    <th
      onClick={() => onSort(sortKey)}
      className="px-3 py-2 text-xs font-medium text-(--color-text-secondary) cursor-pointer select-none whitespace-nowrap hover:text-(--color-text-primary)"
    >
      <div className="flex items-center gap-1">
        {label}
        {active && <span>{sortConfig.dir === "asc" ? "↑" : "↓"}</span>}
      </div>
    </th>
  );
}

export default function Grossing() {

  const [category, setCategory] = useState("overall"); // fixed: was activeCategory/setActiveCategory mismatch
  const [makerFilter, setMakerFilter] = useState("All"); // fixed: was makeFilter/setFilter mismatch
  const [sortConfig, setSortConfig] = useState<{ key: string; dir: "asc" | "desc" }>({ key: "mmlu", dir: "desc" });

  const [detail, setDetail] = useState<any>(null);

  // Step 1: filter MODELS down to just the ones matching the selected category tab.
  const filteredByCategory = category === "overall" ? MODELS : MODELS.filter((m: any) => m.category === category); // fixed: MODELS.((m) => ...) -> MODELS.filter((m) => ...)

  // Step 2: group those filtered models by tier (S/A/B/C/D)
  const tierGroups = useMemo(() => {
    const groups: Record<string, any[]> = {};
    TIERS.forEach((t) => (groups[t] = []));
    filteredByCategory.forEach((m: any) => groups[m.tier]?.push(m));
    return groups;
  }, [filteredByCategory]);

  // // Step 3: build the data for the big sortable table.
  // const tableData = useMemo(() => {
  //   let rows = makerFilter === "All" ? MODELS : MODELS.filter((m: any) => m.maker === makerFilter);

  //   rows = [...rows].sort((a: any, b: any) => {
  //     const va = a[sortConfig.key];
  //     const vb = b[sortConfig.key];

  //     if (typeof va === "string") {
  //       return sortConfig.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
  //     }
  //     return sortConfig.dir === "asc" ? va - vb : vb - va;
  //   });

  //   return rows;
  // }, [makerFilter, sortConfig]);

  // function handleSort(key: string) {
  //   setSortConfig((prev) =>
  //     prev.key === key
  //       ? { key, dir: prev.dir === "asc" ? "desc" : "asc" }
  //       : { key, dir: "desc" }
  //   );
  // }

  return (
    <div className="min-h-screen"> {/* fixed: <body> is not valid inside a page component */}
      <Header />
      <div className="main-content mx-6 max-w-8xl py-8">
        <div className="max-w-xl">
          <h4 className="text-gray-600">Best LLMs - 2026 Rankings</h4>
          <h3>Top Grossing Leaderboard</h3>
          <h6>The definitive ranking of LLMs and hardware for retail — compared across quality, speed, hardware requirements, and cost. Find the best for your local AI infrastructure.</h6>
        </div>


        {/* Category tabs */}
        <div className="flex gap-1 flex-wrap mt-6 mb-2">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)} // fixed: setCategory now exists
              className="px-3 py-1.5 text-sm capitalize transition-colors bg-gray-100 hover:cursor-pointer"
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Tier Grid */}
        <div className="border border-gray-200 overflow-hidden mb-6">
          {TIERS.map((tier) => (
            <TierRow key={tier} tier={tier} models={tierGroups[tier]} onSelect={setDetail} />
          ))}
        </div>

      </div>
      <Footer /> {/* fixed: removed redundant <footer> wrapper around component already named Footer */}
    </div>
  )
}