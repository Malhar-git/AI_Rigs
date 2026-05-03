package com.airigs.modules.benchmark.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "gpu_benchmark_results")
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter
@Setter
public class GpuBenchmarkResult {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "localscore_test_id", nullable = false, unique = true)
    private Integer localscoreTestId;

    @Column(name = "tested_at", nullable = false)
    private LocalDateTime testedAt;

    @Column(name = "accelerator_name", nullable = false)
    private String acceleratorName;

    @Column(name = "accelerator_type", nullable = false)
    private String acceleratorType;         // "GPU" or "CPU"

    @Column(name = "accelerator_vram_gb")
    private BigDecimal acceleratorVramGb;

    @Column(name = "localscore_accel_id")
    private Integer localscoreAccelId;      // from /accelerator/77

    @Column(name = "model_name", nullable = false)
    private String modelName;

    @Column(name = "model_quantization")
    private String modelQuantization;

    @Column(name = "model_params_b")
    private BigDecimal modelParamsB;

    @Column(name = "generation_tps")
    private BigDecimal generationTps;

    @Column(name = "prompt_tps")
    private BigDecimal promptTps;

    @Column(name = "ttft_ms")
    private BigDecimal ttftMs;

    @Column(name = "localscore")
    private Integer localscore;

    @Column(name = "cpu_name")
    private String cpuName;

    @Column(name = "system_ram_gb")
    private BigDecimal systemRamGb;

    @Column(name = "os_name")
    private String osName;

    @Column(name = "runtime_name")
    private String runtimeName;

    @Column(name = "runtime_version")
    private String runtimeVersion;

    @Column(name = "synced_at", nullable = false)
    private LocalDateTime syncedAt;

    @OneToMany(mappedBy = "benchmarkResult",
            cascade = CascadeType.ALL,
            orphanRemoval = true)
    @Builder.Default
    private List<GpuBenchmarkDetails> details = new ArrayList<>();
}

