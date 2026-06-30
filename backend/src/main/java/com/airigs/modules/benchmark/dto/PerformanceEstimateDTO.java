package com.airigs.modules.benchmark.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data
@Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class PerformanceEstimateDTO {
    private String     acceleratorName;
    private BigDecimal generationTps;
    private BigDecimal promptTps;
    private BigDecimal ttftMs;
    private Integer    localScore;
    private String     benchmarkModel;
    private String     quantization;
    private boolean    exactMatch;
}
