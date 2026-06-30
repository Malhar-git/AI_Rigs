package com.airigs.modules.build.service;

import com.airigs.common.exception.ResourceNotFoundException;
import com.airigs.common.exception.ValidationException;
import com.airigs.modules.aimodel.service.AiModelService;
import com.airigs.modules.build.client.GeminiClient;
import com.airigs.modules.build.client.GeminiClient.GeminiApiException;
import com.airigs.modules.build.dto.*;
import com.airigs.modules.build.entity.Build;
import com.airigs.modules.build.entity.BuildItem;
import com.airigs.modules.build.repository.BuildRepository;
import com.airigs.modules.build.service.BuildResponseParser.ParsedBuildResult;
import com.airigs.modules.build.service.BuildResponseParser.ParsedComponent;
import com.airigs.modules.product.dto.ProductDto;
import com.airigs.modules.product.service.ProductService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Orchestrates the complete build generation flow:
 *
 *   1. Validate wizard answers
 *   2. Resolve budget range from tier
 *   3. Resolve VRAM floor from model + precision  (AiModelService)
 *   4. Filter product catalog to eligible items   (ProductService)
 *   5. Build the Gemini prompt                   (BuildPromptBuilder)
 *   6. Call Gemini API                           (GeminiClient)
 *   7. Parse and validate response               (BuildResponseParser)
 *   8. Persist Build + BuildItems                (BuildRepository)
 *   9. Return BuildResponseDTO
 */
@Service
@RequiredArgsConstructor
public class BuildService {

    private static final Logger log = LoggerFactory.getLogger(BuildService.class);

    // Budget tier → [minINR, maxINR]
    private static final Map<String, BigDecimal[]> BUDGET_RANGES = Map.of(
            "essentials",   new BigDecimal[]{ bd("60000"),  bd("100000") },
            "capable",      new BigDecimal[]{ bd("100000"), bd("180000") },
            "serious",      new BigDecimal[]{ bd("180000"), bd("350000") },
            "unrestricted", new BigDecimal[]{ bd("350000"), bd("9999999") }
    );

    private final BuildRepository    buildRepository;
    private final AiModelService     aiModelService;
    private final ProductService     productService;
    private final BuildPromptBuilder promptBuilder;
    private final BuildResponseParser responseParser;
    private final GeminiClient       geminiClient;
    private final ObjectMapper       objectMapper;

    // ─── Generate ─────────────────────────────────────────────────────────────

    public BuildResponseDTO generateBuild(WizardAnswersDTO answers) {

        // 1. Validate
        validateAnswers(answers);

        // 2. Resolve budget range
        BigDecimal[] range = resolveBudgetRange(answers);
        answers.setBudgetMin(range[0]);
        answers.setBudgetMax(range[1]);

        // 3. Resolve VRAM floor
        int vramFloor = resolveVramFloor(answers);

        // 4. Filter catalog
        List<ProductDto> catalog = productService.filterByBudgetAndVram(
                answers.getBudgetMin(), answers.getBudgetMax(), vramFloor);

        if (catalog.isEmpty()) {
            throw new ValidationException(
                    "No products found within your budget that meet the VRAM requirement. " +
                            "Try a higher budget tier or a smaller model.")
                    .addError("budget", "No eligible components in catalog for this configuration");
        }

        log.info("Catalog filtered: {} eligible products for build generation", catalog.size());

        // Build catalog lookup — catalog_id (and UUID fallback) → ProductDTO
        Map<String, ProductDto> catalogLookup = buildLookup(catalog);

        // 5. Build prompt
        String systemPrompt = promptBuilder.buildSystemPrompt();
        String userPrompt   = promptBuilder.buildUserPrompt(answers, catalog, vramFloor);

        // 6. Call Gemini
        log.info("Calling Gemini for build [task={}, budget={}]",
                answers.getTask(), answers.getBudgetTier());

        String rawResponse;
        try {
            rawResponse = geminiClient.generate(systemPrompt, userPrompt);
        } catch (GeminiApiException e) {
            log.error("Gemini API failed: {}", e.getMessage());
            throw new RuntimeException(
                    "Build generation failed — AI service unavailable. Please try again.");
        }

        // 7. Parse response
        ParsedBuildResult parsed = responseParser.parse(rawResponse, catalogLookup, answers.getBudgetMax());

        if (parsed.components().isEmpty()) {
            throw new RuntimeException(
                    "AI could not generate a valid build. " +
                            "Please adjust your requirements and try again.");
        }

        // 8. Resolve canvas hint UUIDs
        CanvasHintsDTO canvasHints = resolveCanvasHints(parsed);

        // 9. Persist
        Build build = persistBuild(answers, parsed, canvasHints, vramFloor, rawResponse);

        // 10. Return response
        return toResponseDTO(build, parsed, canvasHints);
    }

    // ─── Retrieve ─────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public BuildResponseDTO getBuildById(UUID buildId) {
        Build build = buildRepository.findIdWithItems(buildId)
                .orElseThrow(() -> new ResourceNotFoundException("Build", "id", buildId));

        return BuildResponseDTO.builder()
                .buildId(build.getId())
                .buildName(build.getBuildName())
                .totalPriceInr(build.getTotalPriceInr())
                .components(build.getItems().stream().map(this::itemToDTO).toList())
                .summaryReasoning(build.getSummaryReasoning())
                .task(build.getTask())
                .modelName(build.getModelName())
                .budgetTier(build.getBudgetTier())
                .vramFloorGb(build.getVramFloorGb())
                .createdAt(build.getCreatedAt())
                .sessionId(build.getSessionId())
                .build();
    }

    @Transactional(readOnly = true)
    public List<BuildResponseDTO> getBuildsBySession(String sessionId) {
        return buildRepository.findBySessionIdOrderByCreatedAtDesc(sessionId)
                .stream()
                .map(b -> BuildResponseDTO.builder()
                        .buildId(b.getId())
                        .buildName(b.getBuildName())
                        .totalPriceInr(b.getTotalPriceInr())
                        .task(b.getTask())
                        .modelName(b.getModelName())
                        .budgetTier(b.getBudgetTier())
                        .createdAt(b.getCreatedAt())
                        .build())
                .toList();
    }

    // ─── Validation ───────────────────────────────────────────────────────────

    private void validateAnswers(WizardAnswersDTO answers) {
        ValidationException ex = new ValidationException("Wizard answers invalid");
        boolean hasError = false;

        if (answers.getTask() == null || answers.getTask().isBlank()) {
            ex.addError("task", "AI task is required"); hasError = true;
        }
        if (answers.getBudgetTier() == null || !BUDGET_RANGES.containsKey(answers.getBudgetTier())) {
            ex.addError("budgetTier", "Valid budget tier required: essentials|capable|serious|unrestricted");
            hasError = true;
        }
        if (answers.getIntensity() == null || answers.getIntensity().isBlank()) {
            ex.addError("intensity", "Usage intensity is required"); hasError = true;
        }
        if (answers.getExpand() == null || answers.getExpand().isBlank()) {
            ex.addError("expand", "Expandability preference is required"); hasError = true;
        }

        if (hasError) throw ex;
    }

    // ─── Budget resolution ────────────────────────────────────────────────────

    private BigDecimal[] resolveBudgetRange(WizardAnswersDTO answers) {
        if (answers.getBudgetMin() != null && answers.getBudgetMax() != null) {
            return new BigDecimal[]{ answers.getBudgetMin(), answers.getBudgetMax() };
        }
        BigDecimal[] range = BUDGET_RANGES.get(answers.getBudgetTier());
        if (range == null) throw new ValidationException("Unknown budget tier: " + answers.getBudgetTier());
        return range;
    }

    // ─── VRAM floor resolution ────────────────────────────────────────────────

    private int resolveVramFloor(WizardAnswersDTO answers) {
        if (answers.getModelId() == null) {
            return answers.getModelVramGb() != null ? answers.getModelVramGb() : 0;
        }
        try {
            int floor = aiModelService.getVramRequirement(
                    answers.getModelId(),
                    answers.getPrecision() != null ? answers.getPrecision() : "q4");
            log.info("VRAM floor resolved from DB: {}GB", floor);
            return floor;
        } catch (Exception e) {
            int fallback = answers.getModelVramGb() != null ? answers.getModelVramGb() : 0;
            log.warn("VRAM lookup failed — using frontend hint: {}GB", fallback);
            return fallback;
        }
    }

    // ─── Catalog lookup map ───────────────────────────────────────────────────

    private Map<String, ProductDto> buildLookup(List<ProductDto> catalog) {
        Map<String, ProductDto> lookup = new HashMap<>();
        for (ProductDto p : catalog) {
            // Primary key: catalog_id from specs
            if (p.getSpecs() != null && p.getSpecs().has("catalog_id")) {
                String catId = p.getSpecs().get("catalog_id").asText(null);
                if (catId != null) lookup.put(catId, p);
            }
            // Fallback key: product UUID
            if (p.getId() != null) lookup.put(p.getId().toString(), p);
        }
        return lookup;
    }

    // ─── Canvas hints UUID resolution ─────────────────────────────────────────

    private CanvasHintsDTO resolveCanvasHints(ParsedBuildResult parsed) {
        List<UUID> focus = parsed.components().stream()
                .filter(ParsedComponent::isPrimary)
                .map(ParsedComponent::productId)
                .filter(Objects::nonNull)
                .toList();

        List<UUID> secondary = parsed.components().stream()
                .filter(c -> !c.isPrimary())
                .map(ParsedComponent::productId)
                .filter(Objects::nonNull)
                .toList();

        return CanvasHintsDTO.builder()
                .focusProductIds(focus)
                .secondaryProductIds(secondary)
                .dimOthers(parsed.canvasHints().isDimOthers())
                .zoomLevel(parsed.canvasHints().getZoomLevel())
                .build();
    }

    // ─── Persistence ──────────────────────────────────────────────────────────

    @Transactional
    Build persistBuild(WizardAnswersDTO answers,
                               ParsedBuildResult parsed,
                               CanvasHintsDTO canvasHints,
                               int vramFloor,
                               String rawResponse) {
        try {
            Build build = Build.builder()
                    .sessionId(answers.getSessionId())
                    .userId(answers.getUserId())
                    .answers(objectMapper.valueToTree(answers))
                    .aiRawResponse(objectMapper.readTree(
                            rawResponse.startsWith("{") ? rawResponse
                                    : "{\"raw\":\"" + rawResponse.replace("\"","\\\"") + "\"}"))
                    .buildName(parsed.buildName())
                    .totalPriceInr(parsed.totalPriceInr())
                    .summaryReasoning(parsed.summaryReasoning())
                    .zoomLevel(canvasHints.getZoomLevel())
                    .dimOthers(canvasHints.isDimOthers())
                    .vramFloorGb(vramFloor)
                    .task(answers.getTask())
                    .modelName(answers.getModelName())
                    .budgetTier(answers.getBudgetTier())
                    .build();

            List<BuildItem> items = parsed.components().stream()
                    .map(c -> BuildItem.builder()
                            .build(build)
                            .productId(c.productId())
                            .category(c.category())
                            .productName(c.productName())
                            .brand(c.brand())
                            .priceInr(c.priceInr())
                            .vramGb(c.vramGb())
                            .isPrimary(c.isPrimary())
                            .aiReason(c.reason())
                            .sku(c.catalogId())
                            .build())
                    .collect(Collectors.toList());

            build.setItems(items);
            return buildRepository.save(build);

        } catch (Exception e) {
            log.error("Failed to persist build: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to save build: " + e.getMessage());
        }
    }

    // ─── Response mapping ─────────────────────────────────────────────────────

    private BuildResponseDTO toResponseDTO(Build build,
                                           ParsedBuildResult parsed,
                                           CanvasHintsDTO canvasHints) {
        return BuildResponseDTO.builder()
                .buildId(build.getId())
                .buildName(build.getBuildName())
                .totalPriceInr(build.getTotalPriceInr())
                .components(build.getItems().stream().map(this::itemToDTO).toList())
                .summaryReasoning(build.getSummaryReasoning())
                .canvasHints(canvasHints)
                .upgradePaths(parsed.upgradePaths())
                .sessionId(build.getSessionId())
                .createdAt(build.getCreatedAt())
                .task(build.getTask())
                .modelName(build.getModelName())
                .budgetTier(build.getBudgetTier())
                .vramFloorGb(build.getVramFloorGb())
                .build();
    }

    private BuildItemDTO itemToDTO(BuildItem item) {
        return BuildItemDTO.builder()
                .productId(item.getProductId())
                .category(item.getCategory())
                .name(item.getProductName())
                .brand(item.getBrand())
                .priceInr(item.getPriceInr())
                .vramGb(item.getVramGb())
                .isPrimary(item.getIsPrimary())
                .reason(item.getAiReason())
                .sku(item.getSku())
                .build();
    }

    private static BigDecimal bd(String val) { return new BigDecimal(val); }
}