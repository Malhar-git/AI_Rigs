package com.airigs.modules.build.service;

import com.airigs.modules.build.dto.CanvasHintsDTO;
import com.airigs.modules.build.dto.UpgradePathDTO;
import com.airigs.modules.product.dto.ProductDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.*;

/**
 * Parses Claude's raw JSON response into domain objects.
 *
 * Responsibilities:
 * - Strip accidental markdown fences
 * - Parse the JSON structure
 * - Match catalog_id values back to ProductDTO from the eligible catalog
 * - Compute total price from REAL catalog prices — never trust Claude's prices
 * - Fall back to name-matching if catalog_id doesn't resolve
 *
 * One bad component never aborts the whole build — logs and skips instead.
 */
@Component
public class BuildResponseParser {

    private static final Logger log = LoggerFactory.getLogger(BuildResponseParser.class);

    private final ObjectMapper objectMapper;

    public BuildResponseParser(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    // ─── Main parse ───────────────────────────────────────────────────────────

    public ParsedBuildResult parse(String rawResponse,
                                   Map<String, ProductDto> catalogLookup,
                                   BigDecimal budgetMax) {
        String cleaned = stripFences(rawResponse);

        JsonNode root;
        try {
            root = objectMapper.readTree(cleaned);
        } catch (Exception e) {
            log.error("Gemini returned invalid JSON: {}", e.getMessage());
            log.debug("Raw response: {}", rawResponse);
            throw new ParseException("Gemini returned invalid JSON: " + e.getMessage());
        }

        String buildName        = root.path("build_name").asText("AI Workstation Build");
        String summaryReasoning = root.path("summary_reasoning").asText("");
        CanvasHintsDTO  canvasHints  = parseCanvasHints(root.path("canvas_hints"));
        List<UpgradePathDTO> upgrades = parseUpgradePaths(root.path("upgrade_paths"));
        List<ParsedComponent> components = deduplicateByCategory(
                parseComponents(root.path("components"), catalogLookup));

        // Always compute total from real catalog prices — never trust Gemini's values
        BigDecimal total = components.stream()
                .map(c -> c.priceInr() != null ? c.priceInr() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        if (budgetMax != null && total.compareTo(budgetMax) > 0) {
            log.warn("Generated build total ₹{} exceeds budget cap ₹{}", total, budgetMax);
        }

        return new ParsedBuildResult(buildName, summaryReasoning,
                components, canvasHints, upgrades, total);
    }

    // ─── Component parsing ────────────────────────────────────────────────────

    private List<ParsedComponent> parseComponents(JsonNode node,
                                                  Map<String,ProductDto> lookup) {
        List<ParsedComponent> result = new ArrayList<>();
        if (!node.isArray()) return result;

        for (JsonNode n : node) {
            try {
                String catalogId  = n.path("catalog_id").asText(null);
                String aiName     = n.path("product_name").asText("Unknown");
                String category   = n.path("category").asText("unknown");
                boolean isPrimary = n.path("is_primary").asBoolean(false);
                String  reason    = n.path("reason").asText(null);

                // Primary match: catalog_id
                ProductDto product = catalogId != null ? lookup.get(catalogId) : null;

                // Fallback: name substring match scoped to same category
                if (product == null) {
                    product = findByName(lookup, aiName, category);
                    if (product != null)
                        log.warn("catalog_id '{}' not matched — fell back to name match: {}",
                                catalogId, product.getName());
                }

                if (product == null) {
                    log.warn("Component '{}' (catalog_id={}) not found in catalog — skipping",
                            aiName, catalogId);
                    continue;
                }

                result.add(new ParsedComponent(
                        product.getId(), catalogId,
                        product.getName(), product.getBrand(),
                        product.getCategory(), product.getPriceInr(),
                        product.getVramGb(), isPrimary, reason
                ));

            } catch (Exception e) {
                log.warn("Failed to parse component node: {}", e.getMessage());
            }
        }
        return result;
    }

    // Keep only the first component per category — Gemini occasionally suggests two GPUs, etc.
    private List<ParsedComponent> deduplicateByCategory(List<ParsedComponent> components) {
        Set<String> seen = new LinkedHashSet<>();
        List<ParsedComponent> deduped = new ArrayList<>();
        for (ParsedComponent c : components) {
            String cat = c.category() == null ? "" : c.category().toLowerCase();
            if (seen.add(cat)) {
                deduped.add(c);
            } else {
                log.warn("Duplicate category '{}' in build — dropping extra component '{}'",
                        c.category(), c.productName());
            }
        }
        return deduped;
    }

    private CanvasHintsDTO parseCanvasHints(JsonNode node) {
        if (node.isMissingNode() || node.isNull()) {
            return CanvasHintsDTO.builder()
                    .dimOthers(true).zoomLevel(("focused"))
                    .focusProductIds(List.of())
                    .secondaryProductIds(List.of())
                    .build();
        }
        return CanvasHintsDTO.builder()
                .dimOthers(node.path("dim_others").asBoolean(true))
                .zoomLevel((node.path("zoom_level").asText("focused")))
                .focusProductIds(List.of())       // UUIDs resolved later in BuildService
                .secondaryProductIds(List.of())
                .build();
    }

    private List<UpgradePathDTO> parseUpgradePaths(JsonNode node) {
        List<UpgradePathDTO> paths = new ArrayList<>();
        if (!node.isArray()) return paths;
        for (JsonNode p : node) {
            try {
                paths.add(UpgradePathDTO.builder()
                        .target(     p.path("target").asText(null))
                        .currentSpec(p.path("current_spec").asText(null))
                        .maxPossible(p.path("max_possible").asText(null))
                        .slotsFree(String.valueOf(p.path("slots_free").asInt(0)))
                        .build());
            } catch (Exception e) {
                log.warn("Failed to parse upgrade path: {}", e.getMessage());
            }
        }
        return paths;
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Strips ```json ... ``` markdown fences Claude sometimes adds
     * despite instructions not to.
     */
    private String stripFences(String text) {
        if (text == null) return "";
        String t = text.trim();
        if (t.startsWith("```")) {
            int nl = t.indexOf('\n');
            if (nl > 0) t = t.substring(nl + 1);
            if (t.endsWith("```")) t = t.substring(0, t.length() - 3);
        }
        return t.trim();
    }

    // Category-scoped name match to prevent a short brand/series token matching a wrong-category product.
    private ProductDto findByName(Map<String, ProductDto> lookup, String name, String category) {
        if (name == null) return null;
        String lower = name.toLowerCase();
        String cat   = category == null ? "" : category.toLowerCase();
        return lookup.values().stream()
                .filter(p -> cat.isEmpty() || cat.equalsIgnoreCase(p.getCategory()))
                .filter(p -> p.getName().toLowerCase().contains(lower)
                        || lower.contains(p.getName().toLowerCase()))
                .findFirst().orElse(null);
    }

    // ─── Result types ─────────────────────────────────────────────────────────

    public record ParsedBuildResult(
            String buildName,
            String summaryReasoning,
            List<ParsedComponent> components,
            CanvasHintsDTO canvasHints,
            List<UpgradePathDTO> upgradePaths,
            BigDecimal totalPriceInr
    ) {}

    public record ParsedComponent(
            UUID productId, String catalogId,
            String productName, String brand,
            String category, BigDecimal priceInr,
            Integer vramGb, boolean isPrimary, String reason
    ) {}

    public static class ParseException extends RuntimeException {
        public ParseException(String msg) { super(msg); }
    }
}