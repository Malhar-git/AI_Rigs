package com.airigs.modules.benchmark.controller;

import com.airigs.modules.benchmark.dto.GpuLeaderboardDTO;
import com.airigs.modules.benchmark.dto.GpuResultDetailDTO;
import com.airigs.modules.benchmark.dto.SyncStatusDTO;
import com.airigs.modules.benchmark.entity.ModelBenchmark;
import com.airigs.modules.benchmark.service.BenchmarkService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/benchmarks")
@RequiredArgsConstructor
public class BenchmarkController {

    private final BenchmarkService benchmarkService;

    @GetMapping("/gpu")
    public ResponseEntity<List<GpuLeaderboardDTO>> gpuLeaderBoard(
            @RequestParam(required=false) String model
    ){
        return ResponseEntity.ok(benchmarkService.getGpuLeaderboard(model));
    }

    @GetMapping("/gpu/{testId}")
    public ResponseEntity<GpuResultDetailDTO> gpuDetail(@PathVariable Integer testId) {
        return ResponseEntity.ok(benchmarkService.getGpuResultDetail(testId));
    }

    @GetMapping("/models")
    public ResponseEntity<List<ModelBenchmark>> modelLeaderboard(
            @RequestParam(defaultValue = "coding") String category,
            @RequestParam(required = false) String license
    ) {
        return ResponseEntity.ok(benchmarkService.getModelLeaderboard(category, license));
    }

    @GetMapping("/sync/status")
    public ResponseEntity<SyncStatusDTO> syncStatus(){
        return ResponseEntity.ok(benchmarkService.getSyncStatus());
    }

}
