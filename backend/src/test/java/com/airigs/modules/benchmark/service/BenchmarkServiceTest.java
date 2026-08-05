package com.airigs.modules.benchmark.service;

import com.airigs.modules.benchmark.entity.ModelBenchmark;
import com.airigs.modules.benchmark.repository.GpuBenchmarkResultRepository;
import com.airigs.modules.benchmark.repository.ModelBenchmarkRepository;
import com.airigs.modules.benchmark.sync.AIArenaSyncJob;
import com.airigs.modules.infrastructure.persistence.SyncLogRepository;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class BenchmarkServiceTest {

    @Test
    void shouldSyncCategoryOnDemandWhenNoRowsArePresent() throws Exception {
        ModelBenchmarkRepository modelRepo = Mockito.mock(ModelBenchmarkRepository.class);
        GpuBenchmarkResultRepository gpuRepo = Mockito.mock(GpuBenchmarkResultRepository.class);
        SyncLogRepository syncLogRepo = Mockito.mock(SyncLogRepository.class);
        AIArenaSyncJob aiArenaSyncJob = Mockito.mock(AIArenaSyncJob.class);

        when(modelRepo.findByCategoryOrderByArenaRankAsc("math"))
                .thenReturn(List.of())
                .thenReturn(List.of(ModelBenchmark.builder()
                        .id(UUID.randomUUID())
                        .modelName("Test Model")
                        .category("math")
                        .source("arena.ai")
                        .build()));
        when(aiArenaSyncJob.syncCategory("math")).thenReturn(1);

        BenchmarkService service = new BenchmarkService(gpuRepo, modelRepo, syncLogRepo, aiArenaSyncJob);

        List<ModelBenchmark> results = service.getModelLeaderboard("math", null);

        assertThat(results).hasSize(1);
        verify(aiArenaSyncJob).syncCategory("math");
    }
}
