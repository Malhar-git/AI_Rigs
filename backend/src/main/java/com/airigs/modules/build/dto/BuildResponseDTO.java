package com.airigs.modules.build.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class BuildResponseDTO {

    private UUID                 buildId;
    private String               buildName;
    private BigDecimal           totalPriceInr;
    private List<BuildItemDTO>   components;
    private String               summaryReasoning;
    private CanvasHintsDTO       canvasHints;
    private List<UpgradePathDTO> upgradePaths;
    private String               sessionId;
    private LocalDateTime        createdAt;

    // Wizard echo — helps frontend display what was configured
    private String  task;
    private String  modelName;
    private String  budgetTier;
    private Integer vramFloorGb;
}