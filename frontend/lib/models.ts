import { apiGetRaw } from "./api-client";
import type { ModelBenchmark } from "./types";

// GET /api/benchmarks/models?category=&license= — arena Elo leaderboard.
// Returns a RAW list (benchmark endpoints are not enveloped), so this uses
// apiGetRaw rather than apiGet. Only "coding" is populated so far.
export function getModelLeaderboard(category = "coding", license?: string) {
  const p = new URLSearchParams({ category });
  if (license) p.set("license", license);
  return apiGetRaw<ModelBenchmark[]>(`/api/benchmarks/models?${p.toString()}`);
}
