package com.airigs.modules.aimodel.service;

import com.airigs.common.exception.ResourceNotFoundException;
import com.airigs.modules.aimodel.dto.AiModelDetailDto;
import com.airigs.modules.aimodel.dto.AiModelFamilyGroupDto;
import com.airigs.modules.aimodel.dto.AiModelSummaryDto;
import com.airigs.modules.aimodel.dto.VramFloorDto;
import com.airigs.modules.aimodel.entity.AiModel;
import com.airigs.modules.aimodel.repository.AiModelRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class AiModelService {

    private final AiModelRepository aiModelRepository;

    // ── Wizard step 2 — model dropdown grouped by family ──────────────────────

    public List<AiModelFamilyGroupDto> getGroupedByFamily() {
        List<AiModel> models = aiModelRepository.findAllByOrderByModelFamilyAscModelNameAsc();

        List<AiModelFamilyGroupDto> groups   = new ArrayList<>();
        String                      currentFamily = null;
        List<AiModelSummaryDto>     currentModels = new ArrayList<>();

        for (AiModel model : models) {
            String family = model.getModelFamily();
            if (currentFamily == null || !currentFamily.equalsIgnoreCase(family)) {
                if (currentFamily != null) {
                    groups.add(AiModelFamilyGroupDto.builder()
                            .family(currentFamily)
                            .models(currentModels)
                            .build());
                }
                currentFamily = family;
                currentModels = new ArrayList<>();
            }
            currentModels.add(toSummary(model));
        }

        if (currentFamily != null) {
            groups.add(AiModelFamilyGroupDto.builder()
                    .family(currentFamily)
                    .models(currentModels)
                    .build());
        }

        return groups;
    }

    // ── Single model with full metadata ───────────────────────────────────────

    public AiModelDetailDto getById(UUID id) {
        AiModel model = aiModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AiModel", "id", id));
        return toDetail(model);
    }

    // ── VRAM floor DTO (used by controller endpoint) ──────────────────────────

    public VramFloorDto getVramFloor(UUID id, String precision) {
        AiModel model = aiModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AiModel", "id", id));

        int vramFloor = getVramRequirement(id, precision);

        return VramFloorDto.builder()
                .modelId(model.getId())
                .precision(precision)
                .vramFloorGb(vramFloor)
                .build();
    }

    // ── VRAM floor int (used directly by BuildService) ────────────────────────

    /**
     * Resolves minimum VRAM in GB for a model at a given precision.
     *
     * vramMinGb is the Q4 floor (the absolute minimum). Higher precisions
     * scale up from it: Q8 ≈ 1.5×, FP16 ≈ 2×. Unsupported precisions
     * fall back to the Q4 floor so the build still has a usable VRAM constraint.
     */
    public int getVramRequirement(UUID id, String precision) {
        AiModel model = aiModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AiModel", "id", id));

        // Image models skip precision entirely — just return the base floor
        if (model.isSkipPrecision()) {
            return model.getVramMinGb() != null ? model.getVramMinGb() : 0;
        }

        String key = (precision == null || precision.isBlank())
                ? "auto"
                : precision.toLowerCase(Locale.ROOT).trim();

        List<String> variants = model.getPrecisionVariants();

        // Check if this precision is in the supported list
        boolean precisionSupported = variants != null
                && variants.stream()
                .filter(v -> v != null)
                .map(v -> v.toLowerCase(Locale.ROOT).trim())
                .anyMatch(v -> v.equals(key));

        if (precisionSupported) {
            // Apply multiplier for quantized precisions that halve VRAM
            return applyPrecisionMultiplier(model.getVramMinGb(), key);
        }

        // Fallback — return base floor regardless
        return model.getVramMinGb() != null ? model.getVramMinGb() : 0;
    }

    // vramMinGb is the Q4 floor. Higher precisions need proportionally more VRAM.
    private int applyPrecisionMultiplier(Integer baseVramGb, String precision) {
        if (baseVramGb == null || baseVramGb <= 0) return 0;
        if (precision == null) return baseVramGb;

        return switch (precision.toLowerCase(Locale.ROOT).trim()) {
            case "q4", "int4" -> baseVramGb;                           // already the Q4 floor
            case "q8", "int8" -> (int) Math.ceil(baseVramGb * 1.5);   // Q8 ≈ 1.5× Q4
            case "fp16"       -> (int) Math.ceil(baseVramGb * 2.0);   // FP16 ≈ 2× Q4
            default           -> baseVramGb;                           // auto, fp32, etc.
        };
    }

    // ── Mappers ───────────────────────────────────────────────────────────────

    private AiModelSummaryDto toSummary(AiModel model) {
        return AiModelSummaryDto.builder()
                .id(model.getId())
                .modelName(model.getModelName())
                .vramMinGb(model.getVramMinGb())
                .skipPrecision(model.isSkipPrecision())
                // List<String> on both entity and DTO — pass directly
                .precisionVariants(model.getPrecisionVariants())
                .build();
    }

    private AiModelDetailDto toDetail(AiModel model) {
        return AiModelDetailDto.builder()
                .id(model.getId())
                .modelName(model.getModelName())
                .modelFamily(model.getModelFamily())
                .vramMinGb(model.getVramMinGb())
                // Both fields are List<String> on entity AND dto — pass directly
                .precisionVariants(model.getPrecisionVariants())
                .taskTypes(model.getTaskTypes())
                .skipPrecision(model.isSkipPrecision())
                .build();
    }

}