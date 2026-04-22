package com.ai_rigs.gpu_benchmarks;

import com.ai_rigs.gpu_benchmarks.domain.GpuBenchmarkResult;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface GpuBenchmarkResultRepository extends JpaRepository<GpuBenchmarkResult, UUID> {

    // used by incremental sync — stop fetching when we hit this ID
    Optional<GpuBenchmarkResult> findByLocalscoreTestId(Integer testId);

    boolean existsByLocalscoreTestId(Integer testId);

    // leaderboard queries
    List<GpuBenchmarkResult> findByAcceleratorTypeOrderByLocalscoreDesc(String type);
    List<GpuBenchmarkResult> findByModelNameContainingIgnoreCase(String modelName);

    // find best score per Gpu for a given model
    @Query("""
        SELECT r FROM GpuBenchmarkResult r
        WHERE LOWER(r.modelName) LIKE LOWER(CONCAT('%', :model, '%'))
        ORDER BY r.localscore DESC
    """)
    List<GpuBenchmarkResult> findTopByModel(@Param("model") String model, Pageable pageable);

    // highest test ID we've seen — tells us where to resume pagination
    @Query("SELECT MAX(r.localscoreTestId) FROM GpuBenchmarkResult r")
    Optional<Integer> findMaxTestId();
}
