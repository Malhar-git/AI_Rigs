package com.airigs.modules.benchmark.repository;

import com.airigs.modules.benchmark.entity.GpuBenchmarkResult;
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
    List<GpuBenchmarkResult> findByAcceleratorNameContainingIgnoreCase(String acceleratorName);
    List<GpuBenchmarkResult> findByAcceleratorNameContainingIgnoreCaseAndModelNameContainingIgnoreCase(
            String acceleratorName,
            String modelName);

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

    // Best result per accelerator across all models
    @Query(value = """
        SELECT DISTINCT ON (accelerator_name)*
        FROM gpu_benchmark_results
        ORDER BY accelerator_name, localscore DESC NULLS LAST
    """, nativeQuery = true)
    List<GpuBenchmarkResult> findTopResultsPerAccelerator();

    // Best result per accelerator for a given model
    @Query(value = """
        SELECT DISTINCT ON (accelerator_name) * 
        FROM gpu_benchmark_results
        WHERE LOWER(model_name) LIKE LOWER(CONCAT('%', :model, '%'))
        ORDER BY accelerator_name, localscore DESC NULLS LAST 
    """, nativeQuery = true)
    List<GpuBenchmarkResult> findTopResultsPerAcceleratorForModel(@Param("model")  String model);
}
