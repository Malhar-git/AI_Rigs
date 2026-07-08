package com.airigs.modules.build.service;

import com.airigs.modules.build.dto.WizardAnswersDTO;
import com.airigs.modules.product.dto.ProductDto;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * Constructs the system + user prompt sent to Claude.
 *
 * Key design decisions:
 * 1. Claude only sees the pre-filtered catalog — never the full product table.
 * 2. Structured JSON output is strictly enforced in the system prompt.
 * 3. Hard constraints (VRAM floor, PSU headroom, ECC, DIMM slots) are
 *    injected as explicit numbered rules so Claude cannot reason around them.
 * 4. Catalog is grouped by category so Claude scans it efficiently.
 * 5. Each product's ai_use field is included so Claude understands workload fit.
 */
@Component
public class BuildPromptBuilder {

    // ─── System prompt ────────────────────────────────────────────────────────

    public String buildSystemPrompt() {
        return """
            You are an expert AI workstation builder for AI Rigs, an Indian workstation
            configurator. Select the best combination of components from the provided
            catalog to match the user's AI workload requirements.

            HARD RULES — never violate these:
            1. Only recommend products from the provided catalog. Never invent components.
               Each catalog entry has a catalog_id that is a UUID (e.g. "a1b2c3d4-...").
               Copy it character-for-character into your response — do not shorten, guess, or rephrase it.
            2. Total price of all selected components MUST NOT exceed budget_max INR.
            3. If vram_floor_gb > 0, the selected GPU must have vram_gb >= vram_floor_gb.
               If no GPU meets this, pick the highest VRAM available and explain in summary_reasoning.
            4. brand=nvidia → only NVIDIA GPUs. brand=amd → only AMD GPUs. brand=open → best option.
            5. If expand contains "ram", the motherboard MUST have dimm_slots >= 4.
            6. If intensity is "always_on" or "intensive", PSU wattage must cover
               GPU TDP + CPU TDP + 20% headroom. Note this in summary_reasoning.
            7. Write exactly one reason sentence per component — no more.
            8. canvas_hints.focus_skus must contain the catalog_id of the GPU or
               primary compute component.

            OUTPUT — respond ONLY with valid JSON matching this exact schema.
            No markdown fences, no preamble, no trailing text outside the JSON:

            {
              "build_name": "string (creative 3-5 word name)",
              "components": [
                {
                  "catalog_id":   "string — copy from the catalog exactly",
                  "product_name": "string",
                  "category":     "string",
                  "price_inr":    number,
                  "vram_gb":      number or null,
                  "is_primary":   boolean,
                  "reason":       "string — max 1 sentence"
                }
              ],
              "summary_reasoning": "string — 3-4 sentences explaining the overall build rationale",
              "canvas_hints": {
                "focus_skus":     ["catalog_id of primary component"],
                "secondary_skus": ["catalog_id", "..."],
                "dim_others":     true,
                "zoom_level":     "focused"
              },
              "upgrade_paths": [
                {
                  "target":       "ram | gpu | storage | cpu",
                  "current_spec": "string",
                  "max_possible": "string",
                  "slots_free":   number
                }
              ]
            }
            """;
    }

    // ─── User prompt ──────────────────────────────────────────────────────────

    public String buildUserPrompt(WizardAnswersDTO answers,
                                  List<ProductDto> catalog,
                                  int vramFloor) {
        StringBuilder sb = new StringBuilder();

        sb.append("USER REQUIREMENTS:\n");
        sb.append("- AI task: ")        .append(labelTask(answers.getTask())).append("\n");
        sb.append("- Target model: ")   .append(answers.getModelName() != null ? answers.getModelName() : "Not specified").append("\n");
        sb.append("- Precision: ")      .append(answers.getPrecision() != null ? answers.getPrecision() : "auto").append("\n");
        sb.append("- VRAM floor: ")     .append(vramFloor).append(" GB minimum\n");
        sb.append("- Budget range: ₹") .append(answers.getBudgetMin())
                .append(" – ₹")              .append(answers.getBudgetMax()).append("\n");
        sb.append("- Intensity: ")      .append(labelIntensity(answers.getIntensity())).append("\n");
        sb.append("- Priorities: ")     .append(
                answers.getPriorities() != null && !answers.getPriorities().isEmpty()
                        ? String.join(", ", answers.getPriorities()) : "none").append("\n");
        sb.append("- GPU preference: ").append(answers.getBrand() != null ? answers.getBrand() : "open").append("\n");
        sb.append("- Expandability: ") .append(labelExpand(answers.getExpand())).append("\n\n");

        sb.append("AVAILABLE COMPONENTS (in-stock, within budget, meeting VRAM floor):\n\n");

        // Group by category — GPUs first as the most critical decision
        Map<String, List<ProductDto>> byCategory = catalog.stream()
                .collect(Collectors.groupingBy(ProductDto::getCategory));

        for (String cat : new String[]{"gpu","cpu","ram","motherboard","storage","psu","cooling","rack"}) {
            appendCategory(sb, byCategory, cat);
        }

        sb.append("Select one component per category except storage (up to 2 if useful).\n");
        sb.append("Respond ONLY with the JSON schema. Nothing else.\n");

        return sb.toString();
    }

    // ─── Category serialiser ──────────────────────────────────────────────────

    private void appendCategory(StringBuilder sb,
                                Map<String, List<ProductDto>> byCategory,
                                String category) {
        List<ProductDto> items = byCategory.get(category);
        if (items == null || items.isEmpty()) return;

        sb.append("── ").append(category.toUpperCase()).append(" ──\n");

        for (ProductDto p : items) {
            sb.append("  catalog_id: ").append(p.getId())
                    .append(" | ").append(p.getName())
                    .append(" | ₹").append(p.getPriceInr());

            if (p.getVramGb() != null)
                sb.append(" | VRAM: ").append(p.getVramGb()).append("GB");
            if (p.getTdpWatts() != null)
                sb.append(" | TDP: ").append(p.getTdpWatts()).append("W");
            if (p.getTier() != null)
                sb.append(" | tier: ").append(p.getTier());

            // ai_use hint — crucial for Claude to understand fit
            String aiUse = specStr(p.getSpecs(), "ai_use");
            if (aiUse != null)
                sb.append("\n    → ").append(aiUse);

            // Motherboard DIMM slots — needed for RAM upgrade compatibility
            if ("motherboard".equals(category)) {
                String dimmSlots = specStr(p.getSpecs(), "dimm_slots");
                if (dimmSlots != null)
                    sb.append(" | DIMM slots: ").append(dimmSlots);
            }

            sb.append("\n");
        }
        sb.append("\n");
    }

    // ─── Label helpers ────────────────────────────────────────────────────────

    private String labelTask(String t) {
        if (t == null) return "Not specified";
        return switch (t) {
            case "llm_inference" -> "Local LLM inference";
            case "fine_tuning"   -> "Fine-tuning (LoRA/QLoRA)";
            case "training"      -> "Training from scratch";
            case "image_gen"     -> "AI image & video generation";
            case "ai_dev"        -> "AI-assisted development";
            case "edge_deploy"   -> "Edge deployment / serving";
            default              -> t;
        };
    }

    private String labelIntensity(String i) {
        if (i == null) return "Not specified";
        return switch (i) {
            case "occasional" -> "Occasional (few hrs/week)";
            case "daily"      -> "Daily driver";
            case "intensive"  -> "Long training runs (sustained GPU load)";
            case "always_on"  -> "Always-on server (24/7 inference)";
            default           -> i;
        };
    }

    private String labelExpand(String e) {
        if (e == null) return "Not specified";
        return switch (e) {
            case "fixed" -> "Fixed build";
            case "ram"   -> "RAM headroom — needs ≥4 DIMM slots";
            case "gpu2"  -> "Second GPU later — needs PCIe lanes + PSU headroom";
            case "hedt"  -> "Maximum headroom — HEDT platform";
            default      -> e;
        };
    }

    private String specStr(Map<String, Object> specs, String field) {
        if (specs == null) return null;
        Object v = specs.get(field);
        return v == null ? null : v.toString();
    }
}