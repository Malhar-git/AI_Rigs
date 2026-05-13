package com.airigs.modules.aimodel.dto;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

/**
 * VRAM floor response for /api/models/{id}/vram.
 */
@Data
@Builder
public class VramFloorDto {
    private UUID modelId;
    private String precision;
    private Integer vramFloorGb;
}
