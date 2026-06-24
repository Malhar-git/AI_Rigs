# AI Rigs — Claude Code Handoff

## What this is
AI workstation configurator for Indian market. User answers 9-step wizard → Gemini AI generates a hardware build with prices in INR.

## Stack
Java 21 + Spring Boot 3 · PostgreSQL (JSONB) · Flyway · Gemini API (`gemini-2.5-flash`) · Next.js frontend (built separately)

## Package root: `com.airigs`
```
common/         → ApiResponse<T>, GlobalExceptionHandler, ParseUtil, WebConfig, SecurityConfig, RestTemplateConfig
modules/
  benchmark/    → GpuBenchmarkResult, ModelBenchmark, BenchmarkService, LocalScoreSyncJob, ArenaSyncJob ✅
  product/      → Product entity, ProductService, ProductSeeder (82 products seeded) ✅
  aimodel/      → AiModel entity, AiModelService ⚠️ BUG HERE
  build/        → Build, BuildItem, GeminiClient, BuildService, BuildPromptBuilder, BuildResponseParser ⚠️ UNTESTED & Incomplete
```

## DB tables
```
products          → id, name, category, brand, price_inr, vram_gb, in_stock, specs(jsonb)
ai_models         → id, model_name, model_family, vram_min_gb, skip_precision, precision_variants(jsonb), task_types(jsonb)
builds            → id, session_id, user_id, answers(jsonb), ai_raw_response(jsonb), build_name, total_price_inr, ...
build_items       → id, build_id, product_id, category, product_name, price_inr, vram_gb, is_primary, ai_reason, sku
gpu_benchmark_results / gpu_benchmark_details / model_benchmarks / sync_log
```

## What works ✅
- Both scrapers (localscore.ai + arena.ai) populate benchmark tables correctly
- ProductSeeder loads all 82 products from 6 JSON catalogs (gpu/cpu/rack/ram/motherboard/psu)
- All common layer, benchmark endpoints, product endpoints

## Build module flow (written, needs testing)
```
POST /api/builds → BuildService:
  1. validate WizardAnswersDTO
  2. resolve budget range (essentials ₹60K-1L / capable ₹1L-1.8L / serious ₹1.8L-3.5L)
  3. aiModelService.getVramRequirement(modelId, precision) → int vramFloor
  4. productService.filterByBudgetAndVram(min, max, vramFloor) → List<ProductDTO>
  5. BuildPromptBuilder → system + user prompt (catalog grouped by category)
  6. GeminiClient.generate() → raw JSON string
  7. BuildResponseParser.parse() → matches catalog_id back to real ProductDTO (NEVER trusts Gemini prices)
  8. persist Build + BuildItems → return BuildResponseDTO
```

## Key constraints
- Modules never cross-import repos/entities — service-to-service only
- `build_items.product_id` is soft reference (no FK) — catalog updates don't break old builds
- `catalog_id` in `specs` JSONB is how Gemini's response maps back to real products — verify it's not null: `SELECT name, specs->>'catalog_id' FROM products LIMIT 5;`
- Auth deferred — SecurityConfig is permitAll, userId nullable on Build
- Gemini config: `app.gemini.api-key: ${GEMINI_API_KEY}`, `app.gemini.model: gemini-2.5-flash`
- `CanvasHintsDTO.dimOthers` is primitive `boolean` → `isDimOthers()`. `zoomLevel` is `String` → `getZoomLevel()`

## First test after fix
```bash
export GEMINI_API_KEY=AIza...
# POST http://localhost:8080/api/builds
{
  "task": "llm_inference", "modelName": "Llama 3.1 70B",
  "modelVramGb": 40, "precision": "q4", "budgetTier": "serious",
  "intensity": "daily", "brand": "nvidia", "expand": "ram",
  "sessionId": "test-001"
}
```