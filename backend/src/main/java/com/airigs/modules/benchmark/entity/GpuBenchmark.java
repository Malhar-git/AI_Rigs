package com.airigs.modules.benchmark.entity;

import jakarta.persistence.*;
import lombok.*;

import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "gpu_benchmarks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class GpuBenchmark {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(nullable = false)
    private String accelerator;

    @Column(name = "vram_gb")
    private Integer vramGb;

    @Column(name = "gen_tps", precision = 10, scale = 2)
    private BigDecimal genTps;

    @Column(name = "prompt_tps", precision = 10, scale = 2)
    private BigDecimal promptTps;

    @Column
    private Integer localscore;
}

