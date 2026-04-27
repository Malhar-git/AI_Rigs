package com.ai_rigs.model_benchmarks;

import jakarta.transaction.Transactional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ModelBenchmarkRepository
        extends JpaRepository<ModelBenchmark, UUID> {

    List<ModelBenchmark> findByCategoryOrderByArenaRankAsc(String category);

    List<ModelBenchmark> findByCategoryAndLicenseOrderByArenaRankAsc(
            String category, String license);

    Optional<ModelBenchmark> findByModelNameAndCategory(
            String modelName, String category);

    @Modifying
    @Transactional
    @Query(value = """
        INSERT INTO model_benchmarks
            (id, model_name, arena_rank, elo_score, confidence_interval,
             votes, license, price_raw, context_raw, category, source, synced_at)
        VALUES
            (gen_random_uuid(), :modelName, :arenaRank,
             :eloScore, :confidenceInterval, :votes,
             :license, :priceRaw, :contextRaw,
             :category, :source, :syncedAt)
        ON CONFLICT (model_name, category)
        DO UPDATE SET
            arena_rank            = EXCLUDED.arena_rank,
            elo_score             = EXCLUDED.elo_score,
            confidence_interval   = EXCLUDED.confidence_interval,
            votes                 = EXCLUDED.votes,
            license               = EXCLUDED.license,
            price_raw             = EXCLUDED.price_raw,
            context_raw           = EXCLUDED.context_raw,
            synced_at             = EXCLUDED.synced_at
        """, nativeQuery = true)
    void upsertByModelNameAndCategory(
            @Param("modelName") String modelName,
            @Param("arenaRank") Integer arenaRank,
            @Param("eloScore") Integer eloScore,
            @Param("confidenceInterval") Integer confidenceInterval,
            @Param("votes") Integer votes,
            @Param("license") String license,
            @Param("priceRaw") String priceRaw,
            @Param("contextRaw") String contextRaw,
            @Param("category") String category,
            @Param("source") String source,
            @Param("syncedAt") java.time.LocalDateTime syncedAt
    );
}
