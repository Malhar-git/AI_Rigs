package com.airigs.modules.benchmark.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;
@Entity
@Table(name = "gpu_benchmark_details")
@Builder
@NoArgsConstructor
@AllArgsConstructor
@Getter @Setter
public class GpuBenchmarkDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "benchmark_result_id", nullable = false)
    private GpuBenchmarkResult benchmarkResult;

    @Column(name = "test_name", nullable = false)
    private String testName;

    @Column(name = "prompt_tps")
    private BigDecimal promptTps;

    @Column(name = "generation_tps")
    private BigDecimal generationTps;

    @Column(name = "ttft_ms")
    private BigDecimal ttftMs;
}
