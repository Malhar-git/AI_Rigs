package com.airigs.modules.aimodel.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

/**
 * Detailed model payload returned by /api/models/{id}.
 */
@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class AiModelDetailDto {
    private UUID id;
    private String modelName;
    private String modelFamily;
    private Integer vramMinGb;
    private List<String> precisionVariants;
    private List<String> taskTypes;
    private boolean skipPrecision;
}
