package com.airigs.modules.aimodel.controller;

import com.airigs.common.response.ApiResponse;
import com.airigs.modules.aimodel.dto.AiModelDetailDto;
import com.airigs.modules.aimodel.dto.AiModelFamilyGroupDto;
import com.airigs.modules.aimodel.dto.VramFloorDto;
import com.airigs.modules.aimodel.service.AiModelService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/models")
@RequiredArgsConstructor
public class AiModelController {

    // API gateway for AI model catalog endpoints.
    private final AiModelService aiModelService;

    // ── GET /api/models ───────────────────────────────────────────────────────
    @GetMapping
    public ResponseEntity<ApiResponse<List<AiModelFamilyGroupDto>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(aiModelService.getGroupedByFamily()));
    }

    // ── GET /api/models/{id} ───────────────────────────────────────────────────
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<AiModelDetailDto>> getById(
            @PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.ok(aiModelService.getById(id)));
    }

    // ── GET /api/models/{id}/vram?precision=q4 ────────────────────────────────
    @GetMapping("/{id}/vram")
    public ResponseEntity<ApiResponse<VramFloorDto>> getVramFloor(
            @PathVariable UUID id,
            @RequestParam(required = false) String precision) {
        return ResponseEntity.ok(ApiResponse.ok(aiModelService.getVramFloor(id, precision)));
    }
}
