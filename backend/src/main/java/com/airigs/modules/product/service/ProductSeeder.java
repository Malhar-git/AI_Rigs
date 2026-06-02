package com.airigs.modules.product.service;

import com.airigs.modules.product.entity.Product;
import com.airigs.modules.product.repository.ProductRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Map;

@Component
@Order(2)
@RequiredArgsConstructor
public class ProductSeeder implements ApplicationRunner {
    private static final Logger log = LoggerFactory.getLogger(ProductSeeder.class);

    /** Fixed USD → INR rate. Update when significantly out of date. */
    private static final BigDecimal USD_TO_INR = new BigDecimal("84.00");

    private final ProductRepository productRepository;
    private final ObjectMapper objectMapper;

    // ─── Entry point ──────────────────────────────────────────────────────────

    @Override
    public void run(ApplicationArguments args) {
        int totalInserted = 0;
        int totalSkipped  = 0;

        CatalogResult gpuResult  = seedFile("seed/gpu-catalog.json",      "gpus",         "gpu");
        CatalogResult cpuResult  = seedFile("seed/cpu-catalog.json",      "cpus",         "cpu");
        CatalogResult rackResult = seedFile("seed/gpu-rack-catalog.json", "gpu_racks",    "rack");
        CatalogResult moboResult = seedFile("seed/motherboard-catalog.json", "motherboards", "motherboard");
        CatalogResult ramResult  = seedFile("seed/ram-catalog.json",      "ram",          "ram");
        CatalogResult psuResult  = seedFile("seed/psu-catalog.json",      "psus",         "psu");

        totalInserted = gpuResult.inserted + cpuResult.inserted + rackResult.inserted
                + moboResult.inserted + ramResult.inserted + psuResult.inserted;
        totalSkipped  = gpuResult.skipped + cpuResult.skipped + rackResult.skipped
                + moboResult.skipped + ramResult.skipped + psuResult.skipped;

        log.info("Product seeder complete — {} inserted, {} skipped",
                totalInserted, totalSkipped);
    }

    // ─── Per-file seed ────────────────────────────────────────────────────────

    private CatalogResult seedFile(String classpathPath,
                                   String arrayKey,
                                   String category) {
        int inserted = 0, skipped = 0;

        ClassPathResource resource = new ClassPathResource(classpathPath);
        if (!resource.exists()) {
            log.warn("{} not found in classpath — skipping", classpathPath);
            return new CatalogResult(0, 0);
        }

        try {
            JsonNode root  = objectMapper.readTree(resource.getInputStream());
            JsonNode items = root.path(arrayKey);

            if (items.isMissingNode() || !items.isArray()) {
                log.warn("{}: key '{}' missing or not an array", classpathPath, arrayKey);
                return new CatalogResult(0, 0);
            }

            for (JsonNode item : items) {
                String name = resolveName(item, category);
                if (name == null || name.isBlank()) {
                    log.warn("Skipping item with no name in {}", classpathPath);
                    skipped++;
                    continue;
                }

                if (productRepository.existsByName(name)) {
                    skipped++;
                    continue;
                }

                try {
                    Product product = buildProduct(item, name, category);
                    if (product.getPriceInr() == null) {
                        skipped++;
                        log.warn("Skipping product '{}' from {} due to missing price", name, classpathPath);
                        continue;
                    }
                    productRepository.save(product);
                    inserted++;
                } catch (Exception e) {
                    skipped++;
                    log.warn("Failed to insert product '{}' from {}: {}", name, classpathPath, e.getMessage());
                }
            }

        } catch (Exception e) {
            log.error("Failed seeding {}: {}", classpathPath, e.getMessage(), e);
        }

        log.info("  {} — {} inserted, {} skipped", classpathPath, inserted, skipped);
        return new CatalogResult(inserted, skipped);
    }

    // ─── Name resolution ──────────────────────────────────────────────────────

    private String resolveName(JsonNode item, String category) {
        if ("rack".equals(category)) {
            // Racks have no "name" — compose from brand + model
            String brand = item.path("brand").asText("").trim();
            String model = item.path("model").asText("").trim();
            return (brand + " " + model).trim().isEmpty() ? null
                    : (brand + " " + model).trim();
        }
        String name = item.path("name").asText("").trim();
        return name.isEmpty() ? null : name;
    }

    // ─── Product builders ─────────────────────────────────────────────────────

    private Product buildProduct(JsonNode item, String name, String category) {
        return switch (category) {
            case "gpu"  -> buildGpu(item, name);
            case "cpu"  -> buildCpu(item, name);
            case "rack" -> buildRack(item, name);
            case "motherboard", "ram", "psu" -> buildCatalogItem(item, name, category);
            default     -> buildGeneric(item, name, category);
        };
    }

    private Product buildGpu(JsonNode item, String name) {
        JsonNode specs   = item.path("specifications");
        JsonNode pricing = item.path("pricing");
        JsonNode meta    = item.path("meta");

        // vram_gb lives inside specifications
        Integer vramGb = specInt(specs, "vram_gb");

        ObjectNode specsNode = objectMapper.createObjectNode();
        mergeInto(specsNode, specs);                                   // all spec fields flat
        specsNode.set("ai_capabilities",  item.path("ai_capabilities"));
        specsNode.set("compatibility",    item.path("compatibility"));
        specsNode.put("catalog_id",       item.path("id").asText(null));
        specsNode.put("tier",             item.path("tier").asText(null));
        specsNode.put("series",           item.path("series").asText(null));
        specsNode.put("badge",            meta.path("badge").asText(null));
        specsNode.put("editor_pick",      meta.path("editor_pick").asBoolean(false));
        specsNode.put("trending",         meta.path("trending").asBoolean(false));
        specsNode.put("release_date",     meta.path("release_date").asText(null));
        specsNode.put("popularity_score", meta.path("popularity_score").asInt(0));

        return Product.builder()
                .name(name)
                .category("gpu")
                .brand(item.path("brand").asText(null))
                .priceInr(usdToInr(pricing.path("msrp_usd")))
                .vramGb(vramGb)
                .inStock(true)
                .specs(toMap(specsNode))
                .build();
    }

    private Product buildCpu(JsonNode item, String name) {
        JsonNode specs   = item.path("specifications");
        JsonNode pricing = item.path("pricing");
        JsonNode meta    = item.path("meta");

        ObjectNode specsNode = objectMapper.createObjectNode();
        mergeInto(specsNode, specs);
        specsNode.set("compatibility",    item.path("compatibility"));
        specsNode.put("catalog_id",       item.path("id").asText(null));
        specsNode.put("tier",             item.path("tier").asText(null));
        specsNode.put("series",           item.path("series").asText(null));
        specsNode.put("badge",            meta.path("badge").asText(null));
        specsNode.put("editor_pick",      meta.path("editor_pick").asBoolean(false));
        specsNode.put("trending",         meta.path("trending").asBoolean(false));
        specsNode.put("release_date",     meta.path("release_date").asText(null));
        specsNode.put("popularity_score", meta.path("popularity_score").asInt(0));

        return Product.builder()
                .name(name)
                .category("cpu")
                .brand(item.path("brand").asText(null))
                .priceInr(usdToInr(pricing.path("msrp_usd")))
                .vramGb(null)
                .inStock(true)
                .specs(toMap(specsNode))
                .build();
    }

    private Product buildRack(JsonNode item, String name) {
        JsonNode pricing = item.path("pricing");
        JsonNode meta    = item.path("meta");

        // Racks have a completely different top-level structure
        ObjectNode specsNode = objectMapper.createObjectNode();
        specsNode.set("form_factor",         item.path("form_factor"));
        specsNode.set("expansion",           item.path("expansion"));
        specsNode.set("power",               item.path("power"));
        specsNode.set("cooling",             item.path("cooling"));
        specsNode.set("storage_bays",        item.path("storage_bays"));
        specsNode.set("motherboard_support", item.path("motherboard_support"));
        specsNode.set("build_quality",       item.path("build_quality"));
        specsNode.set("cable_management",    item.path("cable_management"));
        specsNode.set("load_capacity",       item.path("load_capacity"));
        specsNode.set("connectivity",        item.path("connectivity"));
        specsNode.set("compatibility",       item.path("compatibility"));
        specsNode.put("catalog_id",          item.path("id").asText(null));
        specsNode.put("model",               item.path("model").asText(null));
        specsNode.put("series",              item.path("series").asText(null));
        specsNode.put("tier",                item.path("tier").asText(null));
        specsNode.put("badge",               meta.path("badge").asText(null));
        specsNode.put("release_date",        meta.path("release_date").asText(null));
        specsNode.put("popularity_score",    meta.path("popularity_score").asInt(0));

        return Product.builder()
                .name(name)
                .category("rack")
                .brand(item.path("brand").asText(null))
                .priceInr(usdToInr(pricing.path("msrp_usd")))
                .vramGb(null)
                .inStock(true)
                .specs(toMap(specsNode))
                .build();
    }

    private Product buildCatalogItem(JsonNode item, String name, String category) {
        JsonNode specs   = item.path("specifications");
        JsonNode pricing = item.path("pricing");
        JsonNode meta    = item.path("meta");

        ObjectNode specsNode = objectMapper.createObjectNode();
        mergeInto(specsNode, specs);
        specsNode.set("ai_capabilities", item.path("ai_capabilities"));
        specsNode.set("compatibility", item.path("compatibility"));
        specsNode.put("catalog_id", item.path("id").asText(null));
        specsNode.put("tier", item.path("tier").asText(null));
        specsNode.put("series", item.path("series").asText(null));
        specsNode.put("badge", meta.path("badge").asText(null));
        specsNode.put("editor_pick", meta.path("editor_pick").asBoolean(false));
        specsNode.put("trending", meta.path("trending").asBoolean(false));
        specsNode.put("release_date", meta.path("release_date").asText(null));
        specsNode.put("popularity_score", meta.path("popularity_score").asInt(0));

        return Product.builder()
                .name(name)
                .category(category)
                .brand(item.path("brand").asText(null))
                .priceInr(usdToInr(pricing.path("msrp_usd")))
                .vramGb(null)
                .inStock(true)
                .specs(toMap(specsNode))
                .build();
    }

    private Product buildGeneric(JsonNode item, String name, String category) {
        ObjectNode specsNode = objectMapper.createObjectNode();
        mergeInto(specsNode, item.path("specifications"));
        return Product.builder()
                .name(name)
                .category(category)
                .brand(item.path("brand").asText(null))
                .priceInr(usdToInr(item.path("pricing").path("msrp_usd")))
                .vramGb(null)
                .inStock(true)
                .specs(toMap(specsNode))
                .build();
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    private Map<String, Object> toMap(ObjectNode specsNode) {
        return objectMapper.convertValue(specsNode,
                new com.fasterxml.jackson.core.type.TypeReference<>() {});
    }

    /** Copies all fields from source JsonNode into target ObjectNode. */
    private void mergeInto(ObjectNode target, JsonNode source) {
        if (source == null || source.isNull() || source.isMissingNode()) return;
        source.fields().forEachRemaining(e -> target.set(e.getKey(), e.getValue()));
    }

    /**
     * Converts a USD price node to INR.
     * Returns null for missing/null/zero values (e.g. Ryzen AI embedded CPUs).
     */
    private BigDecimal usdToInr(JsonNode usdNode) {
        if (usdNode == null || usdNode.isNull() || usdNode.isMissingNode()) return null;
        try {
            BigDecimal usd = new BigDecimal(usdNode.asText());
            if (usd.compareTo(BigDecimal.ZERO) <= 0) return null;
            return usd.multiply(USD_TO_INR).setScale(2, RoundingMode.HALF_UP);
        } catch (Exception e) {
            return null;
        }
    }

    /** Safely reads an int from a nested JsonNode. Returns null if absent. */
    private Integer specInt(JsonNode node, String field) {
        if (node == null || node.isNull() || node.isMissingNode()) return null;
        JsonNode val = node.path(field);
        return (val.isNull() || val.isMissingNode()) ? null : val.asInt();
    }

    // ─── Result record ────────────────────────────────────────────────────────

    private record CatalogResult(int inserted, int skipped) {}

}
