// TypeScript mirrors of the backend DTOs.
// These describe the JSON shapes the backend sends/expects, so `apiGet<BuildResponse>()`
// gives you real autocomplete and typo-checking. Field names are copied 1:1 from the
// backend (it serializes plain camelCase), so DO NOT rename them here.
//
// Type mapping cheatsheet (Java -> TS):
//   UUID, String, LocalDateTime  -> string
//   BigDecimal, Integer, int     -> number
//   List<X>                      -> X[]
//   boolean/Boolean              -> boolean
//   a field that can be null      -> optional (`field?`), because the backend uses
//                                    @JsonInclude(NON_NULL): null fields are OMITTED from JSON.

// ────────────────────────────────────────────────────────────
// REQUEST — what we POST to /api/builds  (backend: WizardAnswersDTO)
// ────────────────────────────────────────────────────────────
export type WizardAnswersDTO = {
  // required by the backend (@NotBlank)
  task: string;         // llm_inference | fine_tuning | image_gen | ai_dev | edge_deploy
  budgetTier: string;   // essential | capable | serious | unrestricted
  intensity: string;    // occasional | daily | intensive | always_on
  expand: string;       // fixed | ram | gpu2 | hedt

  // optional
  modelId?: string;         // UUID, if we resolved the model against the DB
  modelName?: string;       // e.g. "Llama 3.1 70B"
  modelVramGb?: number;     // base VRAM floor for the model
  precision?: string;       // fp16 | q8 | q4 | auto
  budgetMin?: number;       // INR, from the chosen tier
  budgetMax?: number;       // INR (null/absent = unbounded)
  priorities?: string[];    // e.g. ["max_vram", "speed"]
  brand?: string;           // nvidia | amd | open
  sessionId?: string;       // client-generated, tracks a wizard session
  userId?: string;          // UUID, null until auth exists
};

// ────────────────────────────────────────────────────────────
// RESPONSE — what /api/builds returns  (backend: BuildResponseDTO)
// ────────────────────────────────────────────────────────────
export type BuildResponse = {
  buildId: string;
  buildName: string;
  totalPriceInr: number;
  components: BuildItem[];
  summaryReasoning?: string;
  canvasHints?: CanvasHints;
  upgradePaths?: UpgradePath[];
  performanceEstimate?: PerformanceEstimate;
  sessionId?: string;
  createdAt?: string;          // ISO-8601, e.g. "2026-07-04T12:00:00"

  // wizard echo — the backend reflects these back for display
  task?: string;
  modelName?: string;
  budgetTier?: string;
  vramFloorGb?: number;
};

// one hardware component in the build (backend: BuildItemDTO)
export type BuildItem = {
  productId: string;
  category: string;      // gpu | cpu | motherboard | ram | psu | ...
  name: string;
  brand?: string;
  priceInr: number;
  vramGb?: number;
  isPrimary?: boolean;   // true = the hero GPU / centerpiece
  reason?: string;       // Gemini's justification for picking it
  sku?: string;          // catalog_id
};

// hints for the visual canvas (backend: CanvasHintsDTO)
export type CanvasHints = {
  focusProductIds?: string[];
  secondaryProductIds?: string[];
  dimOthers?: boolean;
  zoomLevel?: string;    // overview | focused | hero
};

// a future upgrade the platform leaves room for (backend: UpgradePathDTO)
export type UpgradePath = {
  target?: string;       // ram | gpu | cpu
  currentSpec?: string;
  maxPossible?: string;
  slotsFree?: string;
};

// estimated performance for the chosen model (backend: PerformanceEstimateDTO)
export type PerformanceEstimate = {
  acceleratorName?: string;
  generationTps?: number;  // tokens/sec, generation
  promptTps?: number;      // tokens/sec, prompt processing
  ttftMs?: number;         // time-to-first-token, ms
  localScore?: number;
  benchmarkModel?: string;
  quantization?: string;
  exactMatch?: boolean;
};

// ────────────────────────────────────────────────────────────
// PRODUCTS  (backend: ProductDto)
// ────────────────────────────────────────────────────────────
export type ProductDto = {
  id: string;
  name: string;
  category: string;
  brand?: string;
  priceInr?: number;
  vramGb?: number;
  inStock: boolean;              // primitive boolean → always present
  specs?: Record<string, unknown>; // raw jsonb — arbitrary nested fields

  // convenience fields unpacked from specs by the backend (nullable → optional)
  tdpWatts?: string;
  architecture?: string;
  memoryType?: string;   // e.g. "GDDR7"
  coreCount?: number;    // GPU: CUDA cores | CPU: cores
  socket?: string;       // CPU
  tier?: string;         // flagship | high-end | mid-range | entry
  badge?: string;        // editor label, e.g. "Best AI GPU"
  formFactor?: string;   // rack: "4U"
  aiTops?: number;       // GPU: Tensor TOPS
  series?: string;
};

// Generic paged envelope nested inside `data` for paged endpoints
// (backend: PagedResponse<T>)
export type PagedResponse<T> = {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  last: boolean;
};

// ────────────────────────────────────────────────────────────
// BENCHMARKS  (backend: ModelBenchmark entity, arena Elo leaderboard)
// NOTE: /api/benchmarks/* is returned RAW (no ApiResponse envelope) — the
// entity is serialized directly, so nullable columns arrive as `null`.
// ────────────────────────────────────────────────────────────
export type ModelBenchmark = {
  id: string;
  modelName: string;
  arenaRank?: number | null;
  eloScore?: number | null;
  confidenceInterval?: number | null;
  votes?: number | null;
  license?: string | null;      // "Proprietary" | "Apache 2.0" | "MIT" | "unknown"
  priceRaw?: string | null;     // e.g. "$10 / $50"
  contextRaw?: string | null;   // e.g. "1M"
  category: string;             // "coding" (only category populated so far)
  source: string;
  syncedAt?: string | null;     // ISO-8601
};
