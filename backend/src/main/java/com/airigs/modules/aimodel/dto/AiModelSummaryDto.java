package com.airigs.modules.aimodel.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Lightweight model payload for the /api/models grouped list.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AiModelSummaryDto {
    private UUID id;
    private String modelName;
    private Integer vramMinGb;
    private boolean skipPrecision;
    private List<String> precisionVariants;
}
