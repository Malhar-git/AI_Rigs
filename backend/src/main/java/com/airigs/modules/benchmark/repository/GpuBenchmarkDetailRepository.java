package com.airigs.modules.benchmark.repository;

import com.airigs.modules.benchmark.entity.GpuBenchmarkResult;
import com.airigs.modules.benchmark.entity.GpuBenchmarkDetails;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface  GpuBenchmarkDetailRepository extends JpaRepository<GpuBenchmarkDetails, UUID> {
    List<GpuBenchmarkDetails> findByBenchmarkResult(GpuBenchmarkResult result);
}
