package com.airigs.modules.aimodel.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;

/**
 * Response group for /api/models: one family with its models.
 */
@Data
@Builder
public class AiModelFamilyGroupDto {
    private String family;
    private List<AiModelSummaryDto> models;
}
