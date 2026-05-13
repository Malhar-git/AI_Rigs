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

    // Groups models by family for the wizard dropdown.
    public List<AiModelFamilyGroupDto> getGroupedByFamily() {
        List<AiModel> models = aiModelRepository.findAllByOrderByModelFamilyAscModelNameAsc();

        List<AiModelFamilyGroupDto> groups = new ArrayList<>();
        String currentFamily = null;
        List<AiModelSummaryDto> currentModels = new ArrayList<>();

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

    // Returns a single model with all precision/task metadata.
    public AiModelDetailDto getById(UUID id) {
        AiModel model = aiModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AiModel", "id", id));
        return toDetail(model);
    }

    // Returns the VRAM floor for a given precision (q4/int4 halves VRAM).
    public VramFloorDto getVramFloor(UUID id, String precision) {
        AiModel model = aiModelRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("AiModel", "id", id));

        int vramFloor = calculateVramFloor(model, precision);

        return VramFloorDto.builder()
                .modelId(model.getId())
                .precision(precision)
                .vramFloorGb(vramFloor)
                .build();
    }

    private AiModelSummaryDto toSummary(AiModel model) {
        return AiModelSummaryDto.builder()
                .id(model.getId())
                .modelName(model.getModelName())
                .vramMinGb(model.getVramMinGb())
                .skipPrecision(model.isSkipPrecision())
                .precisionVariants(model.getPrecisionVariants())
                .build();
    }

    private AiModelDetailDto toDetail(AiModel model) {
        return AiModelDetailDto.builder()
                .id(model.getId())
                .modelName(model.getModelName())
                .modelFamily(model.getModelFamily())
                .vramMinGb(model.getVramMinGb())
                .precisionVariants(model.getPrecisionVariants())
                .taskTypes(model.getTaskTypes())
                .skipPrecision(model.isSkipPrecision())
                .build();
    }

    private int calculateVramFloor(AiModel model, String precision) {
        Integer base = model.getVramMinGb();
        if (base == null || base <= 0) return 0;
        if (precision == null || precision.isBlank() || model.isSkipPrecision()) {
            return base;
        }

        String normalized = precision.trim().toLowerCase(Locale.ROOT);
        if (!isPrecisionSupported(model, normalized)) {
            return base;
        }

        double multiplier = precisionMultiplier(normalized);
        return (int) Math.floor(base * multiplier);
    }

    private boolean isPrecisionSupported(AiModel model, String precision) {
        List<String> variants = model.getPrecisionVariants();
        if (variants == null || variants.isEmpty()) return false;
        return variants.stream()
                .filter(v -> v != null && !v.isBlank())
                .map(v -> v.trim().toLowerCase(Locale.ROOT))
                .anyMatch(v -> v.equals(precision));
    }

    private double precisionMultiplier(String precision) {
        // Only q4/int4 get a reduction; other precisions fall back to baseline.
        if (precision.startsWith("q4") || precision.contains("int4")) {
            return 0.5;
        }
        return 1.0;
    }
}
