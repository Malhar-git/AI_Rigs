package com.airigs.modules.benchmark.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data @Builder
public class GpuLeaderboardDTO {
    private Integer      testId;
    private String       acceleratorName;
    private String       acceleratorType;
    private BigDecimal   vramGb;
    private String       modelName;
    private String       modelQuantization;
    private BigDecimal   generationTps;
    private BigDecimal   promptTps;
    private BigDecimal ttftMs;
    private Integer      localscore;
    private String       cpuName;
    private BigDecimal   systemRamGb;
    private String       osName;
    private LocalDateTime testedAt;
}
