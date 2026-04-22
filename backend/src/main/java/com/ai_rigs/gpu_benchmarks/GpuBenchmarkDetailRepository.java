package com.ai_rigs.gpu_benchmarks;

import com.ai_rigs.gpu_benchmarks.domain.GpuBenchmarkDetails;
import com.ai_rigs.gpu_benchmarks.domain.GpuBenchmarkResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface GpuBenchmarkDetailRepository extends JpaRepository<GpuBenchmarkDetails, UUID> {
    List<GpuBenchmarkDetails> findByBenchmarkResult(GpuBenchmarkResult result);
}
