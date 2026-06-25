package com.airigs.modules.benchmark.service;

import com.airigs.modules.benchmark.dto.GpuBenchmarkDetailDTO;
import com.airigs.modules.benchmark.dto.GpuLeaderboardDTO;
import com.airigs.modules.benchmark.dto.GpuResultDetailDTO;
import com.airigs.modules.benchmark.dto.PerformanceEstimateDTO;
import com.airigs.modules.benchmark.dto.SyncStatusDTO;
import com.airigs.modules.benchmark.repository.GpuBenchmarkResultRepository;
import com.airigs.modules.benchmark.entity.GpuBenchmarkResult;
import com.airigs.modules.benchmark.repository.ModelBenchmarkRepository;
import com.airigs.modules.benchmark.entity.ModelBenchmark;
import com.airigs.modules.infrastructure.persistence.SyncLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class BenchmarkService {

    private final GpuBenchmarkResultRepository gpuRepo;
    private final ModelBenchmarkRepository modelRepo;
    private final SyncLogRepository syncLogRepo;

    private static final Pattern GPU_TOKEN = Pattern.compile(
        "\\b(RTX\\s+\\d+\\w*(?:\\s+Ti)?|GTX\\s+\\d+\\w*(?:\\s+Ti)?" +
        "|RX\\s+\\d+\\w*(?:\\s+(?:XT|XTX))?" +
        "|A\\d{3}(?:\\s+\\d+GB)?|H\\d{3}(?:\\s+NVL)?|L\\d{2,3}\\w*)",
        Pattern.CASE_INSENSITIVE);

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

    // ── Performance estimate for build ────────────────────────────────────

    public Optional<PerformanceEstimateDTO> findBestMatchForBuild(
            String gpuProductName, String modelName, String precision) {
        String gpuToken = extractGpuToken(gpuProductName);
        if (gpuToken.isBlank()) return Optional.empty();

        List<GpuBenchmarkResult> candidates = gpuRepo.findByGpuAndModel(gpuToken, modelName);
        if (candidates.isEmpty()) return Optional.empty();

        String quantPrefix = mapPrecisionToQuantPrefix(precision);
        List<GpuBenchmarkResult> matched = candidates.stream()
                .filter(r -> matchesQuantization(r.getModelQuantization(), quantPrefix))
                .toList();

        boolean exactMatch = !matched.isEmpty();
        List<GpuBenchmarkResult> pool = exactMatch ? matched : candidates;

        return pool.stream()
                .max(Comparator.comparingInt(r -> r.getLocalscore() != null ? r.getLocalscore() : 0))
                .map(r -> PerformanceEstimateDTO.builder()
                        .acceleratorName(r.getAcceleratorName())
                        .generationTps(r.getGenerationTps())
                        .promptTps(r.getPromptTps())
                        .ttftMs(r.getTtftMs())
                        .localScore(r.getLocalscore())
                        .benchmarkModel(r.getModelName())
                        .quantization(r.getModelQuantization())
                        .exactMatch(exactMatch)
                        .build());
    }

    private String extractGpuToken(String productName) {
        if (productName == null) return "";
        Matcher m = GPU_TOKEN.matcher(productName);
        return m.find() ? m.group(1).trim() : "";
    }

    private String mapPrecisionToQuantPrefix(String precision) {
        if (precision == null) return null;
        return switch (precision.toLowerCase()) {
            case "q4"   -> "Q4";
            case "q8"   -> "Q8";
            case "fp16" -> "F16";
            default     -> null;
        };
    }

    private boolean matchesQuantization(String quantization, String prefix) {
        if (prefix == null) return true;
        if (quantization == null) return false;
        String q = quantization.toUpperCase();
        if ("F16".equals(prefix)) return q.startsWith("F16") || q.startsWith("BF16");
        return q.startsWith(prefix);
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
