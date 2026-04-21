package com.ai_rigs.model_benchmarks.domain;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "model_benchmarks")
@Builder
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class
ModelBenchmark {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "model_name", nullable = false)
    private String modelName;

    @Column(name = "arena_rank")
    private Integer arenaRank;

    @Column(name = "elo_score")
    private Integer eloScore;

    @Column(name = "confidence_interval")
    private Integer confidenceInterval;

    @Column(name = "votes")
    private Integer votes;

    @Column(name = "license")
    private String license;

    @Column(name = "price_raw")
    private String priceRaw;

    @Column(name = "context_raw")
    private String contextRaw;

    @Column(name = "category", nullable = false)
    private String category;

    @Column(name = "source", nullable = false)
    private String source;

    @Column(name = "synced_at", nullable = false)
    private LocalDateTime syncedAt;
}
