package com.ai_rigs.services;

import com.ai_rigs.dto.GpuBenchmarkDetailDTO;
import com.ai_rigs.dto.GpuLeaderboardDTO;
import com.ai_rigs.dto.GpuResultDetailDTO;
import com.ai_rigs.dto.SyncStatusDTO;
import com.ai_rigs.gpu_benchmarks.GpuBenchmarkResultRepository;
import com.ai_rigs.gpu_benchmarks.GpuBenchmarkResult;
import com.ai_rigs.model_benchmarks.ModelBenchmarkRepository;
import com.ai_rigs.model_benchmarks.ModelBenchmark;
import com.ai_rigs.sync_log.SyncLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BenchmarkService {

    private final GpuBenchmarkResultRepository gpuRepo;
    private final ModelBenchmarkRepository modelRepo;
    private final SyncLogRepository syncLogRepo;

    // Best localscore per accelerator, optionally filtered by model name.
    public List<GpuLeaderboardDTO> getGpuLeaderboard(String modelFilter) {
        String normalizedModelFilter = modelFilter == null ? null : modelFilter.trim();
        List<GpuBenchmarkResult> rows = (normalizedModelFilter != null && !normalizedModelFilter.isBlank()) ?
                gpuRepo.findTopResultsPerAcceleratorForModel(normalizedModelFilter) : gpuRepo.findTopResultsPerAccelerator();

        return rows.stream()
                .map(this::toGpuLeaderboardDTO)
                .toList();

    }

    // GPU detail for a single test result with all parsed test variants.
    public GpuResultDetailDTO getGpuResultDetail(Integer testId) {
        return gpuRepo.findByLocalscoreTestId(testId)
                .map(this::toGpuDetailDTO)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Result not found: " + testId));
    }

    // GPU results for a specific accelerator, optional model filter.
    public List<GpuLeaderboardDTO> getResultsForAccelerator(
            String acceleratorName, String modelFilter) {
        String normalizedAcceleratorName = acceleratorName == null ? "" : acceleratorName.trim();
        String normalizedModelFilter = modelFilter == null ? null : modelFilter.trim();

        List<GpuBenchmarkResult> rows = (normalizedModelFilter != null && !normalizedModelFilter.isBlank())
                ? gpuRepo.findByAcceleratorNameContainingIgnoreCaseAndModelNameContainingIgnoreCase(
                normalizedAcceleratorName, normalizedModelFilter)
                : gpuRepo.findByAcceleratorNameContainingIgnoreCase(normalizedAcceleratorName);

        return rows.stream()
                .map(this::toGpuLeaderboardDTO)
                .toList();
    }

    // ── Model leaderboard ─────────────────────────────────────────────────
    public List<ModelBenchmark> getModelLeaderboard(
            String category, String license) {
        boolean hasLicense = license != null && !license.isBlank();
        return hasLicense
                ? modelRepo.findByCategoryAndLicenseOrderByArenaRankAsc(
                category, license)
                : modelRepo.findByCategoryOrderByArenaRankAsc(category);
    }

    // Latest sync status for both sources.
    public SyncStatusDTO getSyncStatus() {
        return SyncStatusDTO.builder()
                .localscore(syncLogRepo
                        .findTopBySourceOrderByRanAtDesc("localscore.ai")
                        .orElse(null))
                .arena(syncLogRepo
                        .findTopBySourceOrderByRanAtDesc("arena.ai")
                        .orElse(null))
                .build();
    }

    // ── Mappers ───────────────────────────────────────────────────────────
    private GpuLeaderboardDTO toGpuLeaderboardDTO(GpuBenchmarkResult r) {
        return GpuLeaderboardDTO.builder()
                .testId(r.getLocalscoreTestId())
                .acceleratorName(r.getAcceleratorName())
                .acceleratorType(r.getAcceleratorType())
                .vramGb(r.getAcceleratorVramGb())
                .modelName(r.getModelName())
                .modelQuantization(r.getModelQuantization())
                .generationTps(r.getGenerationTps())
                .promptTps(r.getPromptTps())
                .ttftMs(r.getTtftMs())
                .localscore(r.getLocalscore())
                .cpuName(r.getCpuName())
                .systemRamGb(r.getSystemRamGb())
                .osName(r.getOsName())
                .testedAt(r.getTestedAt())
                .build();
    }

    private GpuResultDetailDTO toGpuDetailDTO(GpuBenchmarkResult r) {
        List<GpuBenchmarkDetailDTO> details = r.getDetails().stream()
                .map(d -> GpuBenchmarkDetailDTO.builder()
                        .testName(d.getTestName())
                        .promptTps(d.getPromptTps())
                        .generationTps(d.getGenerationTps())
                        .ttftMs(d.getTtftMs())
                        .build())
                .toList();

        return GpuResultDetailDTO.builder()
                .testId(r.getLocalscoreTestId())
                .testedAt(r.getTestedAt())
                .acceleratorName(r.getAcceleratorName())
                .acceleratorType(r.getAcceleratorType())
                .vramGb(r.getAcceleratorVramGb())
                .modelName(r.getModelName())
                .modelQuantization(r.getModelQuantization())
                .modelParamsB(r.getModelParamsB())
                .generationTps(r.getGenerationTps())
                .promptTps(r.getPromptTps())
                .ttftMs(r.getTtftMs())
                .localscore(r.getLocalscore())
                .cpuName(r.getCpuName())
                .systemRamGb(r.getSystemRamGb())
                .osName(r.getOsName())
                .runtimeName(r.getRuntimeName())
                .runtimeVersion(r.getRuntimeVersion())
                .details(details)
                .build();
    }
}
