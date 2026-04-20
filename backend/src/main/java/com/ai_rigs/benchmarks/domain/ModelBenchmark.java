package com.ai_rigs.benchmarks.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "model_benchmarks")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModelBenchmark {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(updatable = false, nullable = false)
    private UUID id;

    @Column(name = "model_id", nullable = false)
    private UUID modelId;

    @Column(name = "arena_rank")
    private Integer arenaRank;

    @Column(name = "elo_score")
    private Integer eloScore;

    @Column
    private Integer votes;

    @Column(name = "synced_at", nullable = false)
    private LocalDateTime syncedAt;
}

