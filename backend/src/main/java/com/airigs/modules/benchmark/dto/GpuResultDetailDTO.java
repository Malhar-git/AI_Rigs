package com.airigs.modules.benchmark.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data @Builder
public class GpuResultDetailDTO {
    private Integer      testId;
    private LocalDateTime testedAt;
    private String       acceleratorName;
    private String       acceleratorType;
    private BigDecimal   vramGb;
    private String       modelName;
    private String       modelQuantization;
    private BigDecimal   modelParamsB;
    private BigDecimal generationTps;
    private BigDecimal   promptTps;
    private BigDecimal   ttftMs;
    private Integer      localscore;
    private String       cpuName;
    private BigDecimal   systemRamGb;
    private String       osName;
    private String       runtimeName;
    private String       runtimeVersion;
    private List<GpuBenchmarkDetailDTO> details;
}
