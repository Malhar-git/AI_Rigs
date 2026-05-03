package com.airigs.modules.benchmark.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;

@Data @Builder
public class GpuBenchmarkDetailDTO {
    private String     testName;
    private BigDecimal promptTps;
    private BigDecimal generationTps;
    private BigDecimal ttftMs;
}
