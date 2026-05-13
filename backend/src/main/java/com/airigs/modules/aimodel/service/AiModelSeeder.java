package com.airigs.modules.aimodel.service;

import com.airigs.modules.aimodel.entity.AiModel;
import com.airigs.modules.aimodel.repository.AiModelRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

/**
 * Seeds ai_model rows from seed/ai-model-catalog.json at application startup.
 */
@Component
@Order(3)
@RequiredArgsConstructor
public class AiModelSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(AiModelSeeder.class);
    private static final String CATALOG_PATH = "seed/ai-model-catalog.json";

    private final AiModelRepository aiModelRepository;
    private final ObjectMapper objectMapper;

    @Override
    public void run(ApplicationArguments args) {
        ClassPathResource resource = new ClassPathResource(CATALOG_PATH);
        if (!resource.exists()) {
            log.warn("{} not found in classpath — skipping ai_model seed", CATALOG_PATH);
            return;
        }

        int inserted = 0;
        int skipped = 0;

        try {
            JsonNode root = objectMapper.readTree(resource.getInputStream());
            JsonNode models = root.path("models");

            if (models.isMissingNode() || !models.isArray()) {
                log.warn("{}: key 'models' missing or not an array", CATALOG_PATH);
                return;
            }

            for (JsonNode modelNode : models) {
                String name = modelNode.path("name").asText("").trim();
                String family = modelNode.path("model_family").asText("").trim();
                if (name.isEmpty() || family.isEmpty()) {
                    skipped++;
                    log.warn("Skipping ai_model row with missing name/family in {}", CATALOG_PATH);
                    continue;
                }

                if (aiModelRepository.existsByModelNameIgnoreCase(name)) {
                    skipped++;
                    continue;
                }

                try {
                    AiModel model = buildAiModel(modelNode, name, family);
                    aiModelRepository.save(model);
                    inserted++;
                } catch (Exception e) {
                    skipped++;
                    log.warn("Failed to insert ai_model '{}': {}", name, e.getMessage());
                }
            }
        } catch (Exception e) {
            log.error("Failed seeding ai_model catalog: {}", e.getMessage(), e);
            return;
        }

        log.info("AiModel seeder complete — {} inserted, {} skipped", inserted, skipped);
    }

    /**
     * Maps catalog JSON to AiModel.
     *
     * JSON fields:
     * - name              -> model_name
     * - model_family      -> model_family
     * - vram_min_gb       -> vram_min_gb (null becomes 0 to satisfy NOT NULL)
     * - precision_variants-> precision_variants (JSON array -> List<String>)
     * - task_types        -> task_types (JSON array -> List<String>)
     * - skip_precision    -> skip_precision
     */
    private AiModel buildAiModel(JsonNode node, String name, String family) {
        Integer vramMinGb = node.path("vram_min_gb").isNull()
                ? 0
                : node.path("vram_min_gb").asInt(0);

        return AiModel.builder()
                .modelName(name)
                .modelFamily(family)
                .vramMinGb(vramMinGb)
                .precisionVariants(readStringList(node.path("precision_variants")))
                .taskTypes(readStringList(node.path("task_types")))
                .skipPrecision(node.path("skip_precision").asBoolean(false))
                .build();
    }

    /**
     * Safely converts a JSON array node to List<String>.
     */
    private List<String> readStringList(JsonNode node) {
        if (node == null || node.isNull() || node.isMissingNode() || !node.isArray()) {
            return Collections.emptyList();
        }
        return objectMapper.convertValue(node, new TypeReference<>() {});
    }
}
