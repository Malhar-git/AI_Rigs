package com.airigs.modules.build.controller;

import com.airigs.common.response.ApiResponse;
import com.airigs.modules.build.dto.BuildResponseDTO;
import com.airigs.modules.build.dto.WizardAnswersDTO;
import com.airigs.modules.build.entity.Build;
import com.airigs.modules.build.service.BuildService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/builds")
@RequiredArgsConstructor
public class BuildController {
    private final BuildService buildService;

//  POST /api/builds
//  Takes wizard answers -> calls Gemini -> return full build response
    @PostMapping
    public ResponseEntity<ApiResponse<BuildResponseDTO>> generateBuild(
            @Valid @RequestBody WizardAnswersDTO answers
            ){
        BuildResponseDTO result = buildService.generateBuild(answers);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(result, "Build Generated Successfully"));
    }

//  GET /api/builds/{id}
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<BuildResponseDTO>> getBuild(@PathVariable UUID id){
        return ResponseEntity.ok(ApiResponse.ok(buildService.getBuildById(id)));
    }

//  GET /api/builds?sessionId=xxx
//    @GetMapping
//    public ResponseEntity<ApiResponse<List<BuildResponseDTO>>> getBySession(@RequestParam String sessionId){
//        return ResponseEntity.ok(ApiResponse.ok(buildService.getBuildBySession(sessionId)));
//    }
}
